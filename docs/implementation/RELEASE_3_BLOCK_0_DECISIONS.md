# Release 3 — Bloque 0: auditoría y contrato de navegación

**Corte:** 11/10/2026, Argentina. **Base:** `origin/main` actualizado, commit `42d0ce1`. **Rama:** `codex/r3-block-0`. Entrega documental/preparatoria; ninguna ruta, UI, RPC o migración nueva se implementa aquí. R1/R2 conservan su código y comportamiento. Revisión y aceptación humana pendientes.

## 1. Fuentes y método

- [Prompt del bloque](prompts/RELEASE_3_BLOCK_0.md), [plan R3](RELEASE_3_PLAN.md), [estado R3](RELEASE_3_STATUS.md), [contrato R3](../requirements/RELEASE_3_REQUIREMENTS.md): 9 RF y 37 CA, sin CA propios para este bloque.
- [Planificacion](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), recuperado mediante Google Drive: nueva planificación, criterios y «Especificación técnica — R1 a R7». Revisadas para los nueve RF las secciones Flujo funcional, Datos/consultas/operaciones, Reglas/validaciones y Verificación/aceptación. La reorganización vigente define R3 como gestión operativa; las versiones históricas con estadísticas/push no reemplazan este contrato.
- [Arquitectura](../architecture.md), [base de datos](../database.md), instrucciones raíz/frontend/Supabase/diseño, plan y estado R2, [sistema visual](../design/DESIGN_SYSTEM.md), [pantallas](../design/SCREENS.md) y [brechas visuales](../design/DESIGN_GAPS.md).
- CodeGraph sobre rutas, layout, creación, detalle, Mis eventos, tarjetas, participación, media, chat y componentes compartidos. Inspección de migraciones versionadas y consultas **SELECT** a catálogos, definiciones y configuración de Storage exclusivamente en `planit-v2` (`iepeqmvzjguwlhnecsdq`). Proyecto antiguo no consultado ni modificado.
- Abiertos visualmente el [collage original](../design/mockups/release-3.png) y los [siete PNG individuales](../design/mockups/r3/README.md). Se incorporan los archivos originales sin transformación; son referencias, no capturas de pantallas implementadas.

La auditoría es de código/metadatos. No ejecutó operaciones de negocio, pruebas SQL con identidades simuladas, fixtures UI, solicitudes HTTP con JWT ni flujos de navegador. El acceso administrativo a catálogos no acredita la autorización efectiva de dos usuarios reales.

## 2. Qué existe y restricciones efectivas

### Frontend y navegación actual

| Superficie | Implementación existente | Brecha R3 |
| --- | --- | --- |
| Router/layout | Rutas autenticadas `/home`, `/map`, `/events/new`, `/events/:id`, `/events/:id/chat`, `/my-events`, `/me`, `/notifications`; login/registro, redirección raíz a Mapa y 404. Navegación Inicio/Mapa/Mis eventos/Perfil; chat con shell propio | No hay rutas administrativas ni manejo de `duplicateFrom` |
| Mis eventos | `MyEventsPage` distingue Organizo/Participo por `section`; inválido/ausente usa Organizo. `loadMyEvents` llama a `get_my_events`, muestra páginas de 30 (RPC devuelve hasta 31), deduplica y refresca al montar/foco/visibilidad | Filtros de estado y menú de gestión ausentes. No filtrar sólo la página descargada: produciría resultados y paginación incompletos |
| Tarjetas | `CompactEventCard` muestra categoría, estado del evento y participación propia; envía `state.myEventsReturnTo`. `EventCard` de Inicio/Mapa envía `state.returnTo` | Menú administrativo aún inexistente; evitar enlaces/botones a bloques no entregados |
| Detalle | `loadEvent`, categoría, fotos ordenadas con URLs firmadas por 300 s, nombre/username del organizador, inicio/fin, participación/cupo y chat permitido. Carga/error/no disponible, reintento y actualización por foco/online/visibilidad | No hay acciones del organizador ni solicitud de reincorporación. Header vuelve a Inicio sólo si `returnTo='/home'`, en otro caso a Mapa; el enlace separado a Mis eventos respeta la sección recibida |
| Crear | `CreateEventPage` conserva datos/archivos/previews únicamente en React; valida, publica por `create_event` y navega al nuevo detalle con `published=true`. Reintento incierto conserva UUID y archivos en memoria | Formulario y submit están acoplados a crear: se reutilizarán campos/validaciones sin llamar accidentalmente a publicación al editar |
| Participación/chat | `EventParticipation` usa resumen autorizado, inscripción/retiro y reconcilia después de operación incluso ante fallo. `removed` muestra reingreso sujeto a aprobación, sin acción operativa. Chat usa `get_event_chat`, `get_event_chat_messages`, `send_event_chat_message` | Remoción/reincorporación deben integrarse con permisos y revalidación existentes; no suponer revocación instantánea de una pantalla ya abierta |

