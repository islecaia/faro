# Quickstart: Informe mensual SEO/rendimiento automatizado

Guía de validación end-to-end para el MVP (US1, US2, US3, US4, US5 — las cinco historias P1
de `spec.md`). No contiene código de implementación — solo comandos y pasos para comprobar que
cada Independent Test de `spec.md` funciona una vez construidas las tareas correspondientes de
`tasks.md`.

## Prerrequisitos

- Node.js 20 instalado.
- Una base de datos PostgreSQL accesible (local o el add-on de Railway) con `src/db/schema.sql`
  ya aplicado (ver `data-model.md` para las tablas `sites`, `monthly_records`, `keywords`).
- Variables de entorno en `.env` (ver `plan.md` → Technical Context → Constraints y
  `.env.example`): como mínimo `DATABASE_URL` para este quickstart; `GOOGLE_SERVICE_ACCOUNT_JSON`,
  `SMTP_*`, `KEYWORDS_API_URL`, `KEYWORDS_API_KEY`, `SECURITY_NINJA_API_KEY` son necesarias para
  ejercitar la recogida real de datos (US2) y el envío de email (US5).
- Dependencias instaladas: `npm install`.

## Arrancar la app

```bash
npm run dev
# → servidor escuchando en http://localhost:3000 (o el PORT configurado)
```

## Validar US1 — Gestión de sitios

1. Abrir `http://localhost:3000/sites/new` y dar de alta un sitio con nombre, URL, email de
   cliente y (si se dispone de ellos) los identificadores de las 5 fuentes.
2. Ir a `http://localhost:3000/sites` y comprobar que el sitio aparece en el listado de activos.
3. Pulsar "dar de baja" sobre ese sitio y comprobar que desaparece del listado de activos.
4. **Resultado esperado**: consultar la tabla `sites` directamente (`SELECT * FROM sites`) y
   comprobar que la fila sigue existiendo con `status = 'inactive'` — nunca se borra (FR-003).

## Validar US2 — Generación automática del informe mensual

1. Con un sitio activo y sus 5 fuentes configuradas, ir a
   `http://localhost:3000/reports/generate/:site_id` y pulsar "GENERAR INFORME".
2. **Resultado esperado**: redirección a `/reports/:record_id` mostrando los valores recogidos de
   cada fuente y, si alguna fuente no está configurada o falla, esa fuente marcada como fallida en
   `sources_status` sin que falte el resto de datos del informe (FR-006, FR-007).
3. Consultar `monthly_records` para ese `site_id`/`period` y comprobar que ninguna columna
   numérica es `NULL` — las métricas sin actividad deben aparecer como `0` (FR-008).
4. Repetir la generación para el mismo sitio y mes; comprobar que se ha insertado un **segundo**
   registro en `monthly_records` en vez de modificar el primero (FR-009).

## Validar US3 — Google Sheets automático

1. Con un sitio que genera su **primer** informe mensual, comprobar tras la generación que
   `sites.sheets_id` ya no es `NULL` y que existe una hoja de cálculo nueva en Google Drive con las
   columnas de métricas definidas (FR-011).
2. Abrir `http://localhost:3000/sheets/:site_id/open` y comprobar que redirige a esa hoja.
3. Generar un **segundo** informe (otro mes) para el mismo sitio y comprobar que se añade una fila
   nueva a la misma hoja, sin sobrescribir la fila anterior (FR-012).

## Validar US4 — Dashboard

1. Con al menos un `monthly_record` generado, abrir `http://localhost:3000/`.
2. **Resultado esperado**: tarjetas KPI con los datos del mes más reciente por sitio, tabla
   histórica con todos los registros, y una sección de oportunidades SEO listando las keywords con
   `is_opportunity = true` (posición 4–10).
3. Probar el filtro `?site_id=` (o el selector de la vista) y comprobar que la tabla histórica
   muestra solo los registros de ese sitio.

## Validar US5 — Formulario de informe de cliente

1. Desde el detalle de un `monthly_record` (`/reports/:record_id`), navegar a
   `/email-form/:record_id`.
2. **Resultado esperado**: los campos del formulario (impresiones + variación, clics + variación,
   desglose de canales, tendencia de ranking, oportunidades, PageSpeed mobile/desktop, seguridad)
   aparecen precargados con los valores del registro.
3. Enviar el formulario y comprobar que llega un email al `client_email` del sitio, con las 5
   secciones de la plantilla rellenas (§"Secciones de la plantilla de email" en `spec.md` de la
   raíz del repo / `spec.md` de esta feature).
4. Consultar `monthly_records.email_sent_at` para ese registro y comprobar que ya no es `NULL`.

## Fuera de este quickstart (segunda ola — US6)

- **US6 (Alertas)**: una vez implementada, forzar el fallo de una fuente (p. ej. credencial
  inválida) y comprobar que llega un email a `ALERT_EMAIL`; y generar un mes con una métrica en `0`
  tras un mes anterior con actividad, comprobando el email de aviso correspondiente y que no se
  repite en el mes siguiente si la métrica sigue en `0` (FR-021).
