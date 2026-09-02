# Tasks — Faro MVP

**Repo**: https://github.com/islecaia/Faro.git
**Generado desde**: `plan.md` v1
**Fecha**: 2026-09-02

> Cada tarea está dimensionada para construirse y probarse en una sola sesión de trabajo.
> Las dependencias indican qué tareas deben estar completadas antes de empezar.

---

## FASE 0 — Scaffolding y base de datos

---

### T-001 · Inicializar repositorio y dependencias

**Fase**: 0 · **Estimación**: ½ sesión
**Depende de**: —

**Construir**:
- Crear repo `Faro` en GitHub con `.gitignore` para Node.js
- Clonar en local y ejecutar `npm init -y`
- Instalar dependencias: `express`, `ejs`, `pg`, `dotenv`, `nodemailer`, `googleapis`
- Crear `.env.example` con todas las variables del plan.md sección 4
- Crear estructura de carpetas: `src/`, `src/config/`, `src/routes/`, `src/services/`, `src/db/queries/`, `src/views/`, `public/`

**Probar**:
```bash
node -e "require('express'); require('pg'); require('googleapis'); console.log('deps OK')"
```

---

### T-002 · Servidor Express mínimo arrancando en local

**Fase**: 0 · **Estimación**: ½ sesión
**Depende de**: T-001

**Construir**:
- `src/config/env.js`: leer y validar variables de entorno; lanzar error descriptivo si falta alguna obligatoria
- `src/app.js`: Express con `GET /` que devuelve `200 OK` y el texto `Faro arrancando`
- `package.json scripts`: `"start": "node src/app.js"`, `"dev": "node --watch src/app.js"`

**Probar**:
```bash
npm run dev
curl http://localhost:3000   # → 200 OK
```

---

### T-003 · Despliegue en Railway + PostgreSQL add-on

**Fase**: 0 · **Estimación**: ½ sesión
**Depende de**: T-002

**Construir**:
- Crear proyecto `Faro` en Railway
- Añadir add-on PostgreSQL; copiar `DATABASE_URL` a las variables de entorno del servicio
- Crear `railway.toml` con `startCommand = "npm start"`
- Hacer push a `main` y verificar que Railway despliega sin errores

**Probar**:
```
GET https://faro.up.railway.app   → 200 OK
```

---

### T-004 · Esquema de base de datos

**Fase**: 0 · **Estimación**: ½ sesión
**Depende de**: T-003

**Construir**:
- `src/db/schema.sql`: las cuatro tablas del plan.md sección 3 (`sites`, `monthly_records`, `keywords`, `screenshots`)
- `src/config/db.js`: pool de conexión con `pg` usando `DATABASE_URL`
- Ejecutar `schema.sql` contra la base de datos de Railway:
  ```bash
  psql $DATABASE_URL -f src/db/schema.sql
  ```

**Probar**:
```bash
node -e "
const db = require('./src/config/db');
db.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\'')
  .then(r => { console.log(r.rows); process.exit(0); });
"
# → debe listar: sites, monthly_records, keywords, screenshots
```

---

### T-005 · Layout EJS base con el visual del DESIGN.md

**Fase**: 0 · **Estimación**: 1 sesión
**Depende de**: T-002

**Construir**:
- `public/style.css`: bloque `:root { ... }` completo de DESIGN.md sección 10 + estilos de layout (sidebar, cabecera, área de contenido) de sección 6.2
- `src/views/layout.ejs`: shell HTML con:
  - `<head>`: Google Fonts (Bebas Neue, Inter, JetBrains Mono) + Phosphor Icons CDN + `style.css`
  - Sidebar (200px, `--bg-panel`, barra arcoíris 3px izquierda) con enlaces de navegación
  - Cabecera (52px, `--bg-panel`, borde inferior)
  - Área de contenido con `<%- body %>`
- Configurar Express para servir `public/` y usar EJS con `express-ejs-layouts` o inclusión manual de layout

**Probar**:
```
GET http://localhost:3000   → página con sidebar y cabecera con los colores del DESIGN.md
```

---

## FASE 1 — Gestión de sitios

---

### T-006 · Queries SQL de sitios