### Esquema, permisos y Storage verificados remotamente

Las **11 versiones** de `supabase/migrations/` coinciden en versión/nombre con el historial remoto, desde `20261010011204` hasta `20261011193316`. La primera está vacía y consta aplicada: no editarla. Los comentarios históricos «no aplicada» de archivos SQL no describen el estado remoto actual. Se contrastaron firmas/cuerpos relevantes, políticas, grants por tabla/columna, restricciones, triggers y bucket; no se afirma comparación exhaustiva byte a byte de todo el esquema.

| Objeto | Contrato y autorización existentes | Implicación para R3 |
| --- | --- | --- |
| `events` | RLS; dueño lee todos sus eventos. Otros autenticados leen públicos no cancelados/archivados o eventos con participación propia, cualquiera sea su estado; esta última política depende de RLS propia de participaciones. SELECT no excluye finalizados | Histórico propio y detalle del removido ya tienen base de lectura; no confundir acceso al detalle con inscripción/chat/administración |
| Escritura de evento | INSERT concedido sólo a columnas de contenido/ID; identidad por default `auth.uid()`. Sin UPDATE/DELETE al cliente. `create_event` invoker, identidad/validación y bloqueo de reintento por UUID. Trigger valida inicio futuro/categoría activa al **insertar** | Edición requiere nueva operación transaccional y validación propia; el trigger de creación no valida UPDATE. No habilitar UPDATE genérico |
| Restricciones del evento | Título 1–120, descripción 1–3000, dirección no vacía, coordenadas en rango, cupo entero positivo, fin > inicio y fechas finitas. `visibility` public/unlisted; creación normal fuerza public. `events_archive_valid` exige cancelación si se archiva antes del fin. Fechas propias `timestamp without time zone` | Mantener inicio y fin en Argentina, sin columna timezone. CHECK de archivado no realiza por sí solo la cancelación; hace falta operación atómica |
| `files` / `event_images` | RLS; SELECT propio/media vinculada a eventos legibles. INSERT por columnas, dueño real y triggers verifican objeto de Storage y propiedad del archivo. Sin UPDATE/DELETE del cliente. UNIQUE evento/archivo y evento/orden; orden 0–9; FK RESTRICT | Ya existe asociación y límite estructural de diez posiciones; faltan operaciones de orden/baja administrada. No destruir archivos referenciados |
| `event_media` | Privado, 5 MiB (5.242.880 bytes), JPEG/PNG/WebP. INSERT sólo prefijo `auth.uid()/`; SELECT propio o mediante `files` visible; DELETE de objeto propio sólo si no hay fila `files` asociada. Sin política UPDATE de objetos | No usar upsert/reemplazo sobre objetos publicados. El borrado actual sirve para limpiar subidas sin metadatos; desvincular `event_images` no habilita solo la limpieza física si `files` permanece |
| Participación | `event_participations`: confirmed/cancelled/removed, UNIQUE evento/usuario, FK RESTRICT, RLS SELECT propia; sin mutaciones cliente. `participation_history` legible sólo por participación propia | El organizador no puede consultar hoy la nómina ajena por REST. Se necesita proyección administrativa mínima, no abrir SELECT íntegro de profiles |
| Historial/cupos | `register_for_event` / `leave_event` definer con `auth.uid()`, search_path vacío, lock de evento; registro exige READ COMMITTED, cuenta confirmed y rechaza removed. Trigger registra cambios de estado y actor; razones actuales registration/voluntary_leave/organizer_removal | Remoción/aprobación deben usar el mismo orden de locks evento→participación. La reconfirmación futura deberá revisar que el historial distinga reincorporación de registro ordinario |
| Resumen/listado | `get_event_participation_summary` devuelve cupo, confirmados, disponibles, estado propio/organizador/evento sin nómina. `get_my_events(text,integer)` invoker filtra identidad, ordena inicio desc/ID y devuelve hasta 31 | Organizo ya devuelve propios incluidos archivados; falta filtro histórico dedicado. Participo conserva estados históricos y no debe reescribirse |
| Perfil social | `profiles` sólo SELECT propio; UPDATE limitado a columnas del perfil propio. `get_event_organizer` sólo expone display_name/username. No hay proyección administrativa de asistentes ni soporte general de avatar social de asistentes | No hacer joins frontend a profiles completos, ni mostrar emails, birth_date o sex. Avatar futuro sólo mediante ruta/datos autorizados; iniciales como alternativa |
| Chat | `conversations` única por evento, creada por trigger; mensajes/historial con FK RESTRICT y RLS. `can_read_event_chat` permite dueño o confirmed incluso con evento cerrado. Envío bloquea evento y participación, valida identidad y estado; nuevos mensajes prohibidos en ended/cancelled/archived | Cancelar conserva lectura del historial a miembros autorizados; removed/cancelled de **participación** pierden acceso. R3 no debe borrar conversaciones ni mensajes |

