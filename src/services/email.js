const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL } = require('../config/env');

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

function getTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Faltan SMTP_HOST/SMTP_USER/SMTP_PASS en la configuración.');
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
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
  const transport = getTransport();
  await transport.sendMail({
    from: SMTP_USER,
    to: clientEmail,
    subject: `Informe mensual — ${data.site_name}`,
    html,
  });
}

async function sendAlert(subject, html) {
  if (!ALERT_EMAIL) {
    throw new Error('Falta ALERT_EMAIL en la configuración.');
  }
  const transport = getTransport();
  await transport.sendMail({ from: SMTP_USER, to: ALERT_EMAIL, subject, html });
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

module.exports = { sendReport, sendSourceFailureAlert, sendMetricZeroAlert };
