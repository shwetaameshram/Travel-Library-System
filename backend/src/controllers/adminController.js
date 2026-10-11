const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/admin/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [[{ total_librarians }]] = await pool.query("SELECT COUNT(*) AS total_librarians FROM users WHERE role = 'librarian'");
    const [[{ active_librarians }]] = await pool.query("SELECT COUNT(*) AS active_librarians FROM users WHERE role = 'librarian' AND status = 'active'");
    const [[{ total_users }]] = await pool.query("SELECT COUNT(*) AS total_users FROM users WHERE role = 'user'");
    const [[{ active_users }]] = await pool.query("SELECT COUNT(*) AS active_users FROM users WHERE role = 'user' AND status = 'active'");
    const [[{ total_libraries }]] = await pool.query('SELECT COUNT(*) AS total_libraries FROM libraries');
    const [[{ active_rentals }]] = await pool.query("SELECT COUNT(*) AS active_rentals FROM rentals WHERE status = 'rented'");
    const [[{ total_books }]] = await pool.query('SELECT COUNT(*) AS total_books FROM books');
    const [[{ available_books }]] = await pool.query('SELECT COALESCE(SUM(available_quantity), 0) AS available_books FROM library_books');

    // Recent 5 rentals
    const [recentRentals] = await pool.query(`
      SELECT 
        r.id,
        r.rental_code,
        r.status,
        r.rental_date,
        u.name AS passenger_name,
        b.title AS book_title,
        src.name AS source_library_name,
        dest.name AS destination_library_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      JOIN books b ON r.book_id = b.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      ORDER BY r.rental_date DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total_librarians,
          active_librarians,
          total_users,
          active_users,
          total_libraries,
          active_rentals,
          total_books,
          available_books
        },
        recentRentals
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BOOKS MANAGEMENT
// ==========================================

// GET /api/admin/books
exports.getAllBooks = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = `
      SELECT 
        b.id, b.title, b.author, b.category, b.isbn, b.created_at,
        COALESCE(SUM(lb.quantity), 0) AS total_quantity,
        COALESCE(SUM(lb.available_quantity), 0) AS total_available_quantity
      FROM books b
      LEFT JOIN library_books lb ON b.id = lb.book_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ` AND b.category = ?`;
      params.push(category);
    }

    query += ` GROUP BY b.id ORDER BY b.id DESC`;

    const [books] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/books
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, category, isbn } = req.body;
    if (!title || !author || !category || !isbn) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, author, category, and isbn'
      });
    }

    // Check unique ISBN
    const [existing] = await pool.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Book with ISBN ${isbn} already exists.`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO books (title, author, category, isbn) VALUES (?, ?, ?, ?)',
      [title, author, category, isbn]
    );

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: { id: result.insertId, title, author, category, isbn }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/books/:id
exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, category, isbn } = req.body;

    const [books] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check ISBN uniqueness if changed
    if (isbn) {
      const [existing] = await pool.query('SELECT id FROM books WHERE isbn = ? AND id <> ?', [isbn, id]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: `ISBN ${isbn} is already in use by another book.` });
      }
    }

    await pool.query(
      'UPDATE books SET title = ?, author = ?, category = ?, isbn = ? WHERE id = ?',
      [title, author, category, isbn, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/books/:id
exports.deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if book has rentals
    const [rentals] = await pool.query('SELECT id FROM rentals WHERE book_id = ?', [id]);
    if (rentals.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book because active or historical rental records exist for it.'
      });
    }

    const [result] = await pool.query('DELETE FROM books WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LIBRARIES MANAGEMENT
// ==========================================

// GET /api/admin/libraries
exports.getAllLibraries = async (req, res, next) => {
  try {
    const [libraries] = await pool.query(`
      SELECT 
        l.id, l.name, l.city, l.location, l.type, l.created_at,
        u.id AS librarian_id, u.name AS librarian_name, u.email AS librarian_email, u.status AS librarian_status,
        (SELECT COUNT(DISTINCT book_id) FROM library_books WHERE library_id = l.id) AS total_books,
        (SELECT COALESCE(SUM(available_quantity), 0) FROM library_books WHERE library_id = l.id) AS available_copies,
        (SELECT COUNT(*) FROM rentals WHERE source_library_id = l.id AND status = 'rented') AS active_rentals
      FROM libraries l
      LEFT JOIN users u ON l.id = u.library_id AND u.role = 'librarian'
      ORDER BY l.id ASC
    `);
    return res.status(200).json({ success: true, count: libraries.length, data: libraries });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/libraries
exports.createLibrary = async (req, res, next) => {
  try {
    const { name, city, location, type = 'station' } = req.body;
    if (!name || !city || !location) {
      return res.status(400).json({ success: false, message: 'Please provide name, city, and location' });
    }

    const [result] = await pool.query(
      'INSERT INTO libraries (name, city, location, type) VALUES (?, ?, ?, ?)',
      [name, city, location, type]
    );

    return res.status(201).json({
      success: true,
      message: 'Library created successfully',
      data: { id: result.insertId, name, city, location, type }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/libraries/:id
exports.updateLibrary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, city, location, type } = req.body;

    const [result] = await pool.query(
      'UPDATE libraries SET name = ?, city = ?, location = ?, type = ? WHERE id = ?',
      [name, city, location, type, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Library not found' });
    }

    return res.status(200).json({ success: true, message: 'Library updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/libraries/:id
exports.deleteLibrary = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if library is referenced in rentals
    const [rentals] = await pool.query('SELECT id FROM rentals WHERE source_library_id = ? OR destination_library_id = ?', [id, id]);
    if (rentals.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete library with associated rental records.'
      });
    }

    const [result] = await pool.query('DELETE FROM libraries WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Library not found' });
    }

    return res.status(200).json({ success: true, message: 'Library deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STOCK MANAGEMENT
// ==========================================

// GET /api/admin/stock
exports.getStockAdmin = async (req, res, next) => {
  try {
    const [stock] = await pool.query(`
      SELECT 
        lb.id,
        lb.library_id,
        l.name AS library_name,
        l.city AS library_city,
        lb.book_id,
        b.title AS book_title,
        b.author AS book_author,
        lb.quantity,
        lb.available_quantity
      FROM library_books lb
      JOIN libraries l ON lb.library_id = l.id
      JOIN books b ON lb.book_id = b.id
      ORDER BY l.name ASC, b.title ASC
    `);

    return res.status(200).json({ success: true, count: stock.length, data: stock });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/stock
exports.addOrUpdateStock = async (req, res, next) => {
  try {
    const { library_id, book_id, quantity, available_quantity } = req.body;

    if (!library_id || !book_id || quantity === undefined || available_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide library_id, book_id, quantity, and available_quantity'
      });
    }

    const qty = Number(quantity);
    const availQty = Number(available_quantity);

    if (availQty > qty) {
      return res.status(400).json({
        success: false,
        message: 'Available quantity cannot exceed total quantity.'
      });
    }

    if (qty < 0 || availQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity values must be non-negative.'
      });
    }

    // Insert or update on duplicate key
    await pool.query(
      `INSERT INTO library_books (library_id, book_id, quantity, available_quantity) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), available_quantity = VALUES(available_quantity)`,
      [library_id, book_id, qty, availQty]
    );

    return res.status(200).json({
      success: true,
      message: 'Library book stock updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CONNECTIONS MANAGEMENT
// ==========================================

// GET /api/admin/connections
exports.getConnectionsAdmin = async (req, res, next) => {
  try {
    const [connections] = await pool.query(`
      SELECT 
        lc.id,
        lc.active,
        src.id AS source_library_id,
        src.name AS source_name,
        src.city AS source_city,
        dest.id AS destination_library_id,
        dest.name AS destination_name,
        dest.city AS destination_city
      FROM library_connections lc
      JOIN libraries src ON lc.source_library_id = src.id
      JOIN libraries dest ON lc.destination_library_id = dest.id
      ORDER BY src.name ASC, dest.name ASC
    `);

    return res.status(200).json({ success: true, count: connections.length, data: connections });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/connections
exports.createConnection = async (req, res, next) => {
  try {
    const { source_library_id, destination_library_id, active = true } = req.body;

    if (!source_library_id || !destination_library_id) {
      return res.status(400).json({ success: false, message: 'Please provide source_library_id and destination_library_id' });
    }

    if (Number(source_library_id) === Number(destination_library_id)) {
      return res.status(400).json({ success: false, message: 'Source and destination libraries cannot be the same' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM library_connections WHERE source_library_id = ? AND destination_library_id = ?',
      [source_library_id, destination_library_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A route connection between these libraries already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO library_connections (source_library_id, destination_library_id, active) VALUES (?, ?, ?)',
      [source_library_id, destination_library_id, active]
    );

    return res.status(201).json({
      success: true,
      message: 'Library connection created successfully',
      data: { id: result.insertId, source_library_id, destination_library_id, active }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/connections/:id
exports.updateConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const [result] = await pool.query(
      'UPDATE library_connections SET active = ? WHERE id = ?',
      [active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Connection route not found' });
    }

    return res.status(200).json({ success: true, message: 'Connection status updated' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/connections/:id
exports.deleteConnection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM library_connections WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Connection route not found' });
    }

    return res.status(200).json({ success: true, message: 'Connection deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RENTALS MANAGEMENT
// ==========================================

// GET /api/admin/rentals
exports.getRentalsAdmin = async (req, res, next) => {
  try {
    const { status, rental_code } = req.query;

    let query = `
      SELECT 
        r.id,
        r.rental_code,
        r.status,
        r.rental_date,
        r.due_date,
        u.name AS passenger_name,
        u.email AS passenger_email,
        b.title AS book_title,
        COALESCE(p.book_value, b.book_value, 500.00) AS book_value,
        COALESCE(p.rental_fee, b.rental_fee, 50.00) AS rental_fee,
        COALESCE(p.security_deposit, b.book_value, 500.00) AS security_deposit,
        COALESCE(p.amount_paid, b.book_value, 500.00) AS amount_paid,
        COALESCE(p.payment_status, 'PAID') AS payment_status,
        COALESCE(p.refund_amount, 0.00) AS refund_amount,
        COALESCE(p.late_fee, 0.00) AS late_fee,
        COALESCE(p.damage_fee, 0.00) AS damage_fee,
        COALESCE(p.total_deduction, 0.00) AS total_deduction,
        COALESCE(p.refund_status, IF(r.status = 'returned', 'REFUNDED', 'PENDING')) AS refund_status,
        COALESCE(p.transaction_id, CONCAT('TXN-TL-', r.id)) AS transaction_id,
        p.refund_date,
        src.name AS source_library_name,
        dest.name AS destination_library_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      JOIN books b ON r.book_id = b.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      LEFT JOIN payments p ON r.id = p.rental_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (rental_code) {
      query += ` AND (r.rental_code LIKE ? OR r.id LIKE ? OR p.transaction_id LIKE ?)`;
      params.push(`%${rental_code}%`, `%${rental_code}%`, `%${rental_code}%`);
    }

    query += ` ORDER BY r.rental_date DESC`;

    const [rentals] = await pool.query(query, params);

    return res.status(200).json({ success: true, count: rentals.length, data: rentals });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RETURNS MANAGEMENT
