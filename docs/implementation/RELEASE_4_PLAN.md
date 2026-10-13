# PlanIt — Plan técnico de implementación Release 4 (para Codex)

**Versión:** **1.2 · Amanecer** — 13/10/2026 (Argentina); decisiones de producto A01–A07 confirmadas 12/10/2026. **Estado:** documentación propuesta, **R4 no implementada ni validada** por este plan.  
**Contrato obligatorio:** [`RELEASE_4_REQUIREMENTS.md`](../requirements/RELEASE_4_REQUIREMENTS.md), **9 RF y 39 CA**.  
**Fuente original:** [Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), pestañas **Nueva planificación**, **Criterios de aceptación** y **Especificación técnica** (R4).  
**Diseño visual vigente:** `PRODUCT.md` → **`DESIGN.md`** (fuente normativa, B · Amanecer v3.0) → `docs/design/DESIGN_SYSTEM.md` → componentes actuales → `design-lab` dirección `/b` (composición/estados con datos falsos) → `docs/design/mockups/release-4.png` (referencia **histórica y funcional, no pixel-perfect**). Seguir [`RELEASE_4_VISUAL_INTEGRATION.md`](RELEASE_4_VISUAL_INTEGRATION.md) y `docs/design/UI_WORKFLOW.md`; **no regenerar** `DESIGN.md` ni `.impeccable/design.json`.
**Decisiones aprobadas:** `RELEASE_4_DECISIONS_PROPOSED.md` (A01–A07); **seguimiento:** `RELEASE_4_STATUS.md`; **pruebas:** `../qa/RELEASE_4_ACCEPTANCE.md`, `../qa/RELEASE_4_TEST_PLAN.md`; **prompts:** `prompts/RELEASE_4_BLOCK_0.md` a `..._9.md`.

## A. Objetivo, alcance y trazabilidad

R4 desarrolla **descubrimiento público combinado y personalización sencilla**, seguido de **acceso controlado a eventos ocultos**. No añade machine learning, motor de matching externo, precios/pagos/tickets, favoritos, perfiles sociales, mensajes privados, estadísticas R6 o historias R7. **Nuevo orden de octubre de 2026:** la antigua R4 Comunidad es R5. La nueva R4 incluye nueve RF, no seis. El agrupamiento por categoría R2 no equivale al filtro multiselección R4.

| Sprint | Bloque | Entrega | RF | CA oficiales | Dependencias |
| --- | ---: | --- | --- | ---: | --- |
| 1 | 0 | Auditoría, riesgos de autorización, rutas, diseño | transversal | — | R3, migraciones reales |
| 1 | 1 | Búsqueda textual y filtro de categorías | R4-01/02 | 8 | R2 Inicio, RPC descubrimiento |
| 1 | 2 | Fecha/rango, radio, mapa/lista, estado unificado | R4-03/04 | 8 | Bloque 1 |
| 2 | 3 | Intereses persistidos | R4-05 | 4 | Catálogo, Auth |
| 2 | 4 | Ranking determinístico «Para vos» | R4-06 | 4 | Bloques 2–3 |
| 2 | 5 | Seguridad de visibilidad/permiso, auditoría y políticas | parte de R4-07/08/09 | transversal | R1–R3 RPC/RLS/Storage |
| 2 | 6 | Configurar público/oculto y generar/rotar link | R4-07 | 5 | Bloque 5 |
| 2 | 7 | Canjear enlace y autorización persistente | R4-08 | 5 | Bloques 5–6 |
| 2 | 8 | Revocar/restituir grants, remoción atómica | R4-09 | 5 | Bloques 5–7, R3 remoción |
| 2 | 9 | QA integral / regresiones / cierre | todos | 39 | Bloques 0–8 |

**Orden principal** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9; los bloques 3–4 pueden trabajarse en paralelo con la preparación del 5 *sólo si se evitan conflictos de archivos y migraciones*. Un PR por bloque desde `main` sincronizado, previa integración de dependencias. Cada PR tiene revisión humana. No fusionar ni aplicar SQL remoto de manera autónoma.

## B. Contrato de trabajo obligatorio

1. Leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/architecture.md`, `docs/database.md`; planes, STATUS y pruebas R2/R3; `PRODUCT.md`, **`DESIGN.md`**, `docs/design/{AGENTS,DESIGN_SYSTEM,UI_WORKFLOW,SCREENS,DESIGN_GAPS}.md`, `docs/design/proposals/amanecer-direction.md`, `docs/implementation/ui-refresh-blocks/BLOCK_3.md` a `BLOCK_7.md`, `RELEASE_4_VISUAL_INTEGRATION.md`; contrato funcional R4. PNG R4: sólo como contexto histórico, nunca objetivo visual. El contrato funcional conserva el texto literal y no se modifica por diseño/implementación.
2. **Verificar `main` y esquema REAL antes de actuar**; esta foto documental sólo acredita el código leído, no prueba el estado remoto en este instante. **El responsable confirmó el 12/10/2026 que R3 está integrada y validada.** Documentación versionada R3 conserva `NO-GO` por falta de E2E JWT reales/aceptación humana; **registrar discrepancia de evidencia**, sin contradecir la decisión A07 ni afirmar que esa evidencia existe. Verificar únicamente la disponibilidad efectiva en `main` de RPC, migraciones de reincorporación y permisos que R4 reutiliza; no exigir volver a validar R3 como gate de producto ni rehacer QA aprobado.
3. Usar únicamente **Supabase `planit-v2`** (`iepeqmvzjguwlhnecsdq`) previa autorización para cambios. Proyecto viejo `fmqzokxvpqxfzvcnzvjm`: SOLO LECTURA. No ejecutar `db push`, DDL, mutaciones remotas, merge ni despliegue sin permiso expreso; diseñar y probar localmente.
4. React 19, TypeScript, Vite 8, React Router, PWA, Supabase Auth/Postgres RLS/Storage/Realtime; UI aprobada **B · Amanecer v3.0**, mobile-first, tokens `--pi-*`, `.amanecer-shell` acotado por ruta; no introducir Next.js, Expo, un backend separado, Edge Function o PostGIS salvo razón aprobada.
5. `events.starts_at/ends_at` usan **timestamp without time zone, horario Argentina**. Convertir fechas de controles en intervalos locales `[inicio, fin_exclusivo)`; no depender de la zona del dispositivo, no introducir `events.timezone`.
6. Todas las entidades de un evento poseen una categoría; las preferencias y filtros pueden tener varias. No crear una tabla `recommendations`: derivar el ranking mediante consulta/servicio.
7. Nuevos objetos `public` con RLS y grants mínimos. `auth.uid()` como identidad autoritativa. En `SECURITY DEFINER`: `set search_path=''`, objetos schema-qualified, EXECUTE sólo `authenticated`, autorización explícita en cada función, sin SQL dinámico ni retorno de información privada.
8. El diseño no autoriza gratis/pagos, entrada disponible, corazones, perfiles sociales, ratings ni otras prestaciones no contempladas. No inventar controles funcionales.
9. Las pruebas deben discriminar SQL local con sesión/JWT simulado, HTTP/JWT real A/B, navegador, fixtures, Storage y Realtime; capturas sólo de UI realmente ejecutada. Revisar estados loading/empty/error/retry, denegación, cancelación, idempotencia y concurrencia. No marcar **Validado** sin aceptación humana.
10. Si SQL, RF o CA entran en tensión, documentar alternativas en `RELEASE_4_DECISIONS_PROPOSED.md` y pedir aprobación antes de una alteración semántica/remota.

## C. Línea de base verificada en código de `main` (13/10/2026; `a378259a60`)

- Rutas protegidas reales: `/home`, `/map`, `/events/:id`, `/events/new`, `/events/:id/edit`, `/events/:id/chat`, `/events/:id/attendees`, `/events/:id/rejoin-requests`, `/my-events`, `/me` (más galería y notificaciones). `src/App.tsx` usa `RequireAuth`.
- R2: `HomePage.tsx` llama `get_home_events` con cursor; `MapPage.tsx` llama `discover_public_events` con *bounds* y límite efectivo 100; tarjetas `EventCard`, detalle `EventDetailPage`, imágenes privadas firmadas a 300s. La consulta de mapa es de **rectángulo visible, no radio geodésico**.
- `src/features/events/discovery.ts`, `home.ts`, `src/features/location/geolocation.ts` y `src/features/events/validation.ts` ya concentran contratos reutilizables de mapa, lista y horarios. `defaultLocation` apunta a Buenos Aires para centrar mapa; NO equivale a ubicación GPS consentida.
- `events` ya tiene `visibility text` con `public|unlisted`, pero las operaciones de creación/edición actuales sólo aceptan público: política de INSERT y `create_event` restringen; `update_event` carece del parámetro de visibilidad. **No agregar toggle UI antes de adaptar inserción/edición seguras.**
- Tabla `events`: `events_select_authenticated` autoriza dueño o público no cerrado. **Política `events_select_participating` autoriza lectura de evento por cualquier fila de participación histórica**. Esto puede incumplir revocación de ocultos; debe reemplazarse/condicionarse. La mera presencia de `event_access_grants` no soluciona accesos indirectos.
- `get_event_participation_summary`, `get_event_organizer`, `get_event_duplicate_source`, `get_my_events`, RPC de reincorporaciones, archivos/imágenes y otras funciones privilegiadas requieren auditoría de nuevas condiciones oculto/revocado. El chat ya exige dueño/confirmed, no se habilita por grant de lectura del detalle.
- La R3 registra `remove_participant` y un trigger de `participation_history` que deben reutilizarse/coordinarse al revocar acceso. Inscripciones actuales rechazan eventos `visibility <> 'public'`; deben admitir ocultos con grant activo conservando requisitos de cupo/estado/removido.
- `storage.objects` contiene política de lectura de `event_media` basada en relación con `files` y uploader; actualizar y probar autorización para las fotos de eventos ocultos tras revocación. Un enlace firmado ya emitido no deja de funcionar inmediatamente sólo porque cambie RLS: registrar TTL, exposición residual y mitigación.
- Las migraciones remotas reflejadas en STATUS de R3 **no sustituyen la verificación local/remota actual**; comentarios históricos «local only» dentro de algunos SQL pueden estar desactualizados.

### C1. Refresh Amanecer posterior al corte del plan 1.1

- Base de trabajo de esta revisión: `main` **`a378259a60106ddd07b111080a24677ad509bc49`**. Comparación contra `d9c0a6984e4e99a86aaed8dd3c70663518b7144b`: **30 commits nuevos**, PR #25 (QA R3) y PR #27–#34 de dirección/refresh UI. Revalidar SHA al iniciar cada bloque; esta fecha es una foto, no permiso para ignorar futuros commits.
- Dirección aprobada **B · Amanecer**, modo claro único. `src/styles/tokens.css` centraliza `--pi-*`; `src/styles/amanecer.css` habilita patrones scoped `.amanecer-shell`. Bricolage Grotesque autoalojada. `AppLayout.tsx` decide scope según ruta y contiene el dock; extender cuidadosamente para `/me/interests`, `/invite`, `/events/:id/access` si se confirman esas rutas. No repetir fundación ni introducir segunda paleta.
- **Inicio/Mapa/Detalle** ya migrados mediante UI Refresh bloque 4; `HomePage` conserva agrupación y paginación; `MapPage` conserva Mapbox Standard preset `day`, bounds, debounce, mapa/lista/preview único, selección con foco y retorno; `EventCard` público tiene nueva presentación. Integrar R4 **sobre estos componentes**, no reemplazarlos por reproducciones del mockup.
- **Crear/Editar** migrados en refresh bloque 3; gestión y reingresos migrados en bloque 7; galería/asistentes en bloque 5 y perfil/chat/notificaciones en bloque 6. Respetar contratos existentes, diálogos/acciones y límites de layout. Bloques de refresh poseen reportes nuevos en `docs/implementation/ui-refresh-blocks` y evidencias en `docs/design/verification/ui-refresh/`.
- `docs/implementation/UI_REFRESH_R1_R3_STATUS.md` conserva una tabla histórica que puede listar bloque 3–7 pendientes pese a PR fusionadas. Verificar `main` y los documentos por bloque; **no** actualizar retrospectivamente estados o capturas históricas desde R4.
- El mockup R4 fue previo a la dirección B: solo elementos contractuales. Buscador/chips y tira de días del prototipo B eran **visuales no funcionales en R1–R3**; R4 autoriza ahora búsqueda/categorías/fecha según RF/CA, pero **no** favoritos, ventas de entradas, ranking inventado ni un nuevo calendario semanal con contadores no aprobados.
- **Ninguna migración SQL nueva** apareció en la comparación del refresh: seguridad del plan R4, grant/revoke, historial, signed URLs y auditoría definer permanecen requisitos vigentes.

## D. Arquitectura y contratos de implementación

**Acuerdos vinculantes A01–A07 (12/10/2026):** fallback al centro del mapa; fecha por `starts_at`; filtros en Inicio y Mapa; grants transaccionales para confirmados al ocultar; modo público visible para todos; tokens con hash solamente; R3 integrada y validada. El detalle y los asuntos técnicos no aprobados están en `RELEASE_4_DECISIONS_PROPOSED.md`. Los prompts no deben volver a plantear estas siete elecciones.

### D1. Descubrimiento y filtros — RF-R4-01..04

**Experiencia:** una única fuente de estado para filtros de Buscar/Explorar/Mapa: `text`, `categoryIds[]`, `dateFrom`, `dateTo`, `referenceLocation` y `radiusKm`. Multiselección en categorías = OR interno, grupos de filtros = AND. Filtros activos visibles como chips, `Limpiar todo` y limpieza individual. Reutilizar `EventCard`/mapa, no dos lógicas discrepantes.

**Servicio propuesto:** RPC autenticada `search_public_events`, o evolución compatible de funciones existentes, con paginación estable y predicados siempre en servidor:

```text
p_query?: string | null        # btrim; vacío = sin filtro
p_categories?: uuid[] | null  # NULL o [] = sin filtro
p_from_date?: date | null
p_to_date?: date | null       # inclusiva a nivel de UI
p_center_lat?: double precision | null
p_center_lon?: double precision | null
p_radius_km?: double precision | null
p_south/p_north/p_west/p_east?: double precision | null # bbox para mapa
p_after_starts_at?: timestamp | null
p_after_id?: uuid | null
p_limit?: int (límite acotado, p. ej. <=50)
```

Es un **contrato sugerido**, no un procedimiento existente. Restringir `visibility='public'`, sin cancelar/archivar y `ends_at > ahora AR` **antes de paginar**. Búsqueda `ILIKE` en `title OR description` con parámetros correctamente escapados (`%`, `_`, `\` literales en búsquedas) y longitud máxima razonable; no interpolar SQL. No confundir ausencia de resultados con error del servidor. Orden determinístico `(starts_at,id)`; no filtrar en cliente un subconjunto ya limitado del mapa (sesga el resultado). Para listas, cargar otra página y reiniciar cursor al cambiar filtro; para mapa, viewport o límite comunicado.

**Fecha — A02 APROBADA:** eventos cuyo **inicio programado** cae en el día/rango seleccionado, independientemente de cuándo terminen. Convertir a `starts_at >= día_inicio 00:00` y `starts_at < (día_fin+1) 00:00` con convención AR. El rango invertido se rechaza; limpiar no borra otros filtros. No implementar criterio por solapamiento: fue descartado en A02. Incluir pruebas con eventos que comienzan antes y terminan dentro del rango.

**Distancia:** distancia de gran círculo (Haversine, km), con prefiltro bounding box e índice si justifica; no usar coordenadas privadas de `profiles`. **A01 APROBADA:** origen «Mi ubicación» si GPS fue autorizado o **«Centro del mapa»** como alternativa automática y visible cuando GPS no esté disponible. El mapa podría iniciarse con centro por defecto Buenos Aires, pero **debe etiquetarse como centro del mapa, nunca ubicación del usuario**, y permitir ajustar el punto moviendo el mapa. Si se desconoce ambos orígenes, no aplicar radio hasta resolverlo. Radio positivo validado en frontend y servidor; probar límites, hemisferios, empates y valores inválidos. PostGIS no obligatorio. Sugerencia UX a confirmar: radios 5/10/25/50/100 km y `sin límite`.

**A03 APROBADA — Navegación:** sin ruta `/search`; filtros integrados en `/home` y `/map`. **Estado/URL técnicos propuestos:** query params de filtros no sensibles en `/home` y `/map` (`q`, `categories`, `from`, `to`, `radiusKm`, opcional coordenadas explícitamente aceptadas). Nunca serializar tokens secretos de acceso. Compartir estado entre pestañas sin hacer recargas infinitas; `AbortController` o requestId/revisión para respuestas tardías. `loadingMore`, `hasMore`, `retry`, `empty` con filtros activos visibles.

### D2. Intereses — RF-R4-05

Crear `public.user_category_interests` con **PK `(user_id, category_id)`**, FKs a `profiles` y `categories`, `created_at timestamp` conforme convención AR; RLS read/write únicamente sobre `auth.uid()`. Conservar preferencias aunque categoría luego se inactive; no permitir **nuevas** selecciones inactivas. Índice por `category_id` sólo si el patrón consultado lo justifica. No escribir perfiles privados ajenos.

**Contrato de guardado recomendado:** `set_my_category_interests(p_category_ids uuid[])`: validar autenticación, categorías activas, unicidad/UUID, hacer reemplazo atómico de selección en una transacción y devolver IDs resultantes; **no borrar todo y luego insertar en dos peticiones independientes**. Evitar duplicados, actualizaciones parciales o confirmación prematura; incluir estado `guardando`, `guardado`, `error`, reversión visual/reintento y cambio de cuenta. Pantalla `/me/interests` o sección en `/me` a decidir por navegación real.

### D3. Sugerencias — RF-R4-06

Consulta exclusivamente de eventos **públicos vigentes**; opcionalmente omitir eventos propios, según decisión UX pendiente. Sin nueva tabla ni ML. Puntuación determinística propuesta documentada: `afinidad_categoria` 100 puntos si pertenece a intereses + `proximidad` hasta 30 puntos si existe origen válido + `prontitud` hasta 20 puntos según fecha futura; desempate `starts_at, id`. El algoritmo exacto/pesos son **propuesta**, no exigencia del Docs. Evitar ordenar todos los eventos del país en cliente; limitar conjunto de candidatos con filtros públicos/temporalidad, paginar si corresponde. Sin ubicación: ranking por intereses/fecha, nunca simular distancia. Sin intereses: ofrecer eventos próximos *etiquetados como generales*, o vacío informativo si no hay resultados; evitar etiquetar como «para vos» coincidencias ficticias. Tarjetas muestran motivo simple («Coincide con tus intereses» / «Cerca de tu ubicación»), sin inventar porcentajes.

### D4. Modelo de acceso oculto — RF-R4-07/08/09

El **modelo aprobado** exige **dos tablas**, no token directo en `events`:

```text
event_access_links:
 id uuid PK, event_id uuid FK events, created_by uuid FK profiles,
 token_hash text UNIQUE NOT NULL, created_at timestamp NOT NULL,
 revoked_at timestamp NULL
 UNIQUE parcial (event_id) WHERE revoked_at IS NULL
 NO expires_at

