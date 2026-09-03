const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL } = require('../config/env');
const sourcesQueries = require('../db/queries/sources');

const SOURCE_LABELS = {
  search_console: 'Search Console',
  analytics: 'GA4 Analytics',
  keywords: 'Palabras clave',
  pagespeed: 'PageSpeed',
  security: 'Security Ninja',
};

const METRIC_LABELS = {
  impressions: 'Las impresiones',
  clicks: 'Los clics',
  visits: 'Las visitas',
  attacks_blocked: 'Los ataques bloqueados',
};

// Resuelve la configuración SMTP a usar: primero busca credenciales guardadas en
// source_credentials (source_key='smtp', configurables desde /sources); si no hay ninguna
// guardada ahí, cae a las variables de entorno SMTP_* (comportamiento previo, para no romper
// despliegues que aún no han rellenado esa pantalla).
async function resolveSmtpConfig() {
  try {
    const rows = await sourcesQueries.getAllCredentials();
    const row = rows.find((r) => r.source_key === 'smtp');
    const config = row && row.config;
    if (config && config.host && config.user && config.pass) {
      return {
        host: config.host,
        port: config.port,
        user: config.user,
        pass: config.pass,
        from: config.from || config.user,
      };
    }
  } catch (err) {
    console.error(`[email] no se pudo leer la configuración SMTP guardada, usando variables de entorno: ${err.message}`);
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Faltan SMTP_HOST/SMTP_USER/SMTP_PASS en la configuración.');
  }
  return { host: SMTP_HOST, port: SMTP_PORT, user: SMTP_USER, pass: SMTP_PASS, from: SMTP_USER };
}

async function getTransport() {
  const config = await resolveSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port) || 587,
    secure: Number(config.port) === 465,
    auth: { user: config.user, pass: config.pass },
  });
}

async function getFromAddress() {
  const config = await resolveSmtpConfig();
  return config.from;
}

function variationText(value, variation) {
  if (variation === undefined || variation === null || variation === '') return `${value}`;
  const sign = String(variation).trim().startsWith('-') ? '' : '+';
  return `${value} (${sign}${variation}% vs mes anterior)`;
}

