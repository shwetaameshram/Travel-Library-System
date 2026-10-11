const { pool } = require('../config/db');

// Middleware to authorize librarian access and attach librarian context
exports.requireLibrarian = async (req, res, next) => {
  try {
    const roleHeader = req.headers['x-user-role'];
    const userIdHeader = req.headers['x-user-id'];

    let userId = userIdHeader;

    if (!userId && req.body && req.body.user_id) {
      userId = req.body.user_id;
    }

    if (!userId) {
      // Check query parameter
      userId = req.query.user_id || req.query.userId;
    }

    if (!userId && roleHeader === 'admin') {
      req.user = { role: 'admin', library_id: null };
      return next();
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide user identification.'
      });
    }

    // Lookup user in database
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.library_id, l.name as library_name, l.city as library_city
       FROM users u
       LEFT JOIN libraries l ON u.library_id = l.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const user = users[0];

    // Admin has access to all librarian data/APIs
    if (user.role === 'admin') {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        library_id: req.query.library_id || req.body.library_id || 1 // default or requested library
      };
      return next();
    }

    if (user.role !== 'librarian') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Librarian privileges required.'
      });
    }

    if (!user.library_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Librarian is not assigned to any library location.'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      library_id: user.library_id,
      library_name: user.library_name,
      library_city: user.library_city
    };

    return next();
  } catch (error) {
    next(error);
  }
};