event_access_grants:
 id uuid PK, event_id uuid FK events, user_id uuid FK profiles,
 source_link_id uuid NULL FK event_access_links,
 status text CHECK(active|revoked),
 granted_at timestamp, revoked_at timestamp NULL,
 restored_at timestamp NULL, updated_at timestamp,
 UNIQUE(event_id,user_id)
```

Todas las tablas con RLS. **No SELECT abierto del token_hash ni de grants de otras personas**. Enlace criptográficamente impredecible **generado servidor-side** (p. ej., 32 bytes de CSPRNG), sólo hash SHA-256 (con `pgcrypto` o equivalente PostgreSQL aprobado) en BD; retornar token legible al dueño **una sola vez** tras generación/rotación. **A06 APROBADA:** nunca persistir secreto recuperable; si se pierde, se regenera y el anterior deja de servir para nuevos canjes. No intentar recuperar el token a partir del hash. TTL de calendario: ninguno. Vigencia transaccional se evalúa al canjear: link no revocado + `visibility='unlisted'` + evento no terminado/cancelado/archivado. Rotación bloquea fila de evento, revoca link anterior y emite uno nuevo en la misma transacción; `UNIQUE` parcial impide dos activos.

**Matriz base de lectura de detalle (oculto):** organizador sí; `grant active` sí; `grant revoked` **no**, aunque haya una participación histórica; usuario con link sin canje válido no; anon no. `grant active` NO otorga acceso a chat, asistentes ni historias (estas últimas son R7); sólo `confirmed`/organizador participa en chat según reglas previas. Para `public`, conservar reglas actuales sin deshacer el histórico R1–R3. La revocación individual prevalece en `unlisted` incluso si se regeneró el token. **Nunca** basar permisos exclusivamente en ocultar botones.

**Punto crítico de auditoría:** reemplazar/ajustar `events_select_participating` y revisar las otras políticas `events`, `event_images`, `files`, `storage.objects`; auditar **todas las RPC definer que seleccionan eventos o participan** (`get_event_participation_summary`, `get_event_organizer`, `get_event_duplicate_source`, `get_my_events`, `get_my_rejoin_status`, etc.). Evitar recursión RLS usando helper de autorización mínimo `planit_private.can_view_event(...)` auditable, con identidad del JWT y privilegios mínimos. Revisar permisos REST a tabla y permisos de EXECUTE de cada función. Un participante revocado debe perder lectura por ruta directa, consultas RPC y metadatos indirectos.

**Inscripción:** `register_for_event` actualmente sólo admite públicos. Evolucionarla para admitir `unlisted` con grant `active` (o dueño, que no se inscribe), conservando validación de evento abierto, `removed` no se reinscribe sin aprobación, cupo con lock, y trigger de historia. `leave_event`, chat e histórico no deben reabrir lectura tras revocación.

**Creación:** la RPC `create_event` y RLS INSERT actual permiten sólo `public`. Proponer nueva firma/versión compatible que **inserte con `visibility='unlisted'` desde el primer INSERT**; frontend usa el flujo explícito correspondiente sin ventana de exposición. Conservar UUID idempotente y archivos conversacionales nuevos. Actualizar permisos/migración con pruebas de compatibilidad para clientes R1–R3. Editar visibilidad mediante RPC autorizada de dueño, no `UPDATE` público genérico; nunca borrar datos históricos.

**Transiciones A04/A05 APROBADAS:**

1. **`public→unlisted`:** bloquear fila del evento, comprobar los participantes `confirmed` dentro de la misma transacción y crear/preservar grants `active` sin duplicarlos; cambiar la visibilidad de modo atómico. Un `confirmed` que ya tiene grant `revoked` genera **conflicto que bloquea toda la transición**: mostrar advertencia y requerir intervención explícita del organizador; jamás reactivar revocados ni removerlos silenciosamente. La condición debe repetirse al confirmar, bajo lock para evitar carreras con nuevas inscripciones.
2. **`unlisted→public`:** inmediatamente se aplican las reglas de lectura de evento público a todas las personas, incluidos quienes tengan `grant revoked`. Conservar la fila revocada y el estado de participación (`removed` no es `confirmed`); esa revocación vuelve a limitar el acceso si el evento se oculta de nuevo. No eliminar histórico.
3. **Enlace activo al hacer público:** por seguridad se **propone** invalidarlo en la misma transacción para evitar reutilización si vuelve a ocultarse; esta política concreta corresponde a D12 y se registra como propuesta técnica, no como una de las siete decisiones expresas. Los grants activos no se revocan por esa rotación/cambio.

**Canje:** RPC `redeem_event_link(p_token)` con validación server-side, `auth.uid()`, idempotencia por `(event_id,user_id)`, bloqueo de evento/link/grant en orden consistente y rechazo **prioritario** de `grant revoked`. Canje repetido por active no duplica. No auto-inscribe. Error genérico para token inválido/desconocido/revocado que no facilite enumeración de eventos. Ruta propuesta `/invite` con secreto en **fragmento** `#token=...` para evitar incluirlo en servidor/logs/referrer; preservar intención al pasar por login/confirmación y limpiar el fragmento tras canje. La alternativa `/invite/:token` es más simple pero expone el secreto a registros y referrers: requiere decisión explícita. Nunca persistir el token en BD, analytics, logs o URLs enviadas como referrer.

