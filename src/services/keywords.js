const { KEYWORDS_API_URL, KEYWORDS_API_KEY } = require('../config/env');

async function getData(siteId, period) {
  if (!siteId) {
    throw new Error('Falta el site ID de la herramienta de palabras clave para este sitio.');
  }
  if (!KEYWORDS_API_URL || !KEYWORDS_API_KEY) {
    throw new Error('Faltan KEYWORDS_API_URL/KEYWORDS_API_KEY en la configuración.');
  }

  const url = new URL(KEYWORDS_API_URL);
  url.searchParams.set('site_id', siteId);
  url.searchParams.set('period', period);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${KEYWORDS_API_KEY}` },
  });

  if (!response.ok) {
    throw new Error(`La API de palabras clave respondió ${response.status}`);
  }

  const json = await response.json();
  const list = Array.isArray(json) ? json : json.keywords || [];

  return list.map((item) => ({
    keyword: item.keyword,
    position: Number(item.position),
    search_volume: item.search_volume != null ? Number(item.search_volume) : null,
    impressions: item.impressions != null ? Number(item.impressions) : 0,
  }));
}

module.exports = { getData };
