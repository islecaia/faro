# DESIGN.md — Faro

> Sistema de diseño unificado de Faro, con dos temas: **noche** (marca elGriegoNET®, por defecto) y **día** (editorial, calma operativa). Este documento es la única fuente de verdad para ambos — sustituye a las versiones anteriores separadas `DESIGN.md` (oscuro) y `DESIGNdia.md` (claro).

---

## 1. Filosofía de diseño

Faro es una herramienta de uso interno, pero eso no baja el listón de calidad visual. Los dos temas comparten la misma base de valores; difieren en cómo la expresan:

- **Claridad ante todo.** Métricas, estados y alertas deben leerse de un vistazo, sin buscarlos. Si hay que pensar dónde está un dato, el diseño ha fallado. *(compartido)*
- **Cero ambigüedad visual.** Un éxito, un fallo y una advertencia tienen colores distintos que nunca se confunden. Las celdas vacías no existen: si hay un cero, se ve el cero. *(compartido)*
- **Eficiencia.** Cada pantalla muestra exactamente lo que el usuario necesita para tomar una decisión. Nada más. *(compartido)*

A partir de esa base común, cada tema tiene su propia personalidad:

### Tema oscuro (noche) — energía de marca

La interfaz transmite la misma energía y confianza que proyecta elGriegoNET hacia sus clientes: **profesional, directa y visualmente poderosa**. Los datos ocupan el centro, pero la estética refuerza que quien usa esta herramienta trabaja a otro nivel. El rosa eléctrico y la audacia tipográfica de elgriego.net conviven con una estructura funcional pensada para datos — no son opuestos, se refuerzan.

### Tema claro (día) — calma editorial

La interfaz es una **consola de operaciones**, no un panel de marketing. Limpia, editorial, sin ornamentos, con máxima claridad operativa:

- **Confianza técnica.** El aspecto profesional y sobrio refuerza que los informes son fiables.
- **Calma operativa.** Sin colores estridentes, sin alertas innecesarias. Los avisos se reservan solo para lo que realmente lo merece.
- **Color con propósito, nunca decorativo.** Se usa solo para comunicar estado (verde = bien, ámbar = atención, rojo = acción requerida). Las pantallas en estado normal se ven mayoritariamente en blanco, gris cálido y negro.

**Por defecto Faro arranca en tema oscuro** (`:root`, sin atributo); el tema claro se activa explícitamente vía `[data-theme="light"]` (ver §6).

---

## 2. Paleta de colores

### Tema oscuro (noche)

**Colores base (fondos y superficies)**

| Token | Hex | Uso |
|---|---|---|
| `--bg-app` | `#0F000A` | Fondo de la ventana principal (oscuro profundo, tono vinoso) |
| `--bg-panel` | `#1A000F` | Paneles laterales, barras de navegación |
| `--bg-card` | `#240018` | Tarjetas de métricas, contenedores de sección |
| `--bg-card-hover` | `#2E001F` | Estado hover de tarjetas |
| `--bg-input` | `#1A000F` | Fondos de campos de formulario |
| `--border-subtle` | `#4A0035` | Bordes de separación, líneas divisoras |
| `--border-strong` | `#7A0058` | Bordes de elementos activos o enfocados |

> **Referencia visual:** la misma oscuridad profunda con matiz carmesí/vinoso del footer de elgriego.net.

**Colores de marca (primarios)**

| Token | Hex | Uso |
|---|---|---|
| `--brand-primary` | `#E91E8C` | Botones primarios, encabezados de sección, iconos activos |
| `--brand-primary-hover` | `#FF4DB8` | Hover/focus de elementos primarios |
| `--brand-primary-dim` | `#7A1050` | Fondos de badges, estados de carga |
| `--brand-accent` | `#FF9E00` | Acento secundario. CTAs secundarias, oportunidades SEO |
| `--brand-accent-hover` | `#FFB833` | Hover del acento secundario |

**Colores semánticos (estados)**