**Revocación y restitución:** RPC transaccionales sólo de organizador (`revoke_event_access`, `restore_event_access` como nombres propuestos). Para revocar: lock evento→participación→grant; si `confirmed`, cambiar a `removed`, escribir historial *mediante trigger existente*, liberar cupo y luego marcar grant `revoked`, **todo en una transacción**. Si falla cualquier paso, rollback. Evitar duplicados de historia y bloqueos invertidos; revocación/restitución idempotentes. `restore` sólo habilita detalle, **NO reinstala** al asistente ni cupo ni chat automáticamente. No se restaura canjeando otro enlace.

**Nota de medios firmados:** Supabase Storage puede seguir sirviendo una URL firmada emitida antes de revocar hasta su caducidad (actual frontend 300 s). Reducir vida útil en superficies privadas, limpiar URLs de estado/caché al revocar, no cachearlas con Service Worker, y dejar residual documentado. Revocar no puede «des-descargar» contenido previamente visto.

### D5. Contrato de integración visual Amanecer (obligatorio para todos los bloques con frontend)

**Autoridad visual para R4 (no opcional):** leer `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` (referencia, nunca regenerarlo), `docs/design/AGENTS.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/UI_WORKFLOW.md`, `docs/design/proposals/amanecer-direction.md`, `docs/design/DESIGN_GAPS.md`, `docs/design/SCREENS.md` (inventario funcional), `docs/implementation/UI_REFRESH_R1_R3_PLAN.md`, implementaciones `docs/implementation/ui-refresh-blocks/BLOCK_3.md` a `BLOCK_7.md`, y el nuevo `docs/implementation/RELEASE_4_VISUAL_INTEGRATION.md`. Inspeccionar los componentes y estilos reales del `main` vigente. El prototipo `design-lab` dirección `/b` es referencia de composición/estados, **no** código de producción ni fuente de tokens; `docs/design/mockups/release-4.png` es contexto funcional histórico, no contrato pixel-perfect. Si hay conflicto visual manda `DESIGN.md`; para funcionalidades prevalecen RF/CA, especificación, decisiones aprobadas, SQL y RLS.

