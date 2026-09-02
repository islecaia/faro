# Especificación de Feature: Automatización del informe mensual de métricas SEO/rendimiento por sitio web

**Nombre de la aplicación**: Faro
**Rama**: `002-informe-web-railway`
**Repo**: https://github.com/islecaia/Faro.git
**URL producción**: https://faro.up.railway.app
**Creada**: 2026-08-31
**Estado**: Borrador
**Stack**: Node.js + Express + PostgreSQL, desplegada en Railway
**Input**: Transcripción automática (whisper) de los primeros 18 minutos de `2026-08-29 10-21-00_primeros18min.mp3`, en la que el usuario explica su proceso actual, totalmente manual, de recopilación de métricas SEO y de rendimiento de uno o varios sitios web para un informe mensual.

> **Nota sobre la fuente**: la transcripción automática del audio contenía errores de reconocimiento (nombres de herramientas, cifras y algunas frases poco claras). Todos los puntos ambiguos detectados en el borrador inicial se han revisado y confirmado directamente con el usuario.

---

## Arquitectura y capas de salida

El sistema tiene tres capas de salida para cada informe mensual generado:

```
APIs externas → Node.js (recogida + procesado) → PostgreSQL (almacenamiento)
                                                        ↓
                                          Google Sheets (export/registro)
                                          Dashboard web  (visualización)
                                          Email cliente  (formulario + plantilla)
```

**PostgreSQL** actúa como fuente de verdad interna y permite la comparativa con el mes anterior.

**Google Sheets** es creada desde cero por la propia aplicación (el usuario no necesita crearla previamente). Cada registro mensual se escribe como una nueva fila con la fecha de corte y todas las métricas del periodo.

**Dashboard web** (básico): tabla de registros mensuales y métricas clave por sitio, dentro de la propia aplicación Express.

**Formulario de informe para cliente**: el usuario rellena (o revisa datos ya precargados) campos de texto y números que se insertan en una plantilla de email predefinida por secciones, y con un botón lo envía al correo del cliente del sitio.

---

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de Usuario 1 - Registro automático de las métricas mensuales en una hoja de cálculo (Prioridad: P1)

Como gestor de sitios web que prepara un informe mensual de rendimiento y SEO, quiero que las métricas clave de cada sitio (impresiones, clics, visitas, desglose de canales de tráfico) se registren automáticamente en una fila de una hoja de cálculo con la fecha correspondiente, para no tener que copiarlas a mano desde cada herramienta cada mes.

**Por qué esta prioridad**: es el dolor principal descrito por el usuario — hoy todo el proceso es manual, campo a campo, y es lo que más tiempo le consume, especialmente al escalar a varios sitios/clientes. Sin esto, el resto de la automatización no tiene base sobre la que apoyarse.

**Test independiente**: se puede probar generando el registro de un mes para un sitio y comprobando que los valores aparecen correctamente en la fila de la fecha correspondiente de la hoja de cálculo, sin intervención manual.

**Escenarios de aceptación**:
1. **Dado** que ha llegado la fecha de corte mensual (p. ej. el día 30) para un sitio web dado de alta, **Cuando** se genera el informe del mes, **Entonces** se añade una nueva fila con esa fecha y se rellenan las columnas de métricas correspondientes (impresiones, clics, visitas, % de tráfico directo, % de tráfico orgánico, % de redes sociales, % de referidos) con los valores de ese periodo.
2. **Dado** que una métrica numérica concreta no tiene actividad en el periodo (por ejemplo 0 referidos), **Cuando** se registra la fila del mes, **Entonces** el sistema escribe explícitamente el valor `0` en esa columna en lugar de dejarla en blanco. Esta regla aplica a todas las métricas numéricas del registro mensual (impresiones, clics, visitas, % de canales, rendimiento, incidencias de seguridad, etc.).
3. **Dado** que se gestionan varios sitios web, **Cuando** se genera el informe mensual, **Entonces** cada sitio registra su fila de forma independiente, sin mezclar datos entre sitios.
4. **Dado** un sitio web que genera su primer registro mensual (sin mes anterior), **Cuando** se genera el informe, **Entonces** la fila se registra con normalidad y las columnas de comparativa con el mes anterior quedan sin aplicar (no se muestra variación, al no existir un periodo previo con el que comparar).
5. **Dado** que se genera el informe de un mes para un sitio que ya tenía una fila registrada de ese mismo mes, **Cuando** se ejecuta de nuevo la generación, **Entonces** el sistema añade una fila adicional con los nuevos valores, conservando la fila anterior como histórico (nunca sobrescribe ni bloquea).