**Fase**: 1 · **Estimación**: ½ sesión
**Depende de**: T-004

**Construir**:
- `src/db/queries/sites.js` con las funciones:
  - `getAllSites()` → todos los sitios ordenados por nombre
  - `getActiveSites()` → solo `status = 'active'`
  - `getSiteById(id)` → un sitio por id
  - `createSite({ name, url, clientEmail, scPropertyId, gaPropertyId, keywordsSiteId, securitySiteId })` → inserta y devuelve el sitio creado
  - `deactivateSite(id)` → actualiza `status = 'inactive'`

**Probar**:
```bash
node -e "
const q = require('./src/db/queries/sites');
q.createSite({ name: 'Test', url: 'https://test.com', clientEmail: 'a@b.com' })
  .then(s => q.getAllSites())
  .then(console.log)
  .then(() => process.exit(0));
"
```

---

### T-007 · Vista lista de sitios (GET /sites)

**Fase**: 1 · **Estimación**: ½ sesión
**Depende de**: T-005, T-006

**Construir**:
- `src/routes/sites.js`: `GET /sites` → obtiene `getAllSites()` y renderiza `sites/index.ejs`
- `src/views/sites/index.ejs`: tabla de sitios con columnas Nombre, URL, Estado, acciones (Editar / Dar de baja)
- Aplicar estilos de tabla del DESIGN.md sección 5.3; badges de estado ACTIVO / INACTIVO del 5.4
- Estado vacío si no hay sitios: "Aún no tienes sitios dados de alta. Añade el primero."

**Probar**:
```
GET http://localhost:3000/sites   → tabla con el sitio de prueba de T-006
```

---

### T-008 · Formulario de alta de sitio (GET /sites/new + POST /sites)

**Fase**: 1 · **Estimación**: 1 sesión
**Depende de**: T-007

**Construir**:
- `GET /sites/new` → renderiza `sites/form.ejs`
- `src/views/sites/form.ejs`: campos nombre, URL, email del cliente, IDs de las 5 fuentes (Search Console, GA, Keywords, Security Ninja); botón primario "AÑADIR SITIO"
- `POST /sites` → llama `createSite()` y redirige a `/sites` con mensaje de confirmación
- Validación básica del servidor: nombre, URL y email son obligatorios; mostrar error inline si faltan
- Aplicar estilos de campos del DESIGN.md sección 5.7 y botón primario 5.1

**Probar**:
```
1. GET /sites/new   → formulario visible con estilos correctos
2. POST /sites con datos completos   → redirige a /sites, sitio aparece en la tabla
3. POST /sites sin nombre   → vuelve al formulario con mensaje de error
```

---

### T-009 · Dar de baja un sitio (POST /sites/:id/deactivate)

**Fase**: 1 · **Estimación**: ½ sesión
**Depende de**: T-007

**Construir**:
- `POST /sites/:id/deactivate` → llama `deactivateSite(id)` y redirige a `/sites`
- En `sites/index.ejs`: botón destructivo "DAR DE BAJA" que hace POST a esta ruta (con `<form method="post">`)
- El sitio dado de baja sigue apareciendo en la tabla con badge INACTIVO (no se elimina)

**Probar**:
```
1. Dar de baja el sitio de prueba
2. GET /sites   → sitio aparece con badge INACTIVO
3. Verificar en BD que status = 'inactive' y el registro existe
```

---

## FASE 2 — Dashboard

---

### T-010 · Dashboard con KPI cards (GET /)

**Fase**: 2 · **Estimación**: 1 sesión
**Depende de**: T-005, T-006

**Construir**:
- `src/routes/index.js`: `GET /` → obtiene sitios activos y registros del mes actual; renderiza `dashboard.ejs`
- `src/views/dashboard.ejs`: 4 KPI cards (Impresiones, Clics, Visitas, PageSpeed Mobile) usando la estructura del DESIGN.md sección 5.2
- Si no hay registros: estado vacío en cada card ("Sin datos. Genera el primer informe.")
- Selector de sitio en la cabecera del dashboard (`<form method="get">` con `?site_id=`)