**Estética y calidad obligatorias:** B · Amanecer v3.0, modo claro único `#f6f5fd`, tinta `#060b27` para CTAs/dock, azul `#0753ff` reservado a filtros seleccionados/progreso, violeta como luz y foco; Bricolage Grotesque autoalojada, tokens `--pi-*` de `src/styles/tokens.css`, `.amanecer-shell` y estilos acotados por ruta de `src/styles/amanecer.css`. Una mancha superior decorativa aria-hidden por pantalla, tarjetas blancas/cristal con fallback opaco, sombras suaves, píldoras para acciones, sin gradientes en controles/tarjetas/chips, sin tema oscuro, sin tarjetas anidadas. Aplicar áreas >=44px, foco visible violeta 3px, datos operativos >=13,5px, texto/estado accesibles, `prefers-reduced-motion` y `prefers-reduced-transparency`. Reutilizar `AppLayout`, `EventCard`, `ScreenHeader`, `FormField`, `StatusMessage`, `AccountMenu`, botones, diálogos y patrones existentes; **no crear un segundo sistema de diseño**. Preservar dock flotante de cuatro destinos y rutas actuales; una subruta nueva exige definir scope en `AppLayout.tsx` y retorno/foco/safe area explícitos.

**Arquitectura UI:** no crear una ruta `/search`; Inicio/Mapa comparten contrato de filtros sin clonar implementación. Antes de introducir cualquier ruta, auditar condicionales `isDiscovery`, `isEventForm`, `isEventManagement`, `isSocial` de `AppLayout`. Un evento oculto accesible por grant no debe añadirse a resultados públicos por una decisión visual. Búsqueda y mapa preservan la selección/preview y el foco al eliminar un resultado. Personalización en Perfil no debe rediseñar la identidad o el dock.

