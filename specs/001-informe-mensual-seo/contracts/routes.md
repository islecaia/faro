# Phase 1 Contracts: Rutas HTTP

Faro es una aplicación web server-rendered (sin API pública separada); su "contrato" externo son
las rutas Express que exponen las vistas EJS y procesan los formularios. No hay cliente API
externo consumiendo JSON en el alcance actual, así que este documento describe cada endpoint en
términos de entrada/salida HTTP en lugar de un esquema OpenAPI.

## Sitios (US1)

| Método | Ruta | Entrada | Salida | Referencia |
|---|---|---|---|---|
| `GET` | `/sites` | — | Vista `sites/index.ejs`: listado de sitios activos | FR-002 |
| `GET` | `/sites/new` | — | Vista `sites/form.ejs`: formulario de alta | FR-001 |
| `POST` | `/sites` | form-urlencoded: `name, url, client_email, sc_property_id, ga_property_id, keywords_site_id, security_site_id` | Redirect 302 → `/sites` | FR-001 |
| `POST` | `/sites/:id/deactivate` | — (param `id`) | Redirect 302 → `/sites`; `status` del sitio pasa a `inactive`, fila conservada | FR-003 |

## Dashboard (US4)

| Método | Ruta | Entrada | Salida | Referencia |
|---|---|---|---|---|
| `GET` | `/` | query opcional `?site_id=` | Vista `dashboard.ejs`: KPIs del mes más reciente por sitio, tabla histórica (filtrada si hay `site_id`), sección de oportunidades SEO | FR-013, FR-014, FR-015 |

## Generación de informes (US2)

| Método | Ruta | Entrada | Salida | Referencia |
|---|---|---|---|---|
| `GET` | `/reports/generate/:site_id` | param `site_id` | Vista `reports/generate.ejs`: botón "GENERAR INFORME" | FR-004 |
| `POST` | `/reports/generate/:site_id` | param `site_id` | Ejecuta `collector.js` (5 fuentes, 3 reintentos c/u), inserta `monthly_records` + `keywords`, dispara `sheets.appendRow`/`createSheet`; redirect 302 → `/reports/:record_id` | FR-004 a FR-012 |
| `GET` | `/reports/:record_id` | param `record_id` | Vista `reports/detail.ejs`: detalle de un registro mensual, incluyendo `sources_status` | FR-006, FR-007 |

## Formulario de informe de cliente (US5)

| Método | Ruta | Entrada | Salida | Referencia |
|---|---|---|---|---|
| `GET` | `/email-form/:record_id` | param `record_id` | Vista `email-form/index.ejs` con campos precargados desde el `monthly_record` | FR-016 |
| `POST` | `/email-form/:record_id/send` | form-urlencoded: todos los campos de §"Formulario de informe para cliente" de `spec.md` (impresiones + variación, clics + variación, desglose de canales, tendencia de ranking + comentario, oportunidades 1-3, puntuación/calificación mobile y desktop, estado de seguridad, ataques, amenazas, notas) | Genera y envía el email vía `services/email.js`; actualiza `monthly_records.email_sent_at`; redirect 302 → `/reports/:record_id` con confirmación | FR-017, FR-018, FR-019 |

## Google Sheets (US3 — MVP)

| Método | Ruta | Entrada | Salida | Referencia |
|---|---|---|---|---|
| `GET` | `/sheets/:site_id/open` | param `site_id` | Redirect 302 a la URL pública de la hoja (`https://docs.google.com/spreadsheets/d/{sheets_id}`) para que el Admin la abra en una pestaña nueva | FR-011, FR-012 |

## Alertas automáticas (US6 — segunda ola)

No expone rutas propias: es un efecto lateral de `POST /reports/generate/:site_id` (envío de email
de alerta cuando `sources_status` marca un fallo, o cuando una métrica cae a `0` respecto al
registro anterior). Ver FR-020, FR-021 y `data-model.md` §"Entidades no persistidas".

## Convenciones comunes

- Todas las respuestas de éxito de un `POST` que muta estado usan `302 Found` + redirect (patrón
  Post/Redirect/Get), consistente con no tener JS de cliente para manejar respuestas JSON.
- No hay capa de autenticación (Constitución §Restricciones Tecnológicas, FR-022): ninguna ruta
  requiere sesión ni credenciales de usuario.
- Los errores de generación de un informe (fuente fallida) nunca devuelven un código de error
  HTTP al Admin — la petición `POST /reports/generate/:site_id` siempre completa con 302 hacia el
  detalle del registro, que muestra el estado por fuente (Principio IV).
