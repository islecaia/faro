const express = require('express');
const templateQueries = require('../db/queries/template');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const template = await templateQueries.getTemplate();
    await res.renderPage('template/index', {
      screenHeading: 'Plantilla',
      body: (template && template.body) || '',
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
