const crypto = require('crypto');
const Razorpay = require('razorpay');
const { pool } = require('../config/db');

// Initialize Razorpay SDK instance
const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id').trim();
const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret').trim();
const razorpayWebhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_placeholder_webhook_secret').trim();

let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
} catch (err) {
  console.warn('⚠️ Razorpay SDK initialization warning:', err.message);
}

// Helper to generate unique transaction ID (e.g., TXN-TL-2026-0001-9823)
const generateTransactionId = async (connection) => {
  const [rows] = await connection.query('SELECT MAX(id) as max_id FROM payments');
  const nextId = (rows[0].max_id || 0) + 1;
  const paddedId = String(nextId).padStart(4, '0');
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN-TL-${year}-${paddedId}-${rand}`;
};

// Helper to generate unique rental code
const generateRentalCode = async (connection) => {
  const [rows] = await connection.query('SELECT MAX(id) as max_id FROM rentals');
  const nextId = (rows[0].max_id || 0) + 1;
  const paddedId = String(nextId).padStart(4, '0');
  const year = new Date().getFullYear();
  return `TL-${year}-${paddedId}`;
};

// Helper for timeout-protected Razorpay SDK order creation with diagnostic logs
const createRazorpayOrderWithTimeout = (rzpInstance, options, timeoutMs = 12000) => {
  const startTime = Date.now();
  const currentKeyId = (process.env.RAZORPAY_KEY_ID || razorpayKeyId).trim();
  const safeKeySnippet = currentKeyId ? `${currentKeyId.substring(0, 10)}...` : 'undefined';
  console.log(`[Razorpay SDK] 🚀 Starting Razorpay order creation (Amount: ${options.amount} paise, Key: ${safeKeySnippet})`);

  let timer = null;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const elapsedMs = Date.now() - startTime;
      console.error(`[Razorpay SDK] ❌ Razorpay order creation TIMED OUT after ${elapsedMs}ms (${timeoutMs / 1000}s limit)`);
      reject(new Error(`Razorpay API request timed out after ${timeoutMs / 1000} seconds. Please check network connectivity or API credentials.`));
    }, timeoutMs);
  });

  const sdkPromise = rzpInstance.orders.create(options)
    .then((order) => {
      const elapsedMs = Date.now() - startTime;
      console.log(`[Razorpay SDK] ✅ Razorpay order creation SUCCEEDED in ${elapsedMs}ms. Order ID: ${order.id}`);
      return order;
    })
    .catch((err) => {
      const elapsedMs = Date.now() - startTime;
      const errMsg = err.error?.description || err.message || 'Razorpay order creation failed';
      console.error(`[Razorpay SDK] ❌ Razorpay order creation FAILED in ${elapsedMs}ms:`, errMsg);
      throw err;
    });

  return Promise.race([sdkPromise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

/**
 * 1. POST /api/payments/create-order
 * Creates a Razorpay order SERVER-SIDE based on validated book & route pricing.
 * NEVER trusts fee amounts sent by client.
 */
exports.createOrder = async (req, res, next) => {
  let connection;
  try {
    const { user_id, book_id, source_library_id, destination_library_id } = req.body;
    const reqUserId = req.user?.id || user_id;

    if (!reqUserId || !book_id || !source_library_id || !destination_library_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: user_id, book_id, source_library_id, destination_library_id'
      });
    }

    connection = await pool.getConnection();

    // 1. Validate User
    const [users] = await connection.query('SELECT id, name, email, status FROM users WHERE id = ?', [reqUserId]);
    if (users.length === 0 || users[0].status === 'inactive') {
      connection.release();
      return res.status(403).json({ success: false, message: 'User account is invalid or inactive.' });
    }

    // 2. Validate Book & Calculate fee SERVER-SIDE ONLY
    const [books] = await connection.query('SELECT id, title, book_value, rental_fee FROM books WHERE id = ?', [book_id]);
    if (books.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: `Book not found with ID: ${book_id}` });
    }

    const book = books[0];
    const book_value = Number(book.book_value || 500.0);
    const rental_fee = Number(book.rental_fee || 50.0);
    const security_deposit = book_value;
    const totalAmountINR = security_deposit; // Required refundable deposit amount in INR

    // 3. Check Book Stock Availability at Source Library
    const [stock] = await connection.query(
      'SELECT id, available_quantity FROM library_books WHERE library_id = ? AND book_id = ?',
      [source_library_id, book_id]
    );

    if (stock.length === 0 || stock[0].available_quantity <= 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Book "${book.title}" is currently out of stock at source library.`
      });
    }

    // 4. Validate Route Connection
    const [connections] = await connection.query(
      'SELECT id FROM library_connections WHERE source_library_id = ? AND destination_library_id = ? AND active = TRUE',
      [source_library_id, destination_library_id]
    );

    if (connections.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'No active travel route connection between the selected libraries.'
      });
    }

    // 5. Convert INR to smallest currency unit (paise) for Razorpay
    const amountInPaise = Math.round(totalAmountINR * 100);
    const currency = 'INR';

    const isPlaceholderKey = !razorpayKeyId || razorpayKeyId.includes('placeholder') || razorpayKeyId === 'rzp_test_placeholder_key_id';
    let razorpayOrderId = null;

    // Call Razorpay API to create order (or mock if using placeholder keys during local dev tests)
    if (razorpay && !isPlaceholderKey) {
      try {
        const orderOptions = {
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now()}_${reqUserId}`,
          notes: {
            user_id: reqUserId,
            book_id,
            source_library_id,
            destination_library_id
          }
        };
        const razorpayOrder = await createRazorpayOrderWithTimeout(razorpay, orderOptions, 12000);
        razorpayOrderId = razorpayOrder.id;
      } catch (rzpErr) {
        const errMsg = rzpErr.error?.description || rzpErr.message || 'Razorpay order creation failed or timed out.';
        console.error('❌ Razorpay order creation error:', errMsg);
        if (connection) connection.release();
        return res.status(502).json({
          success: false,
          message: `Payment gateway authentication/configuration error: ${errMsg}`
        });
      }
    } else {
      // Mock Razorpay Order ID for sandbox unit testing when placeholder keys are explicitly configured
      razorpayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }

    const transaction_id = await generateTransactionId(connection);

    // 6. Insert Pending Payment Record into DB
    const [insertResult] = await connection.query(
      `INSERT INTO payments 
        (transaction_id, user_id, razorpay_order_id, amount, currency, status, payment_status, book_value, rental_fee, security_deposit, amount_paid)
       VALUES (?, ?, ?, ?, ?, 'created', 'PENDING', ?, ?, ?, ?)`,
      [transaction_id, reqUserId, razorpayOrderId, totalAmountINR, currency, book_value, rental_fee, security_deposit, totalAmountINR]
    );

    connection.release();

    // 7. Return ONLY safe parameters required by Checkout frontend
    return res.status(201).json({
      success: true,
      data: {
        order_id: razorpayOrderId,
        amount: amountInPaise,
        currency,
        key_id: razorpayKeyId,
        payment_record_id: insertResult.insertId
      }
    });
  } catch (error) {
    if (connection) connection.release();
    next(error);
  }
};

/**
 * 2. POST /api/payments/verify
 * Verifies HMAC-SHA256 signature sent from Razorpay Checkout.
 * Updates payment status to 'captured' & 'PAID'.
 */
exports.verifyPayment = async (req, res, next) => {
  let connection;
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const reqUserId = req.user?.id || req.body.user_id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing verification parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature'
      });
    }

    // 1. Signature Verification via HMAC-SHA256 using RAZORPAY_KEY_SECRET
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex');

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      );
    } catch {
      isValid = expectedSignature === razorpay_signature;
    }

    // Allow mock valid signature during sandbox unit tests when placeholder keys are active
    if (!isValid && razorpay_signature === 'mock_valid_signature' && razorpayKeyId.includes('placeholder')) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature. Payment verification failed.'
      });
    }

    connection = await pool.getConnection();

    // 2. Fetch stored payment record
    const [payments] = await connection.query(
      'SELECT id, user_id, amount, currency, status, rental_id FROM payments WHERE razorpay_order_id = ?',
      [razorpay_order_id]
    );

    if (payments.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Payment record not found for the specified order.' });
    }

    const payment = payments[0];

    // 3. Authorization check
    if (reqUserId && payment.user_id && Number(payment.user_id) !== Number(reqUserId)) {
      connection.release();
      return res.status(403).json({ success: false, message: 'Unauthorized: Payment does not belong to this user.' });
    }

    // Prevent duplicate captured status override or reuse
    if (payment.status === 'captured' || payment.status === 'PAID') {
      connection.release();
      return res.status(200).json({
        success: true,
        message: 'Payment was already verified and captured.',
        data: payment
      });
    }

    // 4. Update Payment status in MySQL
    await connection.query(
      `UPDATE payments 
       SET razorpay_payment_id = ?, razorpay_signature = ?, status = 'captured', payment_status = 'PAID', updated_at = NOW()
       WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, payment.id]
    );

    const [updatedPayments] = await connection.query('SELECT * FROM payments WHERE id = ?', [payment.id]);
    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Payment successfully verified and captured.',
      data: updatedPayments[0]
    });
  } catch (error) {
    if (connection) connection.release();
    next(error);
  }
};

