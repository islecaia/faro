# Phase 0 Research: Informe mensual SEO/rendimiento automatizado

No quedaban marcadores `NEEDS CLARIFICATION` en `spec.md` ni en el Technical Context de
`plan.md`. Esta investigación documenta las decisiones técnicas que traducen las restricciones de
`spec.md`, la Constitución y los argumentos del comando en un enfoque concreto de implementación.

## 1. Renderizado de vistas sin bundler

- **Decision**: EJS server-side, cargado directamente por Express con `app.set('view engine',
  'ejs')`; CSS y JS de cliente servidos como archivos estáticos desde `public/` sin paso de build.
- **Rationale**: Principio I de la Constitución (Simplicidad radical) prohíbe bundlers y
  frameworks de frontend; el dashboard y los formularios son páginas con interacción mínima
  (un filtro de tabla), que no justifican un SPA.
- **Alternatives considered**: React/Vite (descartado — prohibido por la Constitución y por
  `--no-frontend-framework`); Handlebars/Pug (descartado — EJS ya está fijado en `plan.md` original
  y en el stack acordado, sin ventaja real de cambiarlo).

## 2. Acceso a datos

- **Decision**: SQL directo con `pg` (pool de conexión único en `src/config/db.js`), consultas
  organizadas por entidad en `src/db/queries/`.
- **Rationale**: Principio II (PostgreSQL como fuente de verdad) prohíbe explícitamente un ORM; el
  esquema es pequeño (4 tablas) y estable, sin necesidad de migraciones complejas.
- **Alternatives considered**: Prisma/Sequelize (descartado — prohibido por la Constitución y por
  `--constraints "Sin ORM"`); query builder tipo Knex (descartado — capa intermedia innecesaria
  para 4 tablas con consultas conocidas de antemano).

## 3. Autenticación con APIs de Google

- **Decision**: cuenta de servicio de Google Cloud, cuyo JSON completo se almacena en la variable
  de entorno `GOOGLE_SERVICE_ACCOUNT_JSON` y se parsea en `src/config/env.js`; se reutiliza la
  misma credencial para Search Console, GA4 Analytics y Sheets/Drive vía el paquete `googleapis`.
- **Rationale**: una única credencial de servicio simplifica la configuración por sitio (solo hace
  falta compartir cada propiedad/hoja con el email de la cuenta de servicio) y evita flujos OAuth
  interactivos, que no tienen sentido para una herramienta sin usuarios finales autenticándose.
- **Alternatives considered**: OAuth2 con consentimiento por sitio (descartado — añade un flujo de
  autorización manual por cliente, contrario a la Simplicidad radical y sin beneficio dado que el
  Admin es el único operador).

## 4. Estrategia de reintentos del collector

- **Decision**: `collector.js` lanza las 5 llamadas a servicios de fuente en paralelo con
  `Promise.allSettled`; cada servicio implementa internamente su propio bucle de reintento (máx. 3
  intentos, con una espera fija corta entre intentos) y, si agota los 3 intentos, devuelve un
  resultado marcado como fallido en lugar de lanzar una excepción no controlada.
- **Rationale**: FR-006/FR-007 de `spec.md` y el Principio IV de la Constitución exigen que un
  fallo de fuente no bloquee el resto del informe; `Promise.allSettled` garantiza que las 5
  promesas se resuelven siempre, con éxito o fallo, sin que un `reject` interrumpa a las demás.
- **Alternatives considered**: librería `async-retry` con backoff exponencial (viable, pero se
  descarta como dependencia adicional para un caso de 3 reintentos fijos; se documenta como opción
  si en el futuro se necesita backoff más sofisticado); un único intento sin reintento (descartado
  — contradice explícitamente FR-006).

## 5. Creación y actualización de Google Sheets

- **Decision**: `services/sheets.js` expone `createSheet(siteName)` (usa la API de Sheets para
  crear el spreadsheet y escribir la fila de cabecera, y guarda el `spreadsheetId` devuelto en
  `sites.sheets_id`) y `appendRow(sheetsId, record)` (usa `spreadsheets.values.append` en modo
  `RAW`/`USER_ENTERED` para añadir la fila del periodo sin tocar filas existentes).
- **Rationale**: FR-011/FR-012 exigen creación automática en el primer informe y filas nuevas en
  los siguientes, sin sobrescritura; `values.append` de la API de Sheets ya garantiza que se añade
  al final de la hoja sin necesidad de calcular manualmente el rango.
- **Alternatives considered**: plantilla de Sheets pre-creada y compartida manualmente por el
  Admin (descartada — contradice FR-011, que exige creación automática desde cero).

## 6. Entrega del email de informe de cliente

- **Decision**: Nodemailer con transporte SMTP (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`);
  la plantilla de email es un literal HTML con estilos inline organizado en las 5 secciones fijas
  de `spec.md`, con los valores del formulario interpolados en `src/services/email.js`.
- **Rationale**: los clientes de correo no cargan hojas de estilo externas de forma fiable; estilos
  inline es el enfoque estándar para HTML de email transaccional. SMTP genérico evita atar la
  entrega a un proveedor de pago para el MVP.
- **Alternatives considered**: proveedor transaccional (SendGrid/Postmark) con plantillas alojadas
  (descartado para el MVP — añade una dependencia de servicio de pago no mencionada en el stack
  acordado; queda como posible mejora futura si la entregabilidad SMTP resulta insuficiente).

## 7. Alcance de pruebas para el MVP

- **Decision**: cada tarea de `tasks.md` incluye un paso de verificación manual ejecutable
  (`curl`, `node -e "..."`, o una acción concreta en el navegador) en vez de una suite de tests
  automatizados.
- **Rationale**: Principio I (Simplicidad radical); el equipo es un único desarrollador/Admin y el
  ciclo de feedback manual por fase es suficiente para el tamaño del MVP. La Constitución no exige
  TDD ni un framework de test concreto.
- **Alternatives considered**: Jest/Vitest con tests de integración por servicio (razonable a
  futuro, especialmente para los 5 servicios de recogida de datos y el collector; se deja como
  mejora post-MVP si el proyecto crece en colaboradores, no como bloqueo de esta fase).

## 8. Despliegue y configuración

- **Decision**: Railway con add-on de PostgreSQL gestionado; `railway.toml` con
  `startCommand = "npm start"`; variables de entorno (`DATABASE_URL`,
  `GOOGLE_SERVICE_ACCOUNT_JSON`, `SMTP_*`, `ALERT_EMAIL`, `KEYWORDS_API_URL`,
  `KEYWORDS_API_KEY`, `SECURITY_NINJA_API_KEY`, `PORT`) configuradas en el dashboard de Railway en
  producción y en `.env` (con `.env.example` como plantilla) en local.
- **Rationale**: ya fijado en la sección "Despliegue y Operación" de la Constitución; no hay
  decisión abierta que investigar.
- **Alternatives considered**: n/a — plataforma ya decidida a nivel de Constitución.
