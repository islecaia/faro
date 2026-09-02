<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1
- Rationale: PATCH amendment — corrects a stale source name in Principle IV's parenthetical list.
  "Google Site Kit" never appears in `specs/001-informe-mensual-seo/spec.md`, `plan.md`,
  `data-model.md`, or `tasks.md`, which all consistently name the analytics source "GA4 Analytics
  (GA4 Data API)". Flagged by `/speckit-analyze` (finding F2) as a terminology drift between the
  ratified constitution and the actual feature artifacts; no normative behavior changes.
- Modified principles: IV. Resiliencia ante fuentes externas (wording only — the MUST clause
  itself, max 3 retries / non-blocking failure, is unchanged)
- Added sections: none
- Removed sections: none
- Deferred placeholders: none
- Templates requiring follow-up: none — this is a documentation-only correction; no downstream
  command behavior depends on the specific source name used in the parenthetical.
-->

# Faro Constitution

Faro es una herramienta interna para automatizar informes mensuales de SEO y rendimiento web
para múltiples sitios de clientes.

## Core Principles

### I. Simplicidad radical

La app se construye con lo mínimo necesario para resolver el problema: Node.js 20 + Express 4,
vistas EJS renderizadas en servidor, CSS puro y Vanilla JS. NO se introducen bundlers (Webpack u
otro), NO se usan frameworks de frontend (React, Vue u otro) y NO se usa TypeScript. Cada página
es una vista EJS renderizada en el servidor; no hay build step para la interfaz. No se añade
abstracción, capa de indirección o dependencia que no resuelva un requisito actual de `spec.md`.

**Rationale**: el equipo es reducido y el valor del producto está en automatizar la recogida de
datos, no en la sofisticación del frontend. Cada capa añadida (bundler, framework, TS) es coste de
mantenimiento sin beneficio demostrado para este caso de uso.

### II. PostgreSQL como fuente de verdad

Los datos fluyen en una sola dirección: **PostgreSQL → Google Sheets + Dashboard + Email
cliente**. PostgreSQL es la fuente de verdad interna; Sheets, el dashboard y el email son
proyecciones de lectura o exportaciones derivadas de ella, nunca al revés. El acceso a datos se
hace con queries SQL directas a través de `pg`; NO se introduce un ORM. Cualquier lógica de
negocio sobre los datos (comparativas mes a mes, detección de oportunidades SEO, etc.) vive en el
código de la aplicación, no en Sheets ni en el email.

**Rationale**: una única fuente de verdad evita divergencias entre lo que ve el dashboard, lo que
hay en la hoja de cálculo y lo que se envía al cliente. Un ORM añadiría una capa de abstracción
innecesaria sobre un esquema pequeño y estable.

### III. Histórico inmutable

El sistema NUNCA elimina registros mensuales ni de sitios. Dar de baja un sitio solo cambia su
`status` a `inactive`; sus registros históricos se conservan y siguen siendo consultables.
Regenerar el informe de un mes ya registrado añade una fila nueva, nunca sobrescribe ni bloquea la
anterior. Toda métrica numérica sin actividad en el periodo se escribe explícitamente como `0`, y
se distingue visualmente de una celda vacía; nunca se deja en blanco ni se omite.

**Rationale**: el histórico es la base de las comparativas mes a mes y de la confianza del cliente
en los datos; borrar o sobrescribir información pasada rompe esa trazabilidad de forma
irrecuperable.

### IV. Resiliencia ante fuentes externas

Toda integración con una fuente de datos externa (GA4 Analytics (GA4 Data API), Search Console,
Squirrly SEO/Ubersuggest, PageSpeed Insights, Security Ninja) reintenta como máximo 3 veces ante un fallo.
Si tras 3 reintentos la fuente sigue fallando, el sistema marca esa fuente/celda como error, avisa
al usuario por email, y CONTINÚA generando el resto del informe con las fuentes disponibles. Un
fallo de una fuente NUNCA bloquea ni invalida el resto del informe mensual.

**Rationale**: con cinco integraciones externas independientes, tratar cualquier fallo como
bloqueante haría el sistema frágil por diseño; el valor de negocio (Historia de Usuario 2 de
`spec.md`) exige que el proceso escale a varios sitios sin intervención manual incluso cuando una
fuente falla puntualmente.

### V. Fidelidad al sistema de diseño

`DESIGN.md` es la fuente de verdad única y no negociable para toda decisión visual: paleta de
color (tema oscuro, `#E91E8C` como color de marca principal), tipografías (Bebas Neue para
titulares, Inter para interfaz, JetBrains Mono para datos), iconografía (Phosphor Icons), layout
(sidebar fija de 200px, cabecera de 52px) y los tokens CSS que define. Ninguna vista introduce
colores, fuentes, espaciados o componentes que no estén ya definidos en `DESIGN.md`; si falta un
patrón, se extiende `DESIGN.md` primero y luego se implementa.

**Rationale**: mantener una única fuente de verdad visual evita que el dashboard, el formulario de
cliente y futuras pantallas diverjan estéticamente, y preserva la coherencia de marca con
elGriegoNET.

## Restricciones Tecnológicas

- Stack permitido: Node.js 20, Express 4, EJS, CSS puro, Vanilla JS, PostgreSQL vía `pg`,
  Nodemailer + SMTP, `googleapis`, desplegado en Railway.
- Prohibido explícitamente: React, Vue, Tailwind, Webpack, TypeScript y cualquier ORM.
- Todo acceso a la base de datos usa SQL directo (`pg`), no un query builder ni un ORM.
- Toda integración con una fuente de datos externa respeta el límite de 3 reintentos antes de
  marcar error (ver Principio IV); no se añaden reintentos ilimitados ni backoff indefinido.

## Despliegue y Operación

- Despliegue en Railway, con PostgreSQL como add-on gestionado por Railway.
- Variables de entorno: fichero `.env` en local (nunca commiteado; ver `.env.example` como
  plantilla), y configuradas directamente en el dashboard de Railway en producción.
- URL de producción: https://faro.up.railway.app
- Repositorio: https://github.com/islecaia/Faro.git

## Governance

Esta constitución prevalece sobre cualquier otra práctica, plantilla o preferencia individual de
implementación dentro de este repositorio, incluyendo lo descrito en `plan.md` y `tasks.md` si
llegara a entrar en conflicto con ella.

- **Amendments**: cualquier cambio a esta constitución se hace vía `/speckit-constitution`, nunca
  editando el fichero a mano. Cada enmienda debe documentar qué cambia y por qué en el Sync Impact
  Report al inicio del fichero.
- **Versioning policy**: versionado semántico.
  - MAJOR: eliminación o redefinición incompatible de un principio existente.
  - MINOR: añadir un principio o sección nueva, o ampliar materialmente una guía existente.
  - PATCH: aclaraciones, correcciones de redacción o cambios no semánticos.
- **Compliance review**: antes de generar o revisar `plan.md`, `tasks.md`, o de implementar
  código, se debe comprobar que la propuesta no contradiga ningún principio de esta constitución.
  Ante cualquier ambigüedad o conflicto entre un spec y esta constitución, el trabajo se detiene y
  se pregunta al usuario en lugar de asumir o inferir una resolución.
- Guía de implementación complementaria (no normativa): `spec.md` (requisitos funcionales),
  `plan.md` (plan de construcción), `DESIGN.md` (sistema de diseño visual).

**Version**: 1.0.1 | **Ratified**: 2026-09-02 | **Last Amended**: 2026-09-02