### Historia de Usuario 2 - Recogida de datos vía API en lugar de visita manual a cada sitio (Prioridad: P1)

Como gestor de varios sitios web, quiero que el sistema obtenga las métricas directamente de las herramientas de origen (Google Site Kit, Search Console, Squirrly SEO/Ubersuggest, Google PageSpeed Insights y Security Ninja) sin tener que entrar manualmente en el panel de cada sitio, para poder escalar el proceso a muchos sitios sin perder tiempo.

**Por qué esta prioridad**: se eleva a P1 porque, sin la recogida automática de datos de origen, la Historia 1 ("registro automático") seguiría dependiendo de que alguien copie los valores a mano desde cada herramienta — no sería realmente automática. El usuario ha confirmado que quiere las cinco fuentes mencionadas en el audio integradas desde la primera versión, no en una fase posterior.

**Test independiente**: se puede probar conectando una fuente de datos concreta y comprobando que el sistema recupera el valor de una métrica sin que el usuario visite manualmente el panel de esa herramienta.

**Escenarios de aceptación**:
1. **Dado** que un sitio tiene configuradas sus cinco fuentes de datos (Site Kit, Search Console, Squirrly SEO/Ubersuggest, PageSpeed Insights, Security Ninja), **Cuando** llega la fecha de generación del informe, **Entonces** el sistema recupera de cada fuente las métricas correspondientes sin intervención manual del usuario.
2. **Dado** que una fuente de datos falla o no responde durante la recogida, **Cuando** el sistema lo detecta, **Entonces** reintenta la petición automáticamente hasta 3 veces y, si tras esos 3 reintentos sigue fallando, avisa al usuario por email y marca la celda/fila afectada en la hoja, indicando qué fuente y qué sitio están afectados, sin bloquear la generación del resto del informe.

### Historia de Usuario 3 - Identificación de oportunidades SEO a partir del ranking de palabras clave (Prioridad: P2)

Como gestor de SEO de un sitio web, quiero que el sistema señale qué palabras clave con volumen de búsqueda relevante están posicionadas por debajo del top 3 (o han aparecido recientemente en el ranking), para saber en qué artículos conviene trabajar (crear o mejorar contenido) sin revisar manualmente cada palabra clave.

**Por qué esta prioridad**: aporta el valor de negocio final (decidir qué contenido priorizar), pero depende de que existan datos de ranking ya recogidos (Historia 2) para poder analizarlos.

**Test independiente**: se puede probar cargando un conjunto de palabras clave con su posición y volumen de búsqueda, y comprobando que el sistema devuelve la lista de oportunidades (palabras clave relevantes fuera del top 3) esperada.

**Escenarios de aceptación**:
1. **Dado** un listado de palabras clave posicionadas de un sitio con su volumen de búsqueda y posición actual, **Cuando** se ejecuta el análisis de oportunidades, **Entonces** el sistema devuelve las palabras clave con volumen de búsqueda igual o superior a 50 búsquedas/mes que no están en el top 3, junto a su posición actual.
2. **Dado** que aparece una palabra clave nueva en el ranking que antes no se rastreaba, **Cuando** se ejecuta el análisis, **Entonces** el sistema la incluye en la lista de oportunidades junto con su posición e impresiones.
3. **Dado** que una palabra clave ya está en el top 3, **Cuando** se ejecuta el análisis, **Entonces** esa palabra clave no aparece en la lista de oportunidades (se considera ya optimizada).

