const pool = require('../../config/db');

async function insertMonthlyRecord(record) {
  const { rows } = await pool.query(
    `INSERT INTO monthly_records (
       site_id, period, impressions, clicks, visits,
       pct_direct, pct_organic, pct_social, pct_referral, pct_other,
       score_mobile, score_desktop, attacks_blocked, threats_count, sources_status, sources_used
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      record.site_id,
      record.period,
      record.impressions,
      record.clicks,
      record.visits,
      record.pct_direct,
      record.pct_organic,
      record.pct_social,
      record.pct_referral,
      record.pct_other,
      record.score_mobile,
      record.score_desktop,
      record.attacks_blocked,
      record.threats_count,
      JSON.stringify(record.sources_status || {}),
      JSON.stringify(record.sources_used || {}),
    ]
  );
  return rows[0];
}

async function getPreviousRecord(siteId, period) {
  const { rows } = await pool.query(
    `SELECT * FROM monthly_records
     WHERE site_id = $1 AND period < $2
     ORDER BY period DESC, created_at DESC
     LIMIT 1`,
    [siteId, period]
  );
  return rows[0] || null;
}

async function getRecordById(id) {
  const { rows } = await pool.query(`SELECT * FROM monthly_records WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function getLatestPerSite() {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (mr.site_id) mr.*, s.name AS site_name
     FROM monthly_records mr
     JOIN sites s ON s.id = mr.site_id
     WHERE s.status = 'active'
     ORDER BY mr.site_id, mr.period DESC, mr.created_at DESC`
  );
  return rows;
}

async function getHistorical(siteId) {
  const { rows } = await pool.query(
    siteId
      ? `SELECT mr.*, s.name AS site_name FROM monthly_records mr
         JOIN sites s ON s.id = mr.site_id
         WHERE mr.site_id = $1
         ORDER BY mr.period DESC, mr.created_at DESC`
      : `SELECT mr.*, s.name AS site_name FROM monthly_records mr
         JOIN sites s ON s.id = mr.site_id
         ORDER BY mr.period DESC, mr.created_at DESC`,
    siteId ? [siteId] : []
  );
  return rows;
}

async function setEmailSentAt(id) {
  await pool.query(`UPDATE monthly_records SET email_sent_at = NOW() WHERE id = $1`, [id]);
}

module.exports = {
  insertMonthlyRecord,
  getPreviousRecord,
  getRecordById,
  getLatestPerSite,
  getHistorical,
  setEmailSentAt,
};
