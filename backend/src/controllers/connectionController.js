const { pool } = require('../config/db');

// GET /api/connections
// Returns list of connected source and destination libraries
exports.getAllConnections = async (req, res, next) => {
  try {
    const [connections] = await pool.query(`
      SELECT 
        lc.id AS connection_id,
        lc.active,
        src.id AS source_library_id,
        src.name AS source_library_name,
        src.city AS source_city,
        src.type AS source_type,
        dest.id AS destination_library_id,
        dest.name AS destination_library_name,
        dest.city AS destination_city,
        dest.type AS destination_type
      FROM library_connections lc
      JOIN libraries src ON lc.source_library_id = src.id
      JOIN libraries dest ON lc.destination_library_id = dest.id
      WHERE lc.active = TRUE
      ORDER BY src.name ASC, dest.name ASC
    `);

    return res.status(200).json({
      success: true,
      count: connections.length,
      data: connections
    });
  } catch (error) {
    next(error);
  }
};
