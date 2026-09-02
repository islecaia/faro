const pool = require('../../config/db');

const COLUMNS = 6;

async function insertKeywords(siteId, period, keywordList) {
  if (!keywordList || !keywordList.length) return;

  const values = [];
  const params = [];

  keywordList.forEach((kw, i) => {
    const base = i * COLUMNS;
    values.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    );
    params.push(siteId, period, kw.keyword, kw.position, kw.search_volume, kw.impressions);
  });

  await pool.query(
    `INSERT INTO keywords (site_id, period, keyword, position, search_volume, impressions)
     VALUES ${values.join(', ')}`,
    params
  );
}

async function getOpportunities(siteId) {
  const { rows } = await pool.query(
    siteId
      ? `SELECT k.*, s.name AS site_name FROM keywords k
         JOIN sites s ON s.id = k.site_id
         JOIN (SELECT site_id, MAX(period) AS max_period FROM keywords GROUP BY site_id) latest
           ON latest.site_id = k.site_id AND latest.max_period = k.period
         WHERE k.is_opportunity = true AND k.site_id = $1
         ORDER BY k.position ASC`
      : `SELECT k.*, s.name AS site_name FROM keywords k
         JOIN sites s ON s.id = k.site_id
         JOIN (SELECT site_id, MAX(period) AS max_period FROM keywords GROUP BY site_id) latest
           ON latest.site_id = k.site_id AND latest.max_period = k.period
         WHERE k.is_opportunity = true
         ORDER BY k.position ASC`,
    siteId ? [siteId] : []
  );
  return rows;
}

module.exports = { insertKeywords, getOpportunities };
