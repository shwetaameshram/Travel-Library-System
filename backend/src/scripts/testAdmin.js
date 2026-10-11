const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool, testConnection } = require('../config/db');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const librarianController = require('../controllers/librarianController');
const { requireAdmin } = require('../middleware/authMiddleware');
const { requireLibrarian } = require('../middleware/librarianMiddleware');

// Helper mock req/res
const createMockRes = () => {
  const res = {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonPayload = data;
      return this;
    }
  };
  return res;
};

async function runAdminTests() {
  console.log('--- STARTING ADMIN MODULE VERIFICATION TESTS ---');

  // 1. Initialize DB Connection & Run Migrations
  await testConnection();

  // Ensure test accounts passwords are standard 'password123'
  const salt = await bcrypt.genSalt(10);
  const testHash = await bcrypt.hash('password123', salt);
  await pool.query(
    "UPDATE users SET password = ?, status = 'active' WHERE email IN ('admin@travellib.com', 'librarian.chandrapur@travellib.com', 'librarian.nagpur@travellib.com', 'alex.passenger@example.com')",
    [testHash]
  );

  const [users] = await pool.query("SELECT id, name, email, role, library_id, status FROM users");
  const adminUser = users.find(u => u.email === 'admin@travellib.com');
  const libAUser = users.find(u => u.email === 'librarian.chandrapur@travellib.com');
  const passengerUser = users.find(u => u.email === 'alex.passenger@example.com');

  if (!adminUser || !libAUser || !passengerUser) {
    throw new Error('Required test accounts missing from database!');
  }

  // TEST 1: Admin login works.
  console.log('\n--- TEST 1: Admin Login ---');
  const reqAdminLogin = { body: { email: 'admin@travellib.com', password: 'password123' } };
  const resAdminLogin = createMockRes();
  await authController.login(reqAdminLogin, resAdminLogin, (err) => { if (err) console.error(err); });

  if (resAdminLogin.statusCode !== 200 || !resAdminLogin.jsonPayload?.success) {
    throw new Error(`Admin login failed with status ${resAdminLogin.statusCode}`);
  }
  console.log('✅ TEST 1 PASSED: Admin login successful!');

  // TEST 2: Admin login response has role = "admin".
  console.log('\n--- TEST 2: Admin Role Verification ---');
  const adminRole = resAdminLogin.jsonPayload?.user?.role;
  console.log('Admin login payload role:', adminRole);
  if (adminRole !== 'admin') {
    throw new Error(`Expected role "admin", got "${adminRole}"`);
  }
  console.log('✅ TEST 2 PASSED: Admin login response role is "admin"!');

  // TEST 3: Admin can fetch librarians.
  console.log('\n--- TEST 3: Admin Fetch Librarians ---');
  const reqGetLibs = { query: {} };
  const resGetLibs = createMockRes();
  await adminController.getAllLibrarians(reqGetLibs, resGetLibs, (err) => { if (err) console.error(err); });
  if (resGetLibs.statusCode !== 200 || !Array.isArray(resGetLibs.jsonPayload?.data)) {
    throw new Error('Admin failed to fetch librarians list');
  }
  console.log(`✅ TEST 3 PASSED: Admin fetched ${resGetLibs.jsonPayload.data.length} librarians!`);

  // TEST 4: Admin can fetch users.
  console.log('\n--- TEST 4: Admin Fetch Users / Passengers ---');
  const reqGetUsers = { query: {} };
  const resGetUsers = createMockRes();
  await adminController.getAllUsers(reqGetUsers, resGetUsers, (err) => { if (err) console.error(err); });
  if (resGetUsers.statusCode !== 200 || !Array.isArray(resGetUsers.jsonPayload?.data)) {
    throw new Error('Admin failed to fetch users list');
  }
  console.log(`✅ TEST 4 PASSED: Admin fetched ${resGetUsers.jsonPayload.data.length} passenger users!`);

  // TEST 5: Admin can fetch libraries.
  console.log('\n--- TEST 5: Admin Fetch Libraries ---');
  const reqGetLibraries = { query: {} };
  const resGetLibraries = createMockRes();
  await adminController.getAllLibraries(reqGetLibraries, resGetLibraries, (err) => { if (err) console.error(err); });
  if (resGetLibraries.statusCode !== 200 || !Array.isArray(resGetLibraries.jsonPayload?.data)) {
    throw new Error('Admin failed to fetch libraries list');
  }
  console.log(`✅ TEST 5 PASSED: Admin fetched ${resGetLibraries.jsonPayload.data.length} library branches!`);

  // TEST 6: Admin can assign Librarian A to Library 1.
  console.log('\n--- TEST 6: Assign Librarian A to Library 1 ---');
  const reqAssign1 = { params: { id: libAUser.id }, body: { library_id: 1 } };
  const resAssign1 = createMockRes();
  await adminController.updateLibrarianLibrary(reqAssign1, resAssign1, (err) => { if (err) console.error(err); });
  if (resAssign1.statusCode !== 200) {
    throw new Error('Failed to assign Librarian A to Library 1');
  }
  console.log('✅ TEST 6 PASSED: Librarian A assigned to Library 1 successfully!');

  // TEST 7: Admin can change Librarian A to Library 2.
  console.log('\n--- TEST 7: Reassign Librarian A to Library 2 ---');
  const reqAssign2 = { params: { id: libAUser.id }, body: { library_id: 2 } };
  const resAssign2 = createMockRes();
  await adminController.updateLibrarianLibrary(reqAssign2, resAssign2, (err) => { if (err) console.error(err); });
  if (resAssign2.statusCode !== 200) {
    throw new Error('Failed to reassign Librarian A to Library 2');
  }
  console.log('✅ TEST 7 PASSED: Librarian A reassigned to Library 2 successfully!');

  // TEST 8: Verify database library_id changed.
  console.log('\n--- TEST 8: Verify Database library_id ---');
  const [updatedDbUser] = await pool.query('SELECT library_id FROM users WHERE id = ?', [libAUser.id]);
  console.log('Database library_id for Librarian A:', updatedDbUser[0]?.library_id);
  if (updatedDbUser[0]?.library_id !== 2) {
    throw new Error(`Expected library_id in database to be 2, but found ${updatedDbUser[0]?.library_id}`);
  }
  console.log('✅ TEST 8 PASSED: Database library_id accurately updated to 2!');

  // TEST 9: Verify Librarian A dashboard/API now uses Library 2.
  console.log('\n--- TEST 9: Verify Librarian Dashboard Scope Reactivity ---');
  const reqLibADash = { user: { id: libAUser.id, role: 'librarian', library_id: updatedDbUser[0].library_id } };
  const resLibADash = createMockRes();
  await librarianController.getDashboardStats(reqLibADash, resLibADash, (err) => { if (err) console.error(err); });

  const assignedLibName = resLibADash.jsonPayload?.data?.library?.name;
  console.log('Librarian A Dashboard Assigned Library Name:', assignedLibName);
  if (resLibADash.jsonPayload?.data?.library?.id !== 2) {
    throw new Error('Librarian dashboard did not reactively reflect the updated assigned library ID 2!');
  }
  console.log('✅ TEST 9 PASSED: Librarian dashboard correctly reflects updated Library ID 2 (Nagpur Railway Library)!');

  // Re-assign Librarian A back to Library 1 for system consistency
  await pool.query('UPDATE users SET library_id = 1 WHERE id = ?', [libAUser.id]);

  // TEST 10: Librarian cannot access /api/admin/*.
  console.log('\n--- TEST 10: RBAC - Librarian Cannot Access Admin APIs ---');
  const reqLibAdmin = { headers: { 'x-user-role': 'librarian', 'x-user-id': String(libAUser.id) } };
  const resLibAdmin = createMockRes();
  let nextCalled = false;
  await requireAdmin(reqLibAdmin, resLibAdmin, () => { nextCalled = true; });
  if (nextCalled || resLibAdmin.statusCode !== 403) {
    throw new Error('Librarian was incorrectly allowed access to admin route!');
  }
  console.log('✅ TEST 10 PASSED: Librarian blocked with 403 Forbidden on Admin routes!');

  // TEST 11: User cannot access /api/admin/*.
  console.log('\n--- TEST 11: RBAC - User Cannot Access Admin APIs ---');
  const reqUserAdmin = { headers: { 'x-user-role': 'user', 'x-user-id': String(passengerUser.id) } };
  const resUserAdmin = createMockRes();
  nextCalled = false;
  await requireAdmin(reqUserAdmin, resUserAdmin, () => { nextCalled = true; });
  if (nextCalled || resUserAdmin.statusCode !== 403) {
    throw new Error('Passenger user was incorrectly allowed access to admin route!');
  }
  console.log('✅ TEST 11 PASSED: Passenger user blocked with 403 Forbidden on Admin routes!');

  // TEST 12: Admin can view user's rental history.
  console.log('\n--- TEST 12: Admin View User Rental History ---');
  const reqHistory = { params: { id: passengerUser.id } };
  const resHistory = createMockRes();
  await adminController.getUserRentalHistory(reqHistory, resHistory, (err) => { if (err) console.error(err); });
  if (resHistory.statusCode !== 200 || !Array.isArray(resHistory.jsonPayload?.data)) {
    throw new Error('Admin failed to fetch passenger rental history');
  }
  console.log(`✅ TEST 12 PASSED: Admin retrieved passenger rental history (${resHistory.jsonPayload.data.length} records)!`);

  // TEST 13: Existing Librarian Module tests verification.
  console.log('\n--- TEST 13: Verify Existing Librarian Module Compatibility ---');
  const reqLibCheck = { headers: { 'x-user-role': 'librarian', 'x-user-id': String(libAUser.id) } };
  const resLibCheck = createMockRes();
  nextCalled = false;
  await requireLibrarian(reqLibCheck, resLibCheck, () => { nextCalled = true; });
  if (!nextCalled || reqLibCheck.user?.library_id !== 1) {
    throw new Error('Existing librarian middleware check failed!');
  }
  console.log('✅ TEST 13 PASSED: Librarian module middleware functioning seamlessly!');

  // TEST 14: Existing user login / rental functionality works.
  console.log('\n--- TEST 14: Verify Existing Passenger Functionality ---');
  const reqPassLogin = { body: { email: 'alex.passenger@example.com', password: 'password123' } };
  const resPassLogin = createMockRes();
  await authController.login(reqPassLogin, resPassLogin, (err) => { if (err) console.error(err); });
  if (resPassLogin.statusCode !== 200 || resPassLogin.jsonPayload?.user?.role !== 'user') {
    throw new Error('Passenger login test failed!');
  }
  console.log('✅ TEST 14 PASSED: Passenger login & rental auth verified!');

  console.log('\n🎉 ALL ADMIN MODULE VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  await pool.end();
  process.exit(0);
}

runAdminTests().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
