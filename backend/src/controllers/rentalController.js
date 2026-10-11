const { pool } = require('../config/db');

// Helper function to generate unique rental code (e.g. TL-1001)
const generateRentalCode = async () => {
  const [rows] = await pool.query('SELECT MAX(id) as max_id FROM rentals');
  const nextId = (rows[0].max_id || 0) + 1001;
  return `TL-${nextId}`;
};

// POST /api/rentals
// Creates a book rental transaction ONLY after a server-side verified Razorpay payment is provided.
exports.createRental = async (req, res, next) => {
  let connection;
  try {
    const {
      user_id,
      book_id,
      source_library_id,
      destination_library_id,
      due_date,
      razorpay_order_id,
      payment_id
    } = req.body;

    // 1. Input Validation - Ensure payment reference is supplied
    if (!user_id || !book_id || !source_library_id || !destination_library_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user_id, book_id, source_library_id, and destination_library_id'
      });
    }

    const paymentRef = razorpay_order_id || payment_id;
    if (!paymentRef) {
      return res.status(400).json({
        success: false,
        message: 'Payment Required: A verified captured Razorpay payment (razorpay_order_id or payment_id) is required to create a rental.'
      });
    }

    // Connect & Start MySQL Transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 2. Lock & Validate Payment Record FOR UPDATE
    const [payments] = await connection.query(
      `SELECT id, user_id, amount, currency, status, payment_status, rental_id 
       FROM payments 
       WHERE (razorpay_order_id = ? OR id = ?) FOR UPDATE`,
      [paymentRef, paymentRef]
    );

    if (payments.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: No matching payment record found.'
      });
    }

    const payment = payments[0];

    // 3. Confirm Payment belongs to User
    if (payment.user_id && Number(payment.user_id) !== Number(user_id)) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Payment Security Error: Payment record belongs to a different user.'
      });
    }

    // 4. Confirm Payment Status is CAPTURED / PAID
    if (payment.status !== 'captured' && payment.payment_status !== 'PAID') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment Not Captured: Payment status is "${payment.status || payment.payment_status}". Cannot create rental.`
      });
    }

    // 5. Confirm Payment is NOT already linked to another rental (Atomic Anti-Reuse)
    if (payment.rental_id !== null && payment.rental_id !== undefined) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Duplicate Rental Error: Payment has already been linked to rental ID: ${payment.rental_id}`
      });
    }

    // 6. Validate User Exists & Active
    const [users] = await connection.query('SELECT id, name, status FROM users WHERE id = ?', [user_id]);
    if (users.length === 0 || users[0].status === 'inactive') {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `User not found or inactive with ID: ${user_id}` });
    }

    // 7. Validate Book Exists
    const [books] = await connection.query('SELECT id, title FROM books WHERE id = ?', [book_id]);
    if (books.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Book not found with ID: ${book_id}` });
    }

    // 8. Validate Source Library
    const [sourceLibs] = await connection.query('SELECT id, name FROM libraries WHERE id = ?', [source_library_id]);
    if (sourceLibs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Source library not found with ID: ${source_library_id}` });
    }

    // 9. Validate Destination Library
    const [destLibs] = await connection.query('SELECT id, name FROM libraries WHERE id = ?', [destination_library_id]);
    if (destLibs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Destination library not found with ID: ${destination_library_id}` });
    }

    // 10. Re-check Book Stock Availability FOR UPDATE
    const [stock] = await connection.query(
      'SELECT id, available_quantity FROM library_books WHERE library_id = ? AND book_id = ? FOR UPDATE',
      [source_library_id, book_id]
    );

    if (stock.length === 0 || stock[0].available_quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Book "${books[0].title}" is currently out of stock at ${sourceLibs[0].name}`
      });
    }

    // 11. Validate Active Connection Route
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

    // 12. Generate Unique Rental Code
    const rental_code = await generateRentalCode();

    const calculatedDueDate = due_date
      ? new Date(due_date)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 13. Decrease available_quantity by 1 at source library
    await connection.query(
      'UPDATE library_books SET available_quantity = available_quantity - 1 WHERE library_id = ? AND book_id = ?',
      [source_library_id, book_id]
    );

    // 14. Insert Rental Record
    const [rentalResult] = await connection.query(
      `INSERT INTO rentals 
        (rental_code, user_id, book_id, source_library_id, destination_library_id, rental_date, due_date, status) 
       VALUES (?, ?, ?, ?, ?, NOW(), ?, 'rented')`,
      [rental_code, user_id, book_id, source_library_id, destination_library_id, calculatedDueDate]
    );

    const newRentalId = rentalResult.insertId;

    // 15. Atomically Link Payment to Rental Record
    await connection.query(
      'UPDATE payments SET rental_id = ? WHERE id = ?',
      [newRentalId, payment.id]
    );

    // Commit MySQL Transaction
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: {
        id: newRentalId,
        rental_code,
        user_id,
        book_id,
        source_library_id,
        destination_library_id,
        due_date: calculatedDueDate,
        status: 'rented',
        payment_id: payment.id
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// GET /api/rentals/:id
// Fetches rental by numeric ID or by rental_code (e.g., TL-1001)
exports.getRentalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.id,
        r.rental_code,
        r.status,
        r.rental_date,
        r.due_date,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        b.id AS book_id,
        b.title AS book_title,
        b.author AS book_author,
        COALESCE(p.book_value, b.book_value, 500.00) AS book_value,
        COALESCE(p.rental_fee, b.rental_fee, 50.00) AS rental_fee,
        src.id AS source_library_id,
        src.name AS source_library_name,
        dest.id AS destination_library_id,
        dest.name AS destination_library_name,
        ret.id AS return_id,
        ret.return_date,
        ret.condition AS return_condition,
        ret.remarks AS return_remarks,
        p.id AS payment_id,
        COALESCE(p.transaction_id, CONCAT('TXN-TL-', r.id)) AS transaction_id,
        COALESCE(p.security_deposit, b.book_value, 500.00) AS security_deposit,
        COALESCE(p.amount_paid, b.book_value, 500.00) AS amount_paid,
        COALESCE(p.payment_status, 'PAID') AS payment_status,
        COALESCE(p.refund_amount, 0.00) AS refund_amount,
        COALESCE(p.late_fee, 0.00) AS late_fee,
        COALESCE(p.damage_fee, 0.00) AS damage_fee,
        COALESCE(p.total_deduction, 0.00) AS total_deduction,
        COALESCE(p.refund_status, IF(r.status = 'returned', 'REFUNDED', 'PENDING')) AS refund_status,
        p.refund_date
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      JOIN books b ON r.book_id = b.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      LEFT JOIN returns ret ON r.id = ret.rental_id
      LEFT JOIN payments p ON r.id = p.rental_id
      WHERE r.id = ? OR r.rental_code = ?
    `;

    const [rentals] = await pool.query(query, [id, id]);

    if (rentals.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Rental not found with ID or Code: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: rentals[0]
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/rentals/user/:userId
exports.getRentalsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT 
        r.id,
        r.rental_code,
        r.status,
        r.rental_date,
        r.due_date,
        b.id AS book_id,
        b.title AS book_title,
        b.author AS book_author,
        COALESCE(p.book_value, b.book_value, 500.00) AS book_value,
        COALESCE(p.rental_fee, b.rental_fee, 50.00) AS rental_fee,
        COALESCE(p.security_deposit, b.book_value, 500.00) AS security_deposit,
        COALESCE(p.amount_paid, b.book_value, 500.00) AS amount_paid,
        COALESCE(p.payment_status, 'PAID') AS payment_status,
        COALESCE(p.refund_amount, 0.00) AS refund_amount,
        COALESCE(p.late_fee, 0.00) AS late_fee,
        COALESCE(p.damage_fee, 0.00) AS damage_fee,
        COALESCE(p.refund_status, IF(r.status = 'returned', 'REFUNDED', 'PENDING')) AS refund_status,
        p.transaction_id,
        src.name AS source_library_name,
        dest.name AS destination_library_name
      FROM rentals r
      JOIN books b ON r.book_id = b.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      LEFT JOIN payments p ON r.id = p.rental_id
      WHERE r.user_id = ?
      ORDER BY r.rental_date DESC
    `;

    const [rentals] = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    next(error);
  }
};
