const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || undefined,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER || undefined,
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || undefined,
  max: process.env.PGPOOL_MAX ? Number(process.env.PGPOOL_MAX) : 10,
});

const schema = process.env.DB_SCHEMA || 'public';
const safeSchema = schema.replace(/[^a-zA-Z0-9_]/g, '');

pool.on('connect', (client) => {
  if (safeSchema) {
    client.query(`SET search_path TO ${safeSchema}`);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
