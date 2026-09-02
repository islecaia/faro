require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria ${name}. Revisa .env.example.`);
  }
  return value;
}

module.exports = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: required('DATABASE_URL'),

  // Requeridas solo al ejercitar sus integraciones concretas (US2/US3/US5/US6);
  // no bloquean el arranque de la app para no impedir trabajar en US1/US4 sin credenciales.
  GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  KEYWORDS_API_URL: process.env.KEYWORDS_API_URL,
  KEYWORDS_API_KEY: process.env.KEYWORDS_API_KEY,
  SECURITY_NINJA_API_KEY: process.env.SECURITY_NINJA_API_KEY,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  ALERT_EMAIL: process.env.ALERT_EMAIL,
};
