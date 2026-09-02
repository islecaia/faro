---

description: "Task list template for feature implementation"
---

# Tasks: Informe mensual SEO/rendimiento automatizado

**Input**: Design documents from `/specs/001-informe-mensual-seo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes.md, quickstart.md

**Tests**: No se generan tareas de test automatizado — `research.md` §7 documenta la decisión de
verificación manual por tarea para el MVP (sin framework de test); cada checkpoint de historia
referencia los pasos correspondientes de `quickstart.md`.

**Organization**: Las tareas están agrupadas por historia de usuario según la numeración de
`spec.md` (US1–US6), en su mismo orden de prioridad (US1–US5 = P1, US6 = P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1–US6)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único server-rendered, según `plan.md` → Project Structure: `src/`, `public/` en la raíz
del repositorio. Sin carpeta `tests/` (ver Tests arriba).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto Node.js y su estructura de carpetas.

- [X] T001 Crear la estructura de carpetas `src/config/`, `src/routes/`, `src/services/`, `src/db/queries/`, `src/views/`, `public/` según `plan.md` → Project Structure
- [X] T002 Inicializar `package.json` (`npm init -y`) e instalar `express`, `ejs`, `pg`, `dotenv`, `nodemailer`, `googleapis`; añadir scripts `"start": "node src/app.js"` y `"dev": "node --watch src/app.js"`
- [X] T003 [P] Crear `.env.example` en la raíz con `DATABASE_URL, GOOGLE_SERVICE_ACCOUNT_JSON, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL, KEYWORDS_API_URL, KEYWORDS_API_KEY, SECURITY_NINJA_API_KEY, PORT` (ver `plan.md` → Technical Context)
- [X] T004 [P] Crear `railway.toml` en la raíz con `startCommand = "npm start"` (ver Constitución → Despliegue y Operación)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura común que TODAS las historias de usuario necesitan.

**🚨 CRITICAL**: Ninguna historia de usuario puede empezar hasta que esta fase esté completa.

- [X] T005 Crear el esquema de base de datos en `src/db/schema.sql` con las tablas `sites`, `monthly_records` y `keywords` (columnas exactas en `data-model.md`) y aplicarlo contra la base de datos configurada en `DATABASE_URL`
- [X] T006 Implementar el pool de conexión PostgreSQL en `src/config/db.js` usando `pg` y `DATABASE_URL`
- [X] T007 Implementar la carga y validación de variables de entorno en `src/config/env.js`, lanzando un error descriptivo si falta alguna variable obligatoria de `.env.example`
- [X] T008 Arrancar Express en `src/app.js`: `view engine` = `ejs`, middleware `express.static('public')`, `express.urlencoded({ extended: true })`, y `app.listen(PORT)`
- [X] T009 [P] Crear `public/style.css` con el bloque completo de tokens `:root { ... }` de `DESIGN.md` §10 y los estilos base de botones, KPI cards, tabla histórica y badges de `DESIGN.md` §5
- [X] T010 [P] Crear `src/views/layout.ejs`: shell con sidebar fija de 200px (barra arcoíris de marca), cabecera de 52px, y carga de Google Fonts (Bebas Neue, Inter, JetBrains Mono) + Phosphor Icons por CDN, según `DESIGN.md` §6.2

**Checkpoint**: la app arranca (`npm run dev`), sirve `public/style.css` y puede renderizar una vista EJS con el layout base. A partir de aquí puede empezar cualquier historia de usuario.

---

## Phase 3: User Story 1 - Gestión de sitios clientes (Priority: P1) 🎯 MVP

**Goal**: el Admin puede dar de alta, listar y dar de baja sitios sin perder su histórico.

**Independent Test**: dar de alta un sitio, comprobar que aparece en el listado, darlo de baja y comprobar que desaparece del listado de activos pero su fila sigue existiendo en `sites` con `status = 'inactive'` (ver `quickstart.md` → Validar US1).

### Implementation for User Story 1

- [X] T011 [P] [US1] Implementar `getAllActiveSites()`, `createSite(data)` y `deactivateSite(id)` en `src/db/queries/sites.js`
- [X] T012 [US1] Implementar `GET /sites`, `GET /sites/new`, `POST /sites` y `POST /sites/:id/deactivate` en `src/routes/sites.js` (depende de T011)
- [X] T013 [P] [US1] Crear la vista `src/views/sites/index.ejs`: listado de sitios activos (nombre, URL, estado)
- [X] T014 [P] [US1] Crear la vista `src/views/sites/form.ejs`: formulario de alta con los campos de `sites` (nombre, URL, email cliente, 4 identificadores de fuente — PageSpeed no requiere identificador, ver `data-model.md`)
- [X] T015 [US1] Montar el router de sitios en `src/app.js` (`app.use('/sites', sitesRouter)`) (depende de T012)

**Checkpoint**: User Story 1 funciona de forma independiente y verificable con `quickstart.md` → Validar US1.

---

## Phase 4: User Story 2 - Generación automática del informe mensual (Priority: P1)

**Goal**: el Admin lanza la generación del informe del mes anterior de un sitio y el sistema recoge las 5 fuentes con reintentos, sin bloquear el informe si alguna falla.

**Independent Test**: lanzar la generación de un sitio con sus 5 fuentes configuradas y comprobar que se crea un `monthly_record` con los valores recuperados, ceros explícitos donde no hay actividad, y regenerar el mismo mes añade un registro nuevo sin sobrescribir el anterior (ver `quickstart.md` → Validar US2).

### Implementation for User Story 2

- [X] T016 [P] [US2] Implementar `getScores(url)` en `src/services/pagespeed.js` (fetch a la API pública de PageSpeed Insights, sin autenticación)
- [X] T017 [P] [US2] Implementar `getData(propertyId, period)` en `src/services/search-console.js` vía `googleapis` (impresiones, clics)
- [X] T018 [P] [US2] Implementar `getData(propertyId, period)` en `src/services/analytics.js` vía GA4 Data API / `googleapis` (visitas y desglose de canales: directo, orgánico, social, referral, otro)
- [X] T019 [P] [US2] Implementar `getData(siteId, period)` en `src/services/keywords.js` contra `KEYWORDS_API_URL`/`KEYWORDS_API_KEY` (lista de `{ keyword, position, search_volume, impressions }`)
- [X] T020 [P] [US2] Implementar `getData(siteId, period)` en `src/services/security.js` contra la API de Security Ninja (`attacks_blocked`, `threats_count`)
- [X] T021 [US2] Implementar el orquestador en `src/services/collector.js`: lanza los 5 servicios con `Promise.allSettled`, hasta 3 reintentos por fuente, y devuelve `{ data, sources_status }` sin lanzar excepción si una fuente falla (depende de T016–T020)
- [X] T022 [P] [US2] Implementar `insertMonthlyRecord(data)` y `getPreviousRecord(siteId, period)` en `src/db/queries/records.js`, escribiendo `0` explícito en toda métrica numérica sin valor
- [X] T023 [P] [US2] Implementar `insertKeywords(siteId, period, keywords)` en `src/db/queries/keywords.js`
- [X] T024 [US2] Implementar `GET /reports/generate/:site_id`, `POST /reports/generate/:site_id` (ejecuta el collector y guarda vía T022/T023) y `GET /reports/:record_id` en `src/routes/reports.js` (depende de T021, T022, T023)
- [X] T025 [P] [US2] Crear la vista `src/views/reports/generate.ejs` con el botón "GENERAR INFORME" (`DESIGN.md` §5.1 botón primario)
- [X] T026 [P] [US2] Crear la vista `src/views/reports/detail.ejs`: valores del registro + badges de estado por fuente (`DESIGN.md` §5.4: CONECTADO/FALLIDO/REINTENTANDO/PENDIENTE)
- [X] T027 [US2] Montar el router de informes en `src/app.js` (depende de T024)

**Checkpoint**: User Story 2 funciona de forma independiente y verificable con `quickstart.md` → Validar US2.

---

## Phase 5: User Story 3 - Actualización automática de Google Sheets (Priority: P1)

**Goal**: cada informe mensual generado crea (la primera vez) o actualiza (las siguientes) una hoja de Google Sheets por sitio, sin intervención manual.

**Independent Test**: generar el primer informe de un sitio y comprobar que se crea una hoja nueva con las columnas de métricas; generar un segundo informe y comprobar que se añade como fila nueva en la misma hoja (ver `quickstart.md` → Validar US3).

### Implementation for User Story 3

- [X] T028 [P] [US3] Implementar `createSheet(siteName)` (crea el spreadsheet con columnas de cabecera y devuelve `spreadsheetId`) y `appendRow(sheetsId, record)` en `src/services/sheets.js` vía `googleapis` (Sheets API)
- [X] T029 [US3] Integrar `sheets.js` en el flujo de generación de `src/routes/reports.js`: si `sites.sheets_id` es `NULL`, llamar a `createSheet` y persistir el id; en caso contrario, llamar a `appendRow` (depende de T028, T024)
- [X] T030 [P] [US3] Implementar `GET /sheets/:site_id/open` (redirect 302 a `https://docs.google.com/spreadsheets/d/{sheets_id}`) en `src/routes/sheets.js` (depende de T028)
- [X] T031 [US3] Montar el router de sheets en `src/app.js` (depende de T030)