### Historia de Usuario 4 - Captura de evidencia visual del informe (Prioridad: P3)

Como gestor de sitios web, quiero que, al generarse el informe mensual, el sistema guarde también una captura de pantalla de las métricas de origen (por ejemplo, del ranking de palabras clave), para tener evidencia visual del dato sin tener que hacerlo manualmente.

**Por qué esta prioridad**: es una mejora sobre el informe base (Historias 1 y 2); aporta valor pero el informe funciona sin ella.

**Test independiente**: se puede probar generando el informe de un mes y comprobando que queda asociado un archivo de captura de pantalla a esa fila/registro.

**Escenarios de aceptación**:
1. **Dado** que se está generando el informe mensual de un sitio, **Cuando** se completa el registro de métricas, **Entonces** el sistema guarda una captura de pantalla de la fuente de datos y la asocia a ese registro mensual.

### Historia de Usuario 5 - Dashboard web con tabla y métricas clave por sitio (Prioridad: P1)

Como gestor de sitios web, quiero ver en la propia aplicación un dashboard básico con la tabla de registros mensuales y las métricas clave de cada sitio, para poder revisar el estado de todos los sitios sin salir de la herramienta.

**Escenarios de aceptación**:
1. **Dado** que hay registros mensuales almacenados en la base de datos, **Cuando** accedo al dashboard, **Entonces** veo una tabla con los registros ordenados por fecha, con las métricas clave de cada sitio (impresiones, clics, visitas, desglose de canales, rendimiento, seguridad).
2. **Dado** que gestiono varios sitios, **Cuando** accedo al dashboard, **Entonces** puedo filtrar o seleccionar un sitio concreto para ver solo sus registros.

### Historia de Usuario 6 - Formulario de informe para cliente con envío por email (Prioridad: P1)

Como gestor de un sitio web, quiero rellenar un formulario con los datos del mes (o revisar los datos ya precargados automáticamente) y enviarlo formateado como email al cliente del sitio, para no tener que redactar el informe a mano cada mes.

**Test independiente**: se puede probar rellenando el formulario con datos de prueba y comprobando que el email generado contiene los valores correctos en cada sección de la plantilla.

**Escenarios de aceptación**:
1. **Dado** que existe un registro mensual para un sitio, **Cuando** accedo al formulario de informe de ese sitio, **Entonces** los campos del formulario se precargan con los datos del registro mensual correspondiente.
2. **Dado** que el formulario está relleno, **Cuando** pulso "Enviar informe", **Entonces** el sistema genera el email aplicando los datos a la plantilla y lo envía al email del cliente del sitio.
3. **Dado** que el email se envía correctamente, **Cuando** el proceso termina, **Entonces** el sistema confirma el envío al usuario y registra la fecha de envío.

---

## Formulario de informe para cliente — Campos y plantilla de email

### Campos del formulario

El formulario permite rellenar (o revisar datos precargados) los siguientes campos, que se insertan en posiciones concretas de la plantilla de email:

**Cabecera**
- Email del cliente (destinatario del email)
- Nombre del sitio / cliente (p. ej. "B&B")

**Tráfico & Visitas — Impresiones**
- Valor numérico de impresiones del mes
- Porcentaje de variación vs mes anterior (positivo o negativo, ej: `+122%` / `-31%`)
- Texto generado: `620 (+122% vs mes anterior)`

**Tráfico & Visitas — Clics**
- Valor numérico de clics del mes
- Porcentaje de variación vs mes anterior
- Texto generado: `11 (-31% vs mes anterior)`

