# Plan de construcción — Faro MVP

**Rama**: `002-informe-web-railway`
**Repo**: https://github.com/islecaia/Faro.git
**URL producción**: https://faro-isleca.up.railway.app
**Fecha**: 2026-09-02
**Fuentes**: `spec.md` v2 + `DESIGN.md` v1.0

---

## 1. Stack tecnológico

Criterio rector: **lo más sencillo que resuelva el problema**. Sin frameworks de frontend, sin ORM complejo, sin build steps innecesarios.

| Capa | Tecnología | Motivo |
|---|---|---|
| Servidor | **Node.js 20 + Express 4** | Ya definido en spec |
| Vistas | **EJS** | Plantillas server-side sin bundler; Express lo soporta nativamente |
| Estilos | **CSS puro** (con los tokens de DESIGN.md) | El DESIGN.md ya da la guía completa; no hace falta Tailwind ni nada más |
| Scripts de UI | **Vanilla JS** | El dashboard es una tabla con filtro; no justifica un framework |
| Base de datos | **PostgreSQL** vía `pg` (node-postgres) | Ya definido; queries SQL directas, sin ORM |
| Email | **Nodemailer** + SMTP | Simple, sin dependencias de terceros de pago para el MVP |
| Google APIs | **`googleapis`** npm | Cubre Search Console, Sheets y puede usarse con Site Kit |
| PageSpeed | Fetch a la API pública de Google | No necesita autenticación; un `fetch` basta |
| Iconos | **Phosphor Icons** CDN | El DESIGN.md los especifica; un `<link>` en el `<head>` |
| Fuentes | **Google Fonts** CDN | Bebas Neue + Inter + JetBrains Mono |
| Despliegue | **Railway** | Ya definido; PostgreSQL incluido como add-on |

---

## 2. Estructura de carpetas

```
Faro/
├── src/
│   ├── app.js                  # Arranque de Express
│   ├── config/
│   │   ├── db.js               # Pool de conexión PostgreSQL
│   │   └── env.js              # Variables de entorno validadas
│   ├── routes/
│   │   ├── index.js            # GET / → dashboard
│   │   ├── sites.js            # CRUD de sitios web
│   │   ├── reports.js          # Generar + ver registros mensuales
│   │   ├── email-form.js       # Formulario de informe para cliente
│   │   └── sheets.js           # Exportar a Google Sheets
│   ├── services/
│   │   ├── pagespeed.js        # Google PageSpeed Insights API
│   │   ├── search-console.js   # Google Search Console API
│   │   ├── analytics.js        # Google Site Kit / GA4
│   │   ├── keywords.js         # Squirrly SEO / Ubersuggest API
│   │   ├── security.js         # Security Ninja API
│   │   ├── sheets.js           # Google Sheets (crear + escribir)
│   │   ├── email.js            # Nodemailer + plantilla de email
│   │   └── collector.js        # Orquestador: llama los 5 servicios con reintentos
│   ├── db/
│   │   ├── schema.sql          # Definición de tablas
│   │   └── queries/
│   │       ├── sites.js
│   │       ├── records.js
│   │       └── keywords.js
│   └── views/                  # Plantillas EJS
│       ├── layout.ejs          # Shell: sidebar + cabecera + tokens CSS
│       ├── dashboard.ejs       # Tabla de registros + KPI cards
│       ├── sites/
│       │   ├── index.ejs       # Lista de sitios activos
│       │   └── form.ejs        # Añadir / editar sitio
│       ├── reports/
│       │   ├── generate.ejs    # Lanzar generación de informe
│       │   └── detail.ejs      # Ver un registro mensual
│       └── email-form/
│           └── index.ejs       # Formulario de informe para cliente
├── public/
│   ├── style.css               # Tokens CSS de DESIGN.md + estilos globales
│   └── app.js                  # JS mínimo de cliente (filtro de tabla, etc.)
├── .env.example
├── package.json
├── railway.toml                # Config de Railway
└── plan.md                     # Este fichero
```

---

## 3. Esquema de base de datos

