# PlanIt — Requisitos funcionales de Release 2

**Versión de extracción:** 10/10/2026.  **Estado:** transcripción de fuentes funcionales, no diseño de solución.
**Alcance:** RF-R2-01 a RF-R2-07, con cuatro criterios de aceptación por RF (**7 RF, 28 CA**).

## Fuentes oficiales

- [Nueva planificación — RF R1 a R7](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.6cfgj0znk3o): ID, nombre, descripción, prioridad y usuarios.
- [Criterios de aceptación — R1 a R7](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.89mq08i5ups2): texto de cada CA.
- [Especificación técnica — R1 a R7](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.58du83a4qpv): material complementario; **no se copia en este archivo**.

## Criterio de mantenimiento

- Los textos de **nombre, descripción y criterios de aceptación** se transcriben del documento original. Los campos de actor y prioridad también proceden de «Nueva planificación».
- No modificar la intención ni la redacción de RF/CA para acomodarlas a una implementación. Proponer cambios de requisitos para aprobación antes de editarlos.
- Distinguir el requisito (qué debe cumplir el sistema) del plan (cómo implementarlo) y del estado/QA (qué se desarrolló y verificó).
- Si una formulación admite más de una interpretación, registrar la duda en el plan/status y consultarla; no reescribir el RF silenciosamente.
- La referencia temporal o de disponibilidad de un evento debe implementarse según las reglas ya aprobadas en docs/database.md; este archivo conserva las palabras originales incluso cuando son genéricas.

## Índice y trazabilidad