**Desglose de canales de tráfico**
- Búsquedas Directas (número en #)
- Búsquedas Organic Search (número en %)
- Búsquedas RSS (número en %)
- Búsquedas Referrals (número en %)
- Búsquedas Other (número en %)

**Ranking actual**
- Selector de tendencia: "Mejorando gradualmente" / "Bajando ligeramente" / "Manteniéndose estable"
- Campo de texto libre para comentario sobre el ranking

**Oportunidades SEO identificadas**
- Oportunidad 1 (texto libre)
- Oportunidad 2 (texto libre)
- Oportunidad 3 (texto libre)

**Rendimiento técnico**
- Puntuación Mobile (número, ej: `72`)
- Calificación Mobile: selector "malo" / "mejorable" / "bueno" / "excelente"
- Puntuación Desktop (número)
- Calificación Desktop: selector "malo" / "mejorable" / "bueno" / "excelente"

**Seguridad y estado general**
- Estado general del sitio (texto libre)
- Número de ataques bloqueados en el periodo
- Número de amenazas detectadas
- Texto personalizado / notas para el cliente (campo libre)

### Secciones de la plantilla de email

La plantilla de email está dividida en secciones numeradas. Los datos del formulario se insertan en los placeholders correspondientes de cada sección:

**#1 FUENTES DE TRÁFICO**
Muestra el desglose porcentual de canales:
- Búsquedas directas: X%
- Búsquedas orgánicas: X%
- Redes sociales: X%
- Referrals: X%
- Otras: X%

**#2 SEGURIDAD Y ESTADO GENERAL**
- Estado general de la web (segura / con incidencias)
- Número de ataques bloqueados en el mes
- Número de amenazas detectadas
- Texto personalizado / notas del gestor para ese cliente

**#3 TRÁFICO Y VISITAS**
- Impresiones del mes + % de variación vs mes anterior
- Clics del mes + % de variación vs mes anterior

**#4 FUENTES DE TRÁFICO** (detalle en contexto narrativo)
- Desglose de canales de nuevo, integrado en el cuerpo del email con contexto explicativo:
  - Búsquedas directas: X%
  - Búsquedas orgánicas: X%
  - Redes sociales: X%
  - Referrals: X%
  - Otras: X%

**#5 POSICIONAMIENTO GOOGLE - SEO**
- Tendencia del ranking actual (Mejorando gradualmente / Bajando ligeramente / Manteniéndose estable)
- Comentario sobre el ranking
- Oportunidades identificadas (hasta 3)
- Rendimiento técnico Mobile: puntuación + calificación
- Rendimiento técnico Desktop: puntuación + calificación

---

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **FR-001**: El sistema DEBE registrar, para cada sitio web dado de alta, una fila mensual con la fecha de corte y el conjunto de métricas definidas (impresiones, clics, visitas y desglose porcentual de canales de tráfico).
- **FR-002**: El sistema DEBE escribir el valor `0` de forma explícita en cualquier métrica numérica cuando no haya actividad en el periodo, en lugar de dejar la celda vacía.
- **FR-003**: El sistema DEBE mantener el histórico de filas mensuales por sitio, mostrando tanto el valor absoluto como el porcentaje de variación respecto al periodo anterior; cuando no exista periodo anterior (primer mes de un sitio), la variación queda sin aplicar.
- **FR-004**: El sistema DEBE identificar como "oportunidad" toda palabra clave con volumen de búsqueda igual o superior a 50 búsquedas/mes que no esté en el top 3 del ranking.
- **FR-005**: El sistema DEBE distinguir en el ranking de palabras clave al menos tres tramos de posición (top 100, top 10, top 3) y contar cuántas palabras clave hay en cada tramo.
- **FR-006**: El sistema DEBE registrar la puntuación de rendimiento de la página obtenida de Google PageSpeed Insights, en versión de escritorio y en versión móvil de forma independiente.
- **FR-007**: El sistema DEBE registrar todas las incidencias de seguridad detectadas en el periodo (vulnerabilidades y malware) reportadas por la herramienta de seguridad, sin filtrar por gravedad.
- **FR-008**: El sistema DEBE guardar una captura de pantalla de la fuente de datos de origen asociada a cada registro mensual generado.
- **FR-009**: El sistema DEBE permitir gestionar varios sitios web de forma independiente, sin mezclar los datos de uno con los de otro, a partir de una lista de sitios activos mantenida por el usuario.
- **FR-010**: El sistema DEBE obtener las métricas directamente de las cinco fuentes de datos configuradas para cada sitio (Google Site Kit, Search Console, Squirrly SEO/Ubersuggest, Google PageSpeed Insights, Security Ninja), sin requerir que el usuario entre manualmente en el panel de cada herramienta.
- **FR-011**: El sistema DEBE reintentar automáticamente hasta 3 veces la recogida de datos de una fuente que falla y, si sigue fallando tras los 3 reintentos, DEBE avisar al usuario por email y además marcar la celda/fila afectada en la hoja de cálculo, indicando el sitio y la fuente afectados, sin bloquear el resto del informe.
- **FR-012**: El sistema DEBE conservar como histórico cada fila generada, incluso si se regenera el informe de un mes ya registrado (nunca sobrescribe ni elimina filas anteriores).
- **FR-013**: El sistema DEBE avisar al usuario cuando una métrica pasa a valer 0 por primera vez respecto al mes anterior (es decir, tenía actividad y ha caído a cero), pero DEBE evitar repetir el aviso en los meses siguientes mientras la métrica se mantenga en 0.
- **FR-014**: El sistema DEBE conservar el histórico de registros mensuales de un sitio dado de baja; dar de baja un sitio solo detiene la generación de nuevas filas, no elimina las existentes.
- **FR-015**: El sistema DEBE crear automáticamente la hoja de Google Sheets desde cero (sin que el usuario la cree previamente), con las columnas de métricas definidas, y escribir una nueva fila por sitio y mes en ella.
- **FR-016**: El sistema DEBE mostrar un dashboard web básico con una tabla de registros mensuales y las métricas clave por sitio, con posibilidad de filtrar por sitio.
- **FR-017**: El sistema DEBE ofrecer un formulario de informe para cliente con los campos definidos en la sección "Formulario de informe para cliente", con precarga automática de datos del registro mensual correspondiente cuando existan.
- **FR-018**: El sistema DEBE aplicar los datos del formulario a la plantilla de email estructurada por secciones (#1 al #5) y enviar el email resultante al correo del cliente del sitio.
- **FR-019**: El sistema DEBE registrar la fecha de envío del email de informe al cliente y confirmarlo al usuario en la interfaz.

### Entidades clave

- **Sitio web**: un sitio gestionado por el usuario del que se recogen métricas; tiene un identificador, nombre, email del cliente, estado (activo/dado de baja) y sus cinco fuentes de datos configuradas.
- **Fuente de datos**: origen externo de una o varias métricas. Listado cerrado para la primera versión: Google Site Kit (analítica), Google Search Console (impresiones/clics de buscador), Squirrly SEO/Ubersuggest (ranking de palabras clave), Google PageSpeed Insights (rendimiento) y Security Ninja (seguridad).
- **Registro mensual**: una fila de métricas de un sitio web para un periodo (mes) concreto, con su fecha de corte y los valores de todas las métricas de ese periodo.
- **Métrica**: un dato individual dentro de un registro mensual (impresiones, clics, visitas, % de canal de tráfico, puntuación de rendimiento, etc.), con su valor y el periodo al que pertenece.
- **Palabra clave**: término por el que posiciona un sitio web; tiene volumen de búsqueda, posición actual e impresiones asociadas.
- **Oportunidad SEO**: palabra clave señalada como candidata a mejora de contenido por su volumen de búsqueda y su posición actual.
- **Incidencia de seguridad**: alerta de vulnerabilidad o malware detectada en un sitio durante el periodo, que puede requerir revisión del usuario.
- **Captura de pantalla**: evidencia visual asociada a un registro mensual.
- **Informe de cliente**: email generado a partir del formulario y la plantilla, con fecha de envío registrada, asociado a un sitio y un registro mensual.

---

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: El tiempo que el usuario dedica a preparar el informe mensual de un sitio web, hoy superior a 1 hora por sitio, se reduce en al menos un 80% (quedando reducido a revisar y validar el informe ya generado, en lugar de recopilar los datos a mano).
- **SC-002**: El usuario deja de tener que copiar manualmente datos de cada herramienta de origen para completar el informe mensual de cada sitio.
- **SC-003**: El proceso de generación del informe puede escalar a varios sitios web sin que el tiempo dedicado por el usuario crezca de forma proporcional al número de sitios.
- **SC-004**: Todas las oportunidades SEO relevantes de un periodo quedan identificadas en el informe sin revisión manual palabra por palabra.
- **SC-005**: El usuario puede enviar el informe mensual al cliente del sitio directamente desde la aplicación, sin redactar el email a mano.
- **SC-006**: La hoja de Google Sheets se genera y actualiza automáticamente sin intervención del usuario.

---

## Casos límite

- Si una fuente de datos sigue fallando tras 3 reintentos automáticos (ver Historia 2, escenario 2), el sistema avisa por email y marca la fila afectada en la hoja, sin bloquear el resto del informe.
- Si se regenera el informe de un mes ya registrado, se añade una fila adicional y se conserva el histórico (ver Historia 1, escenario 5); no hay sobrescritura ni bloqueo.
- Si un sitio es nuevo y no tiene mes anterior, la comparativa queda sin aplicar en ese primer registro (ver Historia 1, escenario 4).
- Si una métrica registra 0 por primera vez en un sitio (el mes anterior tenía actividad y este mes cae a 0), el sistema avisa al usuario ese primer mes en que ocurre; en los meses siguientes en que la métrica se mantenga en 0 no se repite el aviso.
- Alta y baja de sitios web: el usuario mantiene una lista simple de sitios activos; el sistema solo genera informes para los sitios que estén en esa lista en el momento de la generación. Si un sitio se da de baja a mitad de mes, no se le exige generar una fila parcial de ese mes. Al dar de baja un sitio, su histórico de registros anteriores se conserva (no se elimina).
- Si el formulario de informe se envía sin que el usuario haya revisado los datos precargados, el sistema envía igualmente los datos del registro mensual existente; el usuario es responsable de la revisión antes de enviar.

---

## Suposiciones

- El proceso descrito es una herramienta de uso interno del propio usuario (o su equipo/agencia) para preparar informes de sus sitios o los de sus clientes, no una funcionalidad orientada a usuarios finales de esos sitios web.
- Hoy en día el usuario ya tiene acceso (cuentas/suscripciones) a las herramientas de origen mencionadas en el audio (analítica del sitio, buscador, ranking de palabras clave, rendimiento de página, seguridad); esta spec no cubre la contratación de esas herramientas, solo la automatización de la recogida de sus datos.
- La cadencia del informe es mensual, con fecha de corte a fin de mes, según se describe en el audio (agosto, septiembre, octubre...).
- La hoja de Google Sheets es creada por la aplicación desde cero; el usuario no necesita crearla previamente.
- La plantilla de email tiene cinco secciones fijas (#1 al #5) con placeholders predefinidos; el diseño de la plantilla queda fuera del alcance de esta spec (se asume que existe o se define en la implementación).
- Queda FUERA de alcance en esta primera versión: la simulación del comportamiento humano en la página (herramienta de tipo mapa de calor/grabación de sesión mencionada al final del audio) — el propio usuario la describe como "mucho trabajo" y no prioritaria ahora mismo.
- Queda FUERA de alcance: la elección de qué herramientas concretas sustituyen o complementan a las mencionadas; esta spec describe capacidades, no proveedores.
