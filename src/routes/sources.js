const express = require('express');
const sourcesQueries = require('../db/queries/sources');

const router = express.Router();

// Las 7 fuentes soportadas y sus campos de credenciales. El name de cada <input> en el
// formulario es `${key}_${field.name}` (p. ej. rybbit_api_token); el config guardado por
// source_key usa las claves ya sin ese prefijo (p. ej. { api_token: '...' }).
const SOURCE_FIELDS = [
  {
    key: 'gsc',
    label: 'Google Search Console',
    fields: [
      { name: 'service_account_json', label: 'Service Account JSON', type: 'textarea' },
    ],
  },
  {
    key: 'ga4',
    label: 'Google Analytics 4',
    fields: [
      { name: 'property_id', label: 'Property ID', type: 'text' },
    ],
  },
  {
    key: 'squirrly',
    label: 'Squirrly SEO',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password' },
    ],
  },
  {
    key: 'rybbit',
    label: 'Rybbit',
    fields: [
      { name: 'api_token', label: 'API Token', type: 'password' },
      { name: 'site_id', label: 'Site ID', type: 'text' },
    ],
  },
  {
    key: 'ubersuggest',
    label: 'Ubersuggest',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password' },
    ],
  },
  {
    key: 'pagespeed',
    label: 'PageSpeed Insights',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Opcional' },
    ],
  },
  {
    key: 'security_ninja',
    label: 'Security Ninja',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password' },
    ],
  },
];

router.get('/', async (req, res, next) => {
  try {
    const rows = await sourcesQueries.getAllCredentials();
    const credentials = {};
    rows.forEach((row) => {
      credentials[row.source_key] = row.config || {};
    });

    await res.renderPage('sources/index', {
      screenHeading: 'Origen de datos',
      sourceFields: SOURCE_FIELDS,
      credentials,
      justSaved: req.query.saved === '1',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    for (const source of SOURCE_FIELDS) {
      const config = {};
      source.fields.forEach((field) => {
        config[field.name] = req.body[`${source.key}_${field.name}`] || '';
      });
      await sourcesQueries.upsertCredential(source.key, config);
    }
    res.redirect('/sources?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
