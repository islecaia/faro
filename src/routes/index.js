const express = require('express');
const sitesQueries = require('../db/queries/sites');
const recordsQueries = require('../db/queries/records');
const keywordsQueries = require('../db/queries/keywords');

const router = express.Router();

// FR-010: variación porcentual vs. el mes anterior; null cuando no hay mes anterior con el
// que comparar (o su valor era 0, para evitar una división por cero).
function pctChange(actual, anterior) {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 10000) / 100;
}

router.get('/', async (req, res, next) => {
  try {
    const siteId = req.query.site_id || null;

    const sites = await sitesQueries.getAllSites();
    const latestAll = await recordsQueries.getLatestPerSite();
    const latest = siteId
      ? latestAll.filter((record) => String(record.site_id) === String(siteId))
      : latestAll;

    const kpis = await Promise.all(
      latest.map(async (record) => {
        const previous = await recordsQueries.getPreviousRecord(record.site_id, record.period);
        return {
          ...record,
          delta_impressions: previous ? pctChange(record.impressions, previous.impressions) : null,
          delta_clicks: previous ? pctChange(record.clicks, previous.clicks) : null,
          delta_visits: previous ? pctChange(record.visits, previous.visits) : null,
        };
      })
    );

    const historical = await recordsQueries.getHistorical(siteId);
    const opportunities = await keywordsQueries.getOpportunities(siteId);

    await res.renderPage('dashboard', {
      screenHeading: 'Dashboard',
      sites,
      kpis,
      historical,
      opportunities,
      selectedSiteId: siteId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
