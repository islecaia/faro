const express = require('express');
const sitesQueries = require('../db/queries/sites');
const recordsQueries = require('../db/queries/records');
const keywordsQueries = require('../db/queries/keywords');
const collector = require('../services/collector');
const sheetsService = require('../services/sheets');
const emailService = require('../services/email');

const ZERO_CHECK_METRICS = ['impressions', 'clicks', 'visits', 'attacks_blocked'];

const router = express.Router();

function previousMonthPeriod() {
  const now = new Date();
  const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return period.toISOString().slice(0, 10);
}

router.get('/generate/:site_id', async (req, res, next) => {
  try {
    const site = await sitesQueries.getSiteById(req.params.site_id);
    if (!site) return res.status(404).send('Sitio no encontrado');
    await res.renderPage('reports/generate', { screenHeading: 'Generar informe', site });
  } catch (err) {
    next(err);
  }
});

router.post('/generate/:site_id', async (req, res, next) => {
  try {
    const site = await sitesQueries.getSiteById(req.params.site_id);
    if (!site) return res.status(404).send('Sitio no encontrado');

    const period = previousMonthPeriod();
    const { data, sources_status, keywords } = await collector.collect(site, period);

    const record = await recordsQueries.insertMonthlyRecord({
      site_id: site.id,
      period,
      ...data,
      sources_status,
    });

    await keywordsQueries.insertKeywords(site.id, period, keywords);

    // El registro mensual ya es la fuente de verdad (Principio II); un fallo al escribir en
    // Sheets no debe perder ni bloquear el informe ya guardado en PostgreSQL.
    try {
      if (!site.sheets_id) {
        const sheetsId = await sheetsService.createSheet(site.name);
        await sitesQueries.setSheetsId(site.id, sheetsId);
      } else {
        await sheetsService.appendRow(site.sheets_id, record);
      }
    } catch (err) {
      console.error(`[sheets] no se pudo actualizar la hoja del sitio ${site.id}: ${err.message}`);
    }

    // FR-020: avisar de cada fuente que haya fallado tras sus 3 reintentos.
    for (const [source, status] of Object.entries(sources_status)) {
      if (status === 'failed') {
        try {
          await emailService.sendSourceFailureAlert(site, source);
        } catch (err) {
          console.error(`[alert] no se pudo enviar el aviso de fuente fallida (${source}): ${err.message}`);
        }
      }
    }

    // FR-021: avisar solo la primera vez que una métrica pasa de tener actividad a valer 0
    // (se compara contra el registro inmediatamente anterior; si ya estaba en 0, no se repite).
    const previous = await recordsQueries.getPreviousRecord(site.id, period);
    if (previous) {
      for (const metric of ZERO_CHECK_METRICS) {
        if (record[metric] === 0 && previous[metric] > 0) {
          try {
            await emailService.sendMetricZeroAlert(site, metric, previous[metric]);
          } catch (err) {
            console.error(`[alert] no se pudo enviar el aviso de métrica a cero (${metric}): ${err.message}`);
          }
        }
      }
    }

    res.redirect(`/reports/${record.id}?generated=1`);
  } catch (err) {
    next(err);
  }
});

router.get('/:record_id', async (req, res, next) => {
  try {
    const record = await recordsQueries.getRecordById(req.params.record_id);
    if (!record) return res.status(404).send('Registro no encontrado');
    const site = await sitesQueries.getSiteById(record.site_id);
    const statuses = record.sources_status || {};
    const connectedCount = Object.values(statuses).filter((s) => s === 'ok').length;
    await res.renderPage('reports/detail', {
      screenHeading: 'Informe mensual',
      record,
      site,
      justSent: req.query.sent === '1',
      justGenerated: req.query.generated === '1',
      connectedCount,
      totalSources: Object.keys(statuses).length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
