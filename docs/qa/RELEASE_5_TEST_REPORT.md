# Release 5 — Reporte de QA integral · Bloque 10

**Decisión: NO-GO para cierre/entrega funcional de R5.** La implementación queda **Implementado; QA pendiente**. Las pruebas técnicas locales y UI con fixtures no validan los 33 CA de extremo a extremo. La aprobación humana histórica de B5 se conserva; no se extiende a la release completa.

Fecha: 14/10/2026, Argentina. Base `f66d70bcf4f0e28c02fe2aff88088bd238a65e1e`, rama `codex/r5-block-10`; PR #50–#59 integradas, comprobadas después de fetch. Sin merge, deploy, escrituras de fixtures remotos ni DDL remoto. [Contrato, amenazas y reproducción](r5-block-10/README.md). [Resumen computable y resultados por capa](r5-block-10/summary.json).

## Resultado técnico y límites

| Capa | Resultado | Qué demuestra / qué queda pendiente |
| --- | --- | --- |
| Dependencias, build y lint | PASS | npm ci:0 vulnerabilidades; build/PWA generado; avisos de chunks/lint anteriores conservados. [Build](r5-block-10/build.txt), [lint](r5-block-10/lint.txt) |
| SQL social | PASS parcial | 30 migraciones replay, A/B/C/D/anon, public/private × none/pending/accepted/rejected × bloqueo bilateral, 72 audiencias; módulos B2–B9, índices/EXPLAIN, rollback/carreras. PostgreSQL18.4, Auth/Storage scaffold; no JWT real |
| UI integrada | PASS parcial | Build React real en Edge; sesiones, REST, gateway y WebSocket simulados; seis anchos320/360/375/390/768/1280, texto200%, poca altura/foco/retorno, estados, permisos retirados, pérdida de respuesta/reintentos |
| Regresión R1–R4 | PASS16 suites | 13 suites históricas más participaciones/cupos, Inicio y búsqueda. No modifica CA ni aceptación histórica; transporte/dispositivos reales pendientes |
| Unit Auth/eventos/gateway | PASS | Validadores reales y handler avatar con fetch simulado. [Auth](r5-block-10/auth-unit.txt), [eventos](r5-block-10/events-unit.txt), [avatar](r5-block-10/sql/avatar/avatar-unit.json) |
| Catálogo remoto READ ONLY | PASS | PostgreSQL17.11,30 versiones,16 tablas RLS,82 funciones inventariadas; comparación de81 funciones excluye stub rls_auto_enable. [Comparación](r5-block-10/sql/edit-profile/remote-comparison.json) |
| HTTP anónimo real | PASS | Denegación SELECT/RPC/Edge; lectura y RPC de consulta sin sesiones ni efectos persistidos. [Resultados](r5-block-10/http.json); no prueba de audiencias autenticadas |
| Storage/CDN/avatar/JWT funcional | NOT RUN | Inventario confirma social-avatar ACTIVE v1; existencia no prueba firma/expiración/headers/entrega. Sin cuentas A/B/C/D autorizadas en fixture local |
| Realtime real entre sesiones | NOT RUN | Catálogo publica sólo messages/notifications; RLS/cliente comprobados SQL/fixtures, entrega y revocación real pendientes |
| PWA | PASS estático; NOT RUN dispositivo | Manifest/iconos/precache y sin ruta de caché Supabase; instalación, actualización/offline/sesión en dispositivo real pendientes |
| QA humana integral | Pendiente | No autodeclarar Validado; B5 conserva su aprobación anterior |

## Matriz de los 33 CA oficiales

Texto literal releído del Google Doc vigente: [snapshot limitado a33 CA](r5-block-10/source.json). SQL/UI son resultados **parciales por capa**, no un PASS integral. Para cada fila el actor es el fixture correspondiente descrito en los runners y la [matriz de amenazas](r5-block-10/README.md); los resultados JSON contienen los casos y salidas obtenidas. HTTP autenticado/Storage/Realtime y aceptación integral siguen NOT RUN en este corte.