**Checkpoint**: User Story 3 funciona de forma independiente y verificable con `quickstart.md` → Validar US3.

---

## Phase 6: User Story 4 - Dashboard con KPIs e histórico (Priority: P1)

**Goal**: el Admin ve en un panel los KPIs del mes más reciente por sitio, la tabla histórica completa y las oportunidades SEO detectadas.

**Independent Test**: con registros mensuales ya generados, comprobar que el dashboard muestra los KPIs correctos, la tabla histórica filtrable por sitio, y las keywords en posición 4–10 señaladas como oportunidad (ver `quickstart.md` → Validar US4).

### Implementation for User Story 4

- [X] T032 [P] [US4] Añadir `getLatestPerSite()` y `getHistorical(siteId?)` a `src/db/queries/records.js`, y `getOpportunities(siteId?)` a `src/db/queries/keywords.js` (filtro `is_opportunity = true`)
- [X] T033 [US4] Implementar `GET /` con filtro opcional `?site_id=` en `src/routes/index.js` (depende de T032). Implementar función `pctChange(actual, anterior) → (actual - anterior) / anterior * 100`; devuelve `null` si `anterior` es `0`. Usarla para impresiones, clics y visitas antes de pasar los datos a la vista.
- [X] T034 [P] [US4] Crear la vista `src/views/dashboard.ejs`: KPI cards (`DESIGN.md` §5.2), tabla histórica (`DESIGN.md` §5.3) y sección de oportunidades SEO con badge ámbar (`DESIGN.md` §5.4) (depende de T033)
- [X] T035 [P] [US4] Montar el router de dashboard en `src/app.js` (depende de T033)
- [X] T036 [P] [US4] Implementar el filtro de sitio en `public/app.js` (JS mínimo de cliente, sin framework)