**Probar**:
```
GET http://localhost:3000   → dashboard con 4 cards vacías y selector de sitio
GET /?site_id=1             → cards filtradas por el sitio 1
```

---

### T-011 · Tabla de registros históricos en el dashboard

**Fase**: 2 · **Estimación**: 1 sesión
**Depende de**: T-010

**Construir**:
- `src/db/queries/records.js`: `getRecordsBySite(siteId)` → registros ordenados por `period DESC`
- En `dashboard.ejs`: tabla de registros con columnas Fecha, Impresiones, Clics, Visitas, % Directo, % Orgánico, PageSpeed M/D, Ataques, Estado de fuentes
- Celdas con valor `0`: atributo `data-value="0"` para aplicar `--text-zero` vía CSS
- Filas con fuente fallida: `border-left: 3px solid var(--status-error)` (DESIGN.md sección 5.3)
- Estado vacío si no hay registros para el sitio seleccionado

**Probar**:
```bash
# Insertar fila de prueba a mano en la BD
psql $DATABASE_URL -c "INSERT INTO monthly_records (site_id, period, impressions, clicks) VALUES (1, '2026-08-01', 620, 11)"
# GET /?site_id=1 → fila aparece en la tabla con los valores correctos
```

---

### T-012 · Aplicar estilos completos del DESIGN.md al dashboard

**Fase**: 2 · **Estimación**: 1 sesión
**Depende de**: T-011

**Construir**:
- Completar `public/style.css` con todos los componentes de DESIGN.md sección 5: botones (5.1), KPI cards (5.2), tabla (5.3), badges (5.4), alertas inline (5.5), barra de progreso (5.6), campos de entrada (5.7)
- Aplicar animaciones y micro-interacciones de sección 8 (hover de cards, transición de badges)
- Revisar accesibilidad: contraste 4.5:1, estados `:focus-visible` con anillo rosa (sección 9)
- Verificar en móvil / pantalla compacta: grid de 2 columnas para KPI cards

**Probar**:
```
Revisión visual contra el DESIGN.md:
- Sidebar con barra arcoíris
- KPI cards con variación porcentual (▲/▼)
- Tabla con ceros visibles pero apagados
- Badges de estado con colores semánticos correctos
```

---

## FASE 3 — Servicio PageSpeed

---

### T-013 · Servicio pagespeed.js

**Fase**: 3 · **Estimación**: ½ sesión
**Depende de**: T-001

**Construir**:
- `src/services/pagespeed.js`: función `getScores(url)` que hace `fetch` a:
  `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile`
  y luego la misma para `strategy=desktop`
- Devuelve `{ mobile: 72, desktop: 91 }` (puntuación 0-100)
- Si la API devuelve error, lanza excepción con mensaje descriptivo

**Probar**:
```bash
node -e "
require('./src/services/pagespeed').getScores('https://elgriego.net')
  .then(console.log).catch(console.error)
"
# → { mobile: XX, desktop: XX }
```

---

### T-014 · collector.js — estructura base con reintentos

**Fase**: 3 · **Estimación**: 1 sesión
**Depende de**: T-013

**Construir**:
- `src/services/collector.js`: función `withRetry(fn, maxAttempts = 3)` que reintenta una función async hasta 3 veces antes de lanzar el error
- Función `collect(site)` que llama `withRetry(() => pagespeed.getScores(site.url))` y devuelve `{ pagespeed: { mobile, desktop }, errors: {} }`
- Si falla tras 3 intentos: añade `errors.pagespeed = 'mensaje de error'` en lugar de lanzar excepción

**Probar**:
```bash
node -e "
const collector = require('./src/services/collector');
collector.collect({ url: 'https://elgriego.net' }).then(console.log)
"
# → { pagespeed: { mobile: XX, desktop: XX }, errors: {} }
```

---

## FASE 4 — Servicio Search Console

---

### T-015 · Configurar autenticación Google (cuenta de servicio)

**Fase**: 4 · **Estimación**: ½ sesión
**Depende de**: T-001

