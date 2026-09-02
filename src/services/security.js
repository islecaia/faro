const { SECURITY_NINJA_API_KEY } = require('../config/env');

const API_BASE = 'https://api.securityninja.io/v1';

async function getData(siteId, period) {
  if (!siteId) {
    throw new Error('Falta el site ID de Security Ninja para este sitio.');
  }
  if (!SECURITY_NINJA_API_KEY) {
    throw new Error('Falta SECURITY_NINJA_API_KEY en la configuración.');
  }

  const url = `${API_BASE}/sites/${encodeURIComponent(siteId)}/report?period=${encodeURIComponent(period)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${SECURITY_NINJA_API_KEY}` },
  });

  if (!response.ok) {
    throw new Error(`Security Ninja respondió ${response.status}`);
  }

  const json = await response.json();
  return {
    attacks_blocked: Number(json.attacks_blocked || 0),
    threats_count: Number(json.threats_count || 0),
  };
}

module.exports = { getData };
