const { pool } = require('../config/db');

// GET /api/libraries
exports.getAllLibraries = async (req, res, next) => {
  try {
    const [libraries] = await pool.query('SELECT * FROM libraries ORDER BY name ASC');

    return res.status(200).json({
      success: true,
      count: libraries.length,
      data: libraries
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/libraries/:id
exports.getLibraryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [libraries] = await pool.query('SELECT * FROM libraries WHERE id = ?', [id]);
    if (libraries.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Library not found with ID: ${id}`
      });
    }

    const library = libraries[0];

    // Fetch books available at this library
    const [books] = await pool.query(`
      SELECT 
        b.id AS book_id,
        b.title,
        b.author,
        b.category,
        b.isbn,
        lb.quantity,
        lb.available_quantity
      FROM library_books lb
      JOIN books b ON lb.book_id = b.id
      WHERE lb.library_id = ?
    `, [id]);

    return res.status(200).json({
      success: true,
      data: {
        ...library,
        books
      }
    });
  } catch (error) {
    next(error);
  }
};
