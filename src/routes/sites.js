const express = require('express');
const sitesQueries = require('../db/queries/sites');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const sites = await sitesQueries.getAllActiveSites();
    const sitesWithLastReport = await Promise.all(
      sites.map(async (site) => ({
        ...site,
        last_report_date: await sitesQueries.getLastReportDate(site.id),
      }))
    );
    await res.renderPage('sites/index', { screenHeading: 'Sitios', sites: sitesWithLastReport });
  } catch (err) {
    next(err);
  }
});

router.get('/new', async (req, res, next) => {
  try {
    await res.renderPage('sites/form', { screenHeading: 'Añadir sitio' });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await sitesQueries.createSite(req.body);
    res.redirect('/sites');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/deactivate', async (req, res, next) => {
  try {
    await sitesQueries.deactivateSite(req.params.id);
    res.redirect('/sites');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