| CA | Criterio literal | Evidencia técnica nueva | Integral B10 |
| --- | --- | --- | --- |
| RF-R5-01.CA-01 | Sólo el organizador y los asistentes confirmados pueden abrir la lista de participantes de un evento; conocer el enlace o consultar el detalle no concede ese permiso. | PASS parcial [SQL](r5-block-10/sql/participants/sql-results.json) / [UI](r5-block-10/ui/participants/) | NOT RUN |
| RF-R5-01.CA-02 | Cada usuario mostrado corresponde al evento seleccionado y permite abrir el perfil al que se tiene acceso. | PASS parcial [SQL](r5-block-10/sql/participants/sql-results.json) / [UI](r5-block-10/ui/participants/) | NOT RUN |
| RF-R5-01.CA-03 | Los datos visibles respetan la privacidad configurada por cada cuenta y no revelan información restringida. | PASS parcial [SQL](r5-block-10/sql/participants/sql-results.json) / [UI](r5-block-10/ui/participants/) | NOT RUN |
| RF-R5-01.CA-04 | Cuando un evento no tiene usuarios visibles o el usuario no tiene permiso de consulta, se informa el estado sin mostrar participantes de otros eventos. | PASS parcial [SQL](r5-block-10/sql/participants/sql-results.json) / [UI](r5-block-10/ui/participants/) | NOT RUN |
| RF-R5-02.CA-01 | Un usuario autenticado puede abrir un perfil público y consultar su nombre o seudónimo, fotografía e información declarada pública. | PASS parcial [SQL](r5-block-10/sql/profile/sql-results.json) / [UI](r5-block-10/ui/profile/) | NOT RUN |
| RF-R5-02.CA-02 | Cuando el perfil tiene eventos públicos asociados, se muestran únicamente esos eventos y se puede acceder a sus detalles. | PASS parcial [SQL](r5-block-10/sql/profile/sql-results.json) / [UI](r5-block-10/ui/profile/) | NOT RUN |
| RF-R5-02.CA-03 | Los datos privados, credenciales y demás información restringida no se muestran ni quedan disponibles por consultas directas. | PASS parcial [SQL](r5-block-10/sql/profile/sql-results.json) / [UI](r5-block-10/ui/profile/) | NOT RUN |
| RF-R5-02.CA-04 | Cuando la persona no tiene foto o eventos públicos, el perfil sigue siendo legible y presenta estados vacíos adecuados. | PASS parcial [SQL](r5-block-10/sql/profile/sql-results.json) / [UI](r5-block-10/ui/profile/) | NOT RUN |
| RF-R5-03.CA-01 | El usuario puede modificar sus datos editables y fotografía y guardar los cambios en su propia cuenta. | PASS parcial [SQL](r5-block-10/sql/edit-profile/sql-results.json) / [UI](r5-block-10/ui/edit-profile/) | NOT RUN |
| RF-R5-03.CA-02 | El usuario puede cambiar la visibilidad entre perfil público y privado, y el estado elegido persiste al volver a ingresar. | PASS parcial [SQL](r5-block-10/sql/edit-profile/sql-results.json) / [UI](r5-block-10/ui/edit-profile/) | NOT RUN |
| RF-R5-03.CA-03 | Las modificaciones se reflejan en el perfil propio y en las vistas públicas o privadas según la visibilidad configurada. | PASS parcial [SQL](r5-block-10/sql/edit-profile/sql-results.json) / [UI](r5-block-10/ui/edit-profile/) | NOT RUN |
| RF-R5-03.CA-04 | Un usuario no puede editar el perfil de otra persona; los valores no válidos o errores de guardado se informan sin simular éxito. | PASS parcial [SQL](r5-block-10/sql/edit-profile/sql-results.json) / [UI](r5-block-10/ui/edit-profile/) | NOT RUN |
| RF-R5-04.CA-01 | Al consultar un perfil privado sin seguimiento aprobado, únicamente se muestran nombre visible, username y avatar; los datos adicionales permanecen restringidos. | PASS parcial [SQL](r5-block-10/sql/private-profile/sql-results.json) / [UI](r5-block-10/ui/private-profile/) | NOT RUN |
| RF-R5-04.CA-02 | El sistema no presenta datos reservados ni eventos privados del perfil a usuarios sin autorización. | PASS parcial [SQL](r5-block-10/sql/private-profile/sql-results.json) / [UI](r5-block-10/ui/private-profile/) | NOT RUN |
| RF-R5-04.CA-03 | Un seguidor aprobado puede consultar exclusivamente los datos habilitados para seguidores de ese perfil. | PASS parcial [SQL](r5-block-10/sql/private-profile/sql-results.json) / [UI](r5-block-10/ui/private-profile/) | NOT RUN |
| RF-R5-04.CA-04 | Las mismas restricciones se aplican si se intenta consultar información privada mediante acceso directo a la capa de datos. | PASS parcial [SQL](r5-block-10/sql/private-profile/sql-results.json) / [UI](r5-block-10/ui/private-profile/) | NOT RUN |
| RF-R5-05.CA-01 | Seguir un perfil público desde una cuenta autenticada registra la relación y actualiza el estado del botón y los contadores o listados correspondientes. | PASS parcial [SQL](r5-block-10/sql/follows/sql-results.json) / [UI](r5-block-10/ui/follows/) | NOT RUN |
| RF-R5-05.CA-02 | Seguir un perfil privado genera una solicitud pendiente y no concede acceso a sus contenidos privados antes de su aprobación. | PASS parcial [SQL](r5-block-10/sql/follows/sql-results.json) / [UI](r5-block-10/ui/follows/) | NOT RUN |
| RF-R5-05.CA-03 | Dejar de seguir elimina la relación y revoca el acceso derivado de ella; los seguidores ya aceptados conservan su seguimiento cuando el perfil cambia de público a privado. | PASS parcial [SQL](r5-block-10/sql/follows/sql-results.json) / [UI](r5-block-10/ui/follows/) | NOT RUN |
| RF-R5-05.CA-04 | No se permite seguir la propia cuenta ni duplicar relaciones o solicitudes activas al repetir la operación. | PASS parcial [SQL](r5-block-10/sql/follows/sql-results.json) / [UI](r5-block-10/ui/follows/) | NOT RUN |
| RF-R5-06.CA-01 | El propietario de un perfil privado puede consultar las solicitudes de seguimiento que tiene pendientes. | PASS parcial [SQL](r5-block-10/sql/requests/sql-results.json) / [UI](r5-block-10/ui/requests/) | NOT RUN |
| RF-R5-06.CA-02 | Al aceptar una solicitud, se establece la relación de seguimiento y se concede la visibilidad correspondiente a un seguidor aprobado. | PASS parcial [SQL](r5-block-10/sql/requests/sql-results.json) / [UI](r5-block-10/ui/requests/) | NOT RUN |
| RF-R5-06.CA-03 | Al rechazar una solicitud, no se concede seguimiento ni acceso adicional; el solicitante puede enviar otra inmediatamente si no existe bloqueo. | PASS parcial [SQL](r5-block-10/sql/requests/sql-results.json) / [UI](r5-block-10/ui/requests/) | NOT RUN |
| RF-R5-06.CA-04 | Sólo el dueño del perfil puede resolver sus solicitudes; una solicitud ya resuelta no puede procesarse de nuevo como pendiente. | PASS parcial [SQL](r5-block-10/sql/requests/sql-results.json) / [UI](r5-block-10/ui/requests/) | NOT RUN |
| RF-R5-07.CA-01 | Dos usuarios autenticados pueden iniciar una conversación privada de texto sin seguirse; si se bloquean se impiden nuevos mensajes, pero permanece accesible su historial. | PASS parcial [SQL](r5-block-10/sql/messages/sql-results.json) / [UI](r5-block-10/ui/messages/) | NOT RUN |
| RF-R5-07.CA-02 | Los mensajes enviados quedan asociados a la conversación y a su remitente, y se recuperan al volver a abrirla. | PASS parcial [SQL](r5-block-10/sql/messages/sql-results.json) / [UI](r5-block-10/ui/messages/) | NOT RUN |
| RF-R5-07.CA-03 | Los mensajes se muestran con un orden temporal coherente y sin mezclarse con los chats de eventos. | PASS parcial [SQL](r5-block-10/sql/messages/sql-results.json) / [UI](r5-block-10/ui/messages/) | NOT RUN |
| RF-R5-07.CA-04 | Un tercero que no participa de la conversación no puede leer ni escribir mensajes mediante la interfaz o accesos directos a los datos. | PASS parcial [SQL](r5-block-10/sql/messages/sql-results.json) / [UI](r5-block-10/ui/messages/) | NOT RUN |
| RF-R5-08.CA-01 | Un usuario puede bloquear y desbloquear a otro, pero no bloquear su propia cuenta. | PASS parcial [SQL](r5-block-10/sql/blocks/sql-results.json) / [UI](r5-block-10/ui/blocks/) | NOT RUN |
| RF-R5-08.CA-02 | Al bloquearse dos cuentas, se eliminan los seguimientos y solicitudes en ambos sentidos y se impiden nuevos seguimientos y mensajes privados entre ellas. | PASS parcial [SQL](r5-block-10/sql/blocks/sql-results.json) / [UI](r5-block-10/ui/blocks/) | NOT RUN |
| RF-R5-08.CA-03 | Las conversaciones privadas anteriores permanecen disponibles para consulta, sin permitir nuevos envíos durante el bloqueo. | PASS parcial [SQL](r5-block-10/sql/blocks/sql-results.json) / [UI](r5-block-10/ui/blocks/) | NOT RUN |
| RF-R5-08.CA-04 | Si se elimina el bloqueo, se reutiliza la conversación privada existente y los seguimientos eliminados no se restauran automáticamente. | PASS parcial [SQL](r5-block-10/sql/blocks/sql-results.json) / [UI](r5-block-10/ui/blocks/) | NOT RUN |
| RF-R5-08.CA-05 | El bloqueo no impide que ambos participen en el chat grupal de un evento para el que sigan autorizados. | PASS parcial [SQL](r5-block-10/sql/blocks/sql-results.json) / [UI](r5-block-10/ui/blocks/) | NOT RUN |

