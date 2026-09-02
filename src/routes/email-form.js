const express = require('express');
const sitesQueries = require('../db/queries/sites');
const recordsQueries = require('../db/queries/records');
const emailService = require('../services/email');

const router = express.Router();

function pctChange(actual, anterior) {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 10000) / 100;
}

router.get('/:record_id', async (req, res, next) => {
  try {
    const record = await recordsQueries.getRecordById(req.params.record_id);
    if (!record) return res.status(404).send('Registro no encontrado');
    const site = await sitesQueries.getSiteById(record.site_id);
    const previous = await recordsQueries.getPreviousRecord(record.site_id, record.period);

    await res.renderPage('email-form/index', {
      screenHeading: 'Formulario de informe de cliente',
      record,
      site,
      impressions_variation: previous ? pctChange(record.impressions, previous.impressions) : '',
      clicks_variation: previous ? pctChange(record.clicks, previous.clicks) : '',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:record_id/send', async (req, res, next) => {
  try {
    const record = await recordsQueries.getRecordById(req.params.record_id);
    if (!record) return res.status(404).send('Registro no encontrado');
    const site = await sitesQueries.getSiteById(record.site_id);

    await emailService.sendReport(site.client_email, { ...req.body, site_name: site.name });
    await recordsQueries.setEmailSentAt(record.id);

    res.redirect(`/reports/${record.id}?sent=1`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
