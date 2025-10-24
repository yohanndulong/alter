/**
 * Utilitaire pour parser la configuration de base de données
 * Supporte DATABASE_URL ou variables individuelles (DB_HOST, DB_PORT, etc.)
 */
function parseDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Parser DATABASE_URL
    // Format: postgresql://username:password@host:port/database
    const url = new URL(databaseUrl);

    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading '/'
    };
  }

  // Fallback sur les variables individuelles
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'alter_db',
  };
}

module.exports = { parseDatabaseConfig };
