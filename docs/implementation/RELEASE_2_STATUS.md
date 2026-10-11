# PlanIt — Release 2: seguimiento de implementación

**Plan de referencia:** [RELEASE_2_PLAN.md](RELEASE_2_PLAN.md).  
**Requisitos y aceptación:** RF-R2-01 a RF-R2-07 (28 CA), pestañas «Nueva planificación», «Criterios de aceptación» y «Especificación técnica» del [documento Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit).  
**Diseño:** [Mockup R2](../design/mockups/release-2.png), DESIGN_SYSTEM.md, SCREENS.md, DESIGN_GAPS.md.  
**Proyecto remoto permitido:** planit-v2, ref iepeqmvzjguwlhnecsdq; proyecto antiguo: sólo lectura.  
**Corte inicial:** 10/10/2026 (Argentina). Documento de preparación, sin implementación R2 iniciada.

> Estados: **Pendiente** (no iniciado), **En curso** (trabajo abierto), **Implementado; QA pendiente** (código y evidencia; no aprobado), **Validado** (revisión/aceptación humana + evidencia), **Bloqueado** (dependencia explícita). Sólo el usuario autoriza marcar Validado. No confundir PR abierta con bloque integrado.

## Tablero de R2

| Bloque | Alcance | RF | Estado | PR / evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| 0 | Preparar R2, navegación y contrato de diseño | Transversal | Implementado; QA pendiente | [PR #7 fusionada](https://github.com/EnzoG14/PlanIt/pull/7); [PR #8 de verificación](https://github.com/EnzoG14/PlanIt/pull/8) | Revisión humana del contrato visual; revisión visual responsive pendiente |
| 1 | Inicio, categorías y detalle ampliado | R2-01/02/03 | Implementado; QA pendiente | rama `codex/r2-block-1-home-detail`; [PR #9](https://github.com/EnzoG14/PlanIt/pull/9) | 12 CA cubiertos por checks locales; aceptación humana y Auth/REST/Storage remoto pendientes |
| 2 | Chat de evento: leer y enviar texto | R2-04/05 | Implementado; QA pendiente | [PR #10](https://github.com/EnzoG14/PlanIt/pull/10); [evidencia](../design/verification/event-chat/README.md) | Migración aplicada; REST/Auth real y aceptación humana pendientes |
| 3 | Mi perfil (lectura propia ampliada) | R2-06 | Implementado; QA pendiente | [PR #11](https://github.com/EnzoG14/PlanIt/pull/11); [evidencia](../design/verification/own-profile/README.md) | 4 CA con SQL local/UI fixture; cuentas reales y aceptación humana pendientes |
| 4 | Bandeja de notificaciones | R2-07 | Implementado; QA pendiente | [PR #12](https://github.com/EnzoG14/PlanIt/pull/12); [evidencia](../design/verification/notifications/README.md) | Migración aplicada; REST/JWT real y aceptación humana pendientes |
| 5 | QA integral, seguridad y regresión R1 | R2-01 a 07 | Implementado; QA pendiente | [PR #16 (Draft)](https://github.com/EnzoG14/PlanIt/pull/16); [matriz 28 CA](../qa/RELEASE_2_ACCEPTANCE.md), [informe](../qa/RELEASE_2_TEST_REPORT.md) | NO-GO para cierre: E2E de escrituras/entrega/negativos remotos, dispositivo y aceptación humana |

## Estado de partida

- R1 tiene implementación de bloques 0–5 en main y pruebas manuales exitosas informadas por el usuario. No traducir esto a 28/28 pruebas automatizadas.
- En main existen Auth, eventos/fotos, categorías, mapa OSM/Leaflet, detalle mínimo, inscripciones/retiro y Mis eventos.
- Ruta /me existente con nombre visible, username y email. No existe todavía una pantalla Inicio real ni chat de evento ni bandeja de notificaciones R2.
- Supabase nuevo: 7 migraciones registradas hasta 20261010154930 y 7 tablas públicas conocidas; no existen conversations, messages ni notifications al iniciar R2.
- Las advertencias heredadas y límites de QA se describen en docs/qa/RELEASE_1_TEST_REPORT.md. Comprobar estado actual antes de cada migración.
- La PR de documentación QA R1 puede requerir revisión/merge independiente; **no** fusionarla automáticamente durante R2.

## Protocolo de actualización

1. Antes del trabajo, Codex lee RELEASE_2_PLAN.md, el estado y la carpeta de diseño; contrasta Git/Supabase actual con el corte inicial.
2. Trabaja únicamente el bloque pedido, en rama/PR independiente desde main actualizado.
3. Cambia su fila a En curso al comenzar (si versiona ese estado) y a Implementado; QA pendiente sólo después de contar con código y pruebas documentadas.
4. Registra **PR, commit/ramas, migraciones locales y remotas diferenciadas, resultados reales, capturas, CA cubiertos, errores, decisiones y pasos manuales pendientes**.
5. No reescribe RF ni modifica el plan como si fuera una decisión aprobada. Los cambios de alcance se proponen y validan.
6. No informa pruebas fixture como si fueran API real ni supone éxito remoto por un SQL local; tampoco marca Validado sin aprobación del usuario.
7. Ningún agente fusiona PR, ejecuta migraciones remotas o cambia la configuración Supabase sin autorización expresa.

## Actas de bloques

### Bloque 0 — Preparación

- Estado: Implementado; QA pendiente (no validado por revisión humana).
- Rama base original: `main` en `c2b17f30fc845906c47ef3ae0fedc96b94bbcf25`; rama de implementación: `codex/r2-block-0-navigation-docs`. Seguimiento de verificación basado en el merge `c5afa827bab4990f05320a6b7f5660ce43a6e337` de `origin/main`.
- PRs: [#7 — docs: prepare Release 2 block 0 navigation contract](https://github.com/EnzoG14/PlanIt/pull/7), fusionada; [#8 — docs: record Release 2 block 0 verification results](https://github.com/EnzoG14/PlanIt/pull/8), abierta para registrar los resultados posteriores.
- Cambios: contrato de rutas, disponibilidad por bloque, navegación, estados y límites visuales en `docs/implementation/RELEASE_2_BLOCK_0.md`. Sin cambios de código, migraciones ni recursos remotos.
- Rutas: inspección de `src/App.tsx` y `src/components/AppLayout.tsx` confirmó que `/` redirige a `/map`, las rutas R1 permanecen disponibles y la navegación no enlaza a `/home`, chat ni notificaciones antes de estar implementados. `/events/:id` y `/me` ya existen.
- Diseño: revisión visual de `docs/design/mockups/release-2.png` y contraste con DESIGN_SYSTEM, SCREENS y DESIGN_GAPS; no se modificó la UI, por lo que no se generó captura responsive de la aplicación.
- Verificación posterior al merge: `npm ci` instaló 376 paquetes y reportó 0 vulnerabilidades; `npm run build`, `npm run lint` y `git diff --check` pasaron. Se confirmó que la navegación no enlaza a destinos R2 aún no implementados.
- Límites: no hubo verificación visual responsive en navegador porque el cambio es documental y no modifica la UI. Sin CA funcionales propios de este bloque; no se ejecutó QA de bloques posteriores.
- Decisiones: las rutas R2 se documentan pero permanecen sin registrar ni enlazar hasta sus bloques funcionales. Sin migraciones locales o remotas.

### Bloque 1 — Inicio y detalle

- Estado: Implementado; QA pendiente (sin validación/aceptación humana).
- Rama base: `origin/main` actualizado a `611d169b6a0a167e6cd9837293ae2e085e762eef`; rama `codex/r2-block-1-home-detail`.
- PR: [#9 — feat(r2): add event home and expanded detail](https://github.com/EnzoG14/PlanIt/pull/9), abierta, sin fusionar.
- Migración `20261010212819_home_and_event_organizer_read.sql`: aplicada en `planit-v2` (ref `iepeqmvzjguwlhnecsdq`), registrada remotamente con versión `20261010212819`. No se modificó configuración/Auth/Storage.
- Cambios: `/home` autenticado con consulta keyset ordenada por `starts_at,id`, eventos públicos futuros y vigentes, grupos por categoría, portadas firmadas en lote y estados loading/error/empty; detalle amplía organizador mediante proyección autorizada de `display_name,username`, muestra galería disponible y conserva la participación R1. Navegación principal: Inicio, Mapa, Mis eventos y Perfil; Crear permanece accesible desde Mis eventos. `/` y rutas R1 no cambian.
- CA: RF-R2-01.CA-01..04, RF-R2-02.CA-01..04, RF-R2-03.CA-01..04.
- Evidencia automatizada: R2-01.CA-01..04 (fixture de detalle, datos persistidos/locales, fotos presentes/ausentes y acceso/proyección SQL); R2-02.CA-01..04 (eventos próximos, navegación al detalle, exclusión local de pasados/cancelados/archivados y estado vacío); R2-03.CA-01..04 (categoría registrada, agrupación, acceso al detalle y grupos con resultados solamente). Ejecuciones y límites en `docs/design/verification/home-event-detail/`.
- Verificación: `npm ci` (376 paquetes, 0 vulnerabilidades); `npm run build`, `npm run lint`, `npm run check:events`, `npm run check:discovery`, `npm run check:discovery:ui`, `npm run check:home-events` y `npm run check:home:ui` pasaron. PostgreSQL fue local con scaffold Auth/Storage; UI usa respuestas fixture. `git diff --check` pasó.
- Diseño: capturas Playwright en 375×812 y 1280×900, revisadas contra los teléfonos 1/2 del mockup. La UI fixture cubre portada, galería, ausencia de fotos, categorías, error/vacío y paginación.
- Verificación remota posterior: `list_migrations` confirma `20261010212819_home_and_event_organizer_read`; consulta de catálogo confirma ambas funciones, `authenticated` puede ejecutarlas y `anon` no. Asesor de seguridad señala la exposición intencional de la función SECURITY DEFINER a usuarios autenticados, junto con tres funciones R1 preexistentes; no se reportó una nueva exposición para `anon`.
- Pendiente: revisión humana; comprobación de Inicio y detalle desde la aplicación contra REST/Auth/Storage real después de la migración; prueba con dos sesiones; smoke manual de R1 en navegador/entorno real. No se marca el bloque como Validado.
- Riesgo/decisión: `get_event_organizer` es SECURITY DEFINER limitado a nombre visible/username, autenticación y acceso equivalente al evento; nunca concede SELECT general sobre profiles. La advertencia del asesor corresponde al acceso autenticado deliberado a esta proyección.

### Bloque 2 — Chat del evento

- Estado: Implementado; QA pendiente (sin aceptación humana).
- Base: `origin/main` en `18457eac3fb1cfe8b33a875c55c620df4bf3d607`, PR #9 integrada; rama nueva `codex/r2-block-2-event-chat`.
- PR: [#10 — feat(r2): implement event group chat with protected history and sending](https://github.com/EnzoG14/PlanIt/pull/10), borrador sin fusionar; implementación en commit `6bd1282`.
- Migración: `20261010214526_event_chat.sql`, **aplicada en planit-v2** (iepeqmvzjguwlhnecsdq) el 10/10/2026 con autorización expresa del usuario. Versiones locales/remotas sincronizadas (9); dry-run posterior sin pendientes. Sin cambios Auth/Storage/Realtime.
- Cambios: conversación única por evento desde publicación, trigger + backfill idempotente; historial paginado de 50 mensajes, cursor created_at/id; `/events/:id/chat` protegida y enlazada desde detalle para organizador/confirmed; vacío/error/sólo lectura, burbujas marino/azul/violeta y composer con límite 2000.
- Seguridad: RLS para organizador/confirmed; cancelled/removed no acreditan acceso, tampoco al cerrar. Sin mutaciones REST directas. RPC deriva sender_id de auth.uid(), bloquea evento y participación, exige READ COMMITTED y verifica cierre con reloj posterior al lock. UUID retenido en memoria durante reintentos previene duplicación. Repetición de un envío ya persistido puede devolver ID tras cierre, sin insertar.
- Perfil social: proyección limitada a display_name/username del emisor; sin SELECT general de profiles. Funciones definer con autorización explícita, search_path vacío y EXECUTE sólo authenticated; helper privado sin identidad elegida por cliente.
- Transporte: refresco explícito y al recuperar foco/visibilidad. Sin Realtime. Actualizar vuelve a la última página; historial anterior bajo demanda.
- CA: RF-R2-04.CA-01..04 y RF-R2-05.CA-01..04.
- Evidencia: [matriz/capturas](../design/verification/event-chat/README.md), postgres-results.json y ui-results.json. PostgreSQL real local con scaffold Auth/Storage; navegador con fixtures interceptados, no E2E Supabase real.
- Pruebas: build/lint, check:events, check:auth, check:participations, check:my-events, check:home-events, `node scripts/check-chat.mjs`, `node scripts/check-chat-ui.mjs` y diff --check. Resultados y límites en la evidencia.
- Verificación remota: RLS activa, grants sin INSERT/UPDATE/DELETE authenticated ni SELECT anon; RPC EXECUTE authenticated y no anon, search_path vacío; cero eventos sin chat y cero duplicados, trigger presente. Asesores: tres avisos nuevos de SECURITY DEFINER autenticado intencional junto a cuatro heredados y leaked-password protection; sin errores.
- Pendientes: JWT/REST con dos cuentas, smoke R1 real, revisión humana y teclado/safe areas físico. Bloques 3–5 sin iniciar.
- Fuera de la PR: cambios locales previos en package.json/package-lock.json y eliminación de .env.example, preservados.

### Bloque 3 — Mi perfil

- Estado: Implementado; QA pendiente (sin aceptación humana).
- Base: `origin/main` en `1719a25`, PR #10 integrada; rama nueva `codex/r2-block-3-own-profile`.
- PR: [#11 — feat(r2): implement own profile consultation](https://github.com/EnzoG14/PlanIt/pull/11), borrador sin fusionar; implementación en commit `dacdf59`.
- Cambios: `/me` consulta nombre/username/bio/avatar_file_id propios; correo desde Auth. Avatar circular con firma de 300 segundos sólo para archivo propio accesible, placeholder en faltantes/fallos. Mantiene marino/azul/violeta, biografía centrada, navegación Perfil activa y acceso real a Mis eventos; sin funciones R5 del collage.
- Sesiones: estado nuevo por identidad/token, descarte de respuestas tardías y limpieza durante recarga/error; datos actualizados al reabrir, recuperar foco o pulsar Actualizar perfil. AuthProvider y permisos existentes conservados.
- Migraciones: ninguna; sin SQL/escrituras/configuración remotas, sin ampliación de grants/RLS/Storage. Avatar sólo desde referencia ya persistida; no edición/carga ni permisos nuevos.
- CA: RF-R2-06.CA-01..04; [matriz y capturas](../design/verification/own-profile/README.md), ui-results.json y postgres-results.json.
- Pruebas: build/lint, check:auth, check:events y diff --check. `node scripts/check-profile.mjs`: PostgreSQL real local con scaffold Auth/Storage; dos identidades y anon, consultas por ID/sin filtro, actualización propia y denegación cruzada, lectura de archivo/objeto propio. `node scripts/check-profile-ui.mjs`: Edge con fixtures Auth/REST/Storage, móvil 375×812 y desktop 1280×900, cambio A/B con consulta A pendiente, logout, recarga/foco, campos ausentes y avatar denegado/ajeno/roto.
- Diseño: capturas revisadas contra teléfono 4; se omiten métricas, intereses, seguidores, entradas y configuración/edición no disponibles. Correo y Actualizar perfil son accesos/datos reales, sin controles inertes.
- Pendientes: dos cuentas reales Auth/REST/Storage, aceptación humana, smoke completo R1 real y teclado/safe areas físico. `.auth-test.local` no está disponible. Evidencia fixture/SQL local no equivale a E2E remoto.
- Fuera de la PR: cambios locales previos en package.json/package-lock.json y eliminación de .env.example, preservados. Bloques 4/5 sin iniciar.

### Bloque 4 — Notificaciones

- Estado: Implementado; QA pendiente (11/10/2026 Argentina, sin aceptación humana).
- Base: `origin/main` actualizado en `a71b3bfc5f9a6194222ff9319a712611b9ceec4b`; rama nueva `codex/r2-block-4-notifications`.
- PR: [#12 — feat(r2): implement private notification inbox](https://github.com/EnzoG14/PlanIt/pull/12), borrador sin fusionar; implementación en commit `2a1f799`.
- Migración: `20261011163653_notifications_inbox.sql`, **aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario**. Reproduce todas las migraciones en PostgreSQL temporal con scaffold Auth/Storage; sin cambios Auth/Realtime ni Push.
- Verificación remota posterior: 10 migraciones sincronizadas y dry-run sin pendientes; notifications con RLS, SELECT propio, UPDATE sólo read_at, sin INSERT/DELETE de cliente ni acceso anon. Tres RPC invoker con search_path vacío y EXECUTE sólo authenticated; trigger presente. Consulta READ ONLY con dos identidades SQL verificó bandejas vacías y destino ausente; anon denegado. Sin avisos nuevos de seguridad: siete SECURITY DEFINER heredados y leaked-password protection ya documentados.
- Cambios: `/notifications` autenticada desde campana en cabecera; 30 filas + lookahead, cursor created_at/id, tipo/título/cuerpo/fecha Argentina y leído/no leído. Actualizar/foco reinician, cuenta nueva descarta filas y respuestas tardías. Loading/error/empty y migración aún no disponible; marcado sin éxito optimista y revalidación del destino al abrir.
- Seguridad: RLS sólo destinatario, sin INSERT/DELETE de cliente y UPDATE exclusivo read_at con trigger reloj servidor/primera lectura inmutable. RPCs invoker, search_path vacío y EXECUTE sólo authenticated; sin identidad destinataria proporcionada desde navegador. Destinos heredan RLS evento/chat y vuelven a autorizar al navegar; ninguna notificación concede acceso.
- CA: RF-R2-07.CA-01..04.
- Evidencia: [matriz, capturas y límites](../design/verification/notifications/README.md), postgres-results.json y ui-results.json. SQL real local con A/B/anon; UI fixtures interceptados en 375×812 y 1280×900, reloj dispositivo Tokyo, teclado, fallos de red/marca, recurso revocado y cambio de cuenta con respuesta tardía.
- Pruebas PASS: build, lint, `node scripts/check-notifications.mjs`, `node scripts/check-notifications-ui.mjs`, check:auth, check:events, check:participations (incluye carreras de cupo), check:my-events y diff --check.
- Diseño: revisión contra pantalla 5 de mockup R2. Filas marino/violeta, iconos circulares, nav inferior existente; fecha completa y acciones táctiles aumentan altura. Se omiten filtros ilustrativos, agrupaciones relativas y contenido ficticio de producción.
- Pendientes: REST/JWT con dos cuentas reales, revisión humana responsive/safe areas y smoke R1 real. No declarar fixtures como E2E ni marcar Validado. Bloque 5 sin iniciar.
- Fuera de PR: cambio local previo en `vite.config.ts` (allowedHosts) preservado.
- Riesgos/decisiones: sin productores hasta R6, por lo que la bandeja vacía es legítima. No hay nuevos SECURITY DEFINER ni permisos amplios para el cliente.

### Bloque 5 — QA y aceptación R2

- Estado: Implementado; QA pendiente, 11/10/2026 Argentina. Ningún CA marcado Validado.
- Rama nueva: `codex/r2-block-5-qa`, desde `origin/main` `8d21ed4` (PR #15 integrada). Bloques 0–4 y ampliación Realtime integrados en esta base; las actas anteriores describen sus cortes históricos.
- PR: [#16 — QA integral, matriz de aceptación y corrección de detalle obsoleto](https://github.com/EnzoG14/PlanIt/pull/16), Draft hacia `main`, sin fusionar. Implementación y evidencia en `6ba166b`.
- Entregables: [matriz literal de los 28 CA](../qa/RELEASE_2_ACCEPTANCE.md), [informe integral](../qa/RELEASE_2_TEST_REPORT.md), [evidencias/capturas](../qa/evidence/release-2/README.md) y script optativo `npm run check:r2:live` para lectura real sin crear datos.
- PASS: npm ci (372 paquetes, 0 vulnerabilidades), build/lint; doce checks locales de foundation/Auth/eventos/discovery/Mapbox/reconciliación/Home/chat/perfil/avisos/participaciones/Mis eventos. Once escenarios/suites UI finales: diez scripts existentes más modo WebGL de discovery, con HTTP/WS fixture. PostgreSQL temporal real reproduce migraciones y carreras, Auth/Storage scaffold; no equivale a Supabase E2E.
- Prueba real: dos cuentas locales existentes, login y REST/RLS de perfiles/avisos A/B/anon; Home comparado con events persistidos, proyección social mínima y GET de fotos firmadas, chat autorizado y Mis eventos. Edge real en contextos separados 375×812/1280×900: perfil/reload, Inicio→detalle/foto/organizador, bandeja A vacía/B con aviso y chat autorizado. Canal Realtime conecta en ambas cuentas; **no se acredita entrega de mensajes**. Sin signup, escrituras de datos, SQL remoto ni cambios de configuración.
- Fallo reproducible corregido R2-QA-01: detalle conservaba ficha previa cuando perdía acceso y se recuperaba foco. Ahora revalida foco/visibilidad/online, limpia ficha/media/organizador, aísla identidad/token y descarta respuestas anteriores; regresiones de revocación, error/retry y respuesta tardía PASS. Sin cambios de CSS/mockup/branding.
- Seguridad: migraciones/políticas/grants/RPC inspeccionados y negativos SQL locales PASS (outsider/removed/anon, escrituras directas, identidad falsa, cierre y carreras). Advisors remotos: 7 WARN definer authenticated intencionales y 1 WARN leaked-password protection heredado; performance: 1 WARN múltiples SELECT en events y 8 INFO índices sin uso. No ERROR; aceptación de excepciones aún pendiente.
- Migraciones: 11 versiones locales/remotas coincidentes antes/después por MCP. Ninguna nueva o aplicada en este bloque; no se ejecutó SQL remoto ni db push/dry-run. Proyecto histórico no consultado ni modificado.
- Diseño: revisión visual de las cinco pantallas contra mockup R2 móvil/escritorio; mantienen marino/azul/violeta y omisiones de funciones futuras. Safe areas/teclado son CSS y simulación; PWA manifest/SW PASS, instalación física/hosting HTTPS pendiente.
- Decisión: **NO-GO para declarar R2 cerrada/validada**. 28 CA con cobertura local automatizada y límites explícitos; pendientes de envío/entrega/reconexión/JWT/cierre real, outsider/removido real (A/B comparten chat), marca de lectura real, escrituras R1 reales y revisión/aceptación humana. No se presume aceptación de pendientes ni se traslada la validación manual R1 a R2.
- Fuera de PR: cambio local previo `vite.config.ts` (allowedHosts) conservado. Artefactos históricos regenerados por los checks conservan copia recuperable en `.qa-artifacts-backup.local`; la evidencia de esta corrida se versiona bajo docs/qa/evidence/release-2.

## Checklist de cierre de cada bloque

- [ ] Contrastar código real y dependencias contra el plan.
- [ ] Ejecutar npm run build y npm run lint, más tests relevantes del bloque.
- [ ] Probar autorización y manejo de errores con casos positivos y negativos.
- [ ] Registrar migraciones sin modificar las ya aplicadas; remoto sólo con autorización.
- [ ] Comparar visualmente con mockup R2 en móvil y escritorio.
- [ ] Registrar CA cubiertos y límites de cada evidencia (fixture, PostgreSQL local, REST real).
- [ ] Actualizar este archivo; enviar PR; esperar revisión.

## Ampliación R2 — Realtime de chat y notificaciones (11/10/2026 Argentina)

- Estado: implementado; validación remota y aceptación humana pendientes. Esta ampliación reemplaza el transporte manual documentado históricamente en bloques 2/4.
- Rama: codex/r2-realtime-chat-notifications. Base origin/main, commit 5a3aed5, que integra PRs #10/#12. Worktree C:/Users/enzog/planit-worktrees/r2-realtime; el cambio previo de vite.config.ts en D:/planit permanece fuera de esta rama.
- Destino de PR: main; contiene ambas dependencias. [PR #14 — realtime chat, notifications and unread indicator](https://github.com/EnzoG14/PlanIt/pull/14), Draft, sin merge. Implementación efe80f0.
- RF: RF-R2-04, RF-R2-05 y RF-R2-07; requisitos oficiales conservados.
- Chat: INSERT filtrado por conversación autorizada, RPC de historial, recuperación multipágina, UUID/orden/microsegundos, cursor anterior preservado, scroll anclado y textarea intacto; envío y reglas de cierre existentes.
- Avisos: canal INSERT/UPDATE por recipient_id compartido por layout/bandeja; reconciliación de IDs en lotes y recuperación del rango cargado. COUNT exacto RLS e índice parcial para badge; sin productores R6, Push, DM o adjuntos.
- Conexión: SUBSCRIBED recupera; ERROR/TIMED_OUT rejoin del SDK, CLOSED canal nuevo/backoff; foco/visibilidad/online/TOKEN_REFRESHED revalidan. Colas retienen señales en vuelo; cleanup por identidad/evento; respuestas tardías descartadas.
- Migración 20261011193316_r2_realtime_chat_notifications.sql: sólo Git, sin aplicar. Probada en PostgreSQL temporal local, incluida segunda aplicación. No se ejecutó SQL remoto ni se alteró configuración Supabase. Estado actual de publicación remota no confirmado; se deberá consultar con autorización o desde el Dashboard antes de despliegue.
- PASS: npm ci (0 vulnerabilidades), build, lint, check:realtime (simulado), check:realtime:ui (React/SDK con HTTP/Phoenix WS interceptado); check-chat.mjs y check-notifications.mjs (PostgreSQL local), check-chat-ui.mjs y check-notifications-ui.mjs (fixtures); check:auth, check:events, check:foundation, check:participations, check:my-events, check:home-events y check:discovery. Diff check sin errores. Fallos iniciales de herramientas ausentes en el worktree se resolvieron copiando herramientas locales ignoradas; últimas ejecuciones PASS.
- Evidencia: [informe Realtime](../design/verification/realtime/README.md), ui-results.json y capturas móvil/escritorio revisadas contra mockup R2. Tests no equivalen a sesiones/JWT reales ni autorizan marcar el bloque Validado.
- Pendiente: autorización separada para desplegar SQL/configuración, dos sesiones reales + outsider/anon/removido, publicación activa y prueba real de reconexión/rotación JWT, aceptación responsive/teclado/safe areas y smoke remoto R1.
- Límite: una revocación sin señal se detecta en la próxima revalidación; SQL/RLS ya impide lecturas/envíos/entregas futuras. Recuperar un rango grande requiere varias páginas; no hay replay ni almacenamiento offline privado.

### Despliegue autorizado de Realtime — 11/10/2026

- El usuario autorizó aplicar la migración y configurar las variables de entorno del worktree. Se aplicó 20261011193316_r2_realtime_chat_notifications.sql por CLI con versión 20261011193316 y --skip-vault, exclusivamente en planit-v2 (iepeqmvzjguwlhnecsdq). Esta actualización reemplaza los pendientes remotos de publicación/migración señalados arriba.
- Historial: 11 migraciones sincronizadas; dry-run posterior sin pendientes. Publicación previamente vacía, ahora contiene messages/notifications y admite INSERT/UPDATE. Catálogo confirma RLS activa, RPC invoker/search_path vacío/EXECUTE authenticated y no anon, sin INSERT/DELETE de cliente ni SELECT anon, índice de no leídas presente.
- Verificación READ ONLY con dos identidades SQL existentes: lectura de bandeja y RPC de lotes, aislamiento de destinatario y chat; ROLLBACK sin fixtures/escrituras. No equivale a JWT/WS real. Asesores sin avisos nuevos frente al estado previo: siete SECURITY DEFINER autenticados intencionales y protección de contraseñas filtradas desactivada, heredados.
- .env.local creado en C:/Users/enzog/planit-worktrees/r2-realtime con únicamente VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY desde configuración existente validada. Archivo ignorado, valores no registrados en Git ni impresos. Build PASS con configuración real.
- Sin cambios de Auth/Storage/Vault ni merge. Permanecen pendientes las sesiones reales de Realtime y aceptación humana.
