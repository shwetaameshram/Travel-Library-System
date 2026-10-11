const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

const mysql = require('mysql2/promise');

// Create MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'travel_library_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to run schema migrations dynamically
const runMigrations = async (connection) => {
  try {
    // Check if book_value column exists in books table
    const [cols] = await connection.query("SHOW COLUMNS FROM books LIKE 'book_value'");
    if (cols.length === 0) {
      console.log('🔄 Migration: Adding book_value and rental_fee columns to books table...');
      await connection.query(`
        ALTER TABLE books 
        ADD COLUMN book_value DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
        ADD COLUMN rental_fee DECIMAL(10, 2) NOT NULL DEFAULT 50.00
      `);
      // Update specific defaults if needed
      await connection.query("UPDATE books SET book_value = 500.00, rental_fee = 50.00 WHERE title LIKE '%Alchemist%'");
      console.log('✅ Migration: Added book_value and rental_fee to books.');
    }

    // Check if payments table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'payments'");
    if (tables.length === 0) {
      console.log('🔄 Migration: Creating payments table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_id VARCHAR(50) NULL UNIQUE,
          user_id INT NULL,
          rental_id INT NULL UNIQUE,
          razorpay_order_id VARCHAR(100) NULL UNIQUE,
          razorpay_payment_id VARCHAR(100) NULL UNIQUE,
          razorpay_signature VARCHAR(255) NULL,
          amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          currency VARCHAR(10) NOT NULL DEFAULT 'INR',
          status VARCHAR(50) NOT NULL DEFAULT 'created',
          payment_method VARCHAR(50) NULL,
          book_value DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
          rental_fee DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
          security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
          amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
          payment_status ENUM('PENDING', 'PAID', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PAID',
          payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          late_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          damage_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          total_deduction DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          refund_status ENUM('PENDING', 'REFUNDED', 'PARTIALLY_DEDUCTED', 'NO_REFUND') NOT NULL DEFAULT 'PENDING',
          refund_date DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
          CONSTRAINT fk_payments_rental FOREIGN KEY (rental_id) REFERENCES rentals (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Migration: Created payments table.');
    } else {
      // Migrate existing payments table if columns missing
      const [cols] = await connection.query("SHOW COLUMNS FROM payments");
      const colNames = cols.map((c) => c.Field);

      // Make rental_id nullable if it was NOT NULL
      await connection.query("ALTER TABLE payments MODIFY COLUMN rental_id INT NULL UNIQUE");

      if (!colNames.includes('user_id')) {
        console.log('🔄 Migration: Adding user_id column to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN user_id INT NULL, ADD CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL");
      }
      if (!colNames.includes('razorpay_order_id')) {
        console.log('🔄 Migration: Adding razorpay_order_id to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(100) NULL UNIQUE");
      }
      if (!colNames.includes('razorpay_payment_id')) {
        console.log('🔄 Migration: Adding razorpay_payment_id to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(100) NULL UNIQUE");
      }
      if (!colNames.includes('razorpay_signature')) {
        console.log('🔄 Migration: Adding razorpay_signature to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN razorpay_signature VARCHAR(255) NULL");
      }
      if (!colNames.includes('amount')) {
        console.log('🔄 Migration: Adding amount & currency to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00, ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'INR'");
      }
      if (!colNames.includes('status')) {
        console.log('🔄 Migration: Adding status to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'created'");
      }
      if (!colNames.includes('payment_method')) {
        console.log('🔄 Migration: Adding payment_method to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) NULL");
      }
      if (!colNames.includes('created_at')) {
        console.log('🔄 Migration: Adding timestamp columns to payments...');
        await connection.query("ALTER TABLE payments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      }
    }

    // Check if library_id column exists in users table
    const [userCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'library_id'");
    if (userCols.length === 0) {
      console.log('🔄 Migration: Updating users table schema for Librarian role...');
      await connection.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('user', 'admin', 'librarian') NOT NULL DEFAULT 'user',
        ADD COLUMN library_id INT NULL,
        ADD CONSTRAINT fk_users_library FOREIGN KEY (library_id) REFERENCES libraries (id) ON DELETE SET NULL
      `);
      console.log('✅ Migration: Updated users table role enum and added library_id.');
    } else {
      await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'librarian') NOT NULL DEFAULT 'user'");
    }

    // Check if status column exists in users table
    const [statusCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'status'");
    if (statusCols.length === 0) {
      console.log('🔄 Migration: Adding status column to users table...');
      await connection.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'");
      console.log('✅ Migration: Added status column to users.');
    }

    // Seed sample librarian users if missing
    const [libUsers] = await connection.query("SELECT id FROM users WHERE email = 'librarian.chandrapur@travellib.com'");
    if (libUsers.length === 0) {
      console.log('🔄 Migration: Seeding sample librarian accounts...');
      await connection.query(`
        INSERT INTO users (name, email, password, mobile, role, library_id) VALUES
        ('Librarian Chandrapur', 'librarian.chandrapur@travellib.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '+15550192835', 'librarian', 1),
        ('Librarian Nagpur', 'librarian.nagpur@travellib.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '+15550192836', 'librarian', 2)
      `);
      console.log('✅ Migration: Sample librarians seeded.');
    }
  } catch (err) {
    console.error('⚠️ DB Migration Warning:', err.message);
  }
};

// Helper function to test database connectivity
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database:', process.env.DB_NAME || 'travel_library_db');
    await runMigrations(connection);
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
