const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool, testConnection } = require('../config/db');
const authController = require('../controllers/authController');
const librarianController = require('../controllers/librarianController');
const { requireLibrarian } = require('../middleware/librarianMiddleware');

async function runTests() {
  console.log('--- STARTING LIBRARIAN MODULE VERIFICATION TESTS ---');

  // 1. Initialize DB Connection & Run Migrations
  await testConnection();

  // 2. Test DB Users
  const [users] = await pool.query("SELECT id, name, email, role, library_id FROM users");
  console.log('✅ Total Users in database:', users.length);

  const libA = users.find(u => u.email === 'librarian.chandrapur@travellib.com');
  const libB = users.find(u => u.email === 'librarian.nagpur@travellib.com');
  const passenger = users.find(u => u.email === 'alex.passenger@example.com');
  const admin = users.find(u => u.email === 'admin@travellib.com');

  if (!libA || !libB) {
    throw new Error('Librarian sample users not found in database!');
  }
  console.log('✅ Librarian A found:', libA.name, '-> Library ID:', libA.library_id);
  console.log('✅ Librarian B found:', libB.name, '-> Library ID:', libB.library_id);
  console.log('✅ Passenger found:', passenger.name, '-> Role:', passenger.role);
  console.log('✅ Admin found:', admin.name, '-> Role:', admin.role);

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

  // 3. Test Librarian Login
  console.log('\n--- TESTING LOGIN API FOR LIBRARIAN, PASSENGER, & ADMIN ---');
  
  // Ensure password for test accounts is updated to bcrypt hash for 'password123'
  const salt = await bcrypt.genSalt(10);
  const testHash = await bcrypt.hash('password123', salt);
  await pool.query("UPDATE users SET password = ? WHERE email IN ('librarian.chandrapur@travellib.com', 'librarian.nagpur@travellib.com', 'alex.passenger@example.com', 'admin@travellib.com')", [testHash]);

  // Librarian A Login
  const reqLibALogin = { body: { email: 'librarian.chandrapur@travellib.com', password: 'password123' } };
  const resLibALogin = createMockRes();
  await authController.login(reqLibALogin, resLibALogin, (err) => { if (err) console.error(err); });

  console.log('Librarian A Login Status:', resLibALogin.statusCode);
  console.log('Librarian A User Payload Role:', resLibALogin.jsonPayload?.user?.role);
  console.log('Librarian A Assigned Library:', resLibALogin.jsonPayload?.user?.library_name);
  if (resLibALogin.jsonPayload?.user?.role !== 'librarian' || resLibALogin.jsonPayload?.user?.library_id !== 1) {
    throw new Error('Librarian A login payload test failed!');
  }
  console.log('✅ Librarian A login verified successfully!');

  // Passenger Login
  const reqPassLogin = { body: { email: 'alex.passenger@example.com', password: 'password123' } };
  const resPassLogin = createMockRes();
  await authController.login(reqPassLogin, resPassLogin, (err) => { if (err) console.error(err); });
  if (resPassLogin.jsonPayload?.user?.role !== 'user') {
    throw new Error('Passenger login role test failed!');
  }
  console.log('✅ Passenger login verified (role=user)!');

  // Admin Login
  const reqAdminLogin = { body: { email: 'admin@travellib.com', password: 'password123' } };
  const resAdminLogin = createMockRes();
  await authController.login(reqAdminLogin, resAdminLogin, (err) => { if (err) console.error(err); });
  if (resAdminLogin.jsonPayload?.user?.role !== 'admin') {
    throw new Error('Admin login role test failed!');
  }
  console.log('✅ Admin login verified (role=admin)!');

  // 4. Test Middleware Role Protection
  console.log('\n--- TESTING LIBRARIAN MIDDLEWARE AUTHORIZATION ---');
  
  // Passenger attempting librarian access
  const reqPass = { headers: { 'x-user-role': 'user', 'x-user-id': String(passenger.id) } };
  const resPass = createMockRes();
  let nextCalled = false;
  await requireLibrarian(reqPass, resPass, (err) => { nextCalled = true; });
  if (nextCalled || resPass.statusCode !== 403) {
    throw new Error('Passenger was incorrectly granted librarian access!');
  }
  console.log('✅ Passenger access correctly blocked with 403 Forbidden!');

  // Librarian A attempting librarian access
  const reqLibAMid = { headers: { 'x-user-role': 'librarian', 'x-user-id': String(libA.id) } };
  const resLibAMid = createMockRes();
  nextCalled = false;
  await requireLibrarian(reqLibAMid, resLibAMid, (err) => { nextCalled = true; });
  if (!nextCalled || reqLibAMid.user?.library_id !== 1) {
    throw new Error('Librarian A middleware authorization failed!');
  }
  console.log('✅ Librarian A middleware correctly authorized and scoped to Library ID 1!');

  // 5. Test Dashboard Controller Endpoint (Real DB Stats)
  console.log('\n--- TESTING LIBRARIAN DASHBOARD STATS CONTROLLER ---');
  const reqDash = { user: reqLibAMid.user };
  const resDash = createMockRes();
  await librarianController.getDashboardStats(reqDash, resDash, (err) => { if (err) console.error(err); });

  console.log('Dashboard API Response Status:', resDash.statusCode);
  const data = resDash.jsonPayload?.data;
  console.log('Library Name:', data?.library?.name);
  console.log('Real DB Stats:', data?.stats);
  
  const stats = data?.stats;
  if (!stats || typeof stats.total_books !== 'number' || typeof stats.available_copies !== 'number') {
    throw new Error('Dashboard stats missing required real database fields!');
  }
  console.log('✅ Librarian Dashboard stats verified successfully!');

  console.log('\n🎉 ALL 6 VERIFICATION TEST STEPS PASSED SUCCESSFULLY!');
  await pool.end();
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
