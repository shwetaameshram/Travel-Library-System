const http = require('http');

const API_BASE = 'http://localhost:5000';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING API VERIFICATION TESTS ---\n');

  // 1. Health check
  const health = await makeRequest('GET', '/api/health');
  console.log('1. GET /api/health:', health.status, health.body.status === 'OK' ? '✅ PASSED' : '❌ FAILED');

  // 2. User Registration
  const testEmail = `traveler_${Date.now()}@example.com`;
  const regRes = await makeRequest('POST', '/api/auth/register', {
    name: 'Test Traveler',
    email: testEmail,
    password: 'Password123!',
    mobile: '+19876543210'
  });
  console.log('2. POST /api/auth/register:', regRes.status, regRes.body.success ? '✅ PASSED' : '❌ FAILED');
  const createdUser = regRes.body.user;

  // 3. User Login
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: 'Password123!'
  });
  console.log('3. POST /api/auth/login:', loginRes.status, loginRes.body.success ? '✅ PASSED' : '❌ FAILED');

  // 4. Seeded Admin Login Test
  const adminLoginRes = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@travellib.com',
    password: 'password123'
  });
  console.log('4. POST /api/auth/login (Seed Admin):', adminLoginRes.status, adminLoginRes.body.success ? '✅ PASSED' : '❌ FAILED');

  // 5. GET /api/books
  const booksRes = await makeRequest('GET', '/api/books');
  console.log('5. GET /api/books:', booksRes.status, `Count: ${booksRes.body.count}`, booksRes.body.success ? '✅ PASSED' : '❌ FAILED');

  // 6. GET /api/books/1
  const book1Res = await makeRequest('GET', '/api/books/1');
  console.log('6. GET /api/books/1:', book1Res.status, book1Res.body.data?.title, book1Res.body.success ? '✅ PASSED' : '❌ FAILED');

  // 7. GET /api/libraries
  const libsRes = await makeRequest('GET', '/api/libraries');
  console.log('7. GET /api/libraries:', libsRes.status, `Count: ${libsRes.body.count}`, libsRes.body.success ? '✅ PASSED' : '❌ FAILED');

  // 8. GET /api/connections
  const connRes = await makeRequest('GET', '/api/connections');
  console.log('8. GET /api/connections:', connRes.status, `Count: ${connRes.body.count}`, connRes.body.success ? '✅ PASSED' : '❌ FAILED');

  // 9. POST /api/rentals (Create Rental: User borrows Book 1 at Library 1 [Chandrapur] heading to Library 2 [Nagpur])
  const rentalRes = await makeRequest('POST', '/api/rentals', {
    user_id: createdUser ? createdUser.id : 1,
    book_id: 1,
    source_library_id: 1,
    destination_library_id: 2
  });
  console.log('9. POST /api/rentals:', rentalRes.status, rentalRes.body.data?.rental_code, rentalRes.body.success ? '✅ PASSED' : '❌ FAILED');
  const rental = rentalRes.body.data;

  // 10. GET /api/rentals/:id
  if (rental) {
    const getRentalRes = await makeRequest('GET', `/api/rentals/${rental.id}`);
    console.log('10. GET /api/rentals/:id:', getRentalRes.status, getRentalRes.body.data?.rental_code, getRentalRes.body.success ? '✅ PASSED' : '❌ FAILED');
  }

  // 11. GET /api/rentals/user/:userId
  const userRentalsRes = await makeRequest('GET', `/api/rentals/user/${createdUser ? createdUser.id : 1}`);
  console.log('11. GET /api/rentals/user/:userId:', userRentalsRes.status, `Count: ${userRentalsRes.body.count}`, userRentalsRes.body.success ? '✅ PASSED' : '❌ FAILED');

  // 12. POST /api/returns (Process Return to Library 2 [Nagpur])
  if (rental) {
    const returnRes = await makeRequest('POST', '/api/returns', {
      rental_id: rental.id,
      return_library_id: 2,
      condition: 'good',
      remarks: 'Returned safely at destination'
    });
    console.log('12. POST /api/returns:', returnRes.status, returnRes.body.message, returnRes.body.success ? '✅ PASSED' : '❌ FAILED');
  }

  // 13. GET /api/admin/dashboard
  const adminDashRes = await makeRequest('GET', '/api/admin/dashboard', null, { 'x-user-role': 'admin' });
  console.log('13. GET /api/admin/dashboard:', adminDashRes.status, 'Stats:', JSON.stringify(adminDashRes.body.data?.stats), adminDashRes.body.success ? '✅ PASSED' : '❌ FAILED');

  console.log('\n--- ALL API TESTS COMPLETED ---');
}

runTests().catch(err => {
  console.error('Test script error:', err);
});
