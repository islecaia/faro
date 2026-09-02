# Implementation Plan: Informe mensual SEO/rendimiento automatizado

**Branch**: `001-informe-mensual-seo` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-informe-mensual-seo/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Faro sustituye la recopilación manual de métricas SEO/rendimiento por un flujo automatizado:
el Admin da de alta un sitio (US1), lanza la generación del informe del mes anterior (US2), el
sistema recoge datos de 5 fuentes externas en paralelo con hasta 3 reintentos por fuente sin
bloquear el resto del informe, guarda el resultado en PostgreSQL como histórico inmutable, y desde
ahí proyecta los datos hacia un dashboard (US4), la actualización automática de Google Sheets
(US3) y un formulario de informe de cliente enviado por email (US5). El MVP cubre US1, US2,
US3, US4 y US5 (las cinco historias P1 de `spec.md`); las alertas automáticas de incidencias
(US6, P2) quedan para una segunda ola. El enfoque técnico es deliberadamente mínimo: Express + EJS
renderizado en servidor, SQL directo vía `pg`, sin bundler ni framework de frontend, siguiendo la
Constitución.

## Technical Context

**Language/Version**: JavaScript (Node.js 20, CommonJS)

**Primary Dependencies**: Express 4, EJS, `pg`, Nodemailer, `googleapis`, `dotenv`

**Storage**: PostgreSQL (vía `pg`, SQL directo, sin ORM — Principio II de la Constitución)

**Testing**: Verificación manual guiada por comando (`curl`, `node -e "..."`) documentada por cada
tarea de `tasks.md`; sin framework de test automatizado en el MVP (ver `research.md` para la
justificación frente a Jest/Vitest)

**Target Platform**: Servidor Linux gestionado por Railway (Node.js 20 runtime)

**Project Type**: Aplicación web de un solo proyecto (servidor + vistas renderizadas en servidor)

**Performance Goals**: La generación de un informe mensual (5 fuentes en paralelo, hasta 3
reintentos cada una) debe completarse en menos de 60s por sitio en el caso típico; no hay
objetivo de throughput concurrente porque el uso es de un único Admin lanzando generaciones de
forma manual y esporádica.

**Constraints**:
- Sin ORM — queries SQL directas con `pg`.
- Sin bundler — CSS y JS de cliente servidos como estáticos desde `public/`.
- Nunca `DELETE` sobre `sites` ni `monthly_records`; las bajas de sitio solo cambian `status` a
  `inactive`.
- Toda métrica numérica sin actividad se guarda como `0` explícito, nunca `NULL`.
- El collector aplica un máximo de 3 reintentos por fuente vía `Promise.allSettled`; el fallo de
  una fuente tras agotar reintentos no bloquea la generación del resto del informe.
- Google Sheets: se crea la hoja del sitio en su primer informe y se usa `appendRow` en los
  siguientes; nunca se sobrescribe una fila existente.
- El email de informe de cliente se genera como HTML con estilos inline, siguiendo las 5 secciones
  fijas de `spec.md`.

**Scale/Scope**: Herramienta interna de una agencia; decenas de sitios cliente gestionados por un
único Admin, cadencia mensual por sitio — no volumen de tipo SaaS multiusuario.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Sección | Evaluación | Resultado |
|---|---|---|
| I. Simplicidad radical | Stack limitado a Express + EJS + CSS puro + Vanilla JS; sin bundler, sin framework de frontend, sin TypeScript. | ✅ PASS |
| II. PostgreSQL como fuente de verdad | Flujo unidireccional Postgres → Sheets/Dashboard/Email; acceso a datos con SQL directo vía `pg`, sin ORM. | ✅ PASS |
| III. Histórico inmutable | Ninguna operación `DELETE`/`UPDATE` destructiva sobre registros; bajas de sitio solo cambian `status`; ceros explícitos en `monthly_records`/`keywords`. | ✅ PASS |
| IV. Resiliencia ante fuentes externas | `collector.js` reintenta cada fuente hasta 3 veces con `Promise.allSettled`; un fallo persistente marca la fuente y continúa. | ✅ PASS |
| V. Fidelidad al sistema de diseño | Todas las vistas EJS reutilizan los tokens y componentes de `DESIGN.md`; no se introducen estilos ad-hoc. | ✅ PASS |
| Restricciones Tecnológicas | Ninguna dependencia prohibida (React/Vue/Tailwind/Webpack/TypeScript/ORM) aparece en `package.json` planeado. | ✅ PASS |
| Despliegue y Operación | Railway + add-on PostgreSQL; variables de entorno vía `.env` en local y dashboard de Railway en producción. | ✅ PASS |

Sin violaciones — la tabla de Complexity Tracking queda vacía.

**Re-check post Fase 1**: `data-model.md` (3 tablas, sin ORM), `contracts/routes.md` (rutas
server-rendered sin autenticación) y `quickstart.md` no introducen ninguna dependencia, capa ni
patrón fuera de lo evaluado arriba. Gate sigue en ✅ PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-informe-mensual-seo/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── routes.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app.js                      # Arranque de Express
├── config/
│   ├── db.js                   # Pool de conexión PostgreSQL (pg)
│   └── env.js                  # Carga y valida variables de entorno
├── routes/
│   ├── index.js                # GET / → dashboard
│   ├── sites.js                # Alta / listado / baja de sitios (US1)
│   ├── reports.js               # Generación y detalle de registros mensuales (US2)
│   ├── email-form.js           # Formulario de informe de cliente (US5)
│   └── sheets.js                # Enlace/acceso a la hoja de Sheets del sitio (US3)
├── services/
│   ├── pagespeed.js             # Google PageSpeed Insights (sin auth)
│   ├── search-console.js        # Google Search Console (googleapis)
│   ├── analytics.js             # GA4 Analytics (googleapis)
│   ├── keywords.js              # Squirrly SEO / Ubersuggest
│   ├── security.js              # Security Ninja
│   ├── sheets.js                # Crear hoja + appendRow (US3)
│   ├── email.js                 # Nodemailer + plantilla de 5 secciones (US5)
│   └── collector.js             # Orquesta las 5 fuentes con reintentos (US2)
├── db/
│   ├── schema.sql                # sites, monthly_records, keywords
│   └── queries/
│       ├── sites.js
│       ├── records.js
│       └── keywords.js
└── views/
    ├── layout.ejs                # Shell: sidebar + cabecera + tokens de DESIGN.md
    ├── dashboard.ejs              # KPIs + tabla histórica + oportunidades SEO (US4)
    ├── sites/
    │   ├── index.ejs
    │   └── form.ejs
    ├── reports/
    │   ├── generate.ejs
    │   └── detail.ejs
    └── email-form/
        └── index.ejs

public/
├── style.css                     # Tokens CSS de DESIGN.md §10 + estilos de componentes
└── app.js                        # JS mínimo de cliente (filtro de tabla)
```

**Structure Decision**: proyecto único (sin separación frontend/backend) porque no hay SPA ni
build de cliente — las vistas EJS se sirven directamente desde Express. La estructura sigue
exactamente `--folder-structure` del comando (`src/config/`, `src/routes/`, `src/services/`,
`src/db/queries/`, `src/views/`, `public/`), sin carpeta `tests/` dedicada dado que la verificación
del MVP es manual (ver Technical Context → Testing y `quickstart.md`).

## Complexity Tracking

> No aplica — el Constitution Check no registra violaciones que justificar.
