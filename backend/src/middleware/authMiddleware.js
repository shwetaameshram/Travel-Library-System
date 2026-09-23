const { pool } = require('../config/db');

// Middleware to authorize admin access
exports.requireAdmin = async (req, res, next) => {
  try {
    // 1. Check custom header x-user-role
    const roleHeader = req.headers['x-user-role'];
    const userIdHeader = req.headers['x-user-id'];

    if (roleHeader === 'admin') {
      return next();
    }

    // 2. If user ID header is provided, look up role in database
    if (userIdHeader) {
      const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [userIdHeader]);
      if (users.length > 0 && users[0].role === 'admin') {
        return next();
      }
    }

    // 3. Fallback check from query or body user object
    const roleInBody = req.body?.user?.role || req.body?.role || req.query?.role;
    if (roleInBody === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  } catch (error) {
    next(error);
  }
};
