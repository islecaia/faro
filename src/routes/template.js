const express = require('express');
const templateQueries = require('../db/queries/template');

const router = express.Router();

function decodeHtmlEntitiesOnce(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// Repara cuerpos guardados mientras el editor tenía el bug del bloque en blanco: el HTML se
// escapó de más en algún ciclo de guardado/carga y Quill lo mostraba como texto literal
// (<p>...</p> visible en vez de interpretado). Decodifica entidades hasta que se estabiliza.
function repairDoubleEncodedHtml(str) {
  let current = str;
  for (let i = 0; i < 5; i += 1) {
    const decoded = decodeHtmlEntitiesOnce(current);
    if (decoded === current) break;
    current = decoded;
  }
  return current;
}

router.get('/', async (req, res, next) => {
  try {
    const template = await templateQueries.getTemplate();
    const rawBody = (template && template.body) || '';
    const body = repairDoubleEncodedHtml(rawBody);
    if (body !== rawBody) {
      await templateQueries.saveTemplate(body);
    }

    await res.renderPage('template/index', {
      screenHeading: 'Plantilla',
      body,
      justSaved: req.query.saved === '1',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await templateQueries.saveTemplate(req.body.body || '');
    res.redirect('/template?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