**Verificación:** comparar un checkout base inmutable con implementación mediante navegador reproducible; seguir `docs/design/UI_WORKFLOW.md` y las suites específicas de cada pantalla. No declarar aceptación por capturas con Auth/REST interceptados. No regenerar foundation/sidecar/docs del sistema ni pisar carpetas de QA históricas. Consultar [`RELEASE_4_VISUAL_INTEGRATION.md`](RELEASE_4_VISUAL_INTEGRATION.md) para rutas, componentes, alcance y no-regresión.

## E. Bloques y entregables detallados

### BLOQUE 0 — Auditoría y contrato R4
- Inspeccionar main, tabla efectiva, RPC, políticas y grants en migraciones y, con permisos, metadata remota *read-only* de `planit-v2`; revisar dependencias de R3 bloques 5–7 y ausencia de objetos R4.
- Resolver mapa de rutas `/home`, `/map`, `/me`, `/events/new`, `/events/:id/edit`, `/events/:id`, `/invite`, `/events/:id/access`; documentar navegación post-login, entradas desde otras pantallas y manejo del secreto.
- Auditar visualmente mockup `release-4.png`, desglose de cinco pantallas en SCREENS y brechas (gratuitos, favoritos, etc.), sin atribuirlo a funcionalidades.
- Auditar funciones que exponen eventos/unlisted por RLS/historial, Storage y RPC definer; producir tabla `actor × recurso × acción × estado`.
- **Salida:** `RELEASE_4_BLOCK_0_DECISIONS.md` real, listado de scripts/migraciones y permisos confirmados; no SQL aplicado. QA: revisión documental y trazabilidad de 39 CA. **No reemplazar la plantilla de decisiones por evidencia inventada**.

### BLOQUE 1 — Búsqueda por texto y categorías
- Implementar consulta pública combinada, parametrizada y paginada; mostrar input, búsqueda reiterable, limpieza, chips multiselección y OR/AND correctos.
- Compartir contrato de `EventPreview` y signed URLs, sin dejar que errores de media oculten las tarjetas. Cancelar resultados obsoletos.
- Comprobar que R1/R2 Inicio/mapa/listas continúan sólo públicos; registrar contrato de API y screenshots de lista/buscador.
- **DoD:** RF-R4-01.CA-01..04 + RF-R4-02.CA-01..04 (8), acentos como caso exploratorio no obligatorio, wildcard literal, 0/error y paginación.

### BLOQUE 2 — Fecha, distancia y vista mapa/lista
- Implementar fecha única/rango **sólo por `starts_at`** con días enteros Argentina (A02); validar invertidos, limpiar y responder a límites/midnight.
- Implementar radio en km respecto de GPS consentido o, ante ausencia/denegación, **centro del mapa como fallback aprobado** (A01), visible y editable; filtrar en servidor y mantener criterio al alternar mapa/lista.
- Resolver estado sin permiso GPS, timeout, lat/lon inválidas, radio inexistente, mapa movido, paginación y cambio de cuenta. No inferir GPS desde fallback geográfico.
- **DoD:** RF-R4-03.CA-01..04 + RF-R4-04.CA-01..04 (8). Pruebas con mismos eventos y filtros en mapa/lista.

