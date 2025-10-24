const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { parseDatabaseConfig } = require('./src/utils/db-config');

async function installPgvector() {
  const dbConfig = parseDatabaseConfig();

  console.log('Database configuration:');
  console.log('Host:', dbConfig.host);
  console.log('Port:', dbConfig.port);
  console.log('User:', dbConfig.user);
  console.log('Database:', dbConfig.database);
  console.log('Password:', dbConfig.password ? '***' : 'undefined');

  const client = new Client(dbConfig);

  try {
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✓ Connected to database\n');

    // Read SQL migration file
    const sqlFile = path.join(__dirname, 'src', 'migrations', '001-add-pgvector-and-embeddings.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📦 Executing migration...');
    await client.query(sql);
    console.log('✓ Migration completed successfully!\n');
    console.log('pgvector extension is now installed and ready to use.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('extension "vector" is not available')) {
      console.error('\nThe pgvector extension is not installed in your PostgreSQL installation.');
      console.error('Please install it first by following the instructions at:');
      console.error('https://github.com/pgvector/pgvector#installation');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

installPgvector();
