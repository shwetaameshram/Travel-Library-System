const { pool } = require('../config/db');

// GET /api/books
// Supports filtering by query parameters: ?title=...&author=...&category=...
exports.getAllBooks = async (req, res, next) => {
  try {
    const { title, author, category } = req.query;

    let query = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.category,
        b.isbn,
        b.book_value,
        b.rental_fee,
        b.created_at,
        COALESCE(SUM(lb.quantity), 0) AS total_quantity,
        COALESCE(SUM(lb.available_quantity), 0) AS total_available_quantity
      FROM books b
      LEFT JOIN library_books lb ON b.id = lb.book_id
      WHERE 1=1
    `;
    const params = [];

    if (title) {
      query += ` AND b.title LIKE ?`;
      params.push(`%${title}%`);
    }

    if (author) {
      query += ` AND b.author LIKE ?`;
      params.push(`%${author}%`);
    }

    if (category) {
      query += ` AND b.category LIKE ?`;
      params.push(`%${category}%`);
    }

    query += ` GROUP BY b.id ORDER BY b.title ASC`;

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

// GET /api/books/:id
// Returns book details and availability across specific libraries
exports.getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book not found with ID: ${id}`
      });
    }

    const book = books[0];

    // Fetch availability across physical libraries
    const [availability] = await pool.query(`
      SELECT 
        l.id AS library_id,
        l.name AS library_name,
        l.city,
        l.location,
        l.type AS library_type,
        lb.quantity,
        lb.available_quantity
      FROM library_books lb
      JOIN libraries l ON lb.library_id = l.id
      WHERE lb.book_id = ?
    `, [id]);

    return res.status(200).json({
      success: true,
      data: {
        ...book,
        availability
      }
    });
  } catch (error) {
    next(error);
  }
};