**Construir**:
- En Google Cloud Console: crear cuenta de servicio, descargar JSON de credenciales
- Añadir `GOOGLE_SERVICE_ACCOUNT_JSON` al `.env` local y a Railway
- `src/config/google-auth.js`: función `getAuthClient()` que devuelve un `GoogleAuth` autenticado con el JSON de la variable de entorno
- Dar acceso a la cuenta de servicio en Search Console del sitio de prueba

**Probar**:
```bash
node -e "
require('./src/config/google-auth').getAuthClient()
  .then(auth => auth.getAccessToken())
  .then(t => console.log('token OK:', t.token.slice(0,20) + '...'))
"
```

---

### T-016 · Servicio search-console.js

**Fase**: 4 · **Estimación**: 1 sesión
**Depende de**: T-015

**Construir**:
- `src/services/search-console.js`: función `getData(siteUrl, period)` donde `period` es un objeto `{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }`
- Usa `googleapis` con el auth de T-015 para llamar a la Search Console API (`searchanalytics.query`)
- Devuelve `{ impressions: 620, clicks: 11 }`
- Si el sitio no está configurado en Search Console: lanza error descriptivo "Propiedad no encontrada en Search Console"

**Probar**:
```bash
node -e "
require('./src/services/search-console')
  .getData('https://elgriego.net', { start: '2026-08-01', end: '2026-08-31' })
  .then(console.log).catch(console.error)
"
```

---

### T-017 · Integrar Search Console en collector.js

**Fase**: 4 · **Estimación**: ½ sesión
**Depende de**: T-014, T-016

**Construir**:
- En `collector.js`: añadir `withRetry(() => searchConsole.getData(site.url, period))` a la función `collect()`
- El resultado se añade a `{ pagespeed, searchConsole: { impressions, clicks }, errors }`

**Probar**:
```bash
node -e "
const collector = require('./src/services/collector');
collector.collect({ url: 'https://elgriego.net' }, { start: '2026-08-01', end: '2026-08-31' })
  .then(console.log)
"
# → pagespeed + searchConsole en el resultado
```

---

## FASE 5 — Servicio Analytics / Site Kit

---

### T-018 · Servicio analytics.js (GA4 Data API)

**Fase**: 5 · **Estimación**: 1 sesión
**Depende de**: T-015

**Construir**:
- `src/services/analytics.js`: función `getData(propertyId, period)`
- Usa GA4 Data API (`analyticsdata.googleapis.com`) vía `googleapis` con el mismo auth
- Pide métricas: `sessions` y dimensión `sessionDefaultChannelGroup`
- Devuelve `{ visits: 1200, pct_direct: 35.2, pct_organic: 48.1, pct_social: 8.4, pct_referral: 5.1, pct_other: 3.2 }`
- Los porcentajes suman 100%; si algún canal no existe devuelve `0`

**Probar**:
```bash
node -e "
require('./src/services/analytics')
  .getData('properties/XXXXXXX', { start: '2026-08-01', end: '2026-08-31' })
  .then(console.log).catch(console.error)
"
```

---

### T-019 · Integrar Analytics en collector.js

**Fase**: 5 · **Estimación**: ½ sesión
**Depende de**: T-017, T-018

**Construir**:
- En `collector.js`: añadir `withRetry(() => analytics.getData(site.gaPropertyId, period))`
- El resultado se añade a `{ pagespeed, searchConsole, analytics: { visits, pct_direct, ... }, errors }`

**Probar**:
```bash
node -e "
require('./src/services/collector')
  .collect({ url: 'https://elgriego.net', gaPropertyId: 'properties/XXX' }, period)
  .then(console.log)
"
```

---

## FASE 6 — Servicio Keywords (Squirrly / Ubersuggest)

---

### T-020 · Servicio keywords.js

**Fase**: 6 · **Estimación**: 1 sesión
**Depende de**: T-001

**Construir**:
- `src/services/keywords.js`: función `getData(siteId, period)` que llama a la API configurada en `KEYWORDS_API_URL` con `KEYWORDS_API_KEY`
- Devuelve array: `[{ keyword: 'seo local', position: 7, searchVolume: 320, impressions: 45 }, ...]`
- Normaliza la respuesta de la API al formato interno (independiente del proveedor concreto)

