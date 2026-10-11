const { pool } = require('../config/db');

// POST /api/returns
exports.processReturn = async (req, res, next) => {
  let connection;
  try {
    const {
      rental_id,
      rental_code,
      return_library_id,
      return_library,
      condition = 'good',
      remarks,
      late_fee = 0,
      damage_fee = 0
    } = req.body;

    const lookupIdentifier = rental_id || rental_code;
    const targetReturnLibId = return_library_id || return_library;

    if (!lookupIdentifier || !targetReturnLibId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rental_id (or rental_code) and return_library_id'
      });
    }

    const lateFeeNum = Math.max(0, Number(late_fee) || 0);
    const damageFeeNum = Math.max(0, Number(damage_fee) || 0);

    if (Number(late_fee) < 0 || Number(damage_fee) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Deductions (late fee or damage charge) cannot be negative.'
      });
    }

    // 1. Validate rental exists
    const [rentals] = await pool.query(
      `SELECT r.*, b.title AS book_title, b.book_value, b.rental_fee 
       FROM rentals r 
       JOIN books b ON r.book_id = b.id 
       WHERE r.id = ? OR r.rental_code = ?`,
      [lookupIdentifier, lookupIdentifier]
    );

    if (rentals.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Rental not found for identifier: ${lookupIdentifier}`
      });
    }

    const rental = rentals[0];

    // 2. Validate rental status is 'rented'
    if (rental.status !== 'rented') {
      return res.status(400).json({
        success: false,
        message: `Cannot return book. Current rental status is "${rental.status.toUpperCase()}"`
      });
    }

    // 3. Validate return library is the destination library
    if (Number(targetReturnLibId) !== Number(rental.destination_library_id)) {
      const [destLibs] = await pool.query('SELECT name FROM libraries WHERE id = ?', [rental.destination_library_id]);
      const destName = destLibs.length > 0 ? destLibs[0].name : `Library ID ${rental.destination_library_id}`;

      return res.status(400).json({
        success: false,
        message: `Invalid return library. Book must be returned to the agreed destination: ${destName}`
      });
    }

    // 4. Check if book has not already been returned in returns table
    const [existingReturns] = await pool.query('SELECT id FROM returns WHERE rental_id = ?', [rental.id]);
    if (existingReturns.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Book has already been returned for this rental'
      });
    }

    // Connect & Begin Database Transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch existing payment record
    const [payments] = await connection.query('SELECT * FROM payments WHERE rental_id = ? FOR UPDATE', [rental.id]);
    
    let security_deposit = Number(rental.book_value || 500);
    let rental_fee = Number(rental.rental_fee || 50);

    if (payments.length > 0) {
      security_deposit = Number(payments[0].security_deposit);
      rental_fee = Number(payments[0].rental_fee);
    }

    // Calculate deductions and refund
    let total_deduction = 0;
    let refund_amount = 0;
    let refund_status = 'REFUNDED';

    if (condition === 'lost') {
      total_deduction = security_deposit;
      refund_amount = 0;
      refund_status = 'NO_REFUND';
    } else {
      total_deduction = rental_fee + lateFeeNum + damageFeeNum;
      const calculatedRefund = security_deposit - total_deduction;
      refund_amount = Math.max(0, calculatedRefund);

      if (refund_amount === 0) {
        refund_status = 'NO_REFUND';
      } else if (lateFeeNum > 0 || damageFeeNum > 0 || refund_amount < (security_deposit - rental_fee)) {
        refund_status = 'PARTIALLY_DEDUCTED';
      } else {
        refund_status = 'REFUNDED';
      }
    }

    // Insert return record
    const [returnResult] = await connection.query(
      `INSERT INTO returns (rental_id, return_library_id, return_date, \`condition\`, remarks) 
       VALUES (?, ?, NOW(), ?, ?)`,
      [rental.id, targetReturnLibId, condition, remarks || null]
    );

    // Update rental status to 'returned'
    await connection.query(
      "UPDATE rentals SET status = 'returned' WHERE id = ?",
      [rental.id]
    );

    // Update or Insert payment record refund details
    if (payments.length > 0) {
      await connection.query(
        `UPDATE payments 
         SET refund_amount = ?, late_fee = ?, damage_fee = ?, total_deduction = ?, refund_status = ?, refund_date = NOW() 
         WHERE rental_id = ?`,
        [refund_amount, lateFeeNum, damageFeeNum, total_deduction, refund_status, rental.id]
      );
    } else {
      // Create payment record if it was missing from legacy rentals
      const txnId = `TXN-TL-${new Date().getFullYear()}-${String(rental.id).padStart(4, '0')}`;
      await connection.query(
        `INSERT INTO payments 
          (transaction_id, rental_id, book_value, rental_fee, security_deposit, amount_paid, payment_status, payment_date, refund_amount, late_fee, damage_fee, total_deduction, refund_status, refund_date) 
         VALUES (?, ?, ?, ?, ?, ?, 'PAID', NOW(), ?, ?, ?, ?, ?, NOW())`,
        [txnId, rental.id, security_deposit, rental_fee, security_deposit, security_deposit, refund_amount, lateFeeNum, damageFeeNum, total_deduction, refund_status]
      );
    }

    // Increase available_quantity of the book at return/destination library IF NOT LOST
    if (condition !== 'lost') {
      const [stock] = await connection.query(
        'SELECT id, quantity, available_quantity FROM library_books WHERE library_id = ? AND book_id = ?',
        [targetReturnLibId, rental.book_id]
      );

      if (stock.length > 0) {
        await connection.query(
          `UPDATE library_books 
           SET available_quantity = available_quantity + 1,
               quantity = GREATEST(quantity, available_quantity + 1)
           WHERE library_id = ? AND book_id = ?`,
          [targetReturnLibId, rental.book_id]
        );
      } else {
        await connection.query(
          `INSERT INTO library_books (library_id, book_id, quantity, available_quantity) 
           VALUES (?, ?, 1, 1)`,
          [targetReturnLibId, rental.book_id]
        );
      }
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Book "${rental.book_title}" successfully returned to destination library`,
      data: {
        return_id: returnResult.insertId,
        rental_id: rental.id,
        rental_code: rental.rental_code,
        return_library_id: targetReturnLibId,
        return_date: new Date(),
        condition,
        remarks,
        refund_summary: {
          security_deposit,
          rental_fee,
          late_fee: lateFeeNum,
          damage_fee: damageFeeNum,
          total_deduction,
          refund_amount,
          refund_status
        }
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};