/**
 * 3. POST /api/payments/webhook
 * Handles Razorpay Webhook events (payment.captured, payment.failed, order.paid).
 * Verifies signature using RAZORPAY_WEBHOOK_SECRET.
 */
exports.handleWebhook = async (req, res, next) => {
  let connection;
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing x-razorpay-signature header' });
    }

    const rawPayload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', razorpayWebhookSecret)
      .update(rawPayload)
      .digest('hex');

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch {
      isValid = expectedSignature === signature;
    }

    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventType = event.event;
    const payload = event.payload;

    connection = await pool.getConnection();

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const entity = payload?.payment?.entity || payload?.order?.entity;
      const orderId = entity?.order_id || entity?.id;
      const paymentId = entity?.id;

      if (orderId) {
        // Never downgrade an already captured payment
        await connection.query(
          `UPDATE payments 
           SET status = 'captured', payment_status = 'PAID', razorpay_payment_id = COALESCE(razorpay_payment_id, ?)
           WHERE razorpay_order_id = ? AND status != 'captured'`,
          [paymentId, orderId]
        );
      }
    } else if (eventType === 'payment.failed') {
      const entity = payload?.payment?.entity;
      const orderId = entity?.order_id;
      if (orderId) {
        // Only mark failed if not already captured
        await connection.query(
          `UPDATE payments 
           SET status = 'failed', payment_status = 'FAILED'
           WHERE razorpay_order_id = ? AND status != 'captured'`,
          [orderId]
        );
      }
    }

    connection.release();
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    if (connection) connection.release();
    next(error);
  }
};

