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

router.get('/:id', async (req, res, next) => {
  try {
    const site = await sitesQueries.getSiteById(req.params.id);
    if (!site) return res.status(404).send('Sitio no encontrado');
    const lastReportDate = await sitesQueries.getLastReportDate(site.id);
    await res.renderPage('sites/detail', {
      screenHeading: site.name,
      site: { ...site, last_report_date: lastReportDate },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const site = await sitesQueries.getSiteById(req.params.id);
    if (!site) return res.status(404).send('Sitio no encontrado');
    await res.renderPage('sites/edit', { screenHeading: `Editar ${site.name}`, site });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/edit', async (req, res, next) => {
  try {
    const sourcesConfig = {};
    if (req.body.source_clicks) sourcesConfig.clicks = req.body.source_clicks;
    if (req.body.source_visits) sourcesConfig.visits = req.body.source_visits;
    if (req.body.source_keywords) sourcesConfig.keywords = req.body.source_keywords;
    if (req.body.source_pagespeed) sourcesConfig.pagespeed = req.body.source_pagespeed;
    if (req.body.source_security) sourcesConfig.security = req.body.source_security;

    await sitesQueries.updateSite(req.params.id, {
      name: req.body.name,
      url: req.body.url,
      clientEmail: req.body.client_email,
      contactName: req.body.contact_name,
      sourcesConfig,
    });
    res.redirect(`/sites/${req.params.id}`);
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