// ==========================================

// GET /api/admin/returns
exports.getReturnsAdmin = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        ret.id AS return_id,
        r.rental_code,
        r.id AS rental_id,
        u.name AS passenger_name,
        b.title AS book_title,
        l.name AS return_library_name,
        ret.return_date,
        ret.condition,
        ret.remarks
      FROM returns ret
      JOIN rentals r ON ret.rental_id = r.id
      JOIN users u ON r.user_id = u.id
      JOIN books b ON r.book_id = b.id
      JOIN libraries l ON ret.return_library_id = l.id
      ORDER BY ret.return_date DESC
    `;

    const [returns] = await pool.query(query);

    return res.status(200).json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LIBRARIANS MANAGEMENT
// ==========================================

// GET /api/admin/librarians
exports.getAllLibrarians = async (req, res, next) => {
  try {
    const { search, status, library_id } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.mobile, u.role, u.library_id, u.status, u.created_at,
        l.name AS library_name, l.city AS library_city, l.location AS library_location,
        (SELECT COUNT(*) FROM rentals r WHERE r.source_library_id = u.library_id AND r.status = 'rented') AS active_rentals
      FROM users u
      LEFT JOIN libraries l ON u.library_id = l.id
      WHERE u.role = 'librarian'
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (library_id) {
      query += ` AND u.library_id = ?`;
      params.push(library_id);
    }

    query += ` ORDER BY u.id DESC`;

    const [librarians] = await pool.query(query, params);

    return res.status(200).json({ success: true, count: librarians.length, data: librarians });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/librarians/:id
exports.getLibrarianById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [librarians] = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.mobile, u.role, u.library_id, u.status, u.created_at,
        l.name AS library_name, l.city AS library_city, l.location AS library_location,
        (SELECT COUNT(*) FROM rentals r WHERE r.source_library_id = u.library_id AND r.status = 'rented') AS active_rentals
       FROM users u
       LEFT JOIN libraries l ON u.library_id = l.id
       WHERE u.id = ? AND u.role = 'librarian'`,
      [id]
    );

    if (librarians.length === 0) {
      return res.status(404).json({ success: false, message: 'Librarian not found' });
    }

    return res.status(200).json({ success: true, data: librarians[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/librarians
exports.createLibrarian = async (req, res, next) => {
  try {
    const { name, email, password, mobile, library_id, status = 'active' } = req.body;

    if (!name || !email || !password || !mobile || !library_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, mobile, and assigned library_id'
      });
    }

    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `User with email ${email} already exists.`
      });
    }

    // Check library existence
    const [libs] = await pool.query('SELECT id FROM libraries WHERE id = ?', [library_id]);
    if (libs.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid library ID ${library_id}. Library does not exist.`
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, mobile, role, library_id, status)
       VALUES (?, ?, ?, ?, 'librarian', ?, ?)`,
      [name, email, hashedPassword, mobile, library_id, status]
    );

    return res.status(201).json({
      success: true,
      message: 'Librarian account created successfully',
      data: {
        id: result.insertId,
        name,
        email,
        mobile,
        role: 'librarian',
        library_id,
        status
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/librarians/:id
exports.updateLibrarian = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, library_id, status, password } = req.body;

    const [existingLibrarians] = await pool.query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'librarian']);
    if (existingLibrarians.length === 0) {
      return res.status(404).json({ success: false, message: 'Librarian account not found' });
    }

    if (email) {
      const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ success: false, message: `Email ${email} is already taken by another account.` });
      }
    }

    if (library_id) {
      const [libs] = await pool.query('SELECT id FROM libraries WHERE id = ?', [library_id]);
      if (libs.length === 0) {
        return res.status(400).json({ success: false, message: `Invalid library ID ${library_id}.` });
      }
    }

    let updateFields = [];
    let params = [];

    if (name) { updateFields.push('name = ?'); params.push(name); }
    if (email) { updateFields.push('email = ?'); params.push(email); }
    if (mobile) { updateFields.push('mobile = ?'); params.push(mobile); }
    if (library_id !== undefined) { updateFields.push('library_id = ?'); params.push(library_id); }
    if (status) { updateFields.push('status = ?'); params.push(status); }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push('password = ?');
      params.push(hashedPassword);
    }

    if (updateFields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ? AND role = 'librarian'`, params);
    }

    return res.status(200).json({ success: true, message: 'Librarian details updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/librarians/:id/status
exports.updateLibrarianStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide valid status ("active" or "inactive")' });
    }

    const [result] = await pool.query("UPDATE users SET status = ? WHERE id = ? AND role = 'librarian'", [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Librarian not found' });
    }

    return res.status(200).json({ success: true, message: `Librarian account status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/librarians/:id/library
exports.updateLibrarianLibrary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { library_id } = req.body;

    if (!library_id) {
      return res.status(400).json({ success: false, message: 'Please provide valid library_id' });
    }

    const [libs] = await pool.query('SELECT id FROM libraries WHERE id = ?', [library_id]);
    if (libs.length === 0) {
      return res.status(400).json({ success: false, message: `Library ID ${library_id} does not exist.` });
    }

    const [result] = await pool.query("UPDATE users SET library_id = ? WHERE id = ? AND role = 'librarian'", [library_id, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Librarian account not found' });
    }

    return res.status(200).json({ success: true, message: 'Librarian assigned library updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USERS / PASSENGERS MANAGEMENT
// ==========================================

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.mobile, u.role, u.status, u.created_at,
        COUNT(r.id) AS total_rentals
      FROM users u
      LEFT JOIN rentals r ON u.id = r.user_id
      WHERE u.role = 'user'
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY u.id ORDER BY u.id DESC`;

    const [users] = await pool.query(query, params);

    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile, u.role, u.status, u.created_at, COUNT(r.id) AS total_rentals
       FROM users u
       LEFT JOIN rentals r ON u.id = r.user_id
       WHERE u.id = ? AND u.role = 'user'
       GROUP BY u.id`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Passenger user not found' });
    }

    return res.status(200).json({ success: true, data: users[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, mobile, status = 'active' } = req.body;

    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and mobile' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Email ${email} is already registered.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, mobile, role, status) VALUES (?, ?, ?, ?, 'user', ?)`,
      [name, email, hashedPassword, mobile, status]
    );

    return res.status(201).json({
      success: true,
      message: 'Passenger user created successfully',
      data: { id: result.insertId, name, email, mobile, role: 'user', status }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, status } = req.body;

    const [existing] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email) {
      const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ success: false, message: `Email ${email} is taken by another account.` });
      }
    }

    // PREVENT CHANGING USER ROLE TO ADMIN! Keep role as existing role (or 'user')
    const safeRole = existing[0].role === 'admin' ? 'admin' : existing[0].role;

    let updateFields = [];
    let params = [];

    if (name) { updateFields.push('name = ?'); params.push(name); }
    if (email) { updateFields.push('email = ?'); params.push(email); }
    if (mobile) { updateFields.push('mobile = ?'); params.push(mobile); }
    if (status) { updateFields.push('status = ?'); params.push(status); }

    if (updateFields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ? AND role = ?`, [...params, safeRole]);
    }

    return res.status(200).json({ success: true, message: 'Passenger user updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide valid status ("active" or "inactive")' });
    }

    const [result] = await pool.query("UPDATE users SET status = ? WHERE id = ? AND role = 'user'", [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Passenger user not found' });
    }

    return res.status(200).json({ success: true, message: `User account status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id/rentals
exports.getUserRentalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rentals] = await pool.query(
      `SELECT 
        r.id, r.rental_code, r.rental_date, r.due_date, r.status,
        b.title AS book_title, b.author AS book_author,
        src.name AS source_library_name, dest.name AS destination_library_name,
        ret.return_date, ret.condition AS return_condition
       FROM rentals r
       JOIN books b ON r.book_id = b.id
       JOIN libraries src ON r.source_library_id = src.id
       JOIN libraries dest ON r.destination_library_id = dest.id
       LEFT JOIN returns ret ON r.id = ret.rental_id
       WHERE r.user_id = ?
       ORDER BY r.rental_date DESC`,
      [id]
    );

    return res.status(200).json({ success: true, count: rentals.length, data: rentals });
  } catch (error) {
    next(error);
  }
};
