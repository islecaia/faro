const pagespeed = require('./pagespeed');
const searchConsole = require('./search-console');
const analytics = require('./analytics');
const keywords = require('./keywords');
const security = require('./security');

const MAX_ATTEMPTS = 3;

async function withRetry(fn) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// Orquesta las 5 fuentes en paralelo (Promise.allSettled) con hasta 3 reintentos cada una.
// El fallo de una fuente nunca lanza excepción hacia el llamador (Principio IV): se refleja
// en sources_status y las métricas de esa fuente quedan a 0 explícito (Principio III / FR-008).
async function collect(site, period) {
  const sources = [
    { name: 'pagespeed', run: () => pagespeed.getScores(site.url) },
    { name: 'search_console', run: () => searchConsole.getData(site.sc_property_id, period) },
    { name: 'analytics', run: () => analytics.getData(site.ga_property_id, period) },
    { name: 'keywords', run: () => keywords.getData(site.keywords_site_id, period) },
    { name: 'security', run: () => security.getData(site.security_site_id, period) },
  ];

  const settled = await Promise.allSettled(sources.map((source) => withRetry(source.run)));

  const sources_status = {};
  const values = {};
  let keywordList = [];

  settled.forEach((result, index) => {
    const { name } = sources[index];
    if (result.status === 'fulfilled') {
      sources_status[name] = 'ok';
      if (name === 'keywords') {
        keywordList = result.value;
      } else {
        Object.assign(values, result.value);
      }
    } else {
      sources_status[name] = 'failed';
      console.error(`[collector] fuente "${name}" fallida para sitio ${site.id}: ${result.reason.message}`);
    }
  });

  return {
    data: {
      impressions: values.impressions ?? 0,
      clicks: values.clicks ?? 0,
      visits: values.visits ?? 0,
      pct_direct: values.pct_direct ?? 0,
      pct_organic: values.pct_organic ?? 0,
      pct_social: values.pct_social ?? 0,
      pct_referral: values.pct_referral ?? 0,
      pct_other: values.pct_other ?? 0,
      score_mobile: values.mobile ?? 0,
      score_desktop: values.desktop ?? 0,
      attacks_blocked: values.attacks_blocked ?? 0,
      threats_count: values.threats_count ?? 0,
    },
    sources_status,
    keywords: keywordList,
  };
}

module.exports = { collect };
