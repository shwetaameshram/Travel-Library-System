const { pool } = require('../config/db');

// Helper function to generate unique rental code (e.g. TL-1001)
const generateRentalCode = async () => {
  const [rows] = await pool.query('SELECT MAX(id) as max_id FROM rentals');
  const nextId = (rows[0].max_id || 0) + 1001;
  return `TL-${nextId}`;
};

// POST /api/rentals
exports.createRental = async (req, res, next) => {
  let connection;
  try {
    const { user_id, book_id, source_library_id, destination_library_id, due_date } = req.body;

    // Validate presence of fields
    if (!user_id || !book_id || !source_library_id || !destination_library_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user_id, book_id, source_library_id, and destination_library_id'
      });
    }

    // 1. Validate user exists
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User not found with ID: ${user_id}`
      });
    }

    // 2. Validate book exists
    const [books] = await pool.query('SELECT id, title FROM books WHERE id = ?', [book_id]);
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book not found with ID: ${book_id}`
      });
    }

    // 3. Validate source library exists
    const [sourceLibs] = await pool.query('SELECT id, name FROM libraries WHERE id = ?', [source_library_id]);
    if (sourceLibs.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Source library not found with ID: ${source_library_id}`
      });
    }

    // 4. Validate destination library exists
    const [destLibs] = await pool.query('SELECT id, name FROM libraries WHERE id = ?', [destination_library_id]);
    if (destLibs.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Destination library not found with ID: ${destination_library_id}`
      });
    }

    // 5. Validate book availability at source library
    const [stock] = await pool.query(
      'SELECT id, available_quantity FROM library_books WHERE library_id = ? AND book_id = ?',
      [source_library_id, book_id]
    );

    if (stock.length === 0 || stock[0].available_quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `Book "${books[0].title}" is currently not available at ${sourceLibs[0].name}`
      });
    }

    // 6. Validate connection between source and destination libraries
    const [connections] = await pool.query(
      'SELECT id FROM library_connections WHERE source_library_id = ? AND destination_library_id = ? AND active = TRUE',
      [source_library_id, destination_library_id]
    );

    if (connections.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active route connection from ${sourceLibs[0].name} to ${destLibs[0].name}`
      });
    }

    // 7. Generate unique rental code
    const rental_code = await generateRentalCode();

    // Set default due_date to 7 days from now if not provided
    const calculatedDueDate = due_date
      ? new Date(due_date)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Begin Database Transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 8. Decrease available_quantity by 1 at source library
    await connection.query(
      'UPDATE library_books SET available_quantity = available_quantity - 1 WHERE library_id = ? AND book_id = ?',
      [source_library_id, book_id]
    );

    // 9 & 10. Insert rental record
    const [rentalResult] = await connection.query(
      `INSERT INTO rentals 
        (rental_code, user_id, book_id, source_library_id, destination_library_id, rental_date, due_date, status) 
       VALUES (?, ?, ?, ?, ?, NOW(), ?, 'rented')`,
      [rental_code, user_id, book_id, source_library_id, destination_library_id, calculatedDueDate]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: {
        id: rentalResult.insertId,
        rental_code,
        user_id,
        book_id,
        source_library_id,
        destination_library_id,
        due_date: calculatedDueDate,
        status: 'rented'
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
        src.id AS source_library_id,
        src.name AS source_library_name,
        dest.id AS destination_library_id,
        dest.name AS destination_library_name,
        ret.id AS return_id,
        ret.return_date,
        ret.condition AS return_condition,
        ret.remarks AS return_remarks
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      JOIN books b ON r.book_id = b.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      LEFT JOIN returns ret ON r.id = ret.rental_id
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
        src.name AS source_library_name,
        dest.name AS destination_library_name
      FROM rentals r
      JOIN books b ON r.book_id = b.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
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
