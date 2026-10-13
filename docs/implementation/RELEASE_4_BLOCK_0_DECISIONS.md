# PlanIt — Release 4, BLOQUE 0: auditoría y contrato de navegación

**Corte:** 13/10/2026, Argentina. **Estado:** Implementado; QA pendiente (entrega documental, revisión humana pendiente). **Base auditada:** `42af4e42d032637b1363e207714e86c297d8c3b1`, `origin/main` después de `git fetch origin`. [PR #38](https://github.com/EnzoG14/PlanIt/pull/38) en borrador. Rama `codex/r4-block-0`, checkout aislado bajo el home con índice CodeGraph propio. Cambio de `D:/planit/vite.config.ts` preservado fuera de la rama.

Este documento reemplaza la plantilla con inspección verificable. **Verificado** significa código/SQL versionado o navegador con fixtures, según la evidencia indicada; **propuesto** describe contratos futuros; **no inspeccionado** aplica al remoto. No hay implementación funcional R4, corrección de seguridad ni CA funcional aprobado por esta entrega.

## 1. Fuentes y dependencias comprobadas

- Contrato: [9 RF / 39 CA](../requirements/RELEASE_4_REQUIREMENTS.md), [plan v1.2](RELEASE_4_PLAN.md), [decisiones](RELEASE_4_DECISIONS_PROPOSED.md), [matriz de aceptación](../qa/RELEASE_4_ACCEPTANCE.md), [plan de pruebas](../qa/RELEASE_4_TEST_PLAN.md) y [prompt](prompts/RELEASE_4_BLOCK_0.md).
- Documento original [Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), leído mediante Google Drive: «Nueva planificación — RF R1 a R7» (`t.6cfgj0znk3o`), «Criterios de aceptación — R1 a R7» (`t.89mq08i5ups2`), sección R4 de «Especificación técnica — R1 a R7» (`t.58du83a4qpv`) y dominios de acceso/intereses de «Diseño de base de datos — PlanIt v1.0» (`t.xakqbnk83lkc`). Los **39 textos locales coinciden** al normalizar únicamente Unicode/espacios; [resultado](../design/verification/r4-block-0/original-source-comparison.json). La pestaña histórica «Requisitos funcionales - Release 4» no redefine esta release.
- Leídos AGENTS raíz/frontend/Supabase/diseño, arquitectura y modelo; plan/estado R3 antes de la auditoría. Inspeccionados PRODUCT, DESIGN, sidecar, DESIGN_SYSTEM, UI_WORKFLOW, SCREENS, DESIGN_GAPS, dirección Amanecer, plan/estado del refresh, bloques visuales 3–7 e integración visual R4. [Hashes de fuentes](../design/verification/r4-block-0/source-manifest.json).
- Git confirma PR R3 #18–#25 integradas; en particular #23 (`dd4bb07`), #24 (`d9c0a69`) y #25 (`51509d5`). Las migraciones de cierre/duplicación y reincorporación están presentes, incluidas las cinco RPC de reincorporación y `pending_count` en asistentes.
- Refresh integrado: #27 `cb5a249`, #28 `3552d4e`, #29 `123962f`, #31 `31c1ac2`, #30 `da90d98`, #32 `0b8a1b3`, #33 `bdba68a`, #34 `a378259`. La base también incorpora planificación #35 `89f32d5`, auditoría visual #36 `4489328` y correcciones P1 #37 `42af4e4`. El plan R4 conservaba una base anterior; esta auditoría usa la posterior.
- **Desfase documental R3:** A07 confirma R3 integrada y validada por el responsable. STATUS/TEST_REPORT versionados todavía indican QA pendiente/NO-GO por E2E JWT y aceptación humana sin evidencia. Se conserva esa historia y no se reabre A07 ni se afirma que esas pruebas se ejecutaron.
- **Desfase visual:** tabla del STATUS del refresh, AGENTS frontend, UI_WORKFLOW, DESIGN_SYSTEM, dirección y secciones de arquitectura aún describen etapas pendientes, scope sólo Mis eventos o mapa nocturno. Código fusionado y actas de bloques acreditan los scopes actuales y Standard `day`; DESIGN conserva autoridad normativa. No se reescriben esos reportes históricos. Impeccable señaló posible sidecar desactualizado frente a DESIGN; no se regeneró.

## 2. Inventario actual y reutilización

Rutas actuales en `App.tsx`: `/`→`/map`, login/registro, `/home`, `/map`, `/my-events`, `/me`, `/notifications`, crear/detalle/editar/galería/asistentes/reincorporaciones/chat y 404. Las rutas de producto requieren sesión. **No existen** `/search`, `/me/interests`, `/invite` ni `/events/:id/access`.

| Superficie / componente actual | Props, datos y eventos existentes | Reutilización R4 / gap comprobado |
| --- | --- | --- |
| `AppLayout` | Sin props; sesión, pathname, Cuenta, campana, Outlet, foco a `main-content`, scroll al cambiar pathname | Mantener dock Inicio/Mapa/Mis eventos/Perfil. Ampliar clasificación de subrutas; hoy intereses/invite/access no heredan scope Amanecer |
| `HomePage` | Sin props; `loadHomeEvents(cursor)` de 30 + lookahead, grupos por categoría, revisión de respuestas, Actualizar/Más | Buscador y filtros encima del listado; agrupación no equivale a filtro. Falta contrato compartido y «Para vos» |
| `MapPage` / `EventMap` | Página sin props; mapa recibe `events, center, selectedId, onSelect(id), onBoundsChange(bounds)`; debounce 300 ms, GPS optativo, selección/lista/preview y retorno de foco | Incorporar origen real de radio: `onBoundsChange` no comunica el centro actual tras pan. Extender callback de viewport para reportar bounds y center sin reconstruir motor |
| `ProfilePage` | Sin props; perfil propio y avatar firmado, correo propietario; reset por identidad/token, carga/error/reintento | Añadir acceso Mis intereses en lista propia. No contadores ni perfiles sociales |
| `CreateEventPage` / `EditEventPage` | Sin props públicas; formulario local, validaciones, inicio/fin AR, ubicación, categoría, cupo; `duplicateFrom`; reconciliación de respuesta incierta | Añadir visibilidad sólo cuando contrato SQL seguro exista. `EventValues` no tiene visibility; create/update actuales tampoco reciben ese parámetro |
| `EventDetailPage` | Sin props; ID de ruta; `loadEvent`, categorías, organizador, fotos, participación, gestión; reset por evento/cuenta/token | Detalle oculto exige autorización en todas las consultas, no sólo ocultar acciones. Hoy retorno acepta sólo `/home` o `/map`, no sus filtros |
| `EventAttendeesPage` / `EventRejoinRequestsPage` | Sin props públicas; contenido interno `eventId`; paginado 30, búsqueda/estados/confirmación, foco, respuestas tardías y origen | Reusar filas y patrones de gestión para accesos. Nómina administrativa R3 sigue siendo sólo del dueño |
| `EventChatPage` | Sin props públicas; contenido `eventId,userId`; header autorizado antes de canal, limpieza al denegar, revalidación, lectura/envío | Grant por sí solo nunca abre chat; mantener organizer o confirmed con permiso de evento oculto |
| `EventCard` | `event: EventPreview`, `selected?`, `onSelect?(id)`, `returnTo?` | Patrón de descubrimiento; foto autorizada o Sin foto, enlace amplio. Propagar filtros en retorno interno saneado |
| `CompactEventCard` | `event: MyEventListItem`, `returnTo`, `showMenu?`, `onChanged?(message)` | Sólo gestión/Mis eventos; no copiar como segundo patrón público |
| `EventParticipation` | `eventId` | Summary, register/leave, solicitud/reconciliación, refresh 30 s. `pending` es solicitud, nunca participación |
| `EventManagement` | `event`, `origin`, `onChanged(message)` | Añadir entrada Accesos/Enlace del dueño en bloques posteriores; preservar acciones existentes |
| `EventActionDialog` | `event`, `action`, `onClose`, `onChanged`, `origin`, `restoreFocus?`, `dismissLabel?` | Reusar patrón de modalidad/foco/Escape/resultado incierto; sus acciones tipadas son cancel/archive/duplicate. No pasarle grants fingiendo un EventAction |
| `ScreenHeader`, `FormField`, `StatusMessage`, `AccountMenu` | Header: title/description/icon. Field: atributos input + label/icon/error/trailing/inputRef. Status: title/children/tone info/error. Cuenta: signingOut/onLogout | Mantener labels, feedback y menú. Para date/range, inputs con FormField; selects/textarea conservan composición de campos existente |

**Servicios inspeccionados:** `api.ts` ofrece catálogo/publicación/detalle/organizador/fotos; `discovery.ts` consulta bounds y limita 100 de 101; `home.ts` cursor starts_at/id; `participation.ts` summary/register/leave; `actions.ts` cierre, comprobación y fuente de duplicación; `edit.ts` validación/reconciliación; `rejoin.ts` estado/pedido/lista/resolución/comprobación. Home/discovery/my-events/gallery firman media de forma repetida a 300 s: futura centralización mínima de TTL/renovación, sin refactor cosmético. La conservación de origen se repite en páginas y contratos de cards: extender los validadores existentes en lugar de aceptar URLs arbitrarias.

## 3. Contrato propuesto de navegación y composición

| Ruta | Composición / scope futuro | Entrada, regreso y foco |
| --- | --- | --- |
| `/home` | `.amanecer-shell.discovery-shell`; header existente, búsqueda con label, chips seleccionables y panel inline de fecha/radio, resultados y luego Para vos | Mantener cuatro destinos. Enlace Mapa lleva filtros; resultado conserva origen completo. Cambio de filtros reinicia cursor y descarta respuestas tardías; vacío conserva criterios |
| `/map` | Mismo scope y controles; mapa/lista siguen en esta ruta, preview único | Origen «Mi ubicación» sólo GPS consentido; fallback «Centro del mapa — Buenos Aires» inicial. Pan actualiza centro al moveend bajo debounce existente. Si desaparece selección, limpiar preview y enfocar Actualizar resultados cuando el trigger ya no exista |
| `/me/interests` | Ampliar `isSocial`; `.amanecer-shell.social-shell` y composición local `.interests-page` | Entrada desde `/me`; volver a `/me`; h1/fieldset Categorías, opciones con estado y CTA Guardar intereses en tinta. Guardado atómico, selección local conservada ante error |
| `/invite` | Shell explícito `.amanecer-shell.invite-shell`, wash decorativo y StatusMessage; sesión opcional en entrada | Capturar fragmento antes de cualquier RequireAuth/redirect. Login seguro vuelve aquí; canje autenticado→detalle. Mostrar Ingresar/Cancelar/error/reintentar, nunca secreto ni identidad ajena en errores |
| `/events/:id/access` | Ampliar `isEventManagement`; `.amanecer-shell.event-management-shell`, filas active/revoked y diálogo propio de permisos | Entrada sólo gestión del dueño; volver a detalle preservando origen. Foco inicial en h1; después de operar vuelve a fila o Actualizar si desapareció; Escape/cancelación restauran trigger |
| `/events/new`, `/events/:id/edit`, `/events/:id` | Scopes actuales form/discovery, selector Público/Oculto y gestión del enlace cuando estén habilitados | Publicación/guardado oculto atómicos. Duplicación sin enlaces/grants/fotos/participantes/chat heredado; visibilidad se elige conscientemente |

**Scoping:** tokens `--pi-*` de tokens.css y patrones amanecer.css; composición de descubrimiento en discovery.css/home.css, formulario en event-forms.css, perfil en profile.css/social.css y administración en event-management.css/event-actions.css. Nuevas hojas sólo para composición de intereses/canje/accesos; no crear otra paleta ni reutilizar overrides heredados fuera de su scope. El dock ocupa cuatro destinos, nunca agrega Buscar/Invitar/Intereses. Cada nueva ruta reserva el espacio del dock y safe areas; CTA y diálogo deben ser alcanzables al desplazarse. Mantener una mancha decorativa por pantalla; pseudo-elemento actual de discovery no entra al árbol accesible, washes DOM llevan aria-hidden.

**Filtros (defaults técnicos, no funcionalidad implementada):** query params `q`, `categories`, `from`, `to`, `radius`, `origin`, `lat`, `lng`, sólo valores saneados, sin token ni IDs de cuenta. Coordenadas únicamente de referencia GPS consentida/centro; sin historial localStorage ni telemetría, limpiar el estado GPS al cambiar de cuenta. Categorías OR; grupos texto/categoría/fecha/radio AND. Radios 5/10/25/50/100 km y Sin límite inicialmente; fechas por starts_at en `[00:00 AR inicial, 00:00 AR día posterior al final)`. Cliente y servidor validan rango/origen/radio. La categoría del evento sigue siendo una.

**Gap temporal:** Home hoy exige starts_at futuro; mapa ends_at futuro. Para resultados filtrados R4 se propone universo público vigente por ends_at, nunca cancelado/archivado, compartido antes de paginar; documentar la adaptación del feed R2 al integrar bloque 1/2. Bounds limitan representación del mapa; no confundir bounds con el filtro de radio ni rankear solamente las primeras 30 filas de Inicio.

**Auth y secreto (propuesta D10 viable para login con contraseña SPA):**
1. `/invite#token=…` captura token en memoria de contexto que sobreviva a cambios de ruta, fuera de la página de canje; limpia fragmento con replace antes de navegar. No usar params de Router, localStorage, sessionStorage, logs, referrer ni telemetría para el secreto.
2. Sin sesión, navegar a `/login?next=/invite`. Agregar sólo ese destino exacto al allowlist de safeReturnPath; nunca volver el allowlist una redirección abierta. Alternar login/registro conserva destino seguro, no token.
3. Sesión comprobada → RPC de canje → grant persistente sin inscripción → `/events/:id`, replace; borrar token al éxito, cancelación, logout/cambio de cuenta o nueva invitación. Un error de red conserva sólo memoria para reconciliar; revoked jamás se reactiva por reintento.
4. **Límite comprobado:** RequireAuth hoy descarta search/hash y safeReturnPath acepta sólo map/my-events/events/new/me. Registro confirma correo con emailRedirectTo `/map`; la memoria no sobrevive recarga, confirmación en otra pestaña o cierre. En ese caso indicar volver a abrir el enlace original tras ingresar. No prometer recuperación del token ni modificar redirects remotos en este bloque. Probar H21/H22 y redirects permitidos al integrar bloque 7.

## 4. SQL versionado: contratos, permisos y fugas

**Verificado estáticamente:** 17 archivos de migración (uno vacío aplicado históricamente), 11 CREATE TABLE públicas, 31 funciones públicas de negocio, 12 funciones privadas y 20 políticas finales declaradas. Las tres tablas R4 **no están creadas en Git**: `event_access_links`, `event_access_grants`, `user_category_interests`. Las 11 tablas declaran RLS; RPC de negocio declaran search_path vacío y EXECUTE authenticated con revocación de PUBLIC/anon. Esto **no acredita grants efectivos del remoto**, defaults de service_role, propietarios, gateway ni replay SQL. `public.rls_auto_enable()` sólo aparece en una revocación, no tiene definición versionada auditada.

[Inventario exacto](../design/verification/r4-block-0/sql-inventory.json): parámetros con nombres/tipos/defaults, retornos, invoker/definer, dependencias, línea/migración de última definición, sentencias de EXECUTE, políticas y hashes. Abreviaturas de esta tabla: U=uuid, T=text, TS=timestamp sin zona, I=integer, D=double precision. Todas las firmas siguientes son actuales; los nombres de RPC R4 son propuestas, no servicios existentes.

| Firma actual / resultado | Seguridad / autorización actual | Riesgo y trabajo futuro R4 |
| --- | --- | --- |
| `create_event(U,T,T,TS,TS,U,I,T,D,D,T,T[]) → U` | Invoker, inserts por columnas/RLS; auth.uid, UUID idempotente y media propia | INSERT restringe public; sin parámetro visibility. Evolución compatible para publicar oculto sin etapa pública |
| `update_event(U,T,T,TS,TS,U,I,T,D,D,T) → U` | Definer, dueño, antes de inicio, lock evento/cupo | No cambia visibility. Mantener edición/cupo; transición de visibilidad debe ser atómica y coherente con formulario |
| `discover_public_events(D,D,D,D) → filas` | Invoker; public, no cierre, ends_at futuro, bounds/antimeridiano, 101 filas | No texto/categorías/fecha/radio. Nunca ampliar a ocultos por un grant del usuario |
| `get_home_events(TS,U,I) → filas` | Invoker; public, starts_at futuro, keyset y limit+1 | Falta contrato combinado; divergencia temporal con mapa |
| `get_event_participation_summary(U) → fila` | Definer; dueño, público no cerrado **o cualquier own.id histórico** | Expone capacidad/estado/cupo de oculto sin grant; usar predicado autorizado común |
| `register_for_event(U) → void`, `leave_event(U) → void` | Definers; register sólo public, lock evento y estado propio; leave propio incluso cerrado | Admitir oculto sólo grant active; revoked sin recanje. Leave conserva operación propia/historial, sin habilitar lectura de contenido oculto |
| `get_event_organizer(U) → display_name,username` | Definer; dueño/público/histórico propio | Proyección mínima correcta, pero histórico expone identidad vinculada a oculto revocado |
| `get_my_events(T,I) → filas`, `get_my_organized_events(T,I) → filas` | Invokers; propio, RLS, offset 31; organizados exige autoría | Participating hereda fuga de events RLS; preservar histórico público y del dueño, no contenido oculto revocado |
| `get_event_duplicate_source(U) → campos` | Invoker, sólo dueño; sin fotos/fechas/relaciones | No fuga al ajeno; asegurar que nueva publicación no herede enlace/grants |
| `cancel_event(U) → U`, `archive_event(U) → U` | Definers, dueño, READ COMMITTED y lock evento; archivo cancela antes si vigente | Cierre impide canje/aprobación; conservar datos/grants según contrato, sin DELETE |
| `get_my_rejoin_status(U) → jsonb`, `request_rejoin(U) → U` | Definers; status admite histórico; request exige removed, vigencia/cooldown, sin condición visibility/grant | Ambos pueden eludir oculto revocado. Revalidar permiso antes de devolver datos o pedir reincorporación |
| `get_event_rejoin_requests(U,I) → jsonb`, `get_event_rejoin_resolution(U,U) → T` | Definers, sólo dueño y vinculación exacta | Sin acceso de invitado; preservar identidad mínima/páginas |
| `resolve_rejoin(U,U,T) → void` | Definer, dueño; removed/pending, aprobación con cupo/vigencia; rechazo tras cierre aprobado R3 | Antes de aprobar oculto verificar grant active del destinatario; no restaurar un revoked por aprobar una solicitud vieja |
| `get_event_attendees(U,T,T,I) → jsonb`, `remove_participant(U,U) → void` | Definers, sólo dueño; proyección nombre/username; remoción vigente con historial | Invitación no abre nómina administrativa. Revocar acceso R4 requiere remoción+historial+grant en misma transacción; remove de R3 no equivale por sí solo a revoke |
| `get_event_chat(U)`, `get_event_chat_messages(U,TS,U)`, `send_event_chat_message(U,U,T)` | Definers; helper privado can_read_event_chat acepta dueño o confirmed; send locks evento/participación, cerrado read-only | Helper y send deben comprobar también grant de oculto. Endurecer RLS conversaciones/messages y Realtime, no sólo header UI |
| `add_event_image(U,T)`, `remove_event_image(U,U)`, `reorder_event_images(U,U[],U[])`, `get_event_unregistered_uploads(U)` | Definers; lock_gallery/dueño, paths propios, orden y relaciones; no destruir objeto registrado | Lectura depende de RLS; gestión del dueño permanece. Compartidos se autorizan por asociación visible, no por ID provisto por cliente |
| `get_notification_target(U)`, `get_notifications(TS,U)`, `get_notification_changes(U[])`, `mark_notification_read(U)` | Invokers; destinatario propio; target usa RLS events/chat, read_at restringido | Endurecer targets al revocar. Title/body ya entregados son historial propio y no se recuperan borrando la UI; no añadir productores ni notificaciones R4 |

**Cadena de políticas inspeccionada:**
- `events_select_authenticated`: dueño o public sin cancel/archive; no excluye finalizados de detalle. `events_select_participating`: EXISTS participación visible propia, **sin condición de estado ni visibilidad**. Al combinar políticas permisivas, una participación cancelled/removed también abre unlisted.
- `event_images_select_visible` depende de events; `files_select_visible` acepta uploader propio o asociación visible; `event_media_select_visible` acepta prefijo propio o file visible. Endurecer toda la cadena y conservar propiedad legítima del archivo y referencias compartidas. Bloquear la asociación al evento no puede volver secretos bytes que el usuario posee legítimamente por otra asociación pública.
- `conversations_read_member`→`planit_private.can_read_event_chat`→dueño/confirmed; `messages_read_member` hereda conversación. Realtime publica messages/notifications, con sus políticas; header HTTP no basta para controlar canal directo.
- Participaciones/historial y solicitudes tienen SELECT propio. Conservar auditoría propia no debe volver a abrir título, ubicación, media o chat del oculto revocado. RLS profiles sigue siendo propia; nunca habilitar lectura integral ajena.

## 5. Matriz de autorización objetivo y amenazas

[Tabla cartesiana exacta](../design/verification/r4-block-0/authorization-matrix.csv): **288 filas** = actor (anon/organizer/authenticated_other) × public/unlisted × grant active/revoked/none × participación confirmed/removed/history/none × detail/chat/RPC/media. Incluye permiso actual deducido de SQL y permiso objetivo, **no resultados de prueba**. Evento abierto; history significa cancelled con participación previa, no pending. RPC en esta matriz significa lecturas summary/organizer; RPC de gestión exige dueño y mutaciones tienen sus condiciones adicionales. Media significa nueva firma de archivo ajeno asociado exclusivamente al evento; las excepciones de propiedad/compartidos y URLs previas se explican aparte. Combinaciones imposibles se identifican y se deniegan conservadoramente al ajeno.

| Actor / contexto | Detalle + RPC de lectura + nueva firma | Chat | Gestión / nómina administrativa |
| --- | --- | --- | --- |
| Anon, cualquier visibilidad | Denegado; conocer token no concede nada antes de Auth/canje | Denegado | Denegado |
| Organizador de evento | Permitido incluso histórico; no depende de grant propio | Permitido; escritura sólo vigente | Sólo dueño, condiciones de cada operación |
| Ajeno, público abierto, cualquier grant | Permitido por regla pública A05, sin restaurar grant | Sólo confirmed | Denegado |
| Ajeno, oculto active, confirmed | Permitido | Permitido; escritura sólo vigente | Denegado en R3, no introducir nómina social R5 |
| Ajeno, oculto active, none/removed/history | Permitido por grant, sin inscripción implícita | Denegado | Denegado |
| Ajeno, oculto revoked/none, incluso histórico/confirmed inconsistente | Denegado, también REST/RPC/Storage | Denegado | Denegado |

Fuera de la tabla abierta: público cancelado/archivado conserva lectura del dueño y participación histórica permitida R1–R3; oculto histórico requiere dueño/grant active. Evento cerrado no admite canjes nuevos, registro/aprobación/envío; chat histórico autorizado permanece sólo lectura. Restituir grant no reinscribe. Mensajes/medios ya recibidos, capturas del usuario y URLs previamente firmadas no son borrables por RLS.

**Prioridades para bloque 5:** P1 autorización histórica de events/summary/organizer/rejoin y cadena de media; P1 confirmed/chat sin grant; P1 rejoin viejo que pudiera restaurar acceso revocado indirectamente. Son riesgos de habilitar ocultos R4, **no explotación remota demostrada**: el cliente actual publica sólo public. Prioridad funcional: bloquear antes de habilitar visibilidad/enlaces, no ocultar botones como reparación.

**Pruebas futuras obligatorias:** H02/H19/H20 sobre SELECT directo, RPC y firmas nuevas; H13 grant sin chat/nómina; H21/H22 token/cambio de cuenta; H14/H15 remoción→historial→revocación con rollback; H16/H28 carreras register/resolve/visibility/send; H25 confirmed+revoked al ocultar aborta sin cambiar evento/grants/link/participación/historial; H12/H26 regreso a público permite lectura sin alterar revoked, revoca link y exige nuevo al reocultar; H27 hash/rotación sin recuperar secreto. Repetir contra JWT reales sólo con autorización y cuentas de prueba; casos definidos no son PASS.

## 6. Decisiones y secuencia futura

**A01–A07 aprobadas el 12/10/2026:** centro de mapa como fallback visible; fecha por inicio; filtros en Inicio/Mapa; grants atómicos a confirmed al ocultar sin reactivar revoked; público visible para todos; sólo hash/mostrar token una vez/regenerar si se pierde; R3 integrada/validada por responsable. No se reabrieron.

| ID | Resolución de este bloque | Naturaleza / prueba |
| --- | --- | --- |
| D02 | 5/10/25/50/100 km + Sin límite inicial | Default técnico propuesto; validar server-side, no asumir GPS |
| D05 | Query params saneados no secretos, estado compartido y retorno completo | Propuesta de ingeniería; privacidad GPS sin historial/telemetría, limpieza por cuenta |
| D06 | `/me/interests`, selección local y reemplazo atómico mediante RPC propia | Propuesta adoptada para navegación; categorías activas, RLS propietario |
| D07 | Pesos 100 afinidad / 30 cercanía / 20 fecha, candidatos públicos vigentes antes de LIMIT | Propuesta de ranking; fórmula/normalización y límites se fijan y prueban en bloque 4, no se declara aprobada ni existente |
| D10 formato | `/invite#token=` y memoria que sobreviva rutas; recarga/confirmación externa exige reabrir enlace | Propuesta técnica factible para login SPA; nunca almacenar secreto recuperable |
| **D12** | **Al pasar unlisted→public, revocar enlace activo en la misma transacción; conservar grants. Al reocultar generar otro enlace** | **Elegido expresamente por usuario 13/10/2026**; H12/H26, carreras contra canje/rotación |
| D13 | No excluir automáticamente propios/confirmed del universo de sugerencias | Default técnico propuesto; no fabricar badge si tarjeta/consulta no aportan estado |
| **D14** | **TTL objetivo 60 s en URLs de media oculta; renovar tras revalidar permiso y limpiar al denegar/cambiar cuenta** | **Opción elegida por usuario 13/10/2026; propuesta técnica para bloque 5**. No prometer revocación inmediata de URL previa; renovar antes del vencimiento visible y al foco, sin firmar al revoked |

TTL actual comprobado = 300 s en lectores. Supabase documenta URLs privadas temporales y una firma separada de Auth; cambiar claves Auth no cancela firmas emitidas ([Storage](https://supabase.com/docs/guides/storage/serving/downloads)). El objetivo 60 s requiere revisar reutilización de paths entre asociaciones y no sirve como control de autorización: firma nueva siempre requiere permiso. El SW actual precachea recursos locales y no tiene runtimeCaching de Supabase; caché HTTP/memoria e imágenes descargadas tienen límites residuales. Consultada [documentación de redirects](https://supabase.com/docs/guides/auth/redirect-urls); allowlist remoto no inspeccionado. Changelog markdown no pudo abrirse por content-type; se consultó [changelog HTML](https://supabase.com/changelog), sin cambios de SDK/configuración.

**Secuencia, sin archivos SQL nuevos en este bloque:**
1. Bloques 1–2: consulta pública combinada/paginada y contrato de filtros, manteniendo RPC existentes hasta migrar sus consumidores.
2. Bloque 3: user_category_interests con PK user/category, created_at AR, RLS propia y guardado atómico; categorías inactivas no se agregan.
3. Bloque 4: ranking reproducible sobre candidatos autorizados; no tabla recommendations.
4. Bloque 5: event_access_links (token_hash único, created_by, timestamps AR, único activo sin expires_at) y event_access_grants (único event/user, source_link nullable, active/revoked y fechas del modelo original). RLS desde creación, helpers de permiso y reparación de todas las superficies identificadas. Sin habilitar publicación oculta todavía.
5. Bloques 6–8: evolución compatible de create/update y set_event_visibility, generar/invalidar/rotar, redeem, listar/revocar/restituir. Nombres RPC sugeridos en decisiones no son firmas finales. Mantener locks evento→participación→grant/link/solicitud según recurso, READ COMMITTED y autorización auth.uid; cupo/historia/remoción/grant se confirman o revierten juntos. Evitar overload ambiguo de PostgREST y reotorgar grants al cambiar firmas.
6. Bloque 9: replay incremental, catálogos/permisos, fixtures y JWT/Storage/Realtime reales autorizados. No editar migraciones aplicadas; no borrar eventos/historial/grants al alternar visibilidad.

## 7. Diseño observado, verificación y límites

Mockup original **abierto visualmente**, 1491×1055: Buscar (texto/chips/resultados), Filtros (categorías/fechas/radio), Explorar (mapa/lista), Intereses (selección/guardar), Sugerencias (tarjetas). No representa enlace, canje ni panel grants R4-07..09; éstos se componen con gestión/campos/diálogos actuales. Corazones, gratuidad, tickets, tags múltiples, «artistas/lugares» del buscador y «actividad» del ranking no autorizan funciones/campos. La búsqueda oficial es título/descripción; sugerencias usan intereses/distancia/fecha.

Amanecer real conserva fondo claro, fuente local, foto lateral/fallback compacto, tinta para CTA/dock, azul de filtros/progreso y estados con texto. Lab `/b/home`, `/b/map`, `/b/profile`, `/b/event` consultado y capturado: tira de días, accesos rápidos, contadores y dibujo del mapa son fixtures/referencias compositivas; no se trasladan automáticamente. Standard `day` verificado en EventMap; no probado contra proveedor real. Foto/fallback se inspeccionó en EventCard/Detalle y capturó con SVG marcado Imagen de prueba; no se usaron fotos extraídas del collage.

[Evidencia nueva y reproducción](../design/verification/r4-block-0/README.md): base inmutable, 10 capturas app (375×812 y 1280×900, más error/foto ausente) y 4 lab. Sin overflow horizontal en esas capturas, fuente local cargada, scopes y dock medidos. Foco inicial a main inspeccionado/medido; foco de mapa/diálogos inspeccionado en código, no probado exhaustivamente por teclado. Foco violeta 3 px, áreas ≥44, datos ≥13,5, reduced motion/transparency y fallback opaco son requisitos de integración futura; no certificación WCAG del bloque. Sin dispositivos físicos, lector de pantalla, zoom real, desempeño ni aceptación humana.

**Verificaciones del bloque:** trazabilidad 39/39 y comparación original; inventario estático de SQL/firmas/permisos; navegación/scopes/capturas con fixtures; enlaces locales, hashes/alcance y git diff --check. **No ejecutados:** build, lint (diff documental), replay/tests SQL, catálogos remotos, HTTP/JWT A/B, Storage/Realtime reales, CA funcionales R4. No se alteró código, SQL, configuración, reportes históricos ni sistema visual. Entregar PR documental para revisión y detenerse.

## 8. Trazabilidad RF/CA → ruta, servicio, componente, scope y prueba

Todas las filas son contratos propuestos sobre la base inspeccionada; los 39 CA mantienen estado Pendiente. [Detalle individual de 39 criterios](../design/verification/r4-block-0/traceability.csv).

| RF / CA | Ruta / servicio | Componente Amanecer | Scope | Prueba futura |
| --- | --- | --- | --- | --- |
| RF-R4-01, CA-01..04 | /home, /map; proposed search_public_events; loadHomeEvents/discoverEvents integration | HomePage / MapPage / FormField / EventCard / StatusMessage | .discovery-shell; home.css/discovery.css | D01/D02/D11 |
| RF-R4-02, CA-01..04 | /home, /map; proposed search_public_events + loadCategories | HomePage / MapPage / category selection controls | .discovery-shell; home.css/discovery.css | D03/D04/D05 |
| RF-R4-03, CA-01..04 | /home, /map; proposed search_public_events temporal parameters | FormField date/range / filter panel | .discovery-shell | D06/D07/D05 |
| RF-R4-04, CA-01..04 | /home, /map; proposed search_public_events radius + viewport center callback | MapPage / EventMap / filter panel | .discovery-shell; map.css | D08/D09/D10/D12 |
| RF-R4-05, CA-01..04 | /me/interests; proposed set_my_category_interests + categories | ProfilePage entry / ScreenHeader / category checkbox group / StatusMessage | proposed .social-shell .interests-page | P01/P02/P03/P04 |
| RF-R4-06, CA-01..04 | /home; proposed get_suggested_events; candidates ranked before LIMIT | HomePage For you / EventCard / StatusMessage | .discovery-shell; home.css | P05/P06/P07 |
| RF-R4-07, CA-01..05 | /events/new, /events/:id/edit, /events/:id; create_event/update_event evolution; proposed set_event_visibility/create_or_rotate_event_link | CreateEventPage / EditEventPage / EventManagement / link controls | .event-form-shell / .discovery-shell; event-actions.css | H01/H06/H07/H10/H11/H12/H25/H26/H27/H28 |
| RF-R4-08, CA-01..05 | /invite, /login, /events/:id; proposed redeem_event_link; loadEvent/summary/organizer/media gated | AuthPage / proposed invitation page / EventDetailPage / StatusMessage | proposed .invite-shell; .discovery-shell | H02/H03/H04/H05/H08/H09/H10/H13/H19/H20/H21/H22 |
| RF-R4-09, CA-01..05 | /events/:id/access; proposed get_event_access_grants/revoke_event_access/restore_event_access | EventManagement entry / authorized rows / native permission dialog | proposed .event-management-shell .event-access-page; event-management.css | H14/H15/H16/H17/H18/H23/H26 |