### BLOQUE 3 — Intereses por usuario
- Crear y probar migración `user_category_interests` PK compuesta, RLS y operación atómica opcional; sección de selección/guardado de intereses reutilizando categorías activas.
- Cuentas A/B y anon; sin categorías seleccionadas, agregar/quitar/volver, doble clic, rollback al fallar, categorías inactivas.
- **DoD:** RF-R4-05.CA-01..04 (4), persistencia y autorización real.

### BLOQUE 4 — Sugerencias determinísticas
- Implementar ranking reproducible y explicación simple; probar preferencias, fecha y distancia con fallbacks; no nueva tabla.
- Sólo públicos, no cerrados, no media privada ajena. Ajustar bounded candidates y desempate. Usar layout R4 real.
- **DoD:** RF-R4-06.CA-01..04 (4), cero/alguna/todas señales, ranking estable, navegación detalle.

### BLOQUE 5 — Base de seguridad para `unlisted`
- Crear esquema `event_access_links`/`event_access_grants` RLS/índices + helpers de permiso, con migración nueva incremental.
- Reparar `events_select_participating` histórico, lecturas indirectas vía Storage, `get_event_participation_summary`, organizer/duplicación/reingreso/listados/REST. Probar permisos por actor y estado *antes* de lanzar enlaces visibles.
- Revisar `register_for_event` para grant activo y barrera contra revoked; media firmada y política PWA. No habilitar creación oculta todavía si el flujo completo no está listo.
- **DoD:** pruebas de denegación exhaustivas anon/A/B/participante histórico/revocado sin ninguna fuga, sin cambiar accesos públicos históricos indebidamente.

### BLOQUE 6 — Configurar visibilidad y rotación de link
- Adaptar creación/edición atómica y formularios; mostrar selector Público/Oculto y controles de compartir/rotar sólo para dueño de evento oculto; aplicar A04/A05 de transiciones y resolver conflicto de confirmado+revocado sin éxito parcial.
- Token seguro generado en servidor, SHA-256 almacenado, un activo, rota atómicamente, no fecha de expiración y canje bloqueado por fin/cierre.
- Asegurar que duplicación no hereda enlace ni grants, que no hay transición pública fugaz y que el secreto sólo se entrega una vez (A06), sin logs ni almacenamiento recuperable.
- **DoD:** RF-R4-07.CA-01..05 (5), concurrencia de rotación y eventos finalizados.

### BLOQUE 7 — Canje y acceso persistente sin inscripción
- Ruta de canje, redirección a Auth/volver, RPC idempotente, preservar secreto de forma efímera y limpiar URL; detalle autorizado sólo con grant activo.
- Borrar estado privado cacheado al alternar identidades; no activar chat/asistentes. Invalidaciones y fin/cierre como errores controlados.
- **DoD:** RF-R4-08.CA-01..05 (5), acceso directo, sesión vencida, repetición, acceso revocado y HTTPS.

### BLOQUE 8 — Panel de autorizaciones
- Listar grants de evento propio con información mínima (nombre, username, avatar autorizado, active/revoked), paginación y acciones con confirmación; nunca email privado.
- Revocación transaccional de confirmed con historial/cupo/chat; restaurar grant por decisión explícita del organizador sin reinscribir. Conservar grants al rotar link.
- **DoD:** RF-R4-09.CA-01..05 (5), tres cuentas, doble clic, rollback, simultaneidad con `register_for_event`/`resolve_rejoin`.

### BLOQUE 9 — QA integral, regresiones y cierre
- Completar las **39 filas literales** de `RELEASE_4_ACCEPTANCE.md`; resultados, capturas, evidencia SQL/HTTP separada, mitigaciones y recomendación GO/NO-GO en `RELEASE_4_TEST_REPORT.md`.
- Cobertura de 20+ amenazas en `RELEASE_4_TEST_PLAN.md`, datos fixtures autorizados, comparación visual contra R4 y R1–R3, performance con límites, errores, carrera.
- Auditoría de RLS/SECURITY DEFINER/grants y Advisor; retests Auth/crear/editar/cancelar/archivar/duplicar/reingreso/chat/imágenes/Inicio/mapa/Mis eventos/notificaciones.
- No declarar QA completado si faltan sesiones con JWT real o validación humana. **Salida:** PR de QA, estado R4 actualizado y lista de decisiones pendientes.

## F. Matriz de amenazas mínima

| Identidad | Público abierto | Oculto sin grant | Oculto grant active | Oculto grant revoked | Chat oculto sin confirmed |
| --- | --- | --- | --- | --- | --- |
| Anónimo | Sin rutas protegidas según R1/R2 | Denegado | N/A | N/A | Denegado |
| Autenticado ajeno | Ver público según políticas | **Denegado** en REST/RPC/Storage | Ver detalle | **Denegado**, incluso con link nuevo | Denegado |
| Organizador | Administrar propio | Administrar propio | Administrar propio | Organizador no se revoca a sí mismo | Puede leer chat de su evento |
| Confirmado de oculto | N/A | No debería ocurrir sin grant al convertir | Ver detalle + chat | Debe ser removido antes de revocar; sin detalle/chat | Sin confirmed = denegado |