RLS está activo en las **10 tablas públicas**: profiles, categories, events, files, event_images, event_participations, participation_history, conversations, messages y notifications. Las RPC públicas de negocio inspeccionadas conceden EXECUTE a authenticated/service_role, no a anon/PUBLIC, con search_path vacío. Las definer requieren conservar sus comprobaciones explícitas; su presencia no equivale a permisos de administración R3.

**No existen** `event_rejoin_requests`, `update_event`, `cancel_event`, `archive_event`, `remove_participant`, `request_rejoin` o `resolve_rejoin`, ni RPC administrativa de asistentes o gestión de galería. Son propuestas para bloques posteriores. No hay borradores persistidos ni acceso oculto por enlace R4 implementado.

## 3. Contrato de rutas y regreso para bloques posteriores

Estas rutas son decisiones documentales; sólo las tres primeras superficies existentes continúan registradas. Las nuevas se habilitan junto con su funcionalidad y autorización, nunca como destinos vacíos.

| Función | Ruta | Acceso | Regreso predeterminado | Bloque |
| --- | --- | --- | --- | --- |
| Eventos propios | `/my-events?section=organizing` | Cuenta autenticada, listado de `auth.uid()` | Navegación principal | 1 |
| Detalle/gestión | `/events/:id` | Según lectura efectiva del evento; acciones administrativas sólo dueño | Organizo para entrada de gestión/directa; conservar origen Inicio/Mapa/Participo | 1, 5 |
| Crear | `/events/new` | Cuenta autenticada | Comportamiento vigente de creación | R1 existente |
| Editar | `/events/:id/edit` | Sólo organizador, operación autorizada y estado admitido | Detalle del mismo evento | 2 |
| Galería | `/events/:id/gallery` | Sólo organizador | Detalle; conservar origen edición si se abrió desde allí | 3 |
| Asistentes | `/events/:id/attendees` | Sólo organizador | Detalle | 4 |
| Solicitudes | `/events/:id/rejoin-requests` | Sólo organizador | Asistentes del mismo evento | 6 |
| Duplicar | `/events/new?duplicateFrom=:id` | Sólo organizador del original, validado al cargar | Detalle original al cancelar; nuevo detalle al publicar | 5 |

No se crean rutas para cancelar, archivar, remover, aprobar/rechazar o solicitar reingreso: son acciones confirmadas en la superficie correspondiente. La solicitud del removido vive en el detalle accesible; la bandeja administrativa vive en Solicitudes, enlazada desde Asistentes cuando bloque 6 esté disponible.

**Compatibilidad de regreso:** mantener `state.returnTo` permitido `/home` o `/map` y `state.myEventsReturnTo` permitido `/my-events?section=organizing` o `/my-events?section=participating`. Propagar esos orígenes entre detalle y subpantallas para no perder la sección; no aceptar URLs arbitrarias. Una subpantalla abierta directamente vuelve al detalle por ID, sin depender de `navigate(-1)`. El regreso desde galería a edición, si corresponde, sólo acepta la ruta del mismo evento. Recargar edición pierde cambios locales; no persistirlos en BD ni storage del navegador como borrador.

