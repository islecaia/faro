# Feature Specification: Informe mensual SEO/rendimiento automatizado

**Feature Branch**: `001-informe-mensual-seo`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "Herramienta interna para agencias que automatiza la recopilación, almacenamiento y entrega de informes mensuales de SEO y rendimiento web para múltiples sitios de clientes. Actor: Admin (usuario interno de la agencia). Historias: gestión de sitios, generación de informe mensual con 5 fuentes de datos y reintentos, dashboard con KPIs e histórico, formulario de informe de cliente con envío por email, alertas automáticas de fallos y métricas a cero, creación y actualización automática de Google Sheets. Restricciones: sin autenticación de usuarios, sin edición ni borrado de histórico, ceros explícitos, fallos de fuente no bloquean la generación."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión de sitios clientes (Priority: P1)

Como Admin de la agencia, quiero dar de alta, listar y dar de baja los sitios web de mis clientes (con su nombre, URL, email de contacto y los identificadores de sus fuentes de datos), para tener una lista única y controlada de qué sitios generan informe cada mes.

**Why this priority**: es la base sobre la que se apoya cualquier otra funcionalidad: sin un sitio dado de alta no hay informe que generar, ni dashboard que mostrar, ni email que enviar.

**Independent Test**: se puede probar dando de alta un sitio con sus datos, comprobando que aparece en el listado, y dándolo de baja después, comprobando que deja de aparecer entre los activos sin perder su información.

**Acceptance Scenarios**:

1. **Given** que el Admin accede al alta de sitios, **When** introduce nombre, URL, email del cliente y los identificadores de las fuentes de datos del sitio, **Then** el sitio queda registrado como activo y visible en el listado.
2. **Given** que existen varios sitios registrados, **When** el Admin accede al listado, **Then** ve todos los sitios activos con su nombre, URL y estado.
3. **Given** un sitio activo, **When** el Admin lo da de baja, **Then** el sitio deja de aparecer en el listado de sitios activos y deja de generar nuevos informes, pero su histórico de informes anteriores permanece accesible.

---

### User Story 2 - Generación automática del informe mensual (Priority: P1)

Como Admin, quiero lanzar la generación del informe del mes anterior para un sitio activo y que el sistema recoja por mí los datos de las cinco fuentes configuradas, para no tener que visitar manualmente cada herramienta ni copiar cifras a mano.

**Why this priority**: es el núcleo de valor de la herramienta — sustituye el proceso manual de recopilación que hoy consume la mayor parte del tiempo del Admin.

**Independent Test**: se puede probar lanzando la generación de un sitio con sus cinco fuentes configuradas y comprobando que se crea un registro mensual con los valores recuperados de cada fuente, sin que el Admin introduzca ningún dato a mano.

**Acceptance Scenarios**:

1. **Given** un sitio activo con sus cinco fuentes de datos configuradas, **When** el Admin lanza la generación del informe del mes anterior, **Then** el sistema recupera de cada fuente sus métricas correspondientes y las guarda en un nuevo registro mensual asociado a ese sitio y periodo.
2. **Given** que una fuente de datos falla al intentar recuperar sus métricas, **When** el sistema lo detecta, **Then** reintenta la petición hasta un máximo de 3 veces antes de darla por fallida.
3. **Given** que una fuente sigue fallando tras los 3 reintentos, **When** el sistema finaliza la recogida, **Then** marca esa fuente como fallida en el registro, continúa generando el resto del informe con las demás fuentes, y no bloquea ni cancela la generación.
4. **Given** que una métrica numérica no tiene actividad en el periodo, **When** se guarda el registro mensual, **Then** el valor se guarda explícitamente como `0`, nunca como campo vacío o nulo.
5. **Given** que ya existe un registro mensual de ese sitio y ese mismo mes, **When** el Admin vuelve a lanzar la generación, **Then** el sistema añade un nuevo registro con los valores actuales sin modificar ni eliminar el registro anterior.

---

### User Story 3 - Actualización automática de Google Sheets (Priority: P1)

Como Admin, quiero que cada informe mensual generado quede también reflejado en una hoja de cálculo de Google Sheets por sitio, creada automáticamente por el sistema, para tener un registro externo y compartible sin tener que crearlo ni mantenerlo a mano.

**Why this priority**: es la salida de datos que el Admin ya usa hoy como registro de referencia; automatizarla elimina otro paso manual del proceso mensual.

