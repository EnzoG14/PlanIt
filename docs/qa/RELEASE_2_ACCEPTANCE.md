# PlanIt — matriz de aceptación Release 2

Fecha: 11/10/2026 (Argentina). Rama `codex/r2-block-5-qa`; base `origin/main` `8d21ed4` (PR #15 integrada).

Fuente literal: [requisitos oficiales locales](../requirements/RELEASE_2_REQUIREMENTS.md). Los 28 textos se copian sin cambios.

**28/28 CA tienen evidencia automatizada local; 0/28 se marcan Validado.** Todos mantienen estado **Parcial; aceptación pendiente**: un PASS de SQL/fixture prueba ese entorno, no todos los escenarios E2E ni aceptación humana. La corrida real sólo lee datos existentes con dos cuentas de prueba; no crea eventos, envía mensajes ni marca avisos.

**NO-GO para cerrar R2** hasta completar o aceptar explícitamente los pendientes del [informe](RELEASE_2_TEST_REPORT.md). No trasladar la aceptación humana de R1 a R2.

Evidencia transversal: [lectura real Auth/REST/Storage y dos contextos Edge](evidence/release-2/live-readonly.json), [checks locales](evidence/release-2/local-results.json), [checks UI](evidence/release-2/ui-results.json), [Realtime fixture](evidence/release-2/realtime-ui.txt). SQL significa PostgreSQL real local con scaffold Auth/Storage; UI significa Edge con HTTP/WS interceptados salvo la corrida explícitamente real.

## RF-R2-01

| CA | Texto original | Estado | Prueba ejecutada | Evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| RF-R2-01.CA-01 | Al seleccionar un evento disponible, se muestra su título, descripción, fecha, hora, ubicación, categoría, organizador e imágenes asociadas cuando existan. | Parcial; aceptación pendiente | Ficha con datos, organizador social y fotos; lectura real de una ficha existente por A/B | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Aceptación humana y revisión móvil físico |
| RF-R2-01.CA-02 | Los datos visualizados corresponden al evento seleccionado y son consistentes con la información persistida. | Parcial; aceptación pendiente | Comparación Home REST contra fila events y navegación real al mismo detalle | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Aceptación humana; edición/cambios remotos no provocados |
| RF-R2-01.CA-03 | Cuando un campo opcional o una imagen no están disponibles, se presenta la información restante sin errores ni datos inventados. | Parcial; aceptación pendiente | Placeholder sin fotos y opcionales ausentes; error de imagen firmado | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Avatar/fotos ausentes o vencidas reales bajo distintos permisos; aceptación humana |
| RF-R2-01.CA-04 | Si el evento fue eliminado o el usuario ya no puede acceder, se muestra un estado informativo y no una ficha desactualizada. | Parcial; aceptación pendiente | Acceso inexistente/denegado, revalidación al foco/online, red fallida y respuesta anterior tardía | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Revocación real mientras está abierto y cambio de cuenta en esa ficha; fixture PASS |

## RF-R2-02

| CA | Texto original | Estado | Prueba ejecutada | Evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| RF-R2-02.CA-01 | La pantalla Inicio presenta eventos recientes o próximos accesibles al usuario, con información suficiente para identificarlos. | Parcial; aceptación pendiente | RPC local excluye ocultos/pasados/cancelados/archivados; Home real de A/B | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Más eventos reales y revisión humana |
| RF-R2-02.CA-02 | Al seleccionar un evento de Inicio, se abre su detalle correspondiente. | Parcial; aceptación pendiente | Card abre detalle correcto en fixture y navegador real | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Aceptación humana |
| RF-R2-02.CA-03 | Los eventos no disponibles o cancelados no se ofrecen como opciones activas de participación. | Parcial; aceptación pendiente | Orden starts_at/id y exclusión de no disponibles en SQL; CTA según estado en fixtures | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Cancelación/archivo remoto durante la sesión; fixture/SQL PASS |
| RF-R2-02.CA-04 | Cuando no existen eventos para mostrar, se presenta un mensaje de ausencia de resultados. | Parcial; aceptación pendiente | Vacío fixture y SQL sin tarjetas inventadas | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Aceptación humana del vacío; datos actuales tienen evento |

## RF-R2-03

| CA | Texto original | Estado | Prueba ejecutada | Evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| RF-R2-03.CA-01 | Inicio muestra las categorías que tienen eventos disponibles y presenta los eventos dentro del grupo que corresponda. | Parcial; aceptación pendiente | Agrupación por categoría; SQL de públicos vigentes; fixture con dos categorías | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Varias categorías reales; hay una en datos actuales |
| RF-R2-03.CA-02 | Un evento aparece bajo una categoría coherente con la categoría registrada en su ficha. | Parcial; aceptación pendiente | category_id de cada fila coincide con ficha persistida por REST | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Aceptación humana |
| RF-R2-03.CA-03 | El usuario puede seleccionar un elemento agrupado y acceder a su detalle. | Parcial; aceptación pendiente | Navegación desde card de grupo al detalle en fixture y real | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Aceptación humana |
| RF-R2-03.CA-04 | Cuando una categoría no tiene eventos visibles, la interfaz no muestra información incorrecta ni elementos de una categoría distinta. | Parcial; aceptación pendiente | Categorías sin resultados omitidas; grupos combinados al paginar | [SQL](evidence/release-2/home-detail/postgres-results.json), [UI](evidence/release-2/home-detail/ui-results.json) | Categoría real sin eventos y varias páginas reales; fixture/SQL PASS |

## RF-R2-04

| CA | Texto original | Estado | Prueba ejecutada | Evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| RF-R2-04.CA-01 | El organizador y los participantes confirmados pueden abrir el chat desde que se publica el evento y consultar el historial; si el evento termina, se cancela o se archiva, el chat pasa a sólo lectura. | Parcial; aceptación pendiente | Trigger/backfill único; SQL y UI de ended/cancelled/archived; historial real existente | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | Cierre/cancelación/archivo real y membresía revocada real |
| RF-R2-04.CA-02 | Los mensajes se muestran asociados al evento correcto, con identificación de su emisor y orden cronológico coherente. | Parcial; aceptación pendiente | Evento/emisor persistidos, paginación y orden created_at/id en SQL; burbujas fixture | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | Aceptación humana; historial multipágina remoto |
| RF-R2-04.CA-03 | Un usuario sin autorización para participar del chat no puede consultar sus mensajes, aunque intente acceder directamente al recurso. | Parcial; aceptación pendiente | Stranger/anon/cancelled/removed y acceso directo denegados en SQL; anon REST real | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | Outsider/removido JWT real: A/B comparten conversación; no se cambia membresía |
| RF-R2-04.CA-04 | Si la conversación está vacía, se presenta un estado vacío; ante un error de consulta, se informa el error. | Parcial; aceptación pendiente | Vacío/error/reintento fixture y SQL de conversación recién creada | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | Fallo/vacío real controlado; fixtures/SQL PASS |

## RF-R2-05

| CA | Texto original | Estado | Prueba ejecutada | Evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| RF-R2-05.CA-01 | Un participante autorizado puede enviar un mensaje de texto no vacío y verlo reflejado en el chat del evento. | Parcial; aceptación pendiente | Envío autorizado recuperado en SQL y composer fixture; eco Realtime simulado deduplicado | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | Envío desde navegador A y recepción remota B sin refrescar |
| RF-R2-05.CA-02 | El mensaje queda persistido con referencia al evento y a su emisor y puede recuperarse al reabrir el chat. | Parcial; aceptación pendiente | Persistencia y reapertura SQL, reintento idempotente y dos conexiones locales | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | Envío/reapertura real y retry con respuesta perdida |
| RF-R2-05.CA-03 | Se impide enviar mensajes vacíos o compuestos sólo por espacios. | Parcial; aceptación pendiente | Blancos, espacios y máximo 2000 rechazados/permitidos por SQL y composer | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | Negativos JWT/REST de envío real; sólo SQL/UI |
| RF-R2-05.CA-04 | Se impide enviar mensajes si el usuario no es organizador ni asistente confirmado, o si el evento está finalizado, cancelado o archivado; también se impide mediante acceso directo a los datos. | Parcial; aceptación pendiente | Direct REST-equivalent SQL, emisor falso, no miembro y cierre; carrera real envío/cancelación local | [SQL](evidence/release-2/event-chat/postgres-results.json), [UI](evidence/release-2/event-chat/ui-results.json) | No miembro/removido y evento cerrado con JWT/REST; no se muta estado remoto |

## RF-R2-06

| CA | Texto original | Estado | Prueba ejecutada | Evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| RF-R2-06.CA-01 | El usuario autenticado puede acceder a la sección de perfil desde la navegación principal. | Parcial; aceptación pendiente | Perfil activo desde navegación; acceso fixture y real a /me | [SQL](evidence/release-2/own-profile/postgres-results.json), [UI](evidence/release-2/own-profile/ui-results.json) | Aceptación humana |
| RF-R2-06.CA-02 | La sección muestra los datos básicos correspondientes a su cuenta, sin confundirlos con los de otros usuarios. | Parcial; aceptación pendiente | RLS A/B/anon en SQL y REST real; cambio de identidad fixture con petición A tardía | [SQL](evidence/release-2/own-profile/postgres-results.json), [UI](evidence/release-2/own-profile/ui-results.json) | Revisión humana de dos cuentas; A/B reales PASS |
| RF-R2-06.CA-03 | Los datos reflejan los cambios que se hayan guardado previamente en su perfil. | Parcial; aceptación pendiente | Update propio local y posterior lectura; foco/reapertura fixture; recarga real de datos existentes | [SQL](evidence/release-2/own-profile/postgres-results.json), [UI](evidence/release-2/own-profile/ui-results.json) | Cambio guardado real controlado; corrida real sólo lectura |
| RF-R2-06.CA-04 | Si ocurre un error al cargar el perfil, se informa sin mostrar información ajena o valores engañosos como datos reales. | Parcial; aceptación pendiente | Error/ausentes/avatar roto fixture; datos anteriores descartados y consultas tardías ignoradas | [SQL](evidence/release-2/own-profile/postgres-results.json), [UI](evidence/release-2/own-profile/ui-results.json) | Red real interrumpida y recuperación; fixtures PASS |

## RF-R2-07

| CA | Texto original | Estado | Prueba ejecutada | Evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| RF-R2-07.CA-01 | El usuario autenticado puede abrir desde la aplicación una bandeja con los avisos registrados para su cuenta. | Parcial; aceptación pendiente | Campana y bandeja paginada; UI real A vacía/B con aviso existente | [SQL](evidence/release-2/notifications/postgres-results.json), [UI](evidence/release-2/notifications/ui-results.json) | Aceptación humana; marca de lectura real pendiente aunque no es CA textual |
| RF-R2-07.CA-02 | Cada aviso muestra su contenido y la referencia temporal necesaria para comprenderlo, si está disponible. | Parcial; aceptación pendiente | Título/cuerpo/fecha Argentina en fixture y aviso persistido real B | [SQL](evidence/release-2/notifications/postgres-results.json), [UI](evidence/release-2/notifications/ui-results.json) | Aceptación humana; reloj físico |
| RF-R2-07.CA-03 | Los avisos de otras cuentas no aparecen ni pueden consultarse mediante acceso directo. | Parcial; aceptación pendiente | SQL A/B/anon, acceso por ID y sin filtro; REST real destinatario y anon | [SQL](evidence/release-2/notifications/postgres-results.json), [UI](evidence/release-2/notifications/ui-results.json) | Otro aviso por ID real conocido y terceros distintos; aislamiento REST/SQL PASS |
| RF-R2-07.CA-04 | Si no tiene avisos registrados, se muestra un estado vacío; la bandeja no supone por sí misma la generación de nuevas notificaciones. | Parcial; aceptación pendiente | Vacío SQL/fixture y real A; migraciones sin productores R6 | [SQL](evidence/release-2/notifications/postgres-results.json), [UI](evidence/release-2/notifications/ui-results.json) | Aceptación humana; vacío real A PASS |

## Aceptación humana

El 11/10/2026 a las 18:46 ART el usuario informó: «Ya corroboré a mano los cambios así que se puede dar por aprobada esa pr». Se registra **aprobación manual de los cambios de PR #16**, sin pasos ni capturas por CA aportados. La matriz conserva los estados parciales porque esa confirmación no identifica los 28 casos ni acepta explícitamente sus pendientes E2E/seguridad/dispositivo. La revisión humana de la PR ya no está pendiente; el cierre integral de R2 sí.