**Diferencia actual a corregir en implementación futura:** el header de detalle siempre cae a Mapa excepto origen Inicio, aunque la tarjeta de Mis eventos envíe su sección. Bloque 1 debe hacer coherente ese regreso sin alterar el contrato existente de Inicio/Mapa/Participo. El fallback documental a Organizo es para gestión; no implica modificar hoy las entradas R1/R2.

**Acceso y estados:** primero autenticar, luego cargar un recurso autorizado; separar loading, recurso inexistente/no disponible y error reintentable. La condición de dueño en UI sólo controla presentación; todas las operaciones verifican `auth.uid()` en servidor. Participant/removed no ven administración ni acceden a su operación directa. Un removed puede conservar detalle/histórico propio, pero no chat ni registro ordinario; reincorporación exige evento abierto, permiso vigente y elegibilidad confirmada por servidor.

La prioridad existente de `event_state` es archived → cancelled → ended (`ends_at <= ahora Argentina`) → open. `open` puede incluir un evento ya iniciado, no significa exclusivamente «Próximo». Los filtros de Organizo deben distinguir tiempo/estado y preservar paginación: Todos no mezcla archivados con activos; Archivados es la sección histórica explícita. El bloque 1 definirá su consulta completa con reloj de servidor. La política exacta de edición de históricos no está especificada por la fuente: resolverla explícitamente en bloque 2 antes de habilitar mutaciones, sin reabrir eventos cerrados por accidente.

## 4. Reutilización y contratos mínimos

| Pieza | Reutilización / extensión posterior |
| --- | --- |
| Formulario | Extraer campos controlados desde `CreateEventPage` cuando bloque 2 lo necesite; reutilizar `EventValues`, `EventErrors`, catálogo y validadores. Separar cargar/guardar edición de publicar creación. Mantener título, descripción, inicio/fin, lugar/dirección/coordenadas, categoría y cupo; no añadir selector public/unlisted R4 |
| Campos y botones | `FormField` conserva label, error, aria-invalid/describedby, refs/foco; `GradientButton` estilos/atributos nativos. No introducir UI kit/dependencias |
| Tarjetas/layout | `CompactEventCard` para Organizo/Participo; `EventCard` conserva descubrimiento. AppLayout sigue Inicio/Mapa/Mis eventos/Perfil. `ScreenHeader` actual no tiene botón atrás: composición/extensión explícita al implementar, no afirmar que ya lo soporta |
| Confirmación | No existe componente compartido de confirmación auditado. Crear uno cuando se implemente remoción/acciones, con título/consecuencia, cancelar/confirmar, busy/error, foco inicial/retorno y teclado. Confirmar inicia operación; éxito sólo tras resultado confirmado y reconsulta |
| Feedback | `StatusMessage`, loading/empty/error/reintentar existentes; conservar contenido editable al fallar guardado y bloquear doble envío. Si respuesta es incierta, reconsultar antes de anunciar éxito o repetir sin idempotencia |

**Evento/listado:** usar los campos actuales de `EventRecord` y `MyEventListItem`, IDs, starts_at/ends_at, ubicación, categoría, capacity, visibility y marcas de cierre. Mantener event_state separado de participation_status. No persistir estado derivado ni contador mutable. Guardar edición conserva ID/organizer_id; cupo mínimo se verifica contra confirmed en transacción.

**Media:** la lectura actual devuelve sólo URLs, insuficiente para editar orden/asociaciones. La futura galería necesita ID de asociación, file_id, sort_order, MIME/tamaño, portada derivada de la primera posición y URL temporal; no guardar signed URLs como dato estable. JPEG/PNG/WebP, 1 byte–5 MiB y máximo diez. Refrescar firmas/orden después de operaciones; validar estado de upload/registro, rollback y limpieza separadamente. Ordenar exige resolver UNIQUE de posiciones sin colisiones y alternativa de teclado/mover a drag-and-drop.

**Asistentes:** contrato propuesto mínimo: participation_id, user_id, estado y display_name/username autorizados; avatar sólo si su lectura se habilita de forma segura. Confirmados como vista inicial, removidos separados, búsqueda por nombre y cupo operativo. No incluir email, birth_date, sex ni usar get_event_organizer/chat para simular una nómina. Lista vacía válida se distingue de permiso denegado. La navegación a perfiles sociales de R5 no se presenta como enlace operativo en R3.

