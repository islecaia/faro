const express = require('express');
const sitesQueries = require('../db/queries/sites');
const recordsQueries = require('../db/queries/records');
const keywordsQueries = require('../db/queries/keywords');
const collector = require('../services/collector');
const sheetsService = require('../services/sheets');
const emailService = require('../services/email');

const ZERO_CHECK_METRICS = ['impressions', 'clicks', 'visits', 'attacks_blocked'];

// Traduce cada categoría de sources_config (elegida por el Admin en el alta del sitio) a la
// clave correspondiente de sources_status que devuelve el collector para esa misma fuente.
const SOURCE_STATUS_KEY = {
  clicks: 'search_console',
  visits: 'analytics',
  keywords: 'keywords',
  pagespeed: 'pagespeed',
  security: 'security',
};

const router = express.Router();

function previousMonthPeriod() {
  const now = new Date();
  const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return period.toISOString().slice(0, 10);
}

// Construye, en el momento de generar el informe, qué herramienta se usó para cada categoría
// de dato y si tuvo éxito. Solo incluye una categoría si el sitio tiene una herramienta
// configurada para ella (sources_config); si no, no hay nada que registrar ahí.
function buildSourcesUsed(sourcesConfig, sourcesStatus) {
  const sourcesUsed = {};
  for (const [category, statusKey] of Object.entries(SOURCE_STATUS_KEY)) {
    const tool = sourcesConfig && sourcesConfig[category];
    if (!tool) continue;
    sourcesUsed[category] = {
      tool,
      status: sourcesStatus[statusKey] === 'failed' ? 'fallida' : 'ok',
    };
  }
  return sourcesUsed;
}

// Genera el informe del mes anterior para un sitio: recoge las 5 fuentes, guarda el registro,
// actualiza Sheets y dispara las alertas correspondientes. Usada tanto por la generación
// individual como por la generación masiva (generate-all) para no duplicar este flujo.
async function generateReportForSite(site) {
  const period = previousMonthPeriod();
  const { data, sources_status, keywords } = await collector.collect(site, period);

  const record = await recordsQueries.insertMonthlyRecord({
    site_id: site.id,
    period,
    ...data,
    sources_status,
    sources_used: buildSourcesUsed(site.sources_config, sources_status),
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

  return record;
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
    const record = await generateReportForSite(site);
    res.redirect(`/reports/${record.id}?generated=1`);
  } catch (err) {
    next(err);
  }
});

// Genera el informe de todos los sitios activos, uno detrás de otro (no en paralelo, para no
// saturar las APIs externas de las 5 fuentes). Un fallo en un sitio no detiene a los demás.
router.post('/generate-all', async (req, res, next) => {
  try {
    const sites = await sitesQueries.getAllActiveSites();
    const errors = [];

    for (const site of sites) {
      try {
        await generateReportForSite(site);
      } catch (err) {
        console.error(`[generate-all] fallo al generar el informe del sitio ${site.id}: ${err.message}`);
        errors.push({ site_id: site.id, site_name: site.name, message: err.message });
      }
    }

    res.json({ ok: true, total: sites.length, errors });
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