| Token | Hex | Uso |
|---|---|---|
| `--status-success` | `#00C896` | Métricas correctas, fuentes conectadas |
| `--status-warning` | `#FF9E00` | Alertas menores, métrica que cae a cero por primera vez |
| `--status-error` | `#FF3355` | Fuentes fallidas tras 3 reintentos, incidencias críticas |
| `--status-info` | `#3DB8FF` | Información contextual, tooltips |
| `--status-neutral` | `#7A6A78` | Datos sin variación, estados neutros |

**Colores de texto**

| Token | Hex | Uso |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Texto principal, títulos, valores de métricas |
| `--text-secondary` | `#C8A8BF` | Texto de apoyo, etiquetas, subtítulos |
| `--text-muted` | `#7A5A73` | Timestamps, metadata, texto deshabilitado |
| `--text-on-brand` | `#FFFFFF` | Texto sobre fondos de color de marca |
| `--text-zero` | `#4A3548` | El valor `0` explícito (visible pero no prominente) |

**Degradados**

```css
--gradient-brand:   linear-gradient(135deg, #E91E8C 0%, #7B2FF7 100%);
--gradient-rainbow: linear-gradient(90deg, #FF0054, #FF4500, #FFB800, #00C896, #3DB8FF, #7B2FF7, #E91E8C);
--gradient-card:    linear-gradient(160deg, #240018 0%, #1A000F 100%);
```

### Tema claro (día)

**Colores base**

| Nombre | Hex | Uso |
|---|---|---|
| Ink | `#101114` | Texto principal, botón primario, fondos oscuros puntuales |
| White | `#FFFFFF` | Fondo principal, botón secundario |
| Warm Gray 100 | `#F7F7F5` | Fondo de secciones alternas |
| Warm Gray 200 | `#F4F4F2` | Fondos de cards de datos, filas alternas |
| Border | `#DEDED9` | Bordes de cards, inputs, divisores |
| Muted | `#666B73` | Texto secundario, descripciones, metadata |

**Colores de estado y acento**

| Nombre | Hex | Uso |
|---|---|---|
| Green 600 | `#108043` | Estado correcto, tendencia positiva |
| Green 50 | `#EDF7ED` | Fondo de badge verde |
| Amber 600 | `#B45309` | Advertencia, métrica por debajo del objetivo |
| Amber 50 | `#FFFBEB` | Fondo de badge de advertencia |
| Red 600 | `#DC2626` | Error, métrica crítica, seguridad comprometida |
| Red 50 | `#FEF2F2` | Fondo de badge de error |
| Blue 600 | `#1D4ED8` | Enlace, acción informativa, rankings |
| Blue 50 | `#EFF6FF` | Fondo de badge informativo |

> **Regla de uso de color:** nunca decorar con color. Solo para comunicar estado.

**Fondos de sección**

| Contexto | Color |
|---|---|
| Fondo de página principal | `#FFFFFF` |
| Sección alterna / módulo | `#F7F7F5` |
| Sección oscura (CTA, onboarding) | `#101114` |
| Card de datos | `#FFFFFF` con borde `#DEDED9` |
| Card destacada | `#101114` con texto blanco |

---

## 3. Tipografía

### Tema oscuro — tres familias

**Titulares y branding — Bebas Neue** (`'Bebas Neue', 'Impact', sans-serif`). Títulos de pantalla, nombre de la app, métricas numéricas grandes.

**Interfaz — Inter** (`'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif`). Todo el texto funcional: etiquetas, botones, párrafos, tablas.

**Datos — JetBrains Mono** (`'JetBrains Mono', 'Fira Code', 'Courier New', monospace`). Cifras en columnas, hashes, IDs, logs técnicos.

