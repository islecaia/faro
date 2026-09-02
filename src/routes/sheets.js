const express = require('express');
const sitesQueries = require('../db/queries/sites');

const router = express.Router();

router.get('/:site_id/open', async (req, res, next) => {
  try {
    const site = await sitesQueries.getSiteById(req.params.site_id);
    if (!site || !site.sheets_id) {
      return res.status(404).send('Este sitio aún no tiene una hoja de Google Sheets generada.');
    }
    res.redirect(`https://docs.google.com/spreadsheets/d/${site.sheets_id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
