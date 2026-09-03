const pool = require('../../config/db');

async function getAllCredentials() {
  const { rows } = await pool.query('SELECT * FROM source_credentials');
  return rows;
}

async function upsertCredential(sourceKey, config) {
  await pool.query(
    `INSERT INTO source_credentials (source_key, config, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (source_key) DO UPDATE SET config = $2, updated_at = NOW()`,
    [sourceKey, JSON.stringify(config)]
  );
}

module.exports = { getAllCredentials, upsertCredential };