```sql
-- Sitios web gestionados
CREATE TABLE sites (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  client_email  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
  -- Credenciales de las 5 fuentes (almacenadas como JSON cifrado o env por sitio)
  sc_property_id      TEXT,   -- Search Console property
  ga_property_id      TEXT,   -- Google Analytics / Site Kit
  keywords_site_id    TEXT,   -- Squirrly / Ubersuggest site id
  security_site_id    TEXT,   -- Security Ninja site id
  sheets_id           TEXT,   -- ID de la hoja de Google Sheets (se rellena al crearla)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Registros mensuales por sitio
CREATE TABLE monthly_records (
  id              SERIAL PRIMARY KEY,
  site_id         INTEGER REFERENCES sites(id),
  period          DATE NOT NULL,           -- Fecha de corte (primer día del mes o último)
  -- Tráfico
  impressions     INTEGER,
  clicks          INTEGER,
  visits          INTEGER,
  -- Canales (%)
  pct_direct      NUMERIC(5,2),
  pct_organic     NUMERIC(5,2),
  pct_social      NUMERIC(5,2),
  pct_referral    NUMERIC(5,2),
  pct_other       NUMERIC(5,2),
  -- Rendimiento PageSpeed
  score_mobile    INTEGER,
  score_desktop   INTEGER,
  -- Seguridad
  attacks_blocked INTEGER,
  threats_count   INTEGER,
  -- Estado de la generación
  sources_status  JSONB,   -- { "search_console": "ok", "pagespeed": "failed", ... }
  email_sent_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Palabras clave por sitio y mes
CREATE TABLE keywords (
  id              SERIAL PRIMARY KEY,
  site_id         INTEGER REFERENCES sites(id),
  period          DATE NOT NULL,
  keyword         TEXT NOT NULL,
  position        INTEGER,
  search_volume   INTEGER,
  impressions     INTEGER,
  is_opportunity  BOOLEAN GENERATED ALWAYS AS (
    search_volume >= 50 AND position > 3
  ) STORED
);

-- Capturas de pantalla asociadas a un registro mensual
CREATE TABLE screenshots (
  id              SERIAL PRIMARY KEY,
  record_id       INTEGER REFERENCES monthly_records(id),
  source          TEXT NOT NULL,   -- 'keywords' | 'pagespeed' | etc.
  file_path       TEXT NOT NULL,   -- ruta en Railway Volume o URL
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Variables de entorno requeridas

```env
# Base de datos
DATABASE_URL=postgresql://...

# Google APIs (cuenta de servicio o OAuth)
GOOGLE_SERVICE_ACCOUNT_JSON='{...}'   # JSON de cuenta de servicio

# PageSpeed (clave pública opcional, aumenta el cuota)
PAGESPEED_API_KEY=...

# Squirrly / Ubersuggest
KEYWORDS_API_KEY=...
KEYWORDS_API_URL=...

# Security Ninja
SECURITY_NINJA_API_KEY=...

# Email (SMTP)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=reporting@elgriego.net