## Casos adicionales D01–D05

| Caso | Resultado y evidencia | Límite |
| --- | --- | --- |
| D01-A: perfil bloqueado bilateral | PASS SQL/UI parcial: sin identidad/avatar/bio/eventos/contadores; listados filtran antes de paginar; SELECT/RPC directos con SET ROLE | HTTP JWT real NOT RUN |
| D01-B: historial DM y grupo | PASS SQL/UI parcial: DM previo legible, nuevo envío denegado; chat grupal según confirmed/grant R4 | Entrega Realtime real y UI grupal con sesiones reales NOT RUN |
| D02-A: privado pending/rejected/accepted | PASS SQL/UI: mínimo exacto, accepted sólo bio/públicos, ningún oculto/demográfico; revocación limpia UI | Storage/CDN real NOT RUN |
| D03-A: DM sin follow | PASS SQL/UI: pareja canónica, concurrencia inversa, UUID idempotente, sender derivado, tercero denegado | Auth y persistencia por transporte real NOT RUN |
| D04-A: private→public | PASS SQL:0/1/N, rejected intacto, accepted conservados, sin resucitar follows bloqueados, idempotencia; UI avisa y reconsulta resultado incierto | Divergencia con documento oficial pendiente de edición autorizada |
| D04-B: carreras/rollback | PASS SQL: perfil/follow/block serializados, fallos inyectados revierten todo, snapshot congelado rechazado, sin pending residual | PostgreSQL local18 frente a17 remoto; no corrida remota |
| D05-A: accesos contextuales | PASS UI: inicio DM desde perfil, bandeja desde /me y enlaces contextuales; cuatro tabs primarios | Dispositivo/lector de pantalla reales NOT RUN |

