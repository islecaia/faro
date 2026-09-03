const pool = require('../../config/db');

async function getTemplate() {
  const { rows } = await pool.query('SELECT * FROM email_template ORDER BY id LIMIT 1');
  return rows[0] || null;
}

async function saveTemplate(body) {
  await pool.query(
    `INSERT INTO email_template (id, body, updated_at)
     VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE SET body = $1, updated_at = NOW()`,
    [body]
  );
}

module.exports = { getTemplate, saveTemplate };