**Independent Test**: se puede probar generando el primer informe de un sitio nuevo y comprobando que se crea una hoja de cálculo con las columnas de métricas, y generando un segundo informe (de otro mes) y comprobando que se añade como fila nueva en esa misma hoja.

**Acceptance Scenarios**:

1. **Given** un sitio que genera su primer informe mensual, **When** se completa la recogida de datos, **Then** el sistema crea automáticamente una hoja de cálculo para ese sitio con las columnas de métricas correspondientes.
2. **Given** un sitio que ya tiene su hoja de cálculo creada, **When** se genera un nuevo informe mensual, **Then** el sistema añade una fila nueva a esa misma hoja con los datos del periodo, sin sobrescribir filas anteriores.

---

### User Story 4 - Dashboard con KPIs e histórico (Priority: P1)

Como Admin, quiero ver en un panel los indicadores clave del mes actual de cada sitio y una tabla con el histórico completo de informes, incluyendo las oportunidades SEO detectadas, para revisar el estado de todos mis clientes sin salir de la herramienta.

**Why this priority**: da visibilidad inmediata sobre el trabajo ya automatizado; sin esto, los datos recogidos quedarían solo en la base de datos y en Sheets, sin un punto de revisión rápido dentro de la propia herramienta.

**Independent Test**: se puede probar generando informes de prueba para uno o más sitios y comprobando que el dashboard muestra los KPIs del mes actual y la tabla histórica correspondiente.

**Acceptance Scenarios**:

1. **Given** que existen registros mensuales generados, **When** el Admin accede al dashboard, **Then** ve los indicadores clave del mes más reciente de cada sitio (impresiones, clics, visitas y puntuación de rendimiento móvil).
2. **Given** que existen varios registros históricos, **When** el Admin accede al dashboard, **Then** ve una tabla con todos los registros mensuales ordenados por fecha, filtrable por sitio.
3. **Given** que un sitio tiene palabras clave rastreadas en posición 4 a 10, **When** el Admin accede al dashboard, **Then** ve esas palabras clave señaladas como oportunidades SEO junto a su posición actual.

---

### User Story 5 - Formulario de informe de cliente con envío por email (Priority: P1)

Como Admin, quiero rellenar (o revisar datos ya precargados) un formulario con los resultados del mes de un sitio y enviarlo como email formateado al cliente, para entregar el informe sin redactarlo a mano cada vez.

**Why this priority**: es el paso final que entrega el valor del informe al cliente de la agencia; sin él, los datos automatizados nunca llegarían a quien los necesita.

**Independent Test**: se puede probar abriendo el formulario de un registro mensual existente, comprobando que los campos aparecen precargados, y enviándolo, comprobando que el email recibido contiene los datos correctos en cada una de sus cinco secciones.

**Acceptance Scenarios**:

1. **Given** que existe un registro mensual para un sitio, **When** el Admin abre el formulario de informe de ese registro, **Then** los campos del formulario aparecen precargados con los datos de ese registro.
2. **Given** que el Admin ha revisado (y opcionalmente ajustado) el formulario, **When** confirma el envío, **Then** el sistema genera el email aplicando los datos a las cinco secciones fijas de la plantilla y lo envía al email del cliente registrado para ese sitio.
3. **Given** que el email se ha enviado correctamente, **When** el proceso termina, **Then** el sistema confirma el envío al Admin y registra la fecha de envío junto al registro mensual correspondiente.

---

### User Story 6 - Alertas automáticas de incidencias (Priority: P2)

Como Admin, quiero recibir un email automático cuando una fuente de datos falla de forma persistente o cuando una métrica que tenía actividad cae a cero, para poder revisarlo sin tener que auditar cada informe manualmente en busca de anomalías.

**Why this priority**: añade seguridad y confianza sobre el proceso ya automatizado (Historia 2), pero el sistema puede generar y entregar informes sin ella; es una capa de vigilancia adicional, no la generación en sí.

**Independent Test**: se puede probar forzando el fallo repetido de una fuente y comprobando que llega un email de aviso, y por separado registrando un mes con una métrica en 0 tras un mes anterior con actividad, comprobando que también llega un aviso.

**Acceptance Scenarios**:

