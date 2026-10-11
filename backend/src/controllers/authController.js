const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, mobile } = req.body;

    // Basic Validation
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, mobile'
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, mobile, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, mobile, 'user']
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        name,
        email,
        mobile,
        role: 'user'
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check account status
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    if (user.library_id) {
      const [libs] = await pool.query('SELECT id, name, city, location, type FROM libraries WHERE id = ?', [user.library_id]);
      if (libs.length > 0) {
        userWithoutPassword.library = libs[0];
        userWithoutPassword.library_name = libs[0].name;
        userWithoutPassword.library_city = libs[0].city;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};