| RF | Nombre | Prioridad | Implementación R2 |
| --- | --- | --- | --- |
| [RF-R2-01](#rf-r2-01) | Consultar el detalle ampliado de un evento | Alta | Bloque 1 |
| [RF-R2-02](#rf-r2-02) | Explorar eventos recientes en Inicio | Alta | Bloque 1 |
| [RF-R2-03](#rf-r2-03) | Visualizar eventos agrupados por categoría | Media | Bloque 1 |
| [RF-R2-04](#rf-r2-04) | Visualizar mensajes del chat de un evento | Alta | Bloque 2 |
| [RF-R2-05](#rf-r2-05) | Enviar mensajes de texto al chat de un evento | Alta | Bloque 2 |
| [RF-R2-06](#rf-r2-06) | Consultar mi perfil | Media | Bloque 3 |
| [RF-R2-07](#rf-r2-07) | Consultar un centro de notificaciones | Media | Bloque 4 |

## RF-R2-01 — Consultar el detalle ampliado de un evento

- **Identificador:** `RF-R2-01`
- **Prioridad:** Alta
- **Usuario(s):** Usuarios autenticados
- **Descripción:** El sistema permitirá al usuario consultar la ficha completa de un evento, con descripción, horarios, ubicación, categoría, organizador e imágenes disponibles.

### Criterios de aceptación (texto original)

- **RF-R2-01.CA-01:** Al seleccionar un evento disponible, se muestra su título, descripción, fecha, hora, ubicación, categoría, organizador e imágenes asociadas cuando existan.
- **RF-R2-01.CA-02:** Los datos visualizados corresponden al evento seleccionado y son consistentes con la información persistida.
- **RF-R2-01.CA-03:** Cuando un campo opcional o una imagen no están disponibles, se presenta la información restante sin errores ni datos inventados.
- **RF-R2-01.CA-04:** Si el evento fue eliminado o el usuario ya no puede acceder, se muestra un estado informativo y no una ficha desactualizada.

## RF-R2-02 — Explorar eventos recientes en Inicio

- **Identificador:** `RF-R2-02`
- **Prioridad:** Alta
- **Usuario(s):** Usuarios autenticados
- **Descripción:** El sistema permitirá al usuario visualizar en la pantalla Inicio eventos recientes o próximos y acceder a sus fichas para evaluar su participación.

### Criterios de aceptación (texto original)

- **RF-R2-02.CA-01:** La pantalla Inicio presenta eventos recientes o próximos accesibles al usuario, con información suficiente para identificarlos.
- **RF-R2-02.CA-02:** Al seleccionar un evento de Inicio, se abre su detalle correspondiente.
- **RF-R2-02.CA-03:** Los eventos no disponibles o cancelados no se ofrecen como opciones activas de participación.
- **RF-R2-02.CA-04:** Cuando no existen eventos para mostrar, se presenta un mensaje de ausencia de resultados.

## RF-R2-03 — Visualizar eventos agrupados por categoría

- **Identificador:** `RF-R2-03`
- **Prioridad:** Media
- **Usuario(s):** Usuarios autenticados
- **Descripción:** El sistema permitirá al usuario explorar agrupaciones de eventos por categoría en Inicio, sin necesidad de aplicar todavía filtros de búsqueda avanzados.

### Criterios de aceptación (texto original)

- **RF-R2-03.CA-01:** Inicio muestra las categorías que tienen eventos disponibles y presenta los eventos dentro del grupo que corresponda.
- **RF-R2-03.CA-02:** Un evento aparece bajo una categoría coherente con la categoría registrada en su ficha.
- **RF-R2-03.CA-03:** El usuario puede seleccionar un elemento agrupado y acceder a su detalle.
- **RF-R2-03.CA-04:** Cuando una categoría no tiene eventos visibles, la interfaz no muestra información incorrecta ni elementos de una categoría distinta.

## RF-R2-04 — Visualizar mensajes del chat de un evento

- **Identificador:** `RF-R2-04`
- **Prioridad:** Alta
- **Usuario(s):** Participantes y organizadores de eventos
- **Descripción:** El sistema permitirá al organizador y a los asistentes confirmados consultar el chat y su historial desde la creación del evento; al finalizarse, cancelarse o archivarse, el historial autorizado permanecerá en modo sólo lectura.

### Criterios de aceptación (texto original)

- **RF-R2-04.CA-01:** El organizador y los participantes confirmados pueden abrir el chat desde que se publica el evento y consultar el historial; si el evento termina, se cancela o se archiva, el chat pasa a sólo lectura.
- **RF-R2-04.CA-02:** Los mensajes se muestran asociados al evento correcto, con identificación de su emisor y orden cronológico coherente.
- **RF-R2-04.CA-03:** Un usuario sin autorización para participar del chat no puede consultar sus mensajes, aunque intente acceder directamente al recurso.
- **RF-R2-04.CA-04:** Si la conversación está vacía, se presenta un estado vacío; ante un error de consulta, se informa el error.

## RF-R2-05 — Enviar mensajes de texto al chat de un evento

- **Identificador:** `RF-R2-05`
- **Prioridad:** Alta
- **Usuario(s):** Participantes y organizadores de eventos
- **Descripción:** El sistema permitirá al organizador y a los asistentes confirmados enviar y consultar mensajes de texto en el chat de un evento vigente; impedirá nuevos mensajes cuando el evento termine, se cancele o se archive.

### Criterios de aceptación (texto original)

- **RF-R2-05.CA-01:** Un participante autorizado puede enviar un mensaje de texto no vacío y verlo reflejado en el chat del evento.
- **RF-R2-05.CA-02:** El mensaje queda persistido con referencia al evento y a su emisor y puede recuperarse al reabrir el chat.
- **RF-R2-05.CA-03:** Se impide enviar mensajes vacíos o compuestos sólo por espacios.
- **RF-R2-05.CA-04:** Se impide enviar mensajes si el usuario no es organizador ni asistente confirmado, o si el evento está finalizado, cancelado o archivado; también se impide mediante acceso directo a los datos.

## RF-R2-06 — Consultar mi perfil

- **Identificador:** `RF-R2-06`
- **Prioridad:** Media
- **Usuario(s):** Usuarios autenticados
- **Descripción:** El sistema permitirá al usuario visualizar sus datos básicos de perfil y acceder desde esa sección a información asociada a su cuenta. La edición avanzada de imagen y privacidad se desarrollará en R5.

### Criterios de aceptación (texto original)

- **RF-R2-06.CA-01:** El usuario autenticado puede acceder a la sección de perfil desde la navegación principal.
- **RF-R2-06.CA-02:** La sección muestra los datos básicos correspondientes a su cuenta, sin confundirlos con los de otros usuarios.
- **RF-R2-06.CA-03:** Los datos reflejan los cambios que se hayan guardado previamente en su perfil.
- **RF-R2-06.CA-04:** Si ocurre un error al cargar el perfil, se informa sin mostrar información ajena o valores engañosos como datos reales.

## RF-R2-07 — Consultar un centro de notificaciones

- **Identificador:** `RF-R2-07`
- **Prioridad:** Media
- **Usuario(s):** Usuarios autenticados
- **Descripción:** El sistema permitirá al usuario acceder desde la aplicación a una bandeja de notificaciones y consultar los avisos que tenga registrados. La creación de avisos de cupo y movimientos de inscripciones se incorpora en R6.

### Criterios de aceptación (texto original)

- **RF-R2-07.CA-01:** El usuario autenticado puede abrir desde la aplicación una bandeja con los avisos registrados para su cuenta.
- **RF-R2-07.CA-02:** Cada aviso muestra su contenido y la referencia temporal necesaria para comprenderlo, si está disponible.
- **RF-R2-07.CA-03:** Los avisos de otras cuentas no aparecen ni pueden consultarse mediante acceso directo.
- **RF-R2-07.CA-04:** Si no tiene avisos registrados, se muestra un estado vacío; la bandeja no supone por sí misma la generación de nuevas notificaciones.

---

**Documentación relacionada:** [Plan técnico R2](../implementation/RELEASE_2_PLAN.md) · [Seguimiento R2](../implementation/RELEASE_2_STATUS.md) · [Guías visuales](../design/SCREENS.md).