**Checkpoint**: User Story 4 funciona de forma independiente y verificable con `quickstart.md` → Validar US4.

---

## Phase 7: User Story 5 - Formulario de informe de cliente con envío por email (Priority: P1)

**Goal**: el Admin revisa/completa un formulario precargado con los datos del mes y lo envía como email al cliente.

**Independent Test**: abrir el formulario de un registro existente, comprobar que los campos aparecen precargados, enviarlo y comprobar que el email recibido contiene los datos correctos en sus 5 secciones (ver `quickstart.md` → Validar US5).

### Implementation for User Story 5

- [X] T037 [P] [US5] Implementar el renderizador de la plantilla de email (HTML con estilos inline, 5 secciones fijas de `spec.md`) en `src/services/email.js`
- [X] T038 [US5] Implementar el transporte Nodemailer/SMTP y `sendReport(clientEmail, html)` en `src/services/email.js` (mismo archivo que T037, secuencial)
- [X] T039 [US5] Implementar `GET /email-form/:record_id` (precarga desde `monthly_records`) y `POST /email-form/:record_id/send` (aplica plantilla y envía) en `src/routes/email-form.js` (depende de T037, T038)
- [X] T040 [P] [US5] Crear la vista `src/views/email-form/index.ejs` con todos los campos de §"Formulario de informe para cliente" de `spec.md`
- [X] T041 [US5] Montar el router de email-form en `src/app.js` y actualizar `monthly_records.email_sent_at` al confirmar el envío (depende de T039)

