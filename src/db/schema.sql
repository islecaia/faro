-- Faro — esquema de base de datos (ver specs/001-informe-mensual-seo/data-model.md)

CREATE TABLE IF NOT EXISTS sites (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  url               TEXT NOT NULL,
  client_email      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  sc_property_id    TEXT,
  ga_property_id    TEXT,
  keywords_site_id  TEXT,
  security_site_id  TEXT,
  sheets_id         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Qué herramienta concreta cubre cada categoría de dato para este sitio, p. ej.
-- { "clicks": "Google Site Kit", "visits": "Rybbit", "keywords": "Ubersuggest",
--   "pagespeed": "PageSpeed Insights", "security": "Security Ninja" }
ALTER TABLE sites ADD COLUMN IF NOT EXISTS sources_config JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS monthly_records (
  id              SERIAL PRIMARY KEY,
  site_id         INTEGER REFERENCES sites(id),
  period          DATE NOT NULL,
  impressions     INTEGER,
  clicks          INTEGER,
  visits          INTEGER,
  pct_direct      NUMERIC(5,2),
  pct_organic     NUMERIC(5,2),
  pct_social      NUMERIC(5,2),
  pct_referral    NUMERIC(5,2),
  pct_other       NUMERIC(5,2),
  score_mobile    INTEGER,
  score_desktop   INTEGER,
  attacks_blocked INTEGER,
  threats_count   INTEGER,
  sources_status  JSONB,
  email_sent_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_records_site_period ON monthly_records (site_id, period);

CREATE TABLE IF NOT EXISTS keywords (
  id              SERIAL PRIMARY KEY,
  site_id         INTEGER REFERENCES sites(id),
  period          DATE NOT NULL,
  keyword         TEXT NOT NULL,
  position        INTEGER,
  search_volume   INTEGER,
  impressions     INTEGER,
  is_opportunity  BOOLEAN GENERATED ALWAYS AS (position BETWEEN 4 AND 10) STORED
);

CREATE INDEX IF NOT EXISTS idx_keywords_site_period ON keywords (site_id, period);