**Ataques a cubrir:** UI directa, `select` de PostgREST, RPC `SECURITY DEFINER`, imágenes firmadas nuevas, lecturas de `event_images/files/storage.objects`, extractos de organizer/listas/notifications, canje concurrente, rango de IDs/eventos, revocación repetida, rotación e historial. El diseño no considera segura una política hasta verificar *todas* las rutas de exposición.

## G. Estrategia SQL, pruebas y rendimiento

- Una migración incremental por bloque de base (3, 5, 6–8 según necesidad), sin editar migraciones ya aplicadas. Si una función SQL existente cambia de firma: planificar transición compatible, revisar grants y dependencias. En Supabase CLI verificar `supabase migration list`, `supabase db push --dry-run` antes de cualquier aprobación de despliegue.
- Triggers/locks: orden **evento → participación → grant/link** siempre que los recursos existan. No usar transacciones frontend separadas para remoción + historial + revocación.
- Búsqueda pública: query server-side; límite y cursor, no `fetch` completo; `ILIKE` con escape y una estrategia de índices/`pg_trgm` sólo si el volumen y `EXPLAIN` lo justifican. Medir respuesta típica p50/p95 con dataset reproducible cuando exista.
- Distancia: Haversine con radianes/radio terrestre coherente, prefiltrado bounding box con manejo de antimeridiano, sin PostGIS inicialmente; validar puntos próximos al borde.
- Ranking: función pura en TypeScript sobre lote autorizado acotado **o RPC que compute ranking antes de LIMIT**; nunca rankear sólo 30 resultados de Inicio si el conjunto candidato relevante es mayor.
- Seguridad: `EXPLAIN`, índice parcial `(event_id) WHERE revoked_at IS NULL`, `UNIQUE(event_id,user_id)` y pruebas de bloqueo/concurrencia. Funciones de mutación con `SECURITY DEFINER` sólo por necesidad real y revisión de privilegios de creación de objetos/search_path.
- Hora Argentina: `clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'`, dates UI, fin exclusivo, cambios a medianoche, navegador UTC/otra TZ. Probar eventos que inician hoy y terminan mañana.

## H. QA por superficie

- **Backend:** migraciones reproducibles; catálogos y RLS; 4 identidades + anon, 39 CA, directorio SQL/fixtures con rollback; errores/constraints/idempotencia/locks.
- **Frontend:** `npm ci`, `npm run build`, `npm run lint`, scripts `check-*` pertinentes, nuevos `check-search`, `check-interests`, `check-hidden-access` (nombres sugeridos); sin depender de tests unitarios inexistentes.
- **Browser:** 360×800, 375×812, 390×844, 768×1024, escritorio 1280×900; screenshots reales por estado, foco, teclado, safe-area, contraste, lectura de chips/rango/mapa.
- **Regresiones R1–R3:** mapa, Inicio, detalle, Auth y redirect, creación y edición, participación/cupo, cancelación/archivo, duplicación, chat sólo confirmados, remoción, reincorporación, perfil, notificaciones, signed URLs.
- **Aceptación:** evidencia verificable y revisión humana de 39 CA; lo implementado no equivale a validado.

## I. Política de ramas y reporte de cada bloque

1. Crear `codex/r4-block-N` desde `main` actualizado; declarar SHA base, permisos remotos, migraciones nuevas y riesgos. R3 fue confirmada integrada/validada por el responsable; si alguna dependencia técnica no aparece en `main`, documentar el desfase real y resolverlo antes de utilizarla, sin desconocer la aprobación informada.
2. Ejecutar checks y documentar evidencia por tipo: `unit/fixture`, SQL local, JWT real, Storage real, navegador, screenshots. No describir fixtures como integración real.
3. Actualizar `RELEASE_4_STATUS.md`: RF/CA, archivos, migración local/aplicada, PR, pruebas PASS/FAIL/NOT RUN, pendientes, diferencias de mockup y seguridad.
4. No modificar alcance sin RFC; no tocar Supabase histórico ni secretos; no merge/deploy/DDL remoto sin autorización. Finalizar cada bloque dejando PR lista para revisión.

## J. Registro de acuerdos y propuestas técnicas restantes

**No reabrir acuerdos A01–A07:** ubicación alternativa = centro del mapa; fecha = inicio; filtros = Inicio y Mapa; confirmados mantienen acceso al ocultar con grants atómicos; evento vuelto a público visible para todos; enlace sólo hash y regeneración; R3 integrada y validada. La implementación debe demostrar los siete comportamientos.

**A revisar sin alterar esos acuerdos:** radios iniciales (D02), persistencia de parámetros en URL (D05), lugar exacto de Mis intereses (D06), scoring y pesos (D07), formato seguro de fragmento de invitación (parte D10), invalidación de enlace cuando un oculto pasa a público (D12), candidatos de ranking (D13), TTL residual de signed URLs y mitigación (D14). Adoptar defaults documentados en Bloque 0 cuando sean decisiones de ingeniería reversibles; **pedir aprobación adicional sólo si una elección cambia RF/CA, privacidad o derechos de usuario**.

**Dependencia documental:** el archivo R3 STATUS leído antes de esta actualización podría seguir diciendo «QA pendiente»; el acuerdo A07 prevalece para el estado de aceptación de R3. El Bloque 0 verifica el estado técnico de código/SQL en `main`, no realiza una nueva aceptación de R3.
