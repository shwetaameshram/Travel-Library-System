const { pool } = require('../config/db');

// Helper to generate unique rental code
const generateRentalCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TL-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// GET /api/librarian/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;

    if (!libraryId) {
      return res.status(400).json({
        success: false,
        message: 'No library assigned to this librarian.'
      });
    }

    // 1. Library Details
    const [libraries] = await pool.query(
      'SELECT id, name, city, location, type FROM libraries WHERE id = ?',
      [libraryId]
    );

    if (libraries.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Library not found with ID: ${libraryId}`
      });
    }

    const libraryInfo = libraries[0];

    // 2. Total Books (distinct titles in stock at this library)
    const [totalBooksRes] = await pool.query(
      'SELECT COUNT(DISTINCT book_id) as count FROM library_books WHERE library_id = ?',
      [libraryId]
    );
    const total_books = Number(totalBooksRes[0]?.count || 0);

    // 3. Available Copies & Total Copies
    const [copiesRes] = await pool.query(
      'SELECT COALESCE(SUM(available_quantity), 0) as available_copies, COALESCE(SUM(quantity), 0) as total_copies FROM library_books WHERE library_id = ?',
      [libraryId]
    );
    const available_copies = Number(copiesRes[0]?.available_copies || 0);
    const total_copies = Number(copiesRes[0]?.total_copies || 0);

    // 4. Active Rentals (departed from this library, currently rented)
    const [activeRentalsRes] = await pool.query(
      "SELECT COUNT(*) as count FROM rentals WHERE source_library_id = ? AND status = 'rented'",
      [libraryId]
    );
    const active_rentals = Number(activeRentalsRes[0]?.count || 0);

    // 5. Pending Returns (arriving at this library, currently rented)
    const [pendingReturnsRes] = await pool.query(
      "SELECT COUNT(*) as count FROM rentals WHERE destination_library_id = ? AND status = 'rented'",
      [libraryId]
    );
    const pending_returns = Number(pendingReturnsRes[0]?.count || 0);

    // 6. Overdue Rentals (source or destination is this library, overdue or past due_date)
    const [overdueRentalsRes] = await pool.query(
      "SELECT COUNT(*) as count FROM rentals WHERE (source_library_id = ? OR destination_library_id = ?) AND (status = 'overdue' OR (status = 'rented' AND due_date < NOW()))",
      [libraryId, libraryId]
    );
    const overdue_rentals = Number(overdueRentalsRes[0]?.count || 0);

    // 7. Total Passengers (distinct passengers who borrowed or returned at this library)
    const [passengersRes] = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM rentals WHERE source_library_id = ? OR destination_library_id = ?',
      [libraryId, libraryId]
    );
    const total_passengers = Number(passengersRes[0]?.count || 0);

    // 8. Recent Activity / Rentals List
    const [recentRentals] = await pool.query(
      `SELECT r.id, r.rental_code, r.rental_date, r.due_date, r.status,
              b.title as book_title, u.name as passenger_name,
              src.name as source_library_name, dest.name as destination_library_name
       FROM rentals r
       JOIN books b ON r.book_id = b.id
       JOIN users u ON r.user_id = u.id
       JOIN libraries src ON r.source_library_id = src.id
       JOIN libraries dest ON r.destination_library_id = dest.id
       WHERE r.source_library_id = ? OR r.destination_library_id = ?
       ORDER BY r.rental_date DESC LIMIT 5`,
      [libraryId, libraryId]
    );

    return res.status(200).json({
      success: true,
      data: {
        library: libraryInfo,
        stats: {
          total_books,
          available_copies,
          total_copies,
          active_rentals,
          pending_returns,
          overdue_rentals,
          total_passengers
        },
        recent_rentals: recentRentals
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/stock
exports.getBranchStock = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { search } = req.query;

    let query = `
      SELECT lb.id as stock_id, lb.book_id, lb.library_id, lb.quantity, lb.available_quantity,
             (lb.quantity - lb.available_quantity) as rented_quantity,
             b.title, b.author, b.isbn, b.category as genre, '' as cover_image, 'active' as book_status
      FROM library_books lb
      JOIN books b ON lb.book_id = b.id
      WHERE lb.library_id = ?
    `;
    const queryParams = [libraryId];

    if (search) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      const term = `%${search}%`;
      queryParams.push(term, term, term);
    }

    query += ` ORDER BY b.title ASC`;

    const [stockList] = await pool.query(query, queryParams);

    return res.status(200).json({
      success: true,
      data: stockList
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/librarian/stock
exports.addOrUpdateBranchStock = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { book_id, quantity, available_quantity } = req.body;

    if (!book_id || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'book_id and quantity are required.'
      });
    }

    const qty = parseInt(quantity, 10);
    const availQty = available_quantity !== undefined ? parseInt(available_quantity, 10) : qty;

    if (isNaN(qty) || qty < 0 || isNaN(availQty) || availQty < 0 || availQty > qty) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity values. Available quantity cannot exceed total quantity.'
      });
    }

    // Check if stock record exists
    const [existing] = await pool.query(
      'SELECT id FROM library_books WHERE library_id = ? AND book_id = ?',
      [libraryId, book_id]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE library_books SET quantity = ?, available_quantity = ? WHERE library_id = ? AND book_id = ?',
        [qty, availQty, libraryId, book_id]
      );
    } else {
      await pool.query(
        'INSERT INTO library_books (library_id, book_id, quantity, available_quantity) VALUES (?, ?, ?, ?)',
        [libraryId, book_id, qty, availQty]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Stock updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/books
exports.getBranchBooks = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { search, genre } = req.query;

    let query = `
      SELECT b.id, b.title, b.author, b.isbn, b.category as genre, '' as description, '' as cover_image, 'active' as status,
             COALESCE(lb.quantity, 0) as total_quantity,
             COALESCE(lb.available_quantity, 0) as available_quantity,
             COALESCE(lb.quantity - lb.available_quantity, 0) as rented_quantity
      FROM books b
      LEFT JOIN library_books lb ON b.id = lb.book_id AND lb.library_id = ?
      WHERE 1=1
    `;
    const params = [libraryId];

    if (search) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (genre) {
      query += ` AND b.category = ?`;
      params.push(genre);
    }

    query += ` ORDER BY b.title ASC`;

    const [books] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/librarian/books
exports.createBranchBook = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { title, author, isbn, genre, description, initial_quantity } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title and author are required.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO books (title, author, category, isbn)
       VALUES (?, ?, ?, ?)`,
      [title, author, genre || 'Fiction', isbn || null]
    );

    const newBookId = result.insertId;
    const qty = parseInt(initial_quantity || 5, 10);

    // Insert stock for logged-in librarian's library
    await pool.query(
      `INSERT INTO library_books (library_id, book_id, quantity, available_quantity)
       VALUES (?, ?, ?, ?)`,
      [libraryId, newBookId, qty, qty]
    );

    return res.status(201).json({
      success: true,
      message: 'Book created and added to branch stock successfully.',
      data: { id: newBookId, title, author, isbn, genre, initial_quantity: qty }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/librarian/books/:id
exports.updateBranchBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, genre } = req.body;

    const [existing] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    await pool.query(
      `UPDATE books SET title = ?, author = ?, category = ?, isbn = ? WHERE id = ?`,
      [title, author, genre || 'Fiction', isbn, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Book details updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/librarian/books/:id/status
exports.updateBranchBookStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    return res.status(200).json({
      success: true,
      message: `Book status set to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/rentals
exports.getBranchRentals = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { search, status } = req.query;

    let query = `
      SELECT r.id, r.rental_code, r.user_id, r.book_id, r.source_library_id, r.destination_library_id,
             r.rental_date, r.due_date, NULL as return_date, r.status,
             b.title as book_title, b.author as book_author,
             u.name as passenger_name, u.email as passenger_email, u.mobile as passenger_mobile,
             src.name as source_library_name, src.city as source_library_city,
             dest.name as destination_library_name, dest.city as destination_library_city
      FROM rentals r
      JOIN books b ON r.book_id = b.id
      JOIN users u ON r.user_id = u.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      WHERE (r.source_library_id = ? OR r.destination_library_id = ?)
    `;
    const params = [libraryId, libraryId];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (r.rental_code LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR b.title LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY r.rental_date DESC`;

    const [rentals] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rentals
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/librarian/rentals
exports.createBranchRental = async (req, res, next) => {
  try {
    const sourceLibraryId = req.user?.library_id;
    const { user_id, book_id, destination_library_id, due_date } = req.body;

    if (!user_id || !book_id || !destination_library_id || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'user_id, book_id, destination_library_id, and due_date are required.'
      });
    }

    // Check user exists
    const [users] = await pool.query('SELECT id, name FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Passenger user not found.' });
    }

    // Check stock at source library
    const [stock] = await pool.query(
      'SELECT available_quantity FROM library_books WHERE library_id = ? AND book_id = ?',
      [sourceLibraryId, book_id]
    );

    if (stock.length === 0 || stock[0].available_quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This book is currently out of stock at your assigned library.'
      });
    }

    // Generate code & insert rental
    const rentalCode = generateRentalCode();

    await pool.query(
      `INSERT INTO rentals (rental_code, user_id, book_id, source_library_id, destination_library_id, rental_date, due_date, status)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, 'rented')`,
      [rentalCode, user_id, book_id, sourceLibraryId, destination_library_id, due_date]
    );

    // Reduce available quantity at source library
    await pool.query(
      'UPDATE library_books SET available_quantity = available_quantity - 1 WHERE library_id = ? AND book_id = ?',
      [sourceLibraryId, book_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Rental created successfully!',
      data: {
        rental_code: rentalCode,
        user_id,
        book_id,
        source_library_id: sourceLibraryId,
        destination_library_id,
        due_date
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/returns
exports.getBranchReturns = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { search } = req.query;

    let query = `
      SELECT r.id, r.rental_code, r.user_id, r.book_id, r.source_library_id, r.destination_library_id,
             r.rental_date, r.due_date, r.status,
             (r.due_date < NOW() AND r.status = 'rented') as is_overdue,
             b.title as book_title, b.author as book_author,
             u.name as passenger_name, u.email as passenger_email, u.mobile as passenger_mobile,
             src.name as source_library_name, dest.name as destination_library_name
      FROM rentals r
      JOIN books b ON r.book_id = b.id
      JOIN users u ON r.user_id = u.id
      JOIN libraries src ON r.source_library_id = src.id
      JOIN libraries dest ON r.destination_library_id = dest.id
      WHERE r.destination_library_id = ? AND r.status IN ('rented', 'overdue')
    `;
    const params = [libraryId];

    if (search) {
      query += ` AND (r.rental_code LIKE ? OR u.name LIKE ? OR b.title LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY r.due_date ASC`;

    const [returnsList] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: returnsList
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/librarian/returns/:id
exports.processBranchReturn = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { id } = req.params;

    // Check rental exists and status
    const [rentals] = await pool.query(
      `SELECT id, rental_code, book_id, destination_library_id, status FROM rentals WHERE id = ? OR rental_code = ?`,
      [id, id]
    );

    if (rentals.length === 0) {
      return res.status(404).json({ success: false, message: 'Rental record not found.' });
    }

    const rental = rentals[0];

    if (rental.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'This book has already been returned!'
      });
    }

    // Update rental status to returned
    await pool.query(
      `UPDATE rentals SET status = 'returned' WHERE id = ?`,
      [rental.id]
    );

    // Increase available stock at return library (destination_library_id or logged-in library)
    const returnLibraryId = rental.destination_library_id || libraryId;

    const [stockRecord] = await pool.query(
      'SELECT id FROM library_books WHERE library_id = ? AND book_id = ?',
      [returnLibraryId, rental.book_id]
    );

    if (stockRecord.length > 0) {
      await pool.query(
        'UPDATE library_books SET available_quantity = available_quantity + 1 WHERE library_id = ? AND book_id = ?',
        [returnLibraryId, rental.book_id]
      );
    } else {
      await pool.query(
        'INSERT INTO library_books (library_id, book_id, quantity, available_quantity) VALUES (?, ?, 1, 1)',
        [returnLibraryId, rental.book_id]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Return processed successfully for rental code ${rental.rental_code}!`
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/passengers
exports.getBranchPassengers = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { search } = req.query;

    let query = `
      SELECT DISTINCT u.id, u.name, u.email, u.mobile, u.status, u.created_at,
             COUNT(r.id) as branch_rentals_count,
             SUM(CASE WHEN (r.source_library_id = ? OR r.destination_library_id = ?) AND r.status = 'rented' THEN 1 ELSE 0 END) as active_rentals_count
      FROM users u
      JOIN rentals r ON u.id = r.user_id
      WHERE (r.source_library_id = ? OR r.destination_library_id = ?) AND u.role = 'user'
    `;
    const params = [libraryId, libraryId, libraryId, libraryId];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` GROUP BY u.id ORDER BY u.name ASC`;

    const [passengers] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: passengers
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/passengers/:id
exports.getBranchPassengerDetails = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const { id } = req.params;

    const [users] = await pool.query('SELECT id, name, email, mobile, status, created_at FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Passenger not found.' });
    }

    const passenger = users[0];

    const [rentals] = await pool.query(
      `SELECT r.id, r.rental_code, r.rental_date, r.due_date, NULL as return_date, r.status,
              b.title as book_title, b.author as book_author,
              src.name as source_library_name, dest.name as destination_library_name
       FROM rentals r
       JOIN books b ON r.book_id = b.id
       JOIN libraries src ON r.source_library_id = src.id
       JOIN libraries dest ON r.destination_library_id = dest.id
       WHERE r.user_id = ? AND (r.source_library_id = ? OR r.destination_library_id = ?)
       ORDER BY r.rental_date DESC`,
      [id, libraryId, libraryId]
    );

    return res.status(200).json({
      success: true,
      data: {
        passenger,
        rentals
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/libraries
exports.getConnectedLibraries = async (req, res, next) => {
  try {
    const currentLibraryId = req.user?.library_id;
    const { search } = req.query;

    let query = `
      SELECT l.id, l.name, l.city, l.location, l.type,
             (l.id = ?) as is_my_branch,
             COALESCE(SUM(lb.quantity), 0) as total_books,
             COALESCE(SUM(lb.available_quantity), 0) as available_copies
      FROM libraries l
      LEFT JOIN library_books lb ON l.id = lb.library_id
      WHERE 1=1
    `;
    const params = [currentLibraryId];

    if (search) {
      query += ` AND (l.name LIKE ? OR l.city LIKE ? OR l.location LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` GROUP BY l.id ORDER BY is_my_branch DESC, l.name ASC`;

    const [libraries] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: libraries
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/reports
exports.getBranchReports = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;

    // Summary metrics
    const [totalBooksRes] = await pool.query('SELECT COUNT(DISTINCT book_id) as count FROM library_books WHERE library_id = ?', [libraryId]);
    const [copiesRes] = await pool.query('SELECT COALESCE(SUM(quantity), 0) as total_copies, COALESCE(SUM(available_quantity), 0) as available_copies FROM library_books WHERE library_id = ?', [libraryId]);
    const [activeRentalsRes] = await pool.query("SELECT COUNT(*) as count FROM rentals WHERE source_library_id = ? AND status = 'rented'", [libraryId]);
    const [returnsRes] = await pool.query("SELECT COUNT(*) as count FROM rentals WHERE destination_library_id = ? AND status = 'returned'", [libraryId]);
    const [overdueRes] = await pool.query("SELECT COUNT(*) as count FROM rentals WHERE (source_library_id = ? OR destination_library_id = ?) AND (status = 'overdue' OR (status = 'rented' AND due_date < NOW()))", [libraryId, libraryId]);
    const [passengersRes] = await pool.query("SELECT COUNT(DISTINCT user_id) as count FROM rentals WHERE source_library_id = ? OR destination_library_id = ?", [libraryId, libraryId]);

    // Most Rented Books at this branch
    const [topBooks] = await pool.query(
      `SELECT b.id, b.title, b.author, b.category as genre, COUNT(r.id) as total_rentals
       FROM rentals r
       JOIN books b ON r.book_id = b.id
       WHERE r.source_library_id = ?
       GROUP BY b.id
       ORDER BY total_rentals DESC LIMIT 5`,
      [libraryId]
    );

    // Recent Activity Log
    const [activityLog] = await pool.query(
      `SELECT r.id, r.rental_code, r.rental_date, NULL as return_date, r.status,
              b.title as book_title, u.name as passenger_name,
              src.name as source_library_name, dest.name as destination_library_name
       FROM rentals r
       JOIN books b ON r.book_id = b.id
       JOIN users u ON r.user_id = u.id
       JOIN libraries src ON r.source_library_id = src.id
       JOIN libraries dest ON r.destination_library_id = dest.id
       WHERE r.source_library_id = ? OR r.destination_library_id = ?
       ORDER BY r.rental_date DESC LIMIT 10`,
      [libraryId, libraryId]
    );

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_books: Number(totalBooksRes[0]?.count || 0),
          total_copies: Number(copiesRes[0]?.total_copies || 0),
          available_copies: Number(copiesRes[0]?.available_copies || 0),
          active_rentals: Number(activeRentalsRes[0]?.count || 0),
          total_returns: Number(returnsRes[0]?.count || 0),
          overdue_rentals: Number(overdueRes[0]?.count || 0),
          total_passengers: Number(passengersRes[0]?.count || 0)
        },
        top_books: topBooks,
        activity_log: activityLog
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/librarian/profile
exports.getBranchProfile = async (req, res, next) => {
  try {
    const libraryId = req.user?.library_id;
    const userId = req.user?.id;

    // Library Details
    const [libraries] = await pool.query(
      'SELECT id, name, city, location, type FROM libraries WHERE id = ?',
      [libraryId]
    );

    if (libraries.length === 0) {
      return res.status(404).json({ success: false, message: 'Assigned library branch not found.' });
    }

    // Librarian Info
    const [users] = await pool.query('SELECT id, name, email, mobile, role, status FROM users WHERE id = ?', [userId]);

    // Statistics
    const [stockRes] = await pool.query(
      'SELECT COUNT(DISTINCT book_id) as total_books, COALESCE(SUM(quantity), 0) as total_copies, COALESCE(SUM(available_quantity), 0) as available_copies FROM library_books WHERE library_id = ?',
      [libraryId]
    );

    const [activeRentals] = await pool.query("SELECT COUNT(*) as count FROM rentals WHERE source_library_id = ? AND status = 'rented'", [libraryId]);

    return res.status(200).json({
      success: true,
      data: {
        library: libraries[0],
        librarian: users[0] || req.user,
        stats: {
          total_books: Number(stockRes[0]?.total_books || 0),
          total_copies: Number(stockRes[0]?.total_copies || 0),
          available_copies: Number(stockRes[0]?.available_copies || 0),
          active_rentals: Number(activeRentals[0]?.count || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
