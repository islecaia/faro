const { google } = require('googleapis');
const { GOOGLE_SERVICE_ACCOUNT_JSON } = require('../config/env');

const CHANNEL_MAP = {
  Direct: 'direct',
  'Organic Search': 'organic',
  'Organic Social': 'social',
  'Paid Social': 'social',
  Referral: 'referral',
};

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
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
}

async function getData(propertyId, period) {
  if (!propertyId) {
    throw new Error('Falta el property ID de GA4 Analytics para este sitio.');
  }

  const auth = getAuth();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  const { startDate, endDate } = monthRange(period);

  const { data } = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
    },
  });

  const totals = { direct: 0, organic: 0, social: 0, referral: 0, other: 0 };
  let visits = 0;

  for (const row of data.rows || []) {
    const channel = row.dimensionValues[0].value;
    const sessions = Number(row.metricValues[0].value);
    const bucket = CHANNEL_MAP[channel] || 'other';
    totals[bucket] += sessions;
    visits += sessions;
  }

  const pct = (n) => (visits > 0 ? Math.round((n / visits) * 10000) / 100 : 0);

  return {
    visits,
    pct_direct: pct(totals.direct),
    pct_organic: pct(totals.organic),
    pct_social: pct(totals.social),
    pct_referral: pct(totals.referral),
    pct_other: pct(totals.other),
  };
}

module.exports = { getData };
