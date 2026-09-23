const { pool } = require('../config/db');

// POST /api/returns
exports.processReturn = async (req, res, next) => {
  let connection;
  try {
    const { rental_id, rental_code, return_library_id, return_library, condition = 'good', remarks } = req.body;

    const lookupIdentifier = rental_id || rental_code;
    const targetReturnLibId = return_library_id || return_library;

    if (!lookupIdentifier || !targetReturnLibId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rental_id (or rental_code) and return_library_id'
      });
    }

    // 1. Validate rental exists
    const [rentals] = await pool.query(
      `SELECT r.*, b.title AS book_title 
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

    // Begin Database Transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

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

    // Increase available_quantity of the book at the return/destination library
    const [stock] = await connection.query(
      'SELECT id, quantity, available_quantity FROM library_books WHERE library_id = ? AND book_id = ?',
      [targetReturnLibId, rental.book_id]
    );

    if (stock.length > 0) {
      // Stock record exists -> increment available_quantity (and adjust total quantity if needed)
      await connection.query(
        `UPDATE library_books 
         SET available_quantity = available_quantity + 1,
             quantity = GREATEST(quantity, available_quantity + 1)
         WHERE library_id = ? AND book_id = ?`,
        [targetReturnLibId, rental.book_id]
      );
    } else {
      // No prior stock record at destination library -> insert new library_book entry
      await connection.query(
        `INSERT INTO library_books (library_id, book_id, quantity, available_quantity) 
         VALUES (?, ?, 1, 1)`,
        [targetReturnLibId, rental.book_id]
      );
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
        remarks
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};
