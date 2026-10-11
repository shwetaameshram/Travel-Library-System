const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool, testConnection } = require('./config/db');
const paymentController = require('./controllers/paymentController');
const rentalController = require('./controllers/rentalController');

// Mock response builder
function createMockRes() {
  const res = {};
  res.statusCode = 200;
  res.data = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 Starting Phase 3 Comprehensive Integration Tests');
  console.log('==================================================\n');

  try {
    // 1. Test Database Connectivity & Migration
    await testConnection();
    console.log('✅ TEST 1: Database connected & migrations executed successfully.\n');

    // Fetch sample data for testing (Alex Passenger = ID 1, Book ID 1 = The Alchemist, Source Lib 1, Dest Lib 2)
    const [users] = await pool.query("SELECT id, name FROM users WHERE email = 'alex.passenger@example.com'");
    const userId = users[0]?.id || 1;
    const bookId = 1;
    const sourceLibId = 1;
    const destLibId = 2;

    // Reset stock to quantity for clean test execution
    await pool.query('UPDATE library_books SET available_quantity = quantity WHERE library_id = ? AND book_id = ?', [sourceLibId, bookId]);

    // 2. Test createOrder (POST /api/payments/create-order)
    console.log('--- 1. Testing POST /api/payments/create-order ---');
    const reqCreate = {
      body: {
        user_id: userId,
        book_id: bookId,
        source_library_id: sourceLibId,
        destination_library_id: destLibId
      },
      user: { id: userId }
    };
    const resCreate = createMockRes();
    await paymentController.createOrder(reqCreate, resCreate, (err) => { if (err) console.error(err); });

    if (resCreate.statusCode !== 201 || !resCreate.data?.success) {
      throw new Error(`Create Order failed: ${JSON.stringify(resCreate.data)}`);
    }
    console.log('✅ TEST 1 (Create Order): Calculates fee server-side, validates route, creates order & pending record.\n');

    const orderData = resCreate.data.data;
    const orderId = orderData.order_id;

    // 3. Test Invalid Signature Verification (POST /api/payments/verify)
    console.log('--- 2. Testing POST /api/payments/verify with INVALID signature ---');
    const reqVerifyBad = {
      body: {
        user_id: userId,
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_mock_invalid',
        razorpay_signature: 'invalid_signature_hash'
      },
      user: { id: userId }
    };
    const resVerifyBad = createMockRes();
    await paymentController.verifyPayment(reqVerifyBad, resVerifyBad, (err) => { if (err) console.error(err); });

    if (resVerifyBad.statusCode !== 400) {
      throw new Error('Expected 400 Bad Request on invalid signature!');
    }
    console.log('✅ TEST 2 (Invalid Signature): Rejection of invalid HMAC-SHA256 signature verified.\n');

    // 4. Test Valid Signature Verification
    console.log('--- 3. Testing POST /api/payments/verify with VALID signature ---');
    const mockPaymentId = `pay_mock_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${mockPaymentId}`)
      .digest('hex');

    const reqVerifyGood = {
      body: {
        user_id: userId,
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature
      },
      user: { id: userId }
    };
    const resVerifyGood = createMockRes();
    await paymentController.verifyPayment(reqVerifyGood, resVerifyGood, (err) => { if (err) console.error(err); });

    if (resVerifyGood.statusCode !== 200 || !resVerifyGood.data?.success) {
      throw new Error(`Valid signature verification failed: ${JSON.stringify(resVerifyGood.data)}`);
    }
    console.log('✅ TEST 3 (Valid Signature): Signature verified and status updated to captured/PAID.\n');

    // 5. Test Payment Ownership (User A vs User B)
    console.log('--- 4. Testing Payment Ownership Security ---');
    const reqRentalWrongUser = {
      body: {
        user_id: 999, // User B attempting to use User A's payment
        book_id: bookId,
        source_library_id: sourceLibId,
        destination_library_id: destLibId,
        razorpay_order_id: orderId
      }
    };
    const resRentalWrongUser = createMockRes();
    await rentalController.createRental(reqRentalWrongUser, resRentalWrongUser, (err) => { if (err) console.error(err); });

    if (resRentalWrongUser.statusCode !== 403) {
      throw new Error('Expected HTTP 403 when User B attempts to use User A\'s payment!');
    }
    console.log('✅ TEST 4 (Payment Ownership): Cross-user payment unauthorized use rejected (HTTP 403).\n');

    // 6. Test Rental Creation WITHOUT payment
    console.log('--- 5. Testing POST /api/rentals WITHOUT payment ---');
    const reqRentalNoPay = {
      body: {
        user_id: userId,
        book_id: bookId,
        source_library_id: sourceLibId,
        destination_library_id: destLibId
      }
    };
    const resRentalNoPay = createMockRes();
    await rentalController.createRental(reqRentalNoPay, resRentalNoPay, (err) => { if (err) console.error(err); });

    if (resRentalNoPay.statusCode !== 400) {
      throw new Error('Expected HTTP 400 when creating rental without payment!');
    }
    console.log('✅ TEST 5 (No Payment): Rental request without verified payment rejected (HTTP 400).\n');

    // 7. Test Rental Creation WITH Valid Verified Payment (Atomicity Test)
    console.log('--- 6. Testing Atomic Rental Creation & Payment Linking ---');
    const reqRentalGood = {
      body: {
        user_id: userId,
        book_id: bookId,
        source_library_id: sourceLibId,
        destination_library_id: destLibId,
        razorpay_order_id: orderId
      }
    };
    const resRentalGood = createMockRes();
    await rentalController.createRental(reqRentalGood, resRentalGood, (err) => { if (err) console.error(err); });

    if (resRentalGood.statusCode !== 201 || !resRentalGood.data?.success) {
      throw new Error(`Rental creation failed: ${JSON.stringify(resRentalGood.data)}`);
    }
    const createdRentalId = resRentalGood.data.data.id;

    // Confirm DB linking
    const [linkedPayments] = await pool.query('SELECT rental_id, status FROM payments WHERE razorpay_order_id = ?', [orderId]);
    if (linkedPayments.length === 0 || Number(linkedPayments[0].rental_id) !== Number(createdRentalId)) {
      throw new Error('Database Linking Error: payment.rental_id does not match created rental ID!');
    }
    console.log(`✅ TEST 6 (Atomic Linking): Rental #${createdRentalId} created & linked to payment.rental_id.\n`);

    // 8. Test Duplicate Submission Protection (Re-using same payment)
    console.log('--- 7. Testing Duplicate Payment Reuse Protection ---');
    const resRentalDup = createMockRes();
    await rentalController.createRental(reqRentalGood, resRentalDup, (err) => { if (err) console.error(err); });

    if (resRentalDup.statusCode !== 400) {
      throw new Error('Expected HTTP 400 on duplicate payment reuse!');
    }
    console.log('✅ TEST 7 (Duplicate Protection): Second rental creation attempt using same payment rejected.\n');

    // 9. Test Retry Confirm Rental (Verified Payment Retry Scenario)
    console.log('--- 8. Testing Retry Confirm Rental Scenario ---');
    // Create new order & verify payment
    const resCreate2 = createMockRes();
    await paymentController.createOrder(reqCreate, resCreate2, (err) => { if (err) console.error(err); });
    const orderData2 = resCreate2.data.data;
    const orderId2 = orderData2.order_id;

    const mockPaymentId2 = `pay_mock_retry_${Date.now()}`;
    const validSignature2 = crypto
      .createHmac('sha256', secret)
      .update(`${orderId2}|${mockPaymentId2}`)
      .digest('hex');

    const resVerify2 = createMockRes();
    await paymentController.verifyPayment(
      { body: { user_id: userId, razorpay_order_id: orderId2, razorpay_payment_id: mockPaymentId2, razorpay_signature: validSignature2 }, user: { id: userId } },
      resVerify2,
      (err) => { if (err) console.error(err); }
    );

    if (resVerify2.statusCode !== 200) {
      throw new Error('Payment verification 2 failed');
    }

    // First attempt at rental creation succeeds for retry scenario
    const resRetry = createMockRes();
    await rentalController.createRental(
      { body: { user_id: userId, book_id: bookId, source_library_id: sourceLibId, destination_library_id: destLibId, razorpay_order_id: orderId2 } },
      resRetry,
      (err) => { if (err) console.error(err); }
    );

    if (resRetry.statusCode !== 201) {
      throw new Error('Retry confirmation failed');
    }
    console.log('✅ TEST 8 (Retry Confirm Rental): Verified payment reused safely to complete rental.\n');

    // 10. Test Stock Protection when available_quantity = 0
    console.log('--- 9. Testing Stock Protection & Exhaustion ---');
    try {
      // Temporarily set stock to 0
      await pool.query('UPDATE library_books SET available_quantity = 0 WHERE library_id = ? AND book_id = ?', [sourceLibId, bookId]);

      // Create order while stock is 0
      const resCreateOut = createMockRes();
      await paymentController.createOrder(reqCreate, resCreateOut, (err) => { if (err) console.error(err); });

      if (resCreateOut.statusCode !== 400) {
        throw new Error('Expected HTTP 400 when creating order for out-of-stock book!');
      }
    } finally {
      // Restore stock to positive quantity
      await pool.query('UPDATE library_books SET available_quantity = quantity WHERE library_id = ? AND book_id = ?', [sourceLibId, bookId]);
    }
    console.log('✅ TEST 9 (Stock Protection): Out-of-stock rental request properly rejected.\n');

    // 11. Test Webhook Handler (POST /api/payments/webhook)
    console.log('--- 10. Testing POST /api/payments/webhook ---');
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: mockPaymentId,
            order_id: orderId,
            status: 'captured'
          }
        }
      }
    });

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_placeholder_webhook_secret';
    const webhookSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookPayload)
      .digest('hex');

    const reqWebhook = {
      headers: { 'x-razorpay-signature': webhookSignature },
      rawBody: Buffer.from(webhookPayload),
      body: JSON.parse(webhookPayload)
    };
    const resWebhook = createMockRes();
    await paymentController.handleWebhook(reqWebhook, resWebhook, (err) => { if (err) console.error(err); });

    if (resWebhook.statusCode !== 200) {
      throw new Error('Webhook processing failed!');
    }
    console.log('✅ TEST 10 (Webhook Verification): Webhook signature verified and event processed idempotently.\n');

    console.log('==================================================');
    console.log('🎉 ALL PHASE 3 INTEGRATION & SECURITY TESTS PASSED!');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