**Probar**:
```bash
node -e "
require('./src/services/keywords')
  .getData('site-id-123', { start: '2026-08-01', end: '2026-08-31' })
  .then(r => console.log(r.slice(0,3))).catch(console.error)
"
```

---

### T-021 · Queries SQL de keywords

**Fase**: 6 · **Estimación**: ½ sesión
**Depende de**: T-004

**Construir**:
- `src/db/queries/keywords.js`:
  - `saveKeywords(siteId, period, keywords)` → inserta el array de palabras clave (upsert por site_id + period + keyword)
  - `getOpportunities(siteId, period)` → devuelve filas donde `is_opportunity = true`, ordenadas por `search_volume DESC`
  - `getKeywordsBySite(siteId, period)` → todas las keywords del mes

**Probar**:
```bash
node -e "
const q = require('./src/db/queries/keywords');
q.saveKeywords(1, '2026-08-01', [{ keyword: 'seo', position: 8, searchVolume: 500, impressions: 120 }])
  .then(() => q.getOpportunities(1, '2026-08-01'))
  .then(console.log)
"
# → [{ keyword: 'seo', position: 8, search_volume: 500, ... }]
```

---

### T-022 · Integrar Keywords en collector.js

**Fase**: 6 · **Estimación**: ½ sesión
**Depende de**: T-019, T-020, T-021

**Construir**:
- En `collector.js`: añadir `withRetry(() => keywords.getData(site.keywordsSiteId, period))`
- El resultado keywords se guarda en la BD vía `saveKeywords()` durante la recogida
- Se añade `keywords: { count, topOpportunities: 3 }` al resumen del collector

**Probar**:
```bash
node -e "
require('./src/services/collector').collect(site, period).then(r => console.log(r.keywords))
"
# → { count: 87, topOpportunities: 3 }
```

---

## FASE 7 — Servicio Security Ninja

---

### T-023 · Servicio security.js

**Fase**: 7 · **Estimación**: ½ sesión
**Depende de**: T-001

**Construir**:
- `src/services/security.js`: función `getData(siteId, period)` que llama a la API de Security Ninja con `SECURITY_NINJA_API_KEY`
- Devuelve `{ attacksBlocked: 246, threatsCount: 3 }`

**Probar**:
```bash
node -e "
require('./src/services/security').getData('site-id', period)
  .then(console.log).catch(console.error)
"
```

---

### T-024 · Integrar Security en collector.js

**Fase**: 7 · **Estimación**: ½ sesión
**Depende de**: T-022, T-023

**Construir**:
- En `collector.js`: añadir `withRetry(() => security.getData(site.securitySiteId, period))`
- Collector queda completo con las 5 fuentes: `{ pagespeed, searchConsole, analytics, keywords, security, errors }`

**Probar**:
```bash
node -e "
require('./src/services/collector').collect(site, period).then(r => {
  console.log('Fuentes OK:', Object.keys(r).filter(k => k !== 'errors'));
  console.log('Errores:', r.errors);
})
"
```

---

## FASE 8 — Generación del registro mensual

---

### T-025 · Queries SQL de registros mensuales

**Fase**: 8 · **Estimación**: ½ sesión
**Depende de**: T-004

**Construir**:
- `src/db/queries/records.js`:
  - `createRecord(siteId, period, data)` → inserta fila en `monthly_records`; nunca hace UPDATE (siempre INSERT)
  - `getLastRecord(siteId)` → el registro más reciente anterior al periodo actual (para calcular variación)
  - `getRecordsBySite(siteId)` → todos los registros ordenados por `period DESC`
  - `markEmailSent(recordId)` → actualiza `email_sent_at = NOW()`

**Probar**:
```bash
node -e "
const q = require('./src/db/queries/records');
q.createRecord(1, '2026-08-01', { impressions: 620, clicks: 11 })
  .then(() => q.getRecordsBySite(1))
  .then(console.log)
"
```

---

### T-026 · Notificaciones por email (fallos de fuente y métrica a cero)

**Fase**: 8 · **Estimación**: 1 sesión
**Depende de**: T-025

