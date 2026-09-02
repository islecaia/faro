const { google } = require('googleapis');
const { GOOGLE_SERVICE_ACCOUNT_JSON } = require('../config/env');

const HEADER_ROW = [
  'Fecha', 'Impresiones', 'Clics', 'Visitas',
  '% Directo', '% Orgánico', '% Social', '% Referral', '% Otro',
  'PageSpeed Mobile', 'PageSpeed Desktop', 'Ataques', 'Amenazas',
];

function getAuth() {
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('Falta GOOGLE_SERVICE_ACCOUNT_JSON en la configuración.');
  }
  const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function createSheet(siteName) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const { data } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: `Faro — ${siteName}` },
      sheets: [{
        properties: { title: 'Registros' },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{ values: HEADER_ROW.map((text) => ({ userEnteredValue: { stringValue: text } })) }],
        }],
      }],
    },
  });

  return data.spreadsheetId;
}

async function appendRow(sheetsId, record) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const row = [
    record.period,
    record.impressions,
    record.clicks,
    record.visits,
    record.pct_direct,
    record.pct_organic,
    record.pct_social,
    record.pct_referral,
    record.pct_other,
    record.score_mobile,
    record.score_desktop,
    record.attacks_blocked,
    record.threats_count,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: 'Registros!A:A',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

module.exports = { createSheet, appendRow };