1. **Given** que una fuente de datos falla tras sus 3 reintentos automáticos, **When** el sistema finaliza la generación del informe, **Then** envía un email al Admin indicando qué sitio y qué fuente se han visto afectados.
2. **Given** que una métrica tenía actividad el mes anterior y pasa a valer 0 en el mes actual, **When** se guarda el nuevo registro, **Then** el sistema envía un email al Admin señalando esa caída a cero.
3. **Given** que una métrica ya lleva varios meses consecutivos en 0, **When** se genera un nuevo registro y sigue en 0, **Then** el sistema NO repite el aviso para esa métrica ese mes.

### Edge Cases

- Si un sitio genera su primer informe mensual (sin mes anterior registrado), no existe base de comparación: el registro se guarda con normalidad y no se muestra variación porcentual para ese primer periodo.
- Si el Admin regenera el informe de un mes ya registrado, se añade un registro adicional conservando el anterior como histórico; nunca se sobrescribe ni se bloquea la generación.
- Si un sitio se da de baja a mitad de mes, no se le exige un registro parcial de ese mes; su histórico de registros anteriores se conserva íntegro.
- Si el Admin envía el formulario de informe sin revisar los datos precargados, el sistema envía igualmente los datos tal cual están en el registro mensual; la revisión previa es responsabilidad del Admin.
- Si todas las fuentes de un sitio fallan en una misma generación, el sistema igualmente crea el registro mensual (marcando todas las fuentes como fallidas) en lugar de cancelar la generación por completo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir dar de alta un sitio web con nombre, URL, email del cliente y los identificadores de sus fuentes de datos.
- **FR-002**: El sistema DEBE mostrar un listado de los sitios activos con su información básica y estado.
- **FR-003**: El sistema DEBE permitir dar de baja un sitio, deteniendo la generación de nuevos informes para ese sitio sin eliminar sus registros históricos.
- **FR-004**: El sistema DEBE permitir al Admin lanzar manualmente la generación del informe del mes anterior para cualquier sitio activo.
- **FR-005**: El sistema DEBE recuperar, para cada sitio, las métricas de sus cinco fuentes de datos configuradas (Search Console, GA4 Analytics, herramienta de palabras clave, PageSpeed Insights y Security Ninja) sin intervención manual del Admin.
- **FR-006**: El sistema DEBE reintentar automáticamente hasta 3 veces la recogida de datos de una fuente que falla antes de darla por no disponible en ese ciclo.
- **FR-007**: El sistema DEBE marcar como fallida una fuente que no responde tras sus 3 reintentos, sin impedir que el resto del informe se genere con las demás fuentes.
- **FR-008**: El sistema DEBE guardar de forma explícita el valor `0` en cualquier métrica numérica sin actividad en el periodo, sin dejar campos vacíos o nulos.
- **FR-009**: El sistema DEBE conservar cada registro mensual generado como histórico inmutable: regenerar el informe de un mes ya existente añade un registro nuevo y nunca modifica ni elimina uno anterior.
- **FR-010**: El sistema DEBE mostrar, para cada registro mensual, tanto el valor absoluto como la variación porcentual respecto al mes anterior del mismo sitio, cuando exista un mes anterior con el que comparar.
- **FR-011**: El sistema DEBE crear automáticamente una hoja de cálculo de Google Sheets para un sitio en el momento en que se genera su primer informe mensual.
- **FR-012**: El sistema DEBE añadir una fila nueva a la hoja de cálculo del sitio correspondiente cada vez que se genera un informe mensual, sin sobrescribir filas anteriores.
- **FR-013**: El sistema DEBE mostrar un dashboard con los indicadores clave del mes más reciente por sitio (impresiones, clics, visitas, puntuación de rendimiento móvil).
- **FR-014**: El sistema DEBE mostrar en el dashboard una tabla histórica de todos los registros mensuales, filtrable por sitio.
- **FR-015**: El sistema DEBE señalar en el dashboard como "oportunidad SEO" toda palabra clave rastreada cuya posición actual esté entre 4 y 10 (ambos incluidos).
- **FR-016**: El sistema DEBE ofrecer un formulario de informe de cliente cuyos campos se precargan automáticamente con los datos del registro mensual seleccionado, cuando este exista.
- **FR-017**: El sistema DEBE permitir al Admin revisar y, si lo desea, ajustar los datos del formulario antes de confirmar el envío.
- **FR-018**: El sistema DEBE generar el email de informe de cliente aplicando los datos del formulario a las cinco secciones fijas de la plantilla (fuentes de tráfico, seguridad y estado general, tráfico y visitas, detalle narrativo de fuentes de tráfico, y posicionamiento Google/SEO) y enviarlo al email del cliente registrado para ese sitio.
- **FR-019**: El sistema DEBE registrar la fecha de envío del email de informe de cliente y confirmar el envío al Admin.
- **FR-020**: El sistema DEBE notificar al Admin por email cuando una fuente de datos falle tras sus 3 reintentos, indicando el sitio y la fuente afectados.
- **FR-021**: El sistema DEBE notificar al Admin por email la primera vez que una métrica pasa de tener actividad a valer 0 respecto al mes anterior, y DEBE evitar repetir ese aviso en los meses siguientes mientras la métrica se mantenga en 0.
- **FR-022**: El sistema NO DEBE requerir autenticación de usuarios, al ser una herramienta de uso interno de un único Admin por instalación.
- **FR-023**: El sistema NO DEBE permitir la edición ni el borrado manual de registros mensuales ya generados.