/**
 * 4. POST /api/payments/process (Legacy / Simulated Endpoint Preserved)
 */
exports.processPayment = async (req, res, next) => {
  let connection;
  try {
    const {
      user_id,
      book_id,
      source_library_id,
      destination_library_id,
      due_date,
      simulate_failure = false
    } = req.body;

    if (!user_id || !book_id || !source_library_id || !destination_library_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user_id, book_id, source_library_id, and destination_library_id'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query('SELECT id, name, email FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `User not found with ID: ${user_id}` });
    }

    const [books] = await connection.query('SELECT id, title, author, book_value, rental_fee FROM books WHERE id = ?', [book_id]);
    if (books.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Book not found with ID: ${book_id}` });
    }

    const book = books[0];
    const book_value = Number(book.book_value || 500);
    const rental_fee = Number(book.rental_fee || 50);
    const security_deposit = book_value;
    const initial_payment = security_deposit;

    const [sourceLibs] = await connection.query('SELECT id, name FROM libraries WHERE id = ?', [source_library_id]);
    if (sourceLibs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Source library not found with ID: ${source_library_id}` });
    }

    const [destLibs] = await connection.query('SELECT id, name FROM libraries WHERE id = ?', [destination_library_id]);
    if (destLibs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Destination library not found with ID: ${destination_library_id}` });
    }

    const [stock] = await connection.query(
      'SELECT id, available_quantity FROM library_books WHERE library_id = ? AND book_id = ? FOR UPDATE',
      [source_library_id, book_id]
    );

    if (stock.length === 0 || stock[0].available_quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Book "${book.title}" is currently not available at ${sourceLibs[0].name}`
      });
    }

    const [connections] = await connection.query(
      'SELECT id FROM library_connections WHERE source_library_id = ? AND destination_library_id = ? AND active = TRUE',
      [source_library_id, destination_library_id]
    );

    if (connections.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `No active route connection from ${sourceLibs[0].name} to ${destLibs[0].name}`
      });
    }

    if (simulate_failure) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Simulated Payment Failed: Payment declined by demo gateway.'
      });
    }

    const transaction_id = await generateTransactionId(connection);
    const rental_code = await generateRentalCode(connection);

    const calculatedDueDate = due_date
      ? new Date(due_date)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await connection.query(
      'UPDATE library_books SET available_quantity = available_quantity - 1 WHERE library_id = ? AND book_id = ?',
      [source_library_id, book_id]
    );

    const [rentalResult] = await connection.query(
      `INSERT INTO rentals 
        (rental_code, user_id, book_id, source_library_id, destination_library_id, rental_date, due_date, status) 
       VALUES (?, ?, ?, ?, ?, NOW(), ?, 'rented')`,
      [rental_code, user_id, book_id, source_library_id, destination_library_id, calculatedDueDate]
    );

    const rental_id = rentalResult.insertId;

    const [paymentResult] = await connection.query(
      `INSERT INTO payments 
        (transaction_id, user_id, rental_id, book_value, rental_fee, security_deposit, amount_paid, payment_status, status, payment_date, refund_amount, refund_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', 'captured', NOW(), 0.00, 'PENDING')`,
      [transaction_id, user_id, rental_id, book_value, rental_fee, security_deposit, initial_payment]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Payment processed and rental created successfully',
      data: {
        payment_id: paymentResult.insertId,
        transaction_id,
        rental_id,
        rental_code,
        payment_status: 'PAID',
        rental_status: 'rented'
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};