**Checkpoint**: User Story 5 funciona de forma independiente y verificable con `quickstart.md` → Validar US5. **Con esta fase completa, el MVP (US1–US5) está terminado.**

---

## Phase 8: User Story 6 - Alertas automáticas de incidencias (Priority: P2)

**Goal**: el Admin recibe un email automático cuando una fuente falla persistentemente o una métrica cae a cero por primera vez.

**Independent Test**: forzar el fallo repetido de una fuente y comprobar que llega el email de aviso a `ALERT_EMAIL`; registrar un mes con una métrica en 0 tras un mes con actividad y comprobar el aviso, verificando que no se repite el mes siguiente si sigue en 0 (ver `quickstart.md` → Fuera de este quickstart, US6).

### Implementation for User Story 6

- [X] T042 [US6] Añadir `sendSourceFailureAlert(site, source)` y `sendMetricZeroAlert(site, metric)` a `src/services/email.js` (mismo archivo que T037/T038, reutiliza el transporte Nodemailer)
- [X] T043 [US6] Integrar el envío de `sendSourceFailureAlert` en `src/routes/reports.js` cuando `sources_status` marca una fuente como fallida tras los 3 reintentos (depende de T021, T042)
- [X] T044 [US6] Integrar `sendMetricZeroAlert` en `src/routes/reports.js`: comparar cada métrica del nuevo registro contra `getPreviousRecord` y avisar solo la primera vez que cae a 0, no en meses consecutivos ya en 0 (depende de T022, T042)

**Checkpoint**: User Story 6 funciona de forma independiente y verificable manualmente forzando fallos y caídas a cero.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: mejoras que afectan a varias historias a la vez.

- [X] T045 [P] Revisar todas las vistas EJS contra `DESIGN.md` §5 y §7 (botones, alertas inline, tono de textos) y ajustar `public/style.css` donde falte algún componente
- [X] T046 Ejecutar la validación completa de `quickstart.md` (US1, US2, US3, US4, US5) de principio a fin en un entorno con datos reales o de prueba
- [X] T047 [P] Auditar `package.json` para confirmar que no se ha introducido ninguna dependencia prohibida por la Constitución (React, Vue, Tailwind, Webpack, TypeScript, cualquier ORM). Verificar que no existe ninguna ruta PUT/DELETE sobre `/reports` o `/sites/:id` (excepto `/deactivate`), y que no se introdujo middleware de sesión o autenticación.
- [ ] T048 Desplegar en Railway (add-on PostgreSQL, variables de entorno del dashboard) y verificar que `https://faro-isleca.up.railway.app` responde con el flujo MVP completo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar inmediatamente.
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias de usuario.
- **User Stories (Phase 3-8)**: todas dependen de Foundational. Dentro del alcance MVP (US1–US5)
  pueden avanzar en paralelo si hay más de una persona, pero **US2 debe completarse antes que US3
  y US6** (ambas dependen del `collector.js`/`reports.js` de US2), y **US4/US5 asumen que ya
  existen registros generados por US2** para ser útiles en la práctica, aunque sus rutas y vistas
  puedan construirse antes.
