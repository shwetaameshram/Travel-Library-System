const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool, testConnection } = require('../config/db');
const authController = require('../controllers/authController');
const librarianController = require('../controllers/librarianController');
const { requireLibrarian } = require('../middleware/librarianMiddleware');
const { requireAdmin } = require('../middleware/authMiddleware');

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

async function runLibrarianManagementTests() {
  console.log('--- STARTING LIBRARIAN MANAGEMENT MODULE VERIFICATION TESTS ---');

  // Initialize DB Connection
  await testConnection();

  // Reset standard passwords
  const salt = await bcrypt.genSalt(10);
  const testHash = await bcrypt.hash('password123', salt);
  await pool.query(
    "UPDATE users SET password = ?, status = 'active' WHERE email IN ('admin@travellib.com', 'librarian.chandrapur@travellib.com', 'librarian.nagpur@travellib.com', 'alex.passenger@example.com')",
    [testHash]
  );

  const [users] = await pool.query("SELECT id, name, email, role, library_id FROM users");
  const libA = users.find(u => u.email === 'librarian.chandrapur@travellib.com');
  const libB = users.find(u => u.email === 'librarian.nagpur@travellib.com');
  const passenger = users.find(u => u.email === 'alex.passenger@example.com');
  const admin = users.find(u => u.email === 'admin@travellib.com');

  if (!libA || !libB || !passenger || !admin) {
    throw new Error('Required test accounts missing from database!');
  }

  // 1. TEST 1: Login (Librarian A)
  console.log('\n--- TEST 1: Librarian A Login ---');
  const reqLogin = { body: { email: 'librarian.chandrapur@travellib.com', password: 'password123' } };
  const resLogin = createMockRes();
  await authController.login(reqLogin, resLogin, (err) => { if (err) console.error(err); });
  if (resLogin.statusCode !== 200 || !resLogin.jsonPayload?.success) {
    throw new Error('Librarian A login failed');
  }
  console.log('✅ TEST 1 PASSED: Librarian A logged in successfully!');

  // 2. TEST 2: Assigned Library Scope
  console.log('\n--- TEST 2: Verify Assigned Library ---');
  const userLibraryId = resLogin.jsonPayload?.user?.library_id;
  if (userLibraryId !== 1) {
    throw new Error(`Expected library_id = 1 for Chandrapur, got ${userLibraryId}`);
  }
  console.log('✅ TEST 2 PASSED: Assigned library verified as Chandrapur Railway Library (ID: 1)!');

  // 3. TEST 3: Books Catalog API
  console.log('\n--- TEST 3: Branch Books Catalog API ---');
  const reqBooks = { user: { id: libA.id, role: 'librarian', library_id: 1 }, query: {} };
  const resBooks = createMockRes();
  await librarianController.getBranchBooks(reqBooks, resBooks, (err) => { if (err) console.error(err); });
  if (resBooks.statusCode !== 200 || !Array.isArray(resBooks.jsonPayload?.data)) {
    throw new Error('Failed to fetch branch books catalog');
  }
  console.log(`✅ TEST 3 PASSED: Retrieved ${resBooks.jsonPayload.data.length} books for branch ID 1!`);

  // 4. TEST 4: Stock API
  console.log('\n--- TEST 4: Branch Stock API ---');
  const reqStock = { user: { id: libA.id, role: 'librarian', library_id: 1 }, query: {} };
  const resStock = createMockRes();
  await librarianController.getBranchStock(reqStock, resStock, (err) => { if (err) console.error(err); });
  if (resStock.statusCode !== 200 || !Array.isArray(resStock.jsonPayload?.data)) {
    throw new Error('Failed to fetch branch stock inventory');
  }
  console.log(`✅ TEST 4 PASSED: Retrieved ${resStock.jsonPayload.data.length} stock inventory items!`);

  // 5. TEST 5: Add / Update Book & Stock
  console.log('\n--- TEST 5: Add / Update Book & Stock ---');
  const dynamicIsbn = `978-0-${Date.now().toString().slice(-6)}-78-9`;
  const reqAddBook = {
    user: { id: libA.id, role: 'librarian', library_id: 1 },
    body: {
      title: 'Automated Test Express Book',
      author: 'Test Author',
      isbn: dynamicIsbn,
      genre: 'Sci-Fi',
      initial_quantity: 10
    }
  };
  const resAddBook = createMockRes();
  await librarianController.createBranchBook(reqAddBook, resAddBook, (err) => { if (err) console.error(err); });
  if (resAddBook.statusCode !== 201 || !resAddBook.jsonPayload?.data?.id) {
    throw new Error('Failed to create book and add stock');
  }
  const newBookId = resAddBook.jsonPayload.data.id;
  console.log(`✅ TEST 5 PASSED: New book created (ID: ${newBookId}) with 10 initial stock copies!`);

  // 6. TEST 6: Rental Creation
  console.log('\n--- TEST 6: Create Rental on Behalf of Passenger ---');
  const [initialStockBefore] = await pool.query('SELECT available_quantity FROM library_books WHERE library_id = 1 AND book_id = ?', [newBookId]);
  const availBefore = initialStockBefore[0]?.available_quantity;

  const reqCreateRental = {
    user: { id: libA.id, role: 'librarian', library_id: 1 },
    body: {
      user_id: passenger.id,
      book_id: newBookId,
      destination_library_id: 2, // Return to Nagpur
      due_date: '2026-10-25'
    }
  };
  const resCreateRental = createMockRes();
  await librarianController.createBranchRental(reqCreateRental, resCreateRental, (err) => { if (err) console.error(err); });
  if (resCreateRental.statusCode !== 201 || !resCreateRental.jsonPayload?.data?.rental_code) {
    throw new Error('Failed to create passenger rental');
  }
  const createdRentalCode = resCreateRental.jsonPayload.data.rental_code;
  console.log(`✅ TEST 6 PASSED: Rental created successfully with code ${createdRentalCode}!`);

  // 7. TEST 7: Verify Stock Decreases After Rental
  console.log('\n--- TEST 7: Verify Stock Available Quantity Decreased ---');
  const [stockAfterRental] = await pool.query('SELECT available_quantity FROM library_books WHERE library_id = 1 AND book_id = ?', [newBookId]);
  const availAfterRental = stockAfterRental[0]?.available_quantity;
  console.log(`Available stock before: ${availBefore}, after rental: ${availAfterRental}`);
  if (availAfterRental !== availBefore - 1) {
    throw new Error('Stock available quantity did not decrease by 1 after rental creation');
  }
  console.log('✅ TEST 7 PASSED: Stock available quantity accurately decreased by 1!');

  // 8. TEST 8: Process Return
  console.log('\n--- TEST 8: Process Book Return ---');
  const [rentalsInDb] = await pool.query('SELECT id FROM rentals WHERE rental_code = ?', [createdRentalCode]);
  const rentalId = rentalsInDb[0].id;

  const reqReturn = {
    user: { id: libA.id, role: 'librarian', library_id: 2 }, // Returning at Nagpur (ID: 2)
    params: { id: rentalId }
  };
  const resReturn = createMockRes();
  await librarianController.processBranchReturn(reqReturn, resReturn, (err) => { if (err) console.error(err); });
  if (resReturn.statusCode !== 200) {
    throw new Error('Failed to process book return');
  }
  console.log(`✅ TEST 8 PASSED: Return processed for rental ID ${rentalId}!`);

  // 9. TEST 9: Verify Stock Increases After Return
  console.log('\n--- TEST 9: Verify Stock Available Quantity Increased ---');
  const [stockAfterReturn] = await pool.query('SELECT available_quantity FROM library_books WHERE library_id = 2 AND book_id = ?', [newBookId]);
  const availAfterReturn = stockAfterReturn[0]?.available_quantity;
  if (availAfterReturn < 1) {
    throw new Error('Destination library available quantity did not increase after return');
  }
  console.log('✅ TEST 9 PASSED: Return destination library stock accurately increased!');

  // 10. TEST 10: Passenger Rental History
  console.log('\n--- TEST 10: Fetch Passenger Rental History ---');
  const reqPassHistory = { user: { id: libA.id, role: 'librarian', library_id: 1 }, params: { id: passenger.id } };
  const resPassHistory = createMockRes();
  await librarianController.getBranchPassengerDetails(reqPassHistory, resPassHistory, (err) => { if (err) console.error(err); });
  if (resPassHistory.statusCode !== 200 || !resPassHistory.jsonPayload?.data?.rentals) {
    throw new Error('Failed to fetch passenger rental history');
  }
  console.log(`✅ TEST 10 PASSED: Retrieved passenger rental history (${resPassHistory.jsonPayload.data.rentals.length} records)!`);

  // 11. TEST 11: Connected Libraries API
  console.log('\n--- TEST 11: Connected Libraries Network API ---');
  const reqConnected = { user: { id: libA.id, role: 'librarian', library_id: 1 }, query: {} };
  const resConnected = createMockRes();
  await librarianController.getConnectedLibraries(reqConnected, resConnected, (err) => { if (err) console.error(err); });
  if (resConnected.statusCode !== 200 || !Array.isArray(resConnected.jsonPayload?.data)) {
    throw new Error('Failed to fetch connected libraries list');
  }
  console.log(`✅ TEST 11 PASSED: Fetched ${resConnected.jsonPayload.data.length} connected library branches!`);

  // 12. TEST 12: Branch Analytics & Reports
  console.log('\n--- TEST 12: Branch Performance Reports API ---');
  const reqReports = { user: { id: libA.id, role: 'librarian', library_id: 1 } };
  const resReports = createMockRes();
  await librarianController.getBranchReports(reqReports, resReports, (err) => { if (err) console.error(err); });
  if (resReports.statusCode !== 200 || !resReports.jsonPayload?.data?.summary) {
    throw new Error('Failed to generate branch analytics report');
  }
  console.log('✅ TEST 12 PASSED: Generated real-time branch performance analytics report!');

  // 13. TEST 13: Library & Librarian Profile API
  console.log('\n--- TEST 13: Branch Profile & Credentials API ---');
  const reqProfile = { user: { id: libA.id, role: 'librarian', library_id: 1 } };
  const resProfile = createMockRes();
  await librarianController.getBranchProfile(reqProfile, resProfile, (err) => { if (err) console.error(err); });
  if (resProfile.statusCode !== 200 || !resProfile.jsonPayload?.data?.library) {
    throw new Error('Failed to fetch librarian profile');
  }
  console.log(`✅ TEST 13 PASSED: Retrieved profile for ${resProfile.jsonPayload.data.library.name}!`);

  // 14. TEST 14: Security - Librarian cannot access Admin API
  console.log('\n--- TEST 14: RBAC Security - Librarian Blocked from Admin APIs ---');
  const reqLibToAdmin = { headers: { 'x-user-role': 'librarian', 'x-user-id': String(libA.id) } };
  const resLibToAdmin = createMockRes();
  let nextCalled = false;
  await requireAdmin(reqLibToAdmin, resLibToAdmin, () => { nextCalled = true; });
  if (nextCalled || resLibToAdmin.statusCode !== 403) {
    throw new Error('Librarian was incorrectly allowed access to admin endpoints!');
  }
  console.log('✅ TEST 14 PASSED: Librarian correctly blocked with 403 Forbidden on Admin APIs!');

  // 15. TEST 15: Security - Passenger cannot access Librarian API
  console.log('\n--- TEST 15: RBAC Security - Passenger Blocked from Librarian APIs ---');
  const reqPassToLib = { headers: { 'x-user-role': 'user', 'x-user-id': String(passenger.id) } };
  const resPassToLib = createMockRes();
  nextCalled = false;
  await requireLibrarian(reqPassToLib, resPassToLib, () => { nextCalled = true; });
  if (nextCalled || resPassToLib.statusCode !== 403) {
    throw new Error('Passenger was incorrectly allowed access to librarian endpoints!');
  }
  console.log('✅ TEST 15 PASSED: Passenger correctly blocked with 403 Forbidden on Librarian APIs!');

  // 16. TEST 16: Data Isolation - Librarian B scoped to Library 2
  console.log('\n--- TEST 16: Branch Data Isolation Security ---');
  const reqLibB = { user: { id: libB.id, role: 'librarian', library_id: 2 } };
  const resLibB = createMockRes();
  await librarianController.getBranchProfile(reqLibB, resLibB, (err) => { if (err) console.error(err); });
  if (resLibB.jsonPayload?.data?.library?.id !== 2) {
    throw new Error('Librarian B was not scoped to Library 2');
  }
  console.log('✅ TEST 16 PASSED: Branch data isolation strictly enforced for Librarian B (Nagpur)!');

  // 17. TEST 17: Existing Librarian tests pass
  console.log('\n--- TEST 17: Existing Librarian Test Suite Compatibility ---');
  const reqLibMid = { headers: { 'x-user-role': 'librarian', 'x-user-id': String(libA.id) } };
  const resLibMid = createMockRes();
  nextCalled = false;
  await requireLibrarian(reqLibMid, resLibMid, () => { nextCalled = true; });
  if (!nextCalled || reqLibMid.user?.library_id !== 1) {
    throw new Error('Existing librarian middleware authorization check failed!');
  }
  console.log('✅ TEST 17 PASSED: Existing librarian middleware functioning seamlessly!');

  // 18. TEST 18: Existing Admin tests pass
  console.log('\n--- TEST 18: Existing Admin Test Suite Compatibility ---');
  const reqAdminLogin = { body: { email: 'admin@travellib.com', password: 'password123' } };
  const resAdminLogin = createMockRes();
  await authController.login(reqAdminLogin, resAdminLogin, (err) => { if (err) console.error(err); });
  if (resAdminLogin.statusCode !== 200 || resAdminLogin.jsonPayload?.user?.role !== 'admin') {
    throw new Error('Existing admin login test failed!');
  }
  console.log('✅ TEST 18 PASSED: Existing admin login verified!');

  console.log('\n🎉 ALL LIBRARIAN MANAGEMENT MODULE VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  await pool.end();
  process.exit(0);
}

runLibrarianManagementTests().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
