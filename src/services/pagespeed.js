async function fetchScore(url, strategy) {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`PageSpeed Insights respondió ${response.status} para estrategia "${strategy}"`);
  }
  const json = await response.json();
  const score = json && json.lighthouseResult && json.lighthouseResult.categories
    && json.lighthouseResult.categories.performance
    && json.lighthouseResult.categories.performance.score;
  if (typeof score !== 'number') {
    throw new Error(`PageSpeed Insights no devolvió puntuación de rendimiento para "${strategy}"`);
  }
  return Math.round(score * 100);
}

async function getScores(url) {
  const [mobile, desktop] = await Promise.all([
    fetchScore(url, 'mobile'),
    fetchScore(url, 'desktop'),
  ]);
  return { mobile, desktop };
}

module.exports = { getScores };