| Rol | Familia | Tamaño | Peso | Uso |
|---|---|---|---|---|
| App title | Bebas Neue | 28px | 400 | Nombre de la app en cabecera |
| Screen heading | Bebas Neue | 22px | 400 | Título de pantalla/sección |
| Section label | Inter | 11px | 700 | Etiquetas en mayúsculas, tracking amplio |
| Card title | Inter | 15px | 600 | Títulos de tarjetas |
| Body / label | Inter | 13px | 400 | Texto de interfaz general |
| Caption | Inter | 11px | 400 | Fechas, metadata |
| Metric value (large) | Bebas Neue | 36px | 400 | KPI principal en tarjetas grandes |
| Metric value (table) | JetBrains Mono | 13px | 500 | Valores numéricos en tabla |
| Button | Inter | 13px | 700 | Mayúsculas siempre |
| Badge / tag | Inter | 10px | 700 | Estado, error/warning |

### Tema claro — una sola familia

**Inter es la única familia** (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`), aprovechando su eje de peso variable (100–900+). Sin Bebas Neue, sin monoespaciada: los valores numéricos usan Inter en peso alto (≥700) en su lugar.

| Rol | Tamaño | Peso | Line-height | Uso |
|---|---|---|---|---|
| Display | 56–68px | 820 | 0.98 | Título principal |
| H1 | 40–48px | 780 | 1.05 | Título de página |
| H2 | 28–36px | 700 | 1.1 | Título de sección, nombre de sitio |
| H3 | 17–20px | 700 | 1.3 | Título de card |
| H4 | 14–15px | 700 | 1.4 | Subtítulo de card |
| Body | 15–16px | 400 | 1.6 | Párrafo general |
| Body Small | 13–14px | 400 | 1.5 | Texto de apoyo |
| Label / Eyebrow | 11–12px | 760 | 1.2 | Mayúsculas, tracking `0.06em`, color `#666B73` |
| Metric Value | 28–40px | 700–800 | 1.0 | Valor numérico principal |
| Caption | 11px | 400 | 1.4 | Fechas, fuentes de datos |

**Reglas propias del tema claro**: no usar italic en interfaz de datos; no más de dos tamaños de fuente por card.

### Reglas compartidas

- Las cifras de métricas usan siempre `font-variant-numeric: tabular-nums`.
- El valor `0` explícito se muestra con `--text-zero`: visible pero apagado frente a un valor real.
- Las etiquetas de sección van en mayúsculas con tracking amplio en ambos temas (`0.12em` oscuro / `0.06em` claro).

### Puente de tokens de fuente (para que el mismo CSS sirva a ambos temas)

| Token | Tema oscuro | Tema claro |
|---|---|---|
| `--font-display` | `'Bebas Neue', 'Impact', sans-serif` | `'Inter', -apple-system, 'Segoe UI', sans-serif` |
| `--font-ui` | `'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif` | igual (sin cambio) |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', 'Courier New', monospace` | alias a `--font-ui` (Inter tabular-nums en vez de monoespaciada) |

---

## 4. Resto de secciones — qué cambia y qué es compartido

### 4.1 Espaciado

**Compartido en su totalidad.** La escala base-4px es idéntica en px entre ambos temas: `space-1`(4) a `space-12`(48). El tema claro añade dos pasos adicionales para separaciones editoriales de página completa que el oscuro (una consola de una sola pantalla) no necesita:

| Token | Valor | Tema |
|---|---|---|
| `space-1` … `space-12` | 4px … 48px | Compartido |
| `space-16` | 64px | Solo tema claro (padding de sección vertical desktop) |
| `space-20` | 80px | Solo tema claro (separación entre bloques principales) |

### 4.2 Bordes y radios

**Cambia.** Los radios difieren en valor entre temas y, además, el tema claro introduce una forma que el oscuro no usa: el badge en píldora.

| Elemento | Tema oscuro | Tema claro |
|---|---|---|
| Botón / input | `--radius-md` = 8px | `--radius-md` = 7px |
| Card | `--radius-lg` = 12px | `--radius-lg` = 10px |
| Modal / drawer | `--radius-xl` = 16px | `--radius-xl` = 12px |
| Badge / indicador de fila | `--radius-sm` = 4px | `--radius-sm` = 6px, pero el **badge de estado usa `--radius-pill` (999px)**, no `--radius-sm` |

`--radius-pill` (999px) es un token nuevo, compartido y con el mismo valor en ambos temas — solo lo consume el componente Badge, y solo en tema claro (ver 4.4).

### 4.3 Iconografía

**Cambia el peso visual, se comparte la librería.** Para no cargar dos librerías de iconos distintas en la misma app, Faro usa **Phosphor Icons** en los dos temas, cambiando solo el *weight*:

| | Tema oscuro | Tema claro |
|---|---|---|
| Librería | Phosphor Icons | Phosphor Icons (misma) |
| Weight | `duotone` (profundidad sobre fondo oscuro) | `regular` / trazo fino (editorial, sin relleno) |
| Tamaño interfaz | 20px | 16px en datos, 20px en navegación |
| Tamaño tablas/listas | 16px | — |
| Color | Semántico (`--status-*`), nunca gris neutro | `currentColor`, heredado del contexto |

Iconos por concepto (compartido, ambos temas):

| Concepto | Icono |
|---|---|
| Sitio web | `globe` |
| Search Console | `magnifying-glass-plus` |
| PageSpeed / rendimiento | `gauge` |
| Seguridad | `shield-check` |
| Palabras clave / SEO | `trend-up` |
| Oportunidad SEO | `lightning` |
| Error / fallo de fuente | `warning-circle` |
| Reintentar | `arrows-clockwise` |
| Informe generado | `check-circle` |
| Notificación por email | `envelope` |
| Histórico | `clock-clockwise` |

### 4.4 Componentes

**Botones — estructura compartida, tratamiento distinto**

Ambos temas usan primario / secundario / destructivo con el mismo rol semántico y el mismo layout (`padding`, `border-radius` por tema). Lo que cambia:

| | Tema oscuro | Tema claro |
|---|---|---|
| Texto | **MAYÚSCULAS**, `letter-spacing: 0.08em`, peso 700 | Frase normal ("Generar informe"), sin mayúsculas forzadas, peso 720–740 |
| Primario — fondo | `--brand-primary` (rosa) | `--brand-primary` (ahora = ink, ver §5) |
| Hover | Cambia de color (`--brand-primary-hover`) | Reduce opacidad (`opacity: 0.85` / `0.75` activo) |
| Botón "acento" | Existe (`--brand-accent`, ámbar) | No existe como tipo propio — usar el color de advertencia (`--status-warning`) solo si hace falta destacar una acción de atención |
| Botón de texto/enlace | No definido (usar `ghost`) | Definido: transparente, subrayado, `text-underline-offset: 3px` |
| Máximo por área de acción | No restringido explícitamente | Máx. 2 botones: uno primario, uno secundario |

**Tarjetas de métricas (KPI cards) — misma estructura, distinta superficie**

Ambos temas: eyebrow/label → valor numérico grande → tendencia (flecha + %) → caption. Compartido conceptualmente; difiere la superficie:

| | Tema oscuro | Tema claro |
|---|---|---|
| Fondo | `--gradient-card` (degradado sutil) | Plano, `#F7F7F5`, sin degradado |
| Valor | Bebas Neue 36px | Inter 700–800, 28–40px |
| Tendencia | Triángulo ▲/▼ verde/rojo | Flecha + % (mismo patrón, colores de estado del tema claro) |

**Tabla de registros históricos — compartido en mecanismo**

Cabecera en mayúsculas, `font-weight: 700`, `letter-spacing` amplio, y hover de fila resaltado: **compartido en ambos temas**. Cambia el tipo de letra de las celdas numéricas (`--font-mono` → alias Inter en claro, ver §3) y los colores (ver §2). El tema claro además alinea los valores numéricos a la derecha y da peso 600 a la primera columna (nombre de sitio) — regla adicional que el oscuro no especifica pero es coherente aplicar también ahí.

**Badges de estado — mismo concepto, distinta forma y copy**

| | Tema oscuro | Tema claro |
|---|---|---|
| Forma | Rectángulo, `--radius-sm` (4px) | Píldora, `--radius-pill` (999px) |
| Texto | Una palabra en MAYÚSCULAS ("CONECTADO", "FALLIDO") | Símbolo + palabra en frase ("✓ Correcto", "⚠ Atención", "✕ Crítico", "ℹ Info") |
| Tamaño | `padding: 2px 8px`, `font-size: 10px` | `padding: 3px 9px`, `font-size: 12px` |
| Fondo | `rgba(color-estado, 0.15)` | Token de fondo dedicado por estado (`Green 50`, `Amber 50`, `Red 50`, `Blue 50`) |

> **Nota de implementación:** los fondos `rgba(color, 0.15)` del tema oscuro están calculados sobre valores fijos; si se implementa el toggle, sustituir por `color-mix(in srgb, var(--status-x) 15%, transparent)` para que la misma regla CSS sirva en ambos temas sin duplicar reglas por badge.

**Alertas y banners inline — compartido en mecanismo**

Borde de color semántico + fondo tintado suave, en la parte superior de la sección afectada, nunca como modal: **compartido**. Solo cambian los colores (ver §2) y, en tema claro, el error se presenta además como observación descriptiva ("2 sitios requieren atención: errores de rastreo detectados") en vez de alarmista.

**Barra de progreso — solo definida en tema oscuro**

El tema claro no define un patrón propio (su filosofía evita ornamento decorativo). Recomendación: reutilizar el mismo componente, sustituyendo `--gradient-brand` por un relleno sólido (`var(--brand-primary)`) en tema claro, coherente con "sin degradados decorativos" (ver tokens §5).

**Campos de entrada — mecanismo distinto en el foco**

| | Tema oscuro | Tema claro |
|---|---|---|
| Borde normal | `1.5px solid var(--border-subtle)` | `1px solid var(--border-subtle)` |
| Foco | Borde de marca + **glow** (`box-shadow` de color) | Borde sólido `var(--border-strong)`, sin glow — usa el `outline` genérico de accesibilidad (`2px solid var(--border-strong)`, `outline-offset: 2px`) |

### 4.5 Layout

**Compartido:** estructura de dos columnas (sidebar + contenido), cabecera fija superior, grid de 4 columnas de KPI cards en pantalla ancha / 2 en compacta.

**Cambia (valores concretos):**

| | Tema oscuro | Tema claro |
|---|---|---|
| Ancho de sidebar | 200px | 240px (drawer overlay en mobile) |
| Alto de cabecera | 52px | 56px desktop / 52px mobile |
| Remate de sidebar | Barra arcoíris (`--gradient-rainbow`), 3px, estática | Ninguno — sin elemento decorativo |
| Fondo de cabecera | `--bg-panel` (sticky) | Blanco translúcido `rgba(255,255,255,0.94)` + `backdrop-filter: blur(8px)`, sticky |

> ⚠️ **Nota para quien mantenga la Constitución**: el Principio V de `.specify/memory/constitution.md` fija hoy "sidebar fija de 200px, cabecera de 52px" como un hecho único del sistema, sin distinguir tema. Con el tema claro documentado aquí, esos dos valores pasan a ser *por tema* (200px/52px en oscuro, 240px/56px en claro). Si se adopta este DESIGN.md tal cual, el Principio V debería enmendarse vía `/speckit-constitution` para reflejar que la dimensión depende del tema activo — no lo he cambiado yo mismo, ya que es una decisión de gobernanza, no de este documento.

**Nuevo — grid y breakpoints (aportado por el tema claro, aplica a ambos):**

Ninguna de estas reglas depende del color, así que se adoptan como infraestructura compartida:

- Ancho máximo de contenido: 1200px, centrado.
- Columnas: 12, gap 24px.
- Padding lateral de página: 24px (mobile) / 48px (tablet) / 64px (desktop).
- Grid de cards de sitios: 1 columna (mobile) → 2 (tablet) → 3 (desktop).
- Breakpoints: Mobile `< 640px` · Tablet `640–1024px` · Desktop `> 1024px`.

### 4.6 Animaciones (solo definidas en tema oscuro — aplican a ambos)

```
Duración estándar: 150ms (hover, focus)
Duración media:    250ms (aparición de cards, cambio de sección)
Duración lenta:    400ms (apertura de modal, carga de informe)
```

Comportamientos: barras de progreso avanzan de forma continua; badges cambian de color con `transition: background 250ms ease`; filas nuevas de tabla hacen `fade-in` + `slide-down` 300ms; iconos de reintento giran (`spin 1s linear infinite`). La barra arcoíris (solo tema oscuro) no anima, es estática.

### 4.7 Accesibilidad (compartido, con matices)

- Contraste mínimo: 4.5:1 texto de interfaz, 3:1 texto grande.
- El color nunca es el único canal de información: icono + texto siempre acompañan a un estado.
- El valor `0` explícito nunca se confunde con una celda vacía.
- Focus visible en todos los interactivos: anillo de marca en oscuro (`box-shadow` rosa), borde sólido + `outline` en claro.
- Tamaño de fuente mínimo: 11px en ambos temas.
- *(Adicional del tema claro)* Iconos decorativos con `aria-hidden="true"`; métricas numéricas con `aria-label` descriptivo.

### 4.8 Tono de los textos (compartido en principios, con calibración distinta)

Ambos temas comparten: mensajes de error que explican qué falló y qué sigue sin culpar al usuario; estados vacíos proactivos; sin exclamaciones en mensajes de éxito. El tema claro es ligeramente más neutro/descriptivo ("2 sitios requieren atención" en vez de un tono más "resuelto y directo"); el tema oscuro admite algo más de personalidad de marca. Ver los ejemplos originales de cada tema conservados íntegros en el historial de este documento si se necesita el detalle línea a línea; las reglas operativas (verbo en infinitivo en botones, mayúsculas en etiquetas de columna, tooltips de una frase) aplican igual en los dos.

---

## 5. Tokens CSS

```css
:root {
  /* ============ TEMA OSCURO (por defecto) ============ */

  /* Fondos */
  --bg-app:           #0F000A;
  --bg-panel:         #1A000F;
  --bg-card:          #240018;
  --bg-card-hover:    #2E001F;
  --bg-input:         #1A000F;

  /* Bordes */
  --border-subtle:    #4A0035;
  --border-strong:    #7A0058;

  /* Marca */
  --brand-primary:       #E91E8C;
  --brand-primary-hover: #FF4DB8;
  --brand-primary-dim:   #7A1050;
  --brand-accent:        #FF9E00;
  --brand-accent-hover:  #FFB833;

  /* Estados */
  --status-success: #00C896;
  --status-warning: #FF9E00;
  --status-error:   #FF3355;
  --status-info:    #3DB8FF;
  --status-neutral: #7A6A78;

  /* Texto */
  --text-primary:   #FFFFFF;
  --text-secondary: #C8A8BF;
  --text-muted:     #7A5A73;
  --text-on-brand:  #FFFFFF;
  --text-zero:      #4A3548;

  /* Degradados */
  --gradient-brand:   linear-gradient(135deg, #E91E8C 0%, #7B2FF7 100%);
  --gradient-rainbow: linear-gradient(90deg, #FF0054, #FF4500, #FFB800, #00C896, #3DB8FF, #7B2FF7, #E91E8C);
  --gradient-card:    linear-gradient(160deg, #240018 0%, #1A000F 100%);

  /* Radios */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-pill: 999px; /* compartido; solo lo usa el badge en tema claro */

  /* Espaciado */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px; /* compartido; principalmente usado en tema claro */
  --space-20: 80px; /* compartido; principalmente usado en tema claro */

  /* Tipografía */
  --font-display: 'Bebas Neue', 'Impact', sans-serif;
  --font-ui:      'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}

/* ============ TEMA CLARO — solo los tokens que cambian ============ */
[data-theme="light"] {
  /* Fondos */
  --bg-app:        #FFFFFF;
  --bg-panel:      #F7F7F5;
  --bg-card:       #FFFFFF;
  --bg-card-hover: #F7F7F5;
  --bg-input:      #FFFFFF;

  /* Bordes */
  --border-subtle: #DEDED9;
  --border-strong: #101114;

  /* Marca — el tema claro no usa rosa: su "primario" es ink */
  --brand-primary:       #101114;
  --brand-primary-hover: #343537; /* aproxima ink al 85% de opacidad sobre blanco */
  --brand-primary-dim:   #F4F4F2;
  --brand-accent:        #B45309; /* sin botón "acento" propio; se reutiliza el ámbar de advertencia */
  --brand-accent-hover:  #92400E;

  /* Estados */
  --status-success: #108043;
  --status-warning: #B45309;
  --status-error:   #DC2626;
  --status-info:    #1D4ED8;
  --status-neutral: #666B73;

  /* Texto */
  --text-primary:   #101114;
  --text-secondary: #666B73;
  --text-muted:     #9CA3AF; /* aproximado: DESIGNdia.md no distingue secondary de muted */
  --text-on-brand:  #FFFFFF;
  --text-zero:      #9CA3AF;

  /* Degradados — el tema claro evita ornamento decorativo: fallback a color sólido */
  --gradient-brand:   linear-gradient(135deg, #101114 0%, #101114 100%);
  --gradient-rainbow: none; /* la barra arcoíris es exclusiva del tema oscuro */
  --gradient-card:    linear-gradient(160deg, #FFFFFF 0%, #FFFFFF 100%);

  /* Radios */
  --radius-sm: 6px;
  --radius-md: 7px;
  --radius-lg: 10px;
  --radius-xl: 12px;

  /* Tipografía — una sola familia (Inter) para todo */
  --font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:    'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif;
}
```

---

## 6. Componente: toggle día/noche

Botón en la cabecera (`.header-bar`), junto al nombre de la app, que alterna `data-theme` en `<html>`, persiste la elección en `localStorage` y la aplica al cargar sin parpadeo de tema incorrecto (FOUC).

### Markup (en el partial de cabecera)

```html
<header class="header-bar">
  <span class="app-title">FARO</span>
  <button id="theme-toggle" class="btn-ghost" type="button" aria-label="Cambiar a tema claro" aria-pressed="false">
    <i class="ph ph-moon" id="theme-toggle-icon" aria-hidden="true"></i>
  </button>
</header>
```

### Aplicar el tema guardado antes del primer pintado (evita FOUC)

Debe ejecutarse de forma síncrona en `<head>`, antes de que se pinte el `<body>`:

```html
<script>
  (function () {
    if (localStorage.getItem('faro-theme') === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
</script>
```

### Lógica del botón (JS mínimo de cliente, sin framework)

```js
function initThemeToggle() {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function apply(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    btn.setAttribute('aria-pressed', String(theme === 'light'));
    btn.setAttribute('aria-label', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    document.getElementById('theme-toggle-icon').className = theme === 'light' ? 'ph ph-sun' : 'ph ph-moon';
  }

  var current = localStorage.getItem('faro-theme') || 'dark';
  apply(current);

  btn.addEventListener('click', function () {
    current = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('faro-theme', current);
    apply(current);
  });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
```

**Notas de implementación** (para cuando se traslade este componente al código, fuera del alcance de este documento):
- El snippet de `<head>` iría en `src/views/layout.ejs`, antes del `<link rel="stylesheet" href="/style.css">`.
- `initThemeToggle()` iría en `public/app.js`, junto al resto de JS mínimo de cliente (Principio I de la Constitución: sin framework, sin dependencia añadida — usa solo `localStorage` y el DOM).
- Sin tema guardado, Faro arranca en oscuro (`current = 'dark'` por defecto), coherente con que `:root` ya es el tema oscuro sin necesidad de atributo.

---

*Versión 2.0 — septiembre 2026 — Faro / elGriegoNET® · Tema oscuro y tema claro unificados en un único sistema de diseño.*