### Key Entities

- **Sitio web**: sitio gestionado por la agencia; tiene nombre, URL, email del cliente, estado (activo/dado de baja) y los identificadores de sus fuentes de datos configuradas.
- **Fuente de datos**: origen externo de métricas para un sitio. Conjunto cerrado de cinco: Search Console, GA4 Analytics, herramienta de palabras clave (Squirrly SEO/Ubersuggest), PageSpeed Insights y Security Ninja.
- **Registro mensual**: conjunto de métricas de un sitio para un periodo concreto (mes), con el estado de cada fuente en esa generación y, si aplica, la fecha de envío del informe de cliente.
- **Palabra clave**: término por el que posiciona un sitio, con su posición actual y, cuando aplica, su volumen de búsqueda.
- **Oportunidad SEO**: palabra clave señalada por estar en posición 4 a 10 del ranking, candidata a mejora de contenido.
- **Informe de cliente**: email generado a partir del formulario y la plantilla de cinco secciones, asociado a un sitio y a un registro mensual, con su fecha de envío.
- **Alerta**: aviso automático enviado al Admin por email, generado por un fallo de fuente tras 3 reintentos o por una métrica que cae a 0 por primera vez.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El tiempo que el Admin dedica a preparar el informe mensual de un sitio se reduce al menos un 80% frente al proceso manual actual, quedando reducido a revisar y confirmar el informe ya generado.
- **SC-002**: El 100% de los sitios activos con generación de informe completada tienen su registro disponible en el dashboard y su fila correspondiente en Google Sheets sin que el Admin copie ningún dato a mano entre herramientas.
- **SC-003**: El Admin puede completar el envío del informe de cliente en menos de 5 minutos desde que el registro mensual está disponible.
- **SC-004**: Cuando una fuente de datos falla, el resto del informe se genera igualmente en el 100% de los casos observados, sin bloqueo de la generación.
- **SC-005**: El Admin recibe una alerta automática ante cada fallo de fuente persistente o caída a cero de una métrica, sin necesidad de revisar manualmente cada informe en busca de anomalías. (Aplica una vez que US6/Alertas esté desplegado — segundo ciclo, no MVP.)
- **SC-006**: El proceso de generación de informes escala a múltiples sitios sin que el tiempo dedicado por el Admin crezca de forma proporcional al número de sitios gestionados.

## Assumptions

- La herramienta tiene un único tipo de usuario interno (Admin) por instalación; no hay roles adicionales ni acceso de los clientes finales a la aplicación, conforme a la restricción de "sin autenticación de usuarios".
- La generación del informe mensual se lanza manualmente por el Admin para el mes anterior ya cerrado; no se asume una programación automática por calendario en esta versión.
- PageSpeed Insights no requiere un identificador de fuente propio almacenado por sitio, ya que consulta directamente la URL del sitio que ya forma parte de sus datos básicos; las otras cuatro fuentes sí requieren su identificador configurado.
- La definición de "oportunidad SEO" de esta especificación (posición 4 a 10, sin filtro adicional por volumen de búsqueda) sustituye a cualquier definición previa basada en volumen mínimo de búsquedas.
- Regenerar el informe de un mes ya registrado añade un nuevo registro histórico en lugar de sobrescribir el anterior, en línea con la restricción de no permitir edición ni borrado de histórico.
- Dar de baja un sitio detiene únicamente la generación de nuevos informes; su histórico de registros y su hoja de Google Sheets ya creada permanecen accesibles.
- Se asume que el Admin ya cuenta con acceso (cuentas/credenciales) a las cinco herramientas de origen; esta especificación cubre la automatización de la recogida de sus datos, no la contratación de esas herramientas.