**Construir**:
- `src/services/email.js`: función `sendAlert({ to, subject, text })` vía Nodemailer + SMTP
- En `collector.js`:
  - Si una fuente falla tras 3 reintentos: llamar `sendAlert` con el sitio y la fuente afectada
  - Al guardar el registro: comparar cada métrica con `getLastRecord()`; si una métrica era > 0 el mes anterior y ahora es 0, llamar `sendAlert` (solo si es la primera vez consecutiva)

**Probar**:
```bash
# Simular fallo de fuente
node -e "
require('./src/services/email').sendAlert({
  to: 'test@elgriego.net',
  subject: '[Faro] Fuente fallida: Search Console — elgriego.net',
  text: 'No se pudo obtener datos después de 3 intentos.'
}).then(() => console.log('email enviado'))
"
```

---

### T-027 · Ruta de generación + vista con progreso (POST /reports/generate/:site_id)

**Fase**: 8 · **Estimación**: 1 sesión
**Depende de**: T-024, T-025, T-026

**Construir**:
- `src/routes/reports.js`: `POST /reports/generate/:site_id`
  1. Obtiene el sitio por id
  2. Calcula el periodo (mes anterior)
  3. Llama `collector.collect(site, period)`
  4. Llama `createRecord(siteId, period, data)`
  5. Redirige a `GET /reports/:recordId` con mensaje de resultado
- `src/views/reports/generate.ejs`: botón "GENERAR INFORME" (primario), lista de las 5 fuentes con badge PENDIENTE inicial
- `src/views/reports/detail.ejs`: vista del registro generado con todos los valores y badges de estado por fuente (CONECTADO / FALLIDO)

**Probar**:
```
1. POST /reports/generate/1 → redirige a /reports/:id
2. GET /reports/:id → muestra los valores reales recogidos y el estado de cada fuente
3. Verificar en BD que la fila existe en monthly_records
```

---

### T-028 · Botón "GENERAR INFORME" accesible desde el dashboard

**Fase**: 8 · **Estimación**: ½ sesión
**Depende de**: T-027

**Construir**:
- En `sites/index.ejs`: añadir botón "GENERAR INFORME" por cada sitio activo (form POST a `/reports/generate/:id`)
- En `dashboard.ejs`: enlace "Ver detalle" en cada fila de la tabla histórica → `GET /reports/:recordId`
- En `detail.ejs`: enlace "Ir al formulario de informe" → `GET /email-form/:recordId`

**Probar**:
```
Flujo completo desde la UI:
/sites → pulsar GENERAR INFORME → /reports/:id con datos reales
```

---

## FASE 9 — Google Sheets

---

### T-029 · Servicio sheets.js — crear hoja nueva

**Fase**: 9 · **Estimación**: 1 sesión
**Depende de**: T-015

**Construir**:
- `src/services/sheets.js`: función `createSheet(siteName)`:
  - Crea un nuevo Google Spreadsheet en Google Drive con la cuenta de servicio
  - Añade una fila de cabecera: `Fecha | Impresiones | Clics | Visitas | % Directo | % Orgánico | % Social | % Referral | % Otro | PageSpeed Mobile | PageSpeed Desktop | Ataques | Amenazas`
  - Devuelve el `spreadsheetId`
- Actualizar `src/db/queries/sites.js`: `updateSheetsId(siteId, sheetsId)`

**Probar**:
```bash
node -e "
require('./src/services/sheets').createSheet('elgriego.net — Test')
  .then(id => console.log('Sheet creada:', id))
"
# → abrir la hoja en Google Sheets y verificar cabecera
```

---

### T-030 · Servicio sheets.js — escribir fila de registro

**Fase**: 9 · **Estimación**: ½ sesión
**Depende de**: T-029

**Construir**:
- En `sheets.js`: función `appendRow(sheetsId, record)`:
  - Añade una fila con los valores del registro mensual
  - Los valores `null` o `undefined` se escriben como `0` explícito
  - Formato de fecha: `ago 2026` (mes en español + año)