# App
PORT=3000
NODE_ENV=production
SESSION_SECRET=...
```

---

## 5. Fases de construcción

El orden respeta las prioridades del spec (P1 antes que P2/P3) y asegura que cada fase deja algo que funciona y se puede probar de forma independiente.

---

### FASE 0 — Scaffolding y base de datos (½ día)

**Objetivo**: proyecto arrancando en local y en Railway con la base de datos lista.

Tareas:
- [ ] Inicializar `package.json` con Express, EJS, `pg`, `dotenv`, `nodemailer`, `googleapis`
- [ ] Configurar `railway.toml` + add-on PostgreSQL en Railway
- [ ] Ejecutar `schema.sql` contra la base de datos
- [ ] Crear `src/config/db.js` (pool de conexión)
- [ ] Crear `src/app.js` con Express mínimo (un `GET /` que devuelve 200)
- [ ] Crear `public/style.css` con todos los tokens CSS de `DESIGN.md` (`:root { ... }`)
- [ ] Crear `src/views/layout.ejs` con sidebar, cabecera y carga de fuentes + Phosphor Icons

**Criterio de salida**: `railway up` despliega sin errores; la app responde en la URL de producción.

---

### FASE 1 — Gestión de sitios (½ día)

**Objetivo**: el usuario puede añadir, ver y dar de baja sitios web desde la interfaz.

Tareas:
- [ ] `GET /sites` → lista de sitios activos (`sites/index.ejs`)
- [ ] `GET /sites/new` + `POST /sites` → formulario de alta de sitio
- [ ] `POST /sites/:id/deactivate` → dar de baja (cambia `status` a `inactive`, conserva datos)
- [ ] Queries SQL: `getAllSites`, `createSite`, `deactivateSite`

**Criterio de salida**: se puede dar de alta un sitio con nombre, URL, email del cliente e IDs de las 5 fuentes, y aparece en la lista.

---

### FASE 2 — Dashboard básico (½ día)

**Objetivo**: tabla de registros mensuales con filtro por sitio y KPI cards. Puede estar vacía al principio.

Tareas:
- [ ] `GET /` → dashboard con KPI cards vacías + tabla vacía
- [ ] `dashboard.ejs`: KPI cards (impresiones, clics, visitas, rendimiento), tabla de registros, selector de sitio
- [ ] Aplicar estilos del `DESIGN.md`: tarjetas, tabla, badges de estado, tipografía
- [ ] Filtro de sitio por query string (`?site_id=1`) sin JS (un `<form>` con `method="get"`)
- [ ] Estado vacío ("Aún no hay registros. Genera el primer informe.")

**Criterio de salida**: el dashboard muestra la tabla (vacía o con datos de prueba insertados a mano) con el visual del `DESIGN.md`.

---

### FASE 3 — Recogida de datos: PageSpeed (½ día)

**Objetivo**: primer servicio de datos funcional; el más sencillo porque no necesita autenticación.

Tareas:
- [ ] `src/services/pagespeed.js`: `getScores(url)` → `{ mobile, desktop }` vía `fetch` a la API pública
- [ ] Test manual: `node -e "require('./src/services/pagespeed').getScores('https://example.com').then(console.log)"`
- [ ] Integrar en el orquestador `collector.js` con reintentos (máx. 3, `async-retry` o loop manual)

**Criterio de salida**: dado una URL, el servicio devuelve las puntuaciones mobile y desktop sin intervención manual.

---

### FASE 4 — Recogida de datos: Google Search Console (1 día)

**Objetivo**: obtener impresiones y clics del mes del sitio.

Tareas:
- [ ] Configurar `googleapis` con cuenta de servicio (JSON en variable de entorno)
- [ ] `src/services/search-console.js`: `getData(siteUrl, period)` → `{ impressions, clicks }`
- [ ] Manejar error de autenticación con mensaje descriptivo
- [ ] Integrar en `collector.js`

**Criterio de salida**: dado un `siteUrl` con acceso configurado, el servicio devuelve los datos del mes sin visitar Search Console.

---

### FASE 5 — Recogida de datos: Google Analytics / Site Kit (1 día)

**Objetivo**: obtener visitas y desglose de canales de tráfico.

Tareas:
- [ ] `src/services/analytics.js`: `getData(propertyId, period)` → `{ visits, pct_direct, pct_organic, pct_social, pct_referral, pct_other }`
- [ ] Usar GA4 Data API vía `googleapis` (misma cuenta de servicio)
- [ ] Integrar en `collector.js`

**Criterio de salida**: el servicio devuelve visitas y desglose de canales para el periodo dado.

---

### FASE 6 — Recogida de datos: Squirrly SEO / Ubersuggest (1 día)

**Objetivo**: obtener ranking de palabras clave (posición, volumen, impresiones).

Tareas:
- [ ] `src/services/keywords.js`: `getData(siteId, period)` → `[{ keyword, position, search_volume, impressions }]`
- [ ] Guardar cada palabra clave en la tabla `keywords`
- [ ] Calcular campo `is_opportunity` (automático vía columna generada en PostgreSQL)
- [ ] Integrar en `collector.js`

**Criterio de salida**: el servicio guarda las palabras clave del mes y las marcadas como oportunidad quedan identificadas en la base de datos.

---

### FASE 7 — Recogida de datos: Security Ninja (½ día)

**Objetivo**: obtener ataques bloqueados e incidencias del mes.

Tareas:
- [ ] `src/services/security.js`: `getData(siteId, period)` → `{ attacks_blocked, threats_count }`
- [ ] Integrar en `collector.js`

**Criterio de salida**: el servicio devuelve los datos de seguridad del mes para el sitio dado.

---

### FASE 8 — Generación del registro mensual (1 día)

**Objetivo**: un botón en la interfaz lanza la recogida de las 5 fuentes y guarda la fila en la base de datos. Integra todo lo anterior.

Tareas:
- [ ] `collector.js`: llama los 5 servicios en paralelo (`Promise.allSettled`), con reintentos individuales
- [ ] Si una fuente falla tras 3 reintentos: marca `sources_status[fuente] = 'failed'` y envía email de aviso
- [ ] Si una métrica pasa a 0 por primera vez (era > 0 el mes anterior): envía email de aviso
- [ ] `POST /reports/generate/:site_id` → ejecuta el collector, guarda `monthly_records` + `keywords`
- [ ] `reports/generate.ejs`: botón "GENERAR INFORME", barra de progreso por fuente, resultado
- [ ] Añade la fila al dashboard; si ya existe una fila de ese mes, añade otra (no sobrescribe)

**Criterio de salida**: pulsar "GENERAR INFORME" para un sitio configurado crea una fila en la base de datos con los datos de las fuentes disponibles, sin intervención manual.

---

### FASE 9 — Google Sheets (1 día)

**Objetivo**: la aplicación crea la hoja automáticamente y escribe una fila por cada registro generado.

Tareas:
- [ ] `src/services/sheets.js`:
  - `createSheet(siteName)` → crea una nueva hoja en Google Drive con las columnas definidas y devuelve el `sheets_id`
  - `appendRow(sheetsId, record)` → añade una fila con los datos del registro mensual
- [ ] Al generar el primer informe de un sitio, crear la hoja y guardar `sheets_id` en `sites`
- [ ] En cada generación posterior, hacer `appendRow`
- [ ] Columnas de la hoja: Fecha | Impresiones | Clics | Visitas | % Directo | % Orgánico | % Social | % Referral | % Otro | PageSpeed Mobile | PageSpeed Desktop | Ataques | Amenazas

**Criterio de salida**: al generar el informe, aparece una nueva fila en la hoja de Google Sheets del sitio, con los valores correctos (o `0` explícito si no hay actividad).

---

### FASE 10 — Formulario de informe para cliente (1 día)

**Objetivo**: formulario precargado con los datos del registro, que genera y envía el email al cliente.

Tareas:
- [ ] `GET /email-form/:record_id` → carga el formulario con datos del registro precargados
- [ ] `email-form/index.ejs`: todos los campos de la sección "Formulario de informe" del spec
  - Impresiones + variación, Clics + variación
  - Desglose de canales (5 campos)
  - Selector de tendencia de ranking
  - Oportunidades 1-3
  - Puntuación + calificación Mobile y Desktop
  - Seguridad: estado, ataques, amenazas, notas
- [ ] `src/services/email.js`:
  - Plantilla de email inline con las 5 secciones (#1 al #5) del spec
  - `sendReport(clientEmail, data)` vía Nodemailer
- [ ] `POST /email-form/:record_id/send` → aplica los datos a la plantilla y envía
- [ ] Al enviar correctamente: actualiza `email_sent_at` en `monthly_records`, muestra confirmación

**Criterio de salida**: rellenar el formulario y pulsar "ENVIAR INFORME" manda el email al cliente con los datos en las secciones correctas, y la interfaz confirma el envío.

---

### FASE 11 — Análisis de oportunidades SEO en la UI (½ día)

**Objetivo**: mostrar en el dashboard las palabras clave marcadas como oportunidad.

Tareas:
- [ ] En `dashboard.ejs`: sección "OPORTUNIDADES SEO" con la lista de palabras clave donde `is_opportunity = true`
- [ ] Mostrar: keyword, posición actual, volumen de búsqueda
- [ ] Badge "OPORTUNIDAD" con el color ámbar del `DESIGN.md`
- [ ] Si no hay oportunidades: estado vacío proactivo ("Todas las palabras clave rastreadas están en el top 3.")

**Criterio de salida**: el dashboard muestra las oportunidades SEO del mes con posición y volumen, sin revisión manual palabra por palabra.

---

### FASE 12 — Capturas de pantalla (½ día) *(P3 — solo si hay tiempo)*

**Objetivo**: guardar evidencia visual de las fuentes de datos al generar el informe.

Tareas:
- [ ] Instalar `puppeteer` (Chromium headless)
- [ ] En `collector.js`: tras recoger los datos de cada fuente, capturar screenshot de la URL de origen
- [ ] Guardar en Railway Volume + registrar en tabla `screenshots`
- [ ] Mostrar enlace a la captura en `reports/detail.ejs`

**Criterio de salida**: al ver un registro mensual, hay un enlace o miniatura de la captura de cada fuente.

---

## 6. Diseño visual — reglas de implementación

El `DESIGN.md` ya es la fuente de verdad. En el código, aplicar así:

- **`public/style.css`**: copiar íntegramente el bloque `:root { ... }` del `DESIGN.md` sección 10, más los estilos de cada componente de la sección 5.
- **`layout.ejs`**: cargar Bebas Neue, Inter y JetBrains Mono desde Google Fonts; Phosphor Icons desde CDN.
- **Sidebar**: 200px fijo, `background: var(--bg-panel)`, barra arcoíris izquierda de 3px.
- **KPI cards**: usar la estructura del apartado 5.2 del `DESIGN.md`.
- **Tabla de histórico**: usar los estilos del apartado 5.3; las celdas con `0` llevan `data-value="0"` y color `--text-zero`.
- **Badges de estado de fuentes**: los cuatro estados del apartado 5.4 (CONECTADO / FALLIDO / REINTENTANDO / PENDIENTE).
- **Alertas inline**: apartado 5.5; nunca modales para errores de fuente o métricas a cero.
- **Botones**: seguir exactamente los cuatro tipos del apartado 5.1 (primario, secundario, acento, destructivo).
- **Textos del sistema**: seguir las reglas del apartado 7 (verbos en infinitivo en botones, mensajes de error que explican qué pasó y qué sigue, estados vacíos proactivos).

---

## 7. Orden de prioridad resumido

```
FASE 0  Scaffolding + BD                   ← Sin esto nada arranca
FASE 1  Gestión de sitios                  ← P1: base de todo
FASE 2  Dashboard básico                   ← P1: interfaz mínima visible
FASE 3  PageSpeed                          ← P1: más fácil, sin auth
FASE 4  Search Console                     ← P1: impresiones + clics
FASE 5  Analytics / Site Kit               ← P1: visitas + canales
FASE 6  Keywords (Squirrly/Ubersuggest)    ← P1: ranking + oportunidades
FASE 7  Security Ninja                     ← P1: seguridad
FASE 8  Generación del registro mensual    ← P1: integra todo
FASE 9  Google Sheets                      ← P1: export automático
FASE 10 Formulario + email de informe      ← P1: entrega al cliente
FASE 11 Oportunidades SEO en la UI         ← P2: análisis en dashboard
FASE 12 Capturas de pantalla               ← P3: evidencia visual (si hay tiempo)
```

**Estimación total**: ~8 días de desarrollo para Fases 0–11 (MVP completo P1+P2). Fase 12 es opcional.

---

## 8. Criterios de MVP listo

El MVP está listo cuando:
- [ ] Se puede dar de alta un sitio con sus 5 fuentes configuradas
- [ ] Pulsando "GENERAR INFORME" se recogen los datos automáticamente y aparece una fila en el dashboard y en Google Sheets
- [ ] El formulario de informe se precarga con esos datos y el email llega al cliente al pulsar "ENVIAR"
- [ ] Las oportunidades SEO aparecen en el dashboard sin revisión manual
- [ ] Los fallos de fuente no bloquean el informe y se notifican por email
- [ ] La app está desplegada y funcional en https://faro-isleca.up.railway.app
