const { pool } = require('../config/db');

// GET /api/admin/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [[{ total_books }]] = await pool.query('SELECT COUNT(*) AS total_books FROM books');
    const [[{ total_libraries }]] = await pool.query('SELECT COUNT(*) AS total_libraries FROM libraries');
    const [[{ active_rentals }]] = await pool.query("SELECT COUNT(*) AS active_rentals FROM rentals WHERE status = 'rented'");
    const [[{ returned_rentals }]] = await pool.query("SELECT COUNT(*) AS returned_rentals FROM rentals WHERE status = 'returned'");
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
          total_books,
          total_libraries,
          active_rentals,
          returned_rentals,
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
    const [libraries] = await pool.query('SELECT * FROM libraries ORDER BY id DESC');
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
        src.name AS source_library_name,
        dest.name AS destination_library_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      JOIN books b ON r.book_id = b.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (rental_code) {
      query += ` AND (r.rental_code LIKE ? OR r.id LIKE ?)`;
      params.push(`%${rental_code}%`, `%${rental_code}%`);
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
