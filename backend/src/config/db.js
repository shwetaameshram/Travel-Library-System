const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'travel_library_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to test database connectivity
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database:', process.env.DB_NAME || 'travel_library_db');
    connection.release();
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    console.error('👉 Ensure MySQL is running and DB credentials in .env are correct.');
  }
};

module.exports = {
  pool,
  testConnection
};