// Plantilla de email: HTML con estilos inline, 5 secciones fijas (ver spec.md).
function renderReportHtml(d) {
  const section = (title, body) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#1A000F; color:#C8A8BF; font-family:Arial,sans-serif; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; padding:10px 16px; border-radius:8px 8px 0 0;">${title}</td></tr>
      <tr><td style="background:#240018; color:#FFFFFF; font-family:Arial,sans-serif; font-size:14px; padding:16px; border-radius:0 0 8px 8px;">${body}</td></tr>
    </table>`;

  const s1 = section('#1 Fuentes de tráfico', `
    Directas: ${d.pct_direct}%<br>
    Orgánicas: ${d.pct_organic}%<br>
    Redes sociales: ${d.pct_social}%<br>
    Referrals: ${d.pct_referral}%<br>
    Otras: ${d.pct_other}%
  `);

  const s2 = section('#2 Seguridad y estado general', `
    Estado general: ${d.security_status || '—'}<br>
    Ataques bloqueados en el periodo: ${d.attacks_blocked}<br>
    Amenazas detectadas: ${d.threats_count}<br>
    ${d.notes ? `<p>${d.notes}</p>` : ''}
  `);

  const s3 = section('#3 Tráfico y visitas', `
    Impresiones: ${variationText(d.impressions, d.impressions_variation)}<br>
    Clics: ${variationText(d.clicks, d.clicks_variation)}
  `);

  const s4 = section('#4 Fuentes de tráfico', `
    Este mes, el ${d.pct_organic}% del tráfico llegó de forma orgánica, un ${d.pct_direct}% directamente,
    un ${d.pct_social}% desde redes sociales, un ${d.pct_referral}% por referidos y un ${d.pct_other}%
    de otras fuentes.
  `);

  const s5 = section('#5 Posicionamiento Google — SEO', `
    Tendencia del ranking: ${d.ranking_trend || '—'}<br>
    ${d.ranking_comment ? `<p>${d.ranking_comment}</p>` : ''}
    ${[d.opportunity_1, d.opportunity_2, d.opportunity_3].filter(Boolean).length
      ? `<p><strong>Oportunidades identificadas:</strong><br>${[d.opportunity_1, d.opportunity_2, d.opportunity_3].filter(Boolean).join('<br>')}</p>`
      : ''}
    Rendimiento técnico — Mobile: ${d.score_mobile} (${d.rating_mobile || '—'})<br>
    Rendimiento técnico — Desktop: ${d.score_desktop} (${d.rating_desktop || '—'})
  `);

  return `
    <div style="background:#0F000A; padding:24px; font-family:Arial,sans-serif;">
      <h1 style="color:#E91E8C; font-size:22px; margin:0 0 16px;">Informe mensual — ${d.site_name}</h1>
      ${s1}${s2}${s3}${s4}${s5}
    </div>`;
}

async function sendReport(clientEmail, data) {
  const html = renderReportHtml(data);
  const transport = await getTransport();
  await transport.sendMail({
    from: await getFromAddress(),
    to: clientEmail,
    subject: `Informe mensual — ${data.site_name}`,
    html,
  });
}

// Plantilla del informe "compuesto" (formulario libre de dashboard → /reports/:id/compose):
// tabla de métricas + secciones cualitativas de texto libre, mismo lenguaje visual que el
// informe de cliente estándar (renderReportHtml) para que ambos emails se vean coherentes.
function renderComposedReportHtml(d) {
  const row = (label, value) => `
    <tr>
      <td style="padding:8px 12px; color:#C8A8BF; font-family:Arial,sans-serif; font-size:13px; border-bottom:1px solid #4A0035;">${label}</td>
      <td style="padding:8px 12px; color:#FFFFFF; font-family:Arial,sans-serif; font-size:13px; border-bottom:1px solid #4A0035;">${value}</td>
    </tr>`;

  const metricsTable = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; background:#240018; border-radius:8px; overflow:hidden;">
      ${row('Impresiones', variationText(d.impressions, d.impressions_variation))}
      ${row('Clics', variationText(d.clicks, d.clicks_variation))}
      ${row('Direct', `${d.channel_direct ?? 0}%`)}
      ${row('Organic Search', `${d.channel_organic ?? 0}%`)}
      ${row('RSS', `${d.channel_rss ?? 0}%`)}
      ${row('Referrals', `${d.channel_referrals ?? 0}%`)}
      ${row('Other', `${d.channel_other ?? 0}%`)}
      ${row('Rendimiento Móvil', `${d.score_mobile ?? 0}/100 (${d.rating_mobile || '—'})`)}
      ${row('Rendimiento Desktop', `${d.score_desktop ?? 0}/100 (${d.rating_desktop || '—'})`)}
    </table>`;

  const section = (title, body) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr><td style="background:#1A000F; color:#C8A8BF; font-family:Arial,sans-serif; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; padding:10px 16px; border-radius:8px 8px 0 0;">${title}</td></tr>
      <tr><td style="background:#240018; color:#FFFFFF; font-family:Arial,sans-serif; font-size:14px; padding:16px; border-radius:0 0 8px 8px;">${body}</td></tr>
    </table>`;

  const opportunities = [d.opportunity_1, d.opportunity_2, d.opportunity_3].filter(Boolean);
  const recommendations = [d.recommendation_1, d.recommendation_2, d.recommendation_3].filter(Boolean);

  const ranking = section('Ranking', `
    Situación actual: ${d.ranking_current || '—'}<br>
    Evolución vs. mes anterior: ${d.ranking_evolution || '—'}
  `);

  const opportunitiesSection = opportunities.length
    ? section('Oportunidades identificadas', opportunities.join('<br>'))
    : '';

  const incidentsSection = d.incidents_resolved
    ? section('Incidencias resueltas', d.incidents_resolved)
    : '';

  const nextStepsSection = (d.next_steps || recommendations.length)
    ? section('Próximos pasos y recomendaciones', `
        ${d.next_steps ? `${d.next_steps}<br><br>` : ''}
        ${recommendations.length ? recommendations.join('<br>') : ''}
      `)
    : '';

  const additionalSection = d.additional_message
    ? section('Mensaje adicional', d.additional_message)
    : '';

  return `
    <div style="background:#0F000A; padding:24px; font-family:Arial,sans-serif;">
      <h1 style="color:#E91E8C; font-size:22px; margin:0 0 16px;">Informe mensual — ${d.site_name}</h1>
      ${metricsTable}
      ${ranking}
      ${opportunitiesSection}
      ${incidentsSection}
      ${nextStepsSection}
      ${additionalSection}
    </div>`;
}

async function sendComposedReport(clientEmail, data) {
  const html = renderComposedReportHtml(data);
  const transport = await getTransport();
  await transport.sendMail({
    from: await getFromAddress(),
    to: clientEmail,
    subject: `Informe mensual — ${data.site_name}`,
    html,
  });
}

async function sendAlert(subject, html) {
  if (!ALERT_EMAIL) {
    throw new Error('Falta ALERT_EMAIL en la configuración.');
  }
  const transport = await getTransport();
  await transport.sendMail({ from: await getFromAddress(), to: ALERT_EMAIL, subject, html });
}

// FR-020: aviso al Admin cuando una fuente falla tras sus 3 reintentos.
async function sendSourceFailureAlert(site, source) {
  const label = SOURCE_LABELS[source] || source;
  await sendAlert(
    `Faro: fuente fallida en ${site.name}`,
    `<p>${label} no respondió tras 3 intentos para el sitio <strong>${site.name}</strong>.
     Se ha marcado como fallida en el registro. El resto del informe se ha generado con normalidad.</p>`
  );
}

// FR-021: aviso al Admin la primera vez que una métrica pasa de tener actividad a valer 0.
async function sendMetricZeroAlert(site, metric, previousValue) {
  const label = METRIC_LABELS[metric] || metric;
  await sendAlert(
    `Faro: ${label.toLowerCase()} en 0 — ${site.name}`,
    `<p>${label} de este mes en <strong>${site.name}</strong> son 0. El mes anterior fueron ${previousValue}.
     Revisa si hay algún cambio reciente en las fuentes correspondientes.</p>`
  );
}

module.exports = { sendReport, sendComposedReport, sendSourceFailureAlert, sendMetricZeroAlert };
