const { pool } = require('../config/db');

// Middleware to authorize admin access
exports.requireAdmin = async (req, res, next) => {
  try {
    const roleHeader = req.headers['x-user-role'];
    const userIdHeader = req.headers['x-user-id'];

    let userId = userIdHeader || req.body?.user_id || req.body?.userId || req.query?.user_id || req.query?.userId;

    // If a specific user ID is provided, look up in database
    if (userId) {
      const [users] = await pool.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].role === 'admin' && users[0].status !== 'inactive') {
        req.user = users[0];
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Administrator privileges required.'
        });
      }
    }

    // If role header specifies admin and no user ID failed DB check
    if (roleHeader === 'admin') {
      req.user = { role: 'admin' };
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
