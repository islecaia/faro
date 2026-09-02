const { google } = require('googleapis');
const { GOOGLE_SERVICE_ACCOUNT_JSON } = require('../config/env');

function monthRange(period) {
  const date = new Date(period);
  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString().slice(0, 10);
  const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
    .toISOString().slice(0, 10);
  return { startDate, endDate };
}

function getAuth() {
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('Falta GOOGLE_SERVICE_ACCOUNT_JSON en la configuración.');
  }
  const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

async function getData(propertyId, period) {
  if (!propertyId) {
    throw new Error('Falta el property ID de Search Console para este sitio.');
  }

  const auth = getAuth();
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const { startDate, endDate } = monthRange(period);

  const { data } = await searchconsole.searchanalytics.query({
    siteUrl: propertyId,
    requestBody: { startDate, endDate },
  });

  const row = data.rows && data.rows[0];
  return {
    impressions: row ? Math.round(row.impressions) : 0,
    clicks: row ? Math.round(row.clicks) : 0,
  };
}

module.exports = { getData };