[SQL B9 con carrera triple y rollback](r5-block-10/sql/blocks/sql-results.json), [SQL follows](r5-block-10/sql/follows/sql-results.json), [solicitudes](r5-block-10/sql/requests/sql-results.json), [UI DM](r5-block-10/ui/messages/ui-results.json).

## Seguridad y performance

La auditoría parte del contrato B1/B9: propietario lee su perfil íntegro; confirmed no amplía privacidad social; grant unlisted sólo habilita la facultad R4 específica; bloqueo bilateral oculta proyección social, sin quitar historial DM ni autorización grupal. [Matriz completa y columnas](r5-block-10/README.md).

[Diez verificaciones de catálogo/build](r5-block-10/security-audit.json): RLS en tablas públicas, SELECT profiles sólo propia fila, publicación Realtime sin profiles/follows/blocks y con columnas de messages limitadas, bucket avatars privado/MIME/5MiB, firma social no ejecutable por anon/authenticated y service worker sin caché de Supabase. Las suites SQL prueban consultas directas y RPC como authenticated/anon; los payloads UI inyectan sentinels privados y comprueban su ausencia. No logs con tokens/filas privadas ni credenciales versionadas.

Cursores limitados/default30 con lookahead, orden servidor+UUID y autorización previa a paginación; índices de follows/blocks/pareja DM/mensajes comprobados y [EXPLAIN](r5-block-10/sql/blocks/explain.json). Fixtures pequeños: **no benchmark ni afirmación de capacidad de producción**. Se conserva la ventana C03 de firma social hasta60s, sin prometer revocar bytes descargados.

