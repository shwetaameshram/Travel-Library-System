const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDb() {
  console.log('Connecting to MySQL server...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('Reading database/schema.sql...');
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Executing schema script on MySQL...');
  await connection.query(sql);
  console.log('✅ Database travel_library_db schema and sample data successfully created!');

  await connection.end();
}

initDb().catch(err => {
  console.error('❌ Error initializing database:', err.message);
  process.exit(1);
});
