const pool = require('../../config/db');

async function getAllActiveSites() {
  const { rows } = await pool.query(
    `SELECT * FROM sites WHERE status = 'active' ORDER BY name ASC`
  );
  return rows;
}

async function getAllSites() {
  const { rows } = await pool.query(`SELECT * FROM sites ORDER BY name ASC`);
  return rows;
}

async function getSiteById(id) {
  const { rows } = await pool.query(`SELECT * FROM sites WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function createSite(data) {
  const sourcesConfig = {};
  if (data.source_clicks) sourcesConfig.clicks = data.source_clicks;
  if (data.source_visits) sourcesConfig.visits = data.source_visits;
  if (data.source_keywords) sourcesConfig.keywords = data.source_keywords;
  if (data.source_pagespeed) sourcesConfig.pagespeed = data.source_pagespeed;
  if (data.source_security) sourcesConfig.security = data.source_security;

  const { rows } = await pool.query(
    `INSERT INTO sites (name, url, client_email, sc_property_id, ga_property_id, keywords_site_id, security_site_id, sources_config)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.name,
      data.url,
      data.client_email,
      data.sc_property_id || null,
      data.ga_property_id || null,
      data.keywords_site_id || null,
      data.security_site_id || null,
      JSON.stringify(sourcesConfig),
    ]
  );
  return rows[0];
}

async function deactivateSite(id) {
  await pool.query(`UPDATE sites SET status = 'inactive' WHERE id = $1`, [id]);
}

async function setSheetsId(id, sheetsId) {
  await pool.query(`UPDATE sites SET sheets_id = $1 WHERE id = $2`, [sheetsId, id]);
}

module.exports = {
  getAllActiveSites,
  getAllSites,
  getSiteById,
  createSite,
  deactivateSite,
  setSheetsId,
};