**Probar**:
```bash
node -e "
const s = require('./src/services/sheets');
s.appendRow('SHEETS_ID', {
  period: new Date('2026-08-01'),
  impressions: 620, clicks: 11, visits: 1200,
  pct_direct: 35, pct_organic: 48, pct_social: 8,
  pct_referral: 5, pct_other: 4,
  score_mobile: 72, score_desktop: 91,
  attacks_blocked: 246, threats_count: 3
}).then(() => console.log('fila añadida'))
"
# → verificar fila en Google Sheets
```

---

### T-031 · Integrar Sheets en la generación del registro

**Fase**: 9 · **Estimación**: ½ sesión
**Depende de**: T-027, T-030

**Construir**:
- En `POST /reports/generate/:site_id`:
  - Si el sitio no tiene `sheets_id`: llamar `createSheet(site.name)` y guardar con `updateSheetsId()`
  - Tras `createRecord()`: llamar `appendRow(site.sheetsId, record)`
  - Si Sheets falla: loguear el error pero no bloquear la generación del informe

**Probar**:
```
1. Generar informe para un sitio sin sheets_id
   → se crea la hoja automáticamente y aparece la fila
2. Generar informe para el mismo sitio un segundo mes
   → se añade segunda fila a la misma hoja
```

---

## FASE 10 — Formulario de informe para cliente

---

### T-032 · Vista del formulario con precarga (GET /email-form/:record_id)

**Fase**: 10 · **Estimación**: 1 sesión
**Depende de**: T-025

**Construir**:
- `src/routes/email-form.js`: `GET /email-form/:record_id` → obtiene el registro y el sitio; renderiza `email-form/index.ejs`
- `src/views/email-form/index.ejs`: formulario con todos los campos del spec sección "Formulario de informe para cliente":
  - Impresiones + variación %, Clics + variación %
  - 5 campos de canales de tráfico
  - Selector de tendencia de ranking (3 opciones)
  - Campo de texto libre para comentario del ranking
  - Oportunidades 1, 2, 3 (texto libre, precargadas con las top 3 de `getOpportunities()`)
  - Puntuación + selector de calificación Mobile y Desktop
  - Estado general, ataques bloqueados, amenazas, notas para el cliente
- Email del cliente y nombre del sitio en la cabecera (solo lectura, no editables)
- Aplicar estilos de campos (DESIGN.md 5.7) y selectores

**Probar**:
```
GET /email-form/1 → formulario con campos precargados con los datos del registro
```

---

### T-033 · Plantilla de email HTML con las 5 secciones

**Fase**: 10 · **Estimación**: 1 sesión
**Depende de**: T-001

**Construir**:
- `src/services/email.js`: función `buildReportEmail(data)` que devuelve un string HTML con las 5 secciones del spec:
  - **#1 FUENTES DE TRÁFICO**: desglose porcentual de canales
  - **#2 SEGURIDAD Y ESTADO GENERAL**: estado, ataques, amenazas, notas
  - **#3 TRÁFICO Y VISITAS**: impresiones + % variación, clics + % variación
  - **#4 FUENTES DE TRÁFICO** (detalle narrativo): canales con contexto explicativo
  - **#5 POSICIONAMIENTO GOOGLE - SEO**: tendencia, comentario, oportunidades, rendimiento Mobile/Desktop
- Email con estilos inline (compatibilidad máxima con clientes de email)

**Probar**:
```bash
node -e "
const { buildReportEmail } = require('./src/services/email');
const html = buildReportEmail({ impressions: 620, clicks: 11, pct_direct: 35, ... });
require('fs').writeFileSync('/tmp/preview.html', html);
console.log('Abrir /tmp/preview.html en el navegador');
"
```

---

### T-034 · Envío del email (POST /email-form/:record_id/send)

**Fase**: 10 · **Estimación**: 1 sesión
**Depende de**: T-032, T-033

**Construir**:
- `POST /email-form/:record_id/send`:
  1. Lee los valores del formulario (pueden diferir de los precargados si el usuario los editó)
  2. Llama `buildReportEmail(formData)`
  3. Envía con Nodemailer al email del cliente del sitio
  4. Llama `markEmailSent(recordId)`
  5. Redirige a `/email-form/:record_id` con mensaje de confirmación: "Informe enviado a cliente@ejemplo.com"
- Si el envío falla: mostrar alerta inline con el error (DESIGN.md sección 5.5), sin perder los datos del formulario

