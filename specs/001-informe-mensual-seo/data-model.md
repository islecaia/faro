# Phase 1 Data Model: Informe mensual SEO/rendimiento automatizado

Entidades extraídas de `spec.md` §Key Entities, mapeadas al esquema PostgreSQL acordado en el
comando de planificación. Todo acceso es SQL directo vía `pg` (Principio II de la Constitución);
ninguna tabla se borra nunca por completo — solo se actualiza `status` o se añaden filas nuevas
(Principio III).

## sites — Sitio web

Representa un sitio cliente gestionado por la agencia (spec: "Sitio web").

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `name` | `TEXT NOT NULL` | Nombre del sitio/cliente |
| `url` | `TEXT NOT NULL` | URL base, usada también para la llamada a PageSpeed Insights (ver `research.md` §3 — PageSpeed no tiene un identificador de fuente propio) |
| `client_email` | `TEXT NOT NULL` | Destinatario del informe de cliente (US5) |
| `status` | `TEXT NOT NULL DEFAULT 'active'` | `'active' \| 'inactive'` — nunca se borra la fila (FR-003) |
| `sc_property_id` | `TEXT` | Identificador de propiedad en Search Console |
| `ga_property_id` | `TEXT` | Identificador de propiedad GA4 |
| `keywords_site_id` | `TEXT` | Identificador en la herramienta de keywords (Squirrly/Ubersuggest) |
| `security_site_id` | `TEXT` | Identificador en Security Ninja |
| `sheets_id` | `TEXT` | `spreadsheetId` de Google Sheets; se rellena al generar el primer informe (FR-011) |
| `created_at` | `TIMESTAMPTZ DEFAULT NOW()` | |

**Validación / reglas de negocio**:
- `status` solo cambia entre `'active'` e `'inactive'`; no existe operación de borrado (FR-003,
  Principio III).
- `sheets_id` es `NULL` hasta el primer informe generado con éxito; a partir de ahí es inmutable.

## monthly_records — Registro mensual

Fila de métricas de un sitio para un periodo concreto (spec: "Registro mensual").

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `site_id` | `INTEGER REFERENCES sites(id)` | |
| `period` | `DATE NOT NULL` | Mes de corte (el mes anterior al de generación, US2) |
| `impressions` | `INTEGER` | Search Console — `0` explícito si no hay actividad (FR-008) |
| `clicks` | `INTEGER` | Search Console — ídem |
| `visits` | `INTEGER` | GA4 Analytics — ídem |
| `pct_direct` | `NUMERIC(5,2)` | GA4 Analytics, desglose de canal |
| `pct_organic` | `NUMERIC(5,2)` | ídem |
| `pct_social` | `NUMERIC(5,2)` | ídem |
| `pct_referral` | `NUMERIC(5,2)` | ídem |
| `pct_other` | `NUMERIC(5,2)` | ídem |
| `score_mobile` | `INTEGER` | PageSpeed Insights |
| `score_desktop` | `INTEGER` | PageSpeed Insights |
| `attacks_blocked` | `INTEGER` | Security Ninja |
| `threats_count` | `INTEGER` | Security Ninja |
| `sources_status` | `JSONB` | `{ "search_console": "ok" \| "failed", "analytics": "...", "keywords": "...", "pagespeed": "...", "security": "..." }` — usado por US6/FR-020 y por los badges de estado de `DESIGN.md` §5.4 |
| `email_sent_at` | `TIMESTAMPTZ` | `NULL` hasta que se envía el informe de cliente (US5/FR-019) |
| `created_at` | `TIMESTAMPTZ DEFAULT NOW()` | |

**Validación / reglas de negocio**:
- Nunca se actualiza ni se borra un `monthly_record` existente; regenerar un mes ya registrado
  inserta una fila nueva (FR-009, Principio III).
- Toda columna numérica se escribe siempre con un valor (`0` si no hay actividad o si la fuente
  falló); ninguna columna numérica queda `NULL` por una fuente fallida — el fallo se refleja solo en
  `sources_status` (FR-008, FR-007).
- La variación porcentual vs. el mes anterior (FR-010) es un valor derivado en tiempo de lectura
  (se calcula comparando con el `monthly_record` anterior del mismo `site_id`), no se almacena como
  columna.

## keywords — Palabra clave

Palabra clave rastreada de un sitio en un periodo (spec: "Palabra clave" / "Oportunidad SEO").

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `site_id` | `INTEGER REFERENCES sites(id)` | |
| `period` | `DATE NOT NULL` | |
| `keyword` | `TEXT NOT NULL` | |
| `position` | `INTEGER` | Posición actual en el ranking |
| `search_volume` | `INTEGER` | Volumen de búsqueda (puede no estar disponible según la fuente) |
| `impressions` | `INTEGER` | |
| `is_opportunity` | `BOOLEAN GENERATED ALWAYS AS (position BETWEEN 4 AND 10) STORED` | Regla de FR-015: posición 4–10 inclusive, sin filtro de volumen (ver `spec.md` §Assumptions) |

**Validación / reglas de negocio**:
- `is_opportunity` es una columna generada por PostgreSQL, no lógica de aplicación duplicada —
  coherente con el Principio II (la lógica de negocio vive en un solo lugar, aquí expresada como
  regla declarativa sobre el dato).

## Entidades no persistidas como tabla propia

- **Informe de cliente** (spec: email enviado al cliente): no es una tabla separada — se modela
  como el par `monthly_records.email_sent_at` (fecha de envío) + el contenido del formulario, que
  no se persiste más allá de generar el email (FR-016 a FR-019).
- **Alerta** (spec: aviso automático al Admin): no se persiste — es un efecto (envío de email) del
  proceso de generación cuando `sources_status` marca un fallo o cuando una métrica pasa de valor
  no-cero a `0` respecto al `monthly_record` anterior del mismo sitio (FR-020, FR-021). Detectar "ya
  se avisó este mes" no requiere estado adicional: se compara el registro actual contra el
  inmediatamente anterior en cada generación.

## Diagrama de relaciones

```
sites (1) ───< (N) monthly_records
sites (1) ───< (N) keywords
```