**Solicitudes:** contrato futuro mínimo de identidad de solicitud/participación/evento, estado pendiente/resuelto, fecha solicitada/resuelta y datos sociales autorizados. El usuario necesita estado propio y próximo momento elegible calculado por servidor; organizador necesita pendientes del evento y acciones aprobar/rechazar. No hay motivo/comentario, emails ni reservas. `pending` pertenece a solicitudes, nunca a participaciones. Primera solicitud inmediata, una pendiente, rechazo + siete días desde resolución; sin plaza permanece pendiente, sin aprobación automática. El esquema y las firmas nuevas se diseñan en bloque 6, no se declaran existentes aquí.

**Duplicación decidida:** copiar título, descripción, categoría, ubicación/dirección/coordenadas y cupo a formulario local; vaciar inicio/fin y exigir nuevos valores futuros. No copiar fotos, marcas de cancelación/archivo, participantes, historial, conversaciones o estadísticas. Cargar `duplicateFrom` exige dueño y UUID válido incluso por URL directa; cancelar no crea filas. Al publicar, reutilizar creación normal con nuevo UUID, dueño desde Auth y conversación nueva generada por trigger. Esta elección evita compartir media automáticamente; la galería igualmente protege referencias compartidas existentes/futuras.

## 5. Correspondencia visual y excepciones

Conservar fondo marino, gradientes azul/violeta, foto/hero, cards compactas, filas de gestión, chips, formularios oscuros, grilla de imágenes y diálogos del original. La adaptación desktop, labels/foco, objetivos táctiles y safe-area siguen el sistema visual. No trasladar marcos de teléfono, póster ni decoración externa a la PWA.

| PNG individual | Ruta / componente actual o propuesto | RF | Bloques | Excepciones / decisiones |
| --- | --- | --- | --- | --- |
| [01 Mis eventos](../design/mockups/r3/01-mis-eventos.png) | `/my-events?section=organizing`, MyEventsPage / CompactEventCard | RF-R3-04 | 0, 1, 7 | Organizo/Participo, sin drafts; filtros y menú sólo al implementarse. Mantener Mapa en navegación en vez de nueva sección Explorar |
| [02 Editar](../design/mockups/r3/02-editar-evento.png) | `/events/:id/edit`, formulario reutilizado; `/events/new?duplicateFrom=:id` | RF-R3-01/07 | 0, 2, 5, 7 | Mantener inicio **y fin**, dirección/coordenadas aunque no se vean. «Cambiar imagen» enlaza galería sólo cuando exista; no control inerte en bloque 2 |
| [03 Galería](../design/mockups/r3/03-galeria.png) | `/events/:id/gallery`, administración de media propuesta | RF-R3-03 | 0, 3, 7 | Incluir WebP además de JPG/PNG del dibujo; diez, 5 MiB, portada por orden; alternativa accesible para mover. Barra/puntos superiores no simulan un wizard inexistente |
| [04 Asistentes](../design/mockups/r3/04-asistentes.png) | `/events/:id/attendees`, lista administrativa propuesta | RF-R3-05/06/09 | 0, 4, 6, 7 | Sustituir emails por username autorizado; avatars no implican permisos existentes. Confirmados/removidos separados; Solicitudes sólo desde bloque 6 |
| [05 Solicitudes](../design/mockups/r3/05-solicitudes-reincorporacion.png) | `/events/:id/rejoin-requests`, bandeja propuesta | RF-R3-09 | 0, 6, 7 | Omitir emails y párrafos de motivo; decisión/cupo/cooldown reales. Sin aprobación automática ni generación de avisos por apariencia |
| [06 Acciones](../design/mockups/r3/06-acciones-evento.png) | `/events/:id`, acciones de dueño y confirmaciones propuestas | RF-R3-01/02/03/05/07 | 0, 2–5, 7 | Omitir favoritos/compartir/tags múltiples; una categoría. Cupo confirmado operativo, no analítica. Archivar conserva datos; sólo acciones entregadas |
| [07 Estados/diálogos](../design/mockups/r3/07-estados-dialogos.png) | Detalle, asistentes y solicitudes; confirmación propuesta | RF-R3-02/06/07/08/09 | 0, 4–6, 7 | Duplicar abre formulario, no crea copia inmediatamente. «Enviada/en revisión» representan pending, sin estado extra. Mostrar fecha elegible, no «7 días» fijos. Omitir promesa «te avisaremos» mientras no haya notificación implementada |

