const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { parseDatabaseConfig } = require('./src/utils/db-config');

async function migratePhotos() {
  const dbConfig = parseDatabaseConfig();
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✓ Connected to database\n');

    // Read SQL migration file
    const sqlFile = path.join(__dirname, 'src', 'migrations', '002-migrate-photos-to-database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📦 Executing migration...');
    await client.query(sql);
    console.log('✓ Migration completed successfully!\n');

    console.log('📊 Summary:');
    console.log('   - Old "url" column removed');
    console.log('   - New columns added: data (bytea), mimeType, filename, size');
    console.log('   - Backup table "photos_backup" created\n');

    console.log('⚠️  IMPORTANT:');
    console.log('   - All existing photos have been backed up in "photos_backup" table');
    console.log('   - Users will need to re-upload their photos');
    console.log('   - Photos are now stored directly in the database\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migratePhotos();