**Probar**:
```
1. Rellenar el formulario (modificar algún valor precargado)
2. Pulsar ENVIAR INFORME
3. Verificar que llega el email al cliente con las 5 secciones correctas
4. Verificar en BD que email_sent_at tiene fecha
5. Verificar mensaje de confirmación en la UI
```

---

## FASE 11 — Oportunidades SEO en el dashboard

---

### T-035 · Sección de oportunidades SEO en el dashboard

**Fase**: 11 · **Estimación**: ½ sesión
**Depende de**: T-011, T-021

**Construir**:
- En `src/routes/index.js`: añadir `getOpportunities(siteId, currentPeriod)` a los datos del dashboard
- En `dashboard.ejs`: sección "OPORTUNIDADES SEO" bajo la tabla histórica:
  - Lista de palabras clave con `is_opportunity = true`: keyword, posición actual, volumen de búsqueda
  - Badge "OPORTUNIDAD" en ámbar (`--brand-accent`) por cada una
  - Ordenadas por `search_volume DESC`
  - Estado vacío si no hay: "Todas las palabras clave rastreadas están en el top 3."

**Probar**:
```
GET /?site_id=1 → sección OPORTUNIDADES SEO con las palabras clave guardadas en T-021
```

---

## FASE 12 — Capturas de pantalla *(P3 — solo si hay tiempo)*

---

### T-036 · Captura de pantalla por fuente con Puppeteer

**Fase**: 12 · **Estimación**: 1 sesión
**Depende de**: T-027

**Construir**:
- Instalar `puppeteer-core` + `@sparticuz/chromium` (compatible con Railway)
- `src/services/screenshot.js`: función `capture(url, filename)` → abre la URL con Puppeteer, captura screenshot, guarda en Railway Volume o directorio local
- En `collector.js`: tras recoger datos de cada fuente, intentar `capture()` de la URL del panel de esa fuente; si falla, continuar sin bloquear
- `src/db/queries/screenshots.js`: `saveScreenshot(recordId, source, filePath)`

**Probar**:
```bash
node -e "
require('./src/services/screenshot').capture('https://elgriego.net', 'test.png')
  .then(path => console.log('Captura en:', path))
"
```

---

### T-037 · Mostrar capturas en el detalle del registro

**Fase**: 12 · **Estimación**: ½ sesión
**Depende de**: T-036

**Construir**:
- En `src/db/queries/screenshots.js`: `getScreenshotsByRecord(recordId)` → todas las capturas del registro
- En `reports/detail.ejs`: sección "EVIDENCIA VISUAL" con enlace o miniatura (`<img>`) de cada captura, etiquetada por fuente

**Probar**:
```
GET /reports/:id → sección EVIDENCIA VISUAL con las capturas asociadas al registro
```

---

## Resumen de tareas por fase

```
FASE 0  T-001 T-002 T-003 T-004 T-005          (5 tareas — ~3 sesiones)
FASE 1  T-006 T-007 T-008 T-009                (4 tareas — ~2.5 sesiones)
FASE 2  T-010 T-011 T-012                      (3 tareas — ~3 sesiones)
FASE 3  T-013 T-014                            (2 tareas — ~1.5 sesiones)
FASE 4  T-015 T-016 T-017                      (3 tareas — ~2 sesiones)
FASE 5  T-018 T-019                            (2 tareas — ~1.5 sesiones)
FASE 6  T-020 T-021 T-022                      (3 tareas — ~2 sesiones)
FASE 7  T-023 T-024                            (2 tareas — ~1 sesión)
FASE 8  T-025 T-026 T-027 T-028               (4 tareas — ~3.5 sesiones)
FASE 9  T-029 T-030 T-031                      (3 tareas — ~2 sesiones)
FASE 10 T-032 T-033 T-034                      (3 tareas — ~3 sesiones)
FASE 11 T-035                                  (1 tarea  — ½ sesión)
FASE 12 T-036 T-037                            (2 tareas — ~1.5 sesiones — P3)
─────────────────────────────────────────────────────────────────────────
TOTAL   37 tareas                              (~26 sesiones para T-001–T-035)
```