El collage original incluye Borradores, Eliminar y Pendientes de asistencia: se sustituyen por el contrato vigente anterior. Ejemplos 48/80, nombres, fotos y fechas son ilustrativos; no seed ni activos de eventos. No se agrega exportación CSV, métricas R6, favoritos, Web Push ni servicios R4/R5/R7.

## 6. Brechas, dependencias y verificación posterior

| Bloque | Brecha concreta / dependencia | Escenarios de aceptación que deberá probar |
| --- | --- | --- |
| 1 — RF-R3-04, 4 CA | Base get_my_events existe; filtros completos/históricos, regreso y menú por estado/funcionalidad disponible faltan | Propios vs ajenos, activos/pasados/cancelados/archivados, más de una página, regreso Inicio/Mapa/Participo, vacío/error/refresco |
| 2 — RF-R3-01, 4 CA | Formulario reutilizable + update_event propuesta; resolver edición histórica, validar fechas/categoría/cupo y locks compatibles con register | Edición conserva ID, inicio/fin cruzan medianoche, navegador en otra zona, cupo concurrente, tercero denegado y error conserva valores |
| 3 — RF-R3-03, 4 CA | Asociación básica existe; faltan lectura administrativa con IDs, orden/baja y protocolo Storage/BD/limpieza | Fotos 1/10/11, MIME/tamaño, orden y portada, red fallida/resultado incierto, referencias compartidas, permiso ajeno y teclado |
| 4 — RF-R3-05/06, 8 CA | Falta proyección administrativa y remove_participant; conservar trigger/historial y lock evento→participación del chat | Nómina correcta/privada, confirmación cancelada, remoción libera cupo sin DELETE, historial/actor y carrera con envío de chat |
| 5 — RF-R3-02/07, 8 CA | Faltan cancel_event/archive_event; precarga local de duplicado depende del formulario, sin copiar fotos | Cancelar/archivar atómicos, fallo sin éxito falso, conservación histórica/chat sólo lectura, cancelación de duplicado sin fila, publicación con nuevo ID y original intacto |
| 6 — RF-R3-08/09, 9 CA | Tabla/RPCs ausentes; depende de remoción, proyección administrativa y locks de cupo | Removed elegible/acceso, primera inmediata, única pending, siete días desde resolved_at, último cupo concurrente, evento cerrado y tercero denegado |

**Discrepancias que requieren resolución en su bloque:** la especificación técnica menciona navegación a perfil social y notificación de resolución, mientras el plan R3 limita esas capacidades; no añadirlas sin conciliar alcance aprobado. La política exacta de edición histórica tampoco está definida. No cambian RF/modelo remoto en este bloque.

**Verificación del Bloque 0:** revisión editorial/enlaces locales, matriz siete PNG→RF/bloque, historial remoto de once versiones, auditoría de catálogos y alcance exclusivo documental; `git diff --check`. Comparación de hashes de PNG y `vite.config.ts` para conservar originales y cambio previo. Build/lint no ejecutados por no cambiar frontend/configuración/dependencias. Sin migraciones creadas/aplicadas, sin pruebas funcionales/locales SQL/HTTP-JWT/fixtures/responsive y sin capturas nuevas. Ninguno de los 37 CA se marca aprobado por esta auditoría; QA integral y aceptación humana siguen pendientes.

**Reproducción de la auditoría:** consultar historial `supabase_migrations.schema_migrations`; tablas/RLS `pg_class` + `pg_namespace`; restricciones `pg_constraint` + `pg_get_constraintdef`; triggers `pg_trigger` + `pg_get_triggerdef`; funciones públicas/planit_private `pg_proc` + `pg_get_functiondef`, proacl/proconfig; políticas `pg_policies`; grants `information_schema.role_table_grants` y `column_privileges`; bucket `storage.buckets` limitado a event_media. Todas las consultas son SELECT de metadatos, sin invocar RPCs de negocio ni leer filas privadas. Repetir el contraste antes de escribir una migración futura, porque este corte no garantiza que el remoto permanezca igual.