## Diseño y accesibilidad

Mockup R5 original inspeccionado e intacto (hash en auditoría), usado para inventario funcional; apariencia Amanecer según DESIGN.md. Sin llamadas/audio/historias ni nuevo tab primario. [Revisión visual](r5-block-10/design-review.md).

Se encontró texto oscuro sobre botón marino en Seguir/Solicitar seguimiento; corregido reutilizando GradientButton. La prueba final mide contraste de ambas etiquetas ≥4,5:1 en seis anchos. Capturas anteriores y posteriores se conservan. Responsive/foco/teclado de escritorio y simulación200% no prueban teclado móvil/lector físico. No se cambia la dirección visual ni fuentes/tokens.

## Incidencias, desviaciones y aceptación pendiente

Errores iniciales de entorno/harness: TCP/Edge/DNS bloqueados por sandbox; B2 esperaba servidor externo; fixtures B2 sin lecturas añadidas en B6; B4–B7 comparaban contra catálogos históricos; trigger de prueba B9 con delimitador inválido; scaffolds R1/R2 sin rol server-only service_role. Se corrigieron sin relajar aserciones funcionales y se repitieron los casos afectados. El resumen computable conserva el resultado técnico final; manifiestos pueden registrar previous_attempt_result.

La evidencia histórica de «avatar no desplegada» difiere del inventario actual ACTIVE; se registra existencia actual sin atribuir un deploy a B10 ni afirmar prueba funcional. No se modifican actas anteriores. D04 sigue siendo decisión aprobada posterior al Google Doc; **no se fingió que el CA original describe autoaceptación**.

Para cambiar NO-GO: ejecutar matriz autenticada A/B/C/D/anon y blocked/accepted/rejected mediante HTTP/UI reales; verificar SELECT/RPC, Storage/avatar/CDN/TTL y Realtime entre sesiones con permisos retirados; instalación PWA y dispositivos/accesibilidad; revisar las evidencias y obtener aceptación humana explícita. Preparar fixtures remotos o desplegar/configurar servicios requiere autorización independiente. No se aplicó SQL remoto en este bloque.

Migraciones B10: **creadas0 / probadas locales nuevas0 / aplicadas remotas0 / verificadas remotas nuevas0**. Las30 históricas fueron reproducidas localmente y su catálogo actual leído, sin alterar su estado de aplicación.

Detenerse en revisión de esta PR. No iniciar otra release ni bloque sin nueva aprobación.