- **Polish (Phase 9)**: depende de que las historias deseadas (como mínimo US1–US5, el MVP) estén completas.

### User Story Dependencies

- **US1 (P1)**: sin dependencia de otras historias — es la base de datos de sitios que todas las demás consultan.
- **US2 (P1)**: depende de que existan sitios (US1) para tener algo que generar; introduce `collector.js`, `reports.js` y las queries de `monthly_records`/`keywords` que reutilizan US3, US4, US5 y US6.
- **US3 (P1)**: depende de US2 (integra `sheets.js` en el flujo de generación de `reports.js`).
- **US4 (P1)**: depende de US2 (lee `monthly_records`/`keywords` para mostrar KPIs e histórico); no depende de US3.
- **US5 (P1)**: depende de US2 (lee un `monthly_record` para precargar el formulario); no depende de US3 ni US4.
- **US6 (P2)**: depende de US2 (usa `sources_status` y `getPreviousRecord`) y de que `email.js` ya tenga el transporte Nodemailer configurado (T038 de US5).

### Parallel Opportunities

- Todas las tareas `[P]` de Setup (T003, T004) en paralelo.
- Todas las tareas `[P]` de Foundational (T009, T010) en paralelo, tras completar T005–T008.
- Dentro de US2, los 5 servicios de fuente (T016–T020) son completamente independientes entre sí y pueden implementarse en paralelo antes de construir `collector.js` (T021).
- Una vez completada US2, US4 y US5 pueden avanzar en paralelo entre sí (no comparten archivos de ruta/vista), y US3 puede avanzar en paralelo a ambas.

---

## Parallel Example: User Story 2

```bash
# Los 5 servicios de fuente no comparten archivo ni dependen entre sí:
Task: "Implementar getScores(url) en src/services/pagespeed.js"
Task: "Implementar getData(propertyId, period) en src/services/search-console.js"
Task: "Implementar getData(propertyId, period) en src/services/analytics.js"
Task: "Implementar getData(siteId, period) en src/services/keywords.js"
Task: "Implementar getData(siteId, period) en src/services/security.js"

# Las queries de persistencia tampoco dependen de los servicios ni entre sí:
Task: "Implementar insertMonthlyRecord/getPreviousRecord en src/db/queries/records.js"
Task: "Implementar insertKeywords en src/db/queries/keywords.js"
```

---

## Implementation Strategy

### MVP First (US1 → US2 → US3 → US4 → US5)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational (bloquea todo lo demás).
3. Completar Phase 3 (US1) → validar con `quickstart.md` → Validar US1.
4. Completar Phase 4 (US2) → validar con `quickstart.md` → Validar US2.
5. Completar Phase 5 (US3) → validar con `quickstart.md` → Validar US3.
6. Completar Phase 6 (US4) → validar con `quickstart.md` → Validar US4.
7. Completar Phase 7 (US5) → validar con `quickstart.md` → Validar US5.
8. **STOP y VALIDAR**: con US1–US5 completas, el MVP descrito en `plan.md` está listo para demo/despliegue.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → gestión de sitios operativa.
3. US2 → generación de informes operativa (ya aporta valor de negocio real).
4. US3 → Sheets automático (cierra la salida de datos externa del informe).
5. US4 → visibilidad en dashboard.
6. US5 → entrega al cliente por email (MVP completo).
7. US6 (P2) → capa de alertas añadida sin modificar el comportamiento ya entregado.

### Complexity Tracking

No aplica — `plan.md` no registra violaciones de la Constitución que justificar en la tabla de Complexity Tracking.
