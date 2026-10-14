# PlanIt — Plan técnico Release 5 · Comunidad y relaciones sociales

**Entrega B8 — 14/10/2026:** B0–B7 integrados (#50–#57); B8 **Implementado; QA pendiente**, base `0116fd30478dea8a6851b7a97cac518abded3925`, rama `codex/r5-block-8`. Bandeja y DM de texto con Realtime/RLS existentes, reconciliación por UUID e historial read-only bajo bloqueo. [Contrato, amenazas, pruebas y límites](../qa/r5-block-8/README.md). Sin nuevas migraciones/deploy/merge; HTTP JWT/Realtime reales y aceptación pendientes. B9 requiere instrucción independiente. Las referencias anteriores a PR #57 en borrador son cortes históricos: está integrada en esta base.

**Aplicación autorizada B7 — 14/10/2026:**20261014212935 aplicada/verificada en planit-v2 tras «sí» del responsable. [Acta](../qa/r5-block-7/follow-notifications/remote/README.md),29 migraciones y catálogo/ACL/RLS/publicación PASS. Sin deploy/merge; QA JWT/Realtime real pendiente. Supera el permiso pendiente del corte siguiente.

**Ampliación expresa B7 — 14/10/2026:** pedido posterior incorpora aviso Realtime genérico por nueva generación pending, transaccional/sin duplicar reintentos. Reutiliza notifications/RLS/canal existentes y abre solicitudes propias. [Contrato/migración/pruebas](../qa/r5-block-7/follow-notifications/README.md). Una migración nueva local; aplicación remota requiere permiso. Supera exclusión original de notificaciones B7 sin renumerar los33 CA.

**Entrega B7 — 14/10/2026:** B0–B6 integrados, incluido #56 (`cbb0547`). B7 autorizado e **Implementado; QA pendiente**, rama `codex/r5-block-7`. Bandeja `/me/follow-requests`, aceptación/rechazo versionados y conciliación por lectura ante resultado incierto, sobre RPC/RLS B1 existentes. [Contrato, pruebas y límites](../qa/r5-block-7/README.md). Sin migraciones nuevas, aplicación SQL remota, deploy ni merge. Los cortes siguientes son históricos; B8 requiere instrucción independiente.

**Entrega B6 — 14/10/2026:** B0–B5 integrados. B6 **Implementado; QA pendiente**, base `54b4749b1c12775e0d6c800b15d82aeb8ecdafbc`, rama `codex/r5-block-6`. Follow/unfollow y listas paginadas con contadores filtrados por servidor; estado público/privado y resultados inciertos reconsultados; APIs/SQL B1 intactos. [Contrato, matriz de amenazas, evidencias y límites](../qa/r5-block-6/README.md). Sin nueva migración/deploy/merge. Los cortes siguientes son históricos; **no continuar B7 sin aprobación**.

**Entrega B5 — 14/10/2026:** B0–B4 integrados (#50–#54). B5 **Validado por QA humana**, aprobación expresa del 14/10/2026 ([Acta de aceptación](../qa/r5-block-5/APPROVAL.md)), base `24c24cee44725cfa2fa4c2a3668474e891417ad3`, rama `codex/r5-block-5`. Matriz estricta privada y reconciliación entre perfil/eventos: revocación conserva sólo el mínimo vigente, bloqueo elimina toda la proyección. Sin migración nueva/deploy. [Pruebas y límites](../qa/r5-block-5/README.md), [PR #55 en borrador](https://github.com/EnzoG14/PlanIt/pull/55). Cortes anteriores históricos; B6 requiere instrucción independiente.

**Entrega B4 — 14/10/2026:** B0–B3 integrados (#50–#53). B4 autorizado e **Implementado; QA pendiente**, base `286d38ecf7e461ebd9218a6f71e8ff10a41e0bae`, rama `codex/r5-block-4`. `/me/edit`, datos/privacidad por RPC B1 y avatar independiente con reconciliación/limpieza; sin migración nueva ni deploy. [Entrega, pruebas y límites](../qa/r5-block-4/README.md). Las referencias siguientes a B4 no autorizado describen cortes históricos. Detenerse para revisión de PR; B5 no autorizado.

**Actualización B3 — 14/10/2026:** B0–B2 integrados (#50–#52). B3 autorizado e **Implementado; QA pendiente** desde base `4ef0b34a789082352f8b1ca831f75761fb6e6b17`: perfil social ampliado y eventos públicos vigentes por RPC B1, paginación/retorno seguro, sin migración nueva ni deploy. [Entrega, pruebas y límites](../qa/r5-block-3/README.md). JWT autenticado/avatar real/aceptación pendientes. B4 requiere autorización; la fotografía B2 siguiente es histórica.

**Versión:** 1.1 · decisiones D01–D05 aprobadas · 14/10/2026 · **Estado actual:** B0/B1 integrados por PR #50/#51; B2 autorizado e implementado con QA pendiente. [Entrega B2](../qa/r5-block-2/README.md): participantes seguros y navegación a identidad mínima; perfil completo B3/B5 pendiente. [Contrato B1](RELEASE_5_BLOCK_1_CONTRACT.md) materializa D06–D08 y C01; C02 conserva autorización independiente R4 y C03 firmas sociales60s. Ningún CA integral validado; SQL B1 aplicado/verificado por autorización previa, [acta](../qa/r5-block-1/REMOTE_MIGRATION.md). B2 sin migraciones nuevas/deploy/merge; gateway avatar todavía no desplegado. **B3 requiere aprobación expresa.** Auditoría B0 conservada como antecedente en [RELEASE_5_BLOCK_0_DECISIONS.md](RELEASE_5_BLOCK_0_DECISIONS.md).
**Fuente funcional prevalente:** Google Doc «Nueva planificación — RF R1 a R7», «Criterios de aceptación — R1 a R7» y «Especificación técnica — R1 a R7» (09/10/2026). **No usar** la antigua «Pestaña 3» que llamaba R5 a descubrimiento; ahora eso es R4.  
**Referencias de repositorio:** `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/architecture.md`, `docs/database.md`, `docs/implementation/RELEASE_4_PLAN.md`, `RELEASE_4_STATUS.md`, `docs/requirements/RELEASE_4_REQUIREMENTS.md`, `docs/qa/RELEASE_4_ACCEPTANCE.md`, `supabase/migrations`, `src/pages/ProfilePage.tsx`, `src/pages/EventAttendeesPage.tsx`. La fotografía leída de `main` es orientativa: **cada bloque debe verificar SHA, migraciones y entorno nuevamente**.

## 1. Alcance y prioridades

**Objetivo:** habilitar navegación desde asistentes autorizados a perfiles sociales, lectura privada por niveles, edición del perfil, relaciones de seguimiento y solicitudes, mensajes directos de texto y bloqueos. **Sprint 1**: R5-01 a 04. **Sprint 2**: R5-05 a 08. 8 RF y **33 CA oficiales**. No confundir el chat de evento con DM ni los enlaces `unlisted` de R4 con permisos de perfiles.

| RF | Historia | CA | Bloques |
| --- | --- | ---: | --- |
| RF-R5-01 | Explorar usuarios de un evento | 4 | 2 |
| RF-R5-02 | Visualizar perfiles públicos | 4 | 3 |
| RF-R5-03 | Editar perfil propio y privacidad | 4 | 4 |
| RF-R5-04 | Visualizar perfiles privados | 4 | 5 |
| RF-R5-05 | Seguir y dejar de seguir | 4 | 6 |
| RF-R5-06 | Gestionar solicitudes de seguimiento | 4 | 7 |
| RF-R5-07 | Mensajería privada | 4 | 8 |
| RF-R5-08 | Bloquear/desbloquear | 5 | 9 |

**Fuera de alcance:** recomendación de eventos y buscador (R4), gestión/remoción de asistentes (R3), métricas (R6), imágenes en DM, historias, Web Push (R7), búsqueda global de personas sin vínculo con eventos, moderación de chat grupal y ML.

## 2. Estado real y riesgo de integración

**Actualización B0 (14/10/2026):** la fotografía inicial del párrafo siguiente queda como antecedente. R4/B9 está integrado y aceptado por el responsable; catálogo read-only actual confirma 25 migraciones, 14 tablas con RLS y 55 funciones coincidentes con replay local. `conversations/messages` existen sólo para eventos; follows/blocks/DM R5 no existen. D06 elige extensión de las tablas existentes y D07 RPC social separada. [Contratos y conflictos C01–C03](RELEASE_5_BLOCK_0_DECISIONS.md). No se verificaron aquí operaciones funcionales con JWT A/B/C/D.

La rama `main` contiene `src/pages/ProfilePage.tsx`, `EventAttendeesPage.tsx`, migraciones de perfiles y participaciones, bandeja interna y chat de eventos. **No se observaron en el árbol inspeccionado módulos de frontend dedicados a follows, blocks, direct conversations o DM**, ni migraciones con esos nombres. Esto NO demuestra ausencia de tablas remotas: validar catálogo real mediante bloque 0 antes de definir DDL. R4 `RELEASE_4_STATUS.md` documenta 0–8 implementados, pero la QA real/JWT y aceptación humana estaban pendientes y el bloque 9 también: verificar PR integradas, no tomar 'implementado local' como API estable en main.

## 3. Contrato obligatorio para Codex

1. Leer AGENTS raíz y cercanos, PRODUCT, DESIGN (Amanecer B v3), UI_WORKFLOW, arquitectura/modelo, R3/R4 plans/status/QA y todos los RF/CA originales de R5. Prevalencia: RF/CA aprobados > especificación y decisiones aprobadas > SQL/migraciones reales > diseño > bocetos.
2. React 19 + TS + Vite 8 + React Router + PWA; Supabase Auth/Postgres RLS/Storage/Realtime. No backend nuevo, ORM, Expo, Next ni dependencia gratuita sin justificación. Reusar componentes, tokens `--pi-*`, `.amanecer-shell`, navegación y estado de sesión existentes.
3. Trabajo por rama `codex/r5-block-N`, desde `main` actualizado e integrado. Un PR revisable por bloque. Jamás fusionar, desplegar ni hacer `supabase db push` o migración remota sin aprobación explícita.
4. Único proyecto modificable, previa aprobación: `planit-v2` (`iepeqmvzjguwlhnecsdq`); legado `fmqzokxvpqxfzvcnzvjm` únicamente lectura.
5. Para cada operación sensible: `auth.uid()` autoritativo, RLS/ACL mínimos, nunca exponer `profiles` íntegro a terceros; proyectar campos permitidos por nivel mediante RPC controlada o vista segura. Auditar REST directo, RPC, Storage, Realtime y rutas. DEFINER sólo justificado, `search_path=''`, calificación explícita, grants sólo `authenticated`, sin SQL dinámico.
6. Fechas y horas de tablas propias conforme al contrato existente de Argentina; no cambiar semantics de eventos. Para mensajería ordenar por instante del servidor + id estable (no por reloj del cliente).
7. Respetar la noción de `confirmed` y las revocaciones R4; `unlisted` y conocer el detalle no confieren lista de participantes. No mostrar `birth_date`, `sex`, email ni perfiles internos completos a terceros, incluso aprobados.
8. Documentar al final de cada bloque: SHA base, rama/PR, archivos, migraciones nuevas, firmas/ACL, pruebas y tipo de prueba, CA PASS/FAIL/BLOCKED/NOT RUN, seguridad/privacidad, accesibilidad/UI y pendientes; nunca declarar E2E JWT si sólo hubo mock.

## 4. Arquitectura objetivo (propuesta, sujeta a auditoría bloque 0)

**Datos:** reutilizar `profiles` existente para `username`, nombre visible, bio pública/para seguidores, `visibility`, avatar; revisar tipos exactos antes de ALTER. Nuevas tablas sólo si faltan: `user_follows(follower_id,followed_id,status,requested_at,responded_at)` con PK pareja y CHECK no-self; `user_blocks(blocker_id,blocked_id,created_at)` con PK pareja y CHECK no-self; `direct_conversations(id,user_low_id,user_high_id,created_at,unique(user_low_id,user_high_id))` con pareja ordenada; `direct_messages(id,conversation_id,sender_id,body,created_at)` con índice `(conversation_id,created_at,id)`. Estas denominaciones son **diseño propuesto**, no esquema confirmado; la especificación menciona `conversations(kind=direct)`/`messages`: si ya existen y hay uso real, preferir extender sin crear duplicados.

**Operaciones sugeridas (NO firmas definitivas):** `get_event_social_participants(event_id,cursor,limit)`, `get_social_profile(user_id)`, `update_my_social_profile(...)`, `follow_user(target_id)`, `unfollow_user(target_id)`, `list_follow_requests(...)`, `resolve_follow_request(follower_id,decision)`, `get_or_create_direct_conversation(target_id)`, `send_direct_message(conversation_id,body)`, `block_user(target_id)`, `unblock_user(target_id)`. Auditar coincidencia con funciones existentes y evitar CREATE OR REPLACE invasivo.

**Autorizaciones:**

| Recurso/operación | Dueño | Confirmado evento | Seguidor accepted | Usuario ajeno | Bloqueado |
| --- | --- | --- | --- | --- | --- |
| Lista asistentes del evento | organizador sí | sí | no por seguir | no | sólo según permisos del evento, sin privilegio social extra |
| Perfil público | sí | sí | sí | sí autenticado | **Perfil no disponible** para la contraparte del bloqueo |
| Perfil privado | completo propio | mínimo salvo accepted | tres mínimos + bio + eventos públicos | tres mínimos | **Perfil no disponible**, sin proyección (D01 aprobada) |
| Datos demográficos/email | propio | NO | NO | NO | NO |
| DM historial | participante | no por evento | no por seguir | NO | participantes leen historial |
| DM enviar | participante sin bloqueo | — | — | NO | NO |
| Chat del evento | reglas R2/R3 | reglas R2/R3 | no por seguir | NO | **sin cambios por bloqueo social** |

**Concurrencia e invariantes:** canonicalizar pares, UNIQUE para impedir chats y follows duplicados, transacciones para bloquear + limpiar relaciones, controlar race `block` vs `follow` y `block` vs `send`, idempotencia y reintentos ambiguos. Nunca eliminar historial de DM ni restaurar seguimientos al desbloquear.

**Frontend:** rutas tentativas `/users/:username` o `/users/:id`, `/me/edit`, `/me/follow-requests`, `/messages`, `/messages/:conversationId`; enlaces desde `/events/:id/attendees`. Resolver naming en bloque 0 cotejando router actual. Componentes reutilizables `SocialProfileCard`, `FollowButton`, `PrivacyBadge`, `BlockActionDialog`, `DirectMessageComposer`; edición de perfil integrada en `/me` sin recrear pantalla R2.

**Reactividad:** usar carga paginada + refresco por mutación como base; Realtime sólo con políticas de lectura equivalentes para mensajes. Evitar leakage de payload en eventos de publicación. Avatar por Storage con policies, tipos y tamaños limitados, path propiedad del usuario, URLs cortas si corresponde. Imagen fallida no debe revertir datos válidos de perfil sin reconciliación explícita.

## 5. Secuencia de ejecución y dependencias

| Bloque | Sprint | Entrega | Gate obligatorio |
| --- | --- | --- | --- |
| 0 | Preparación | Auditoría real, contratos y decisiones | Aprobación de discrepancias importantes |
| 1 | Preparación | Esquema social, RLS, RPC y pruebas de autorización | Auditoría + DDL local probada |
| 2 | 1 | Participantes con perfiles seguros | 1, permisos `confirmed` R3/R4 |
| 3 | 1 | Perfil público + eventos public | 1–2 |
| 4 | 1 | Editar perfil + avatar + privacy | 1 |
| 5 | 1 | Perfil privado por relación | 1,4, contrato follows |
| 6 | 2 | Follow/unfollow + listas | 1,3–5 |
| 7 | 2 | Solicitudes privadas | 6 |
| 8 | 2 | DM canónico y bandeja | 1,3,9 seguridad de bloqueo; integrar SQL en orden |
| 9 | 2 | Bloqueo y contrato transversal | 1,6–8; **infra bloqueos antes de habilitar envío DM** |
| 10 | Cierre | QA integrada, E2E, informe GO/NO-GO | 0–9 y aprobación humana |

**Nota:** ordenar implementación de la política `user_blocks` y funciones de autorización antes de activar DM público. Aunque la UI de bloqueo se entregue al final, la seguridad de envío se implementa desde bloque 1 y se verifica en bloque 8.

## 6. Decisiones de producto aprobadas (14/10/2026)

**D01 — Bloqueo:** en perfiles y descubrimiento social, si existe bloqueo `A→B` o `B→A`, la contraparte ve **«Perfil no disponible»** y el backend no entrega metadatos sociales. Esto vale para ambos sentidos y para enlaces directos y listados, con proyección neutra y sin filtración de identidad. **Excepción intencional y obligatoria:** los participantes de un DM preexistente conservan su historial de conversación; el bloqueo sólo impide nuevos envíos. Tampoco se modifican reglas del chat grupal de eventos autorizados.

**D02 — Privacidad:** un perfil `private` sin relación `accepted` revela exclusivamente nombre visible, username y avatar. Un seguidor `accepted` recibe además **biografía y eventos públicos**, nunca eventos `unlisted`, datos demográficos, correo, detalles de grants ni perfil completo. Un perfil `public` sólo muestra información social declarada pública y eventos públicos. Aplicar en PostgreSQL/RPC, Storage y frontend.

**D03 — DM:** cualquier cuenta autenticada puede abrir conversación directa con otra cuenta distinta de sí misma sin tener que seguirla; un bloqueo en cualquiera de los sentidos impide **iniciar nueva conversación o enviar mensajes nuevos**, no leer el historial previamente permitido. Una pareja tiene una conversación canónica e índice UNIQUE; prevenir carreras A→B/B→A.

**D04 — Cambio `private → public`:** aprobar automáticamente **todas las solicitudes `pending` dirigidas al perfil** convirtiéndolas a `accepted` como parte de la misma transacción que actualiza `profiles.visibility`. La interfaz debe avisar claramente la consecuencia antes de guardar. `rejected` no se acepta, las relaciones borradas por bloqueo no reaparecen, y los `accepted` permanecen. Serializar `follow_user`, `block_user` y el cambio de privacidad con una estrategia consistente de locks para no dejar `pending` residuales ni aceptar relaciones bloqueadas. **Esta decisión posterior agrega comportamiento a la especificación del Google Doc: requiere actualización documental explícita, sin alterar los 33 CA oficiales.**

**D05 — Navegación DM:** bandeja `/messages` o ruta equivalente según auditoría, accesible desde `/me` y accesos contextuales; acción desde perfil ajeno para iniciar conversación. **No agregar una pestaña nueva al dock primario.**

**D06–D08 auditadas técnicamente:** reusar conversations/messages con separación por kind; ruta asistentes con RPC social independiente; dependencias R4 confirmadas por Git/catálogo. Justificación, locks y conflictos de integración en [bloque 0](RELEASE_5_BLOCK_0_DECISIONS.md). Revisión humana pendiente, sin permiso para avanzar B1; no son decisiones de producto pendientes de votación.

### 6.1 Contrato de transición de privacidad y concurrencia

- Operación propuesta `update_my_social_profile` (firma a determinar en bloque 0) verifica `auth.uid()` y rol de actor dentro de la base.
- Iniciar transacción; bloquear perfil objetivo y serializar todas las escrituras de `user_follows`/`user_blocks` que involucren esa cuenta en orden único. Guardar perfil y convertir pendientes válidas a `accepted` **sin ventana intermedia**; fallo de cualquier paso revierte todo.
- Convertir sólo `pending` actuales, no `rejected`, `removed`, relaciones inexistentes o eliminadas por bloqueo. Repetir la llamada no aumenta contadores ni crea duplicados. Revalidar bloqueos antes de conversión.
- Retornar datos para refresco de perfil, solicitud, seguidores/seguidos y avisos visuales. Nunca asumir éxito ante timeout hasta reconsultar estado.
- Pruebas: 0, 1, N pendientes; rechazadas; blocked; dos cambios simultáneos; `follow` mientras pasa a público; `block` concurrente; error inyectado/rollback; volver a privado conserva accepted; consultas A/B/JWT directas.

### 6.2 Contrato UI y permisos por bloqueo

- En perfil bloqueado: estado «Perfil no disponible», sin avatar, username, bio, eventos, contadores, botones de follow o mensaje; únicamente permitir una acción de **desbloquear** al actor que creó el bloqueo, en un control propio protegido que no requiera devolver datos del otro perfil.
- El destinatario bloqueado tampoco obtiene proyección de quien lo bloqueó ni puede iniciar interacción. Las listas sociales no deben permitir inferir nombres/datos bloqueados; analizar conteos y resultados paginados.
- Un DM previo puede seguir apareciendo con historial y estado de escritura deshabilitada; no ocultar mensajes antiguos ni conceder permisos extra a la capa de perfil. El chat grupal permanece regido por asistencia.

## 7. Criterios técnicos transversales (DoD)

- Cada CA oficial tiene test reproducible con usuario A/B/C y permisos; tests unitarios, SQL local, HTTP JWT real (cuando autorizado), UI navegador mobile/desktop, flujo PWA, Storage/Realtime según alcance.
- Casos críticos: ajeno intenta SELECT profiles completo; invitado con sólo link oculto intenta listar asistentes; seguidor rechazado consulta bio; race follow/bloqueo; cambio private→public frente a follow/block concurrentes; rollback de autoaceptación; send/bloqueo simultáneos; A→B y B→A crean mismo DM; reintentos de mensajes; unlock reutiliza conversación; chat grupal intacto; avatar path ajeno; perfil pasa public→private sin perder accepted.
- Validar `npm ci`, `npm run build`, `npm run lint`, suites existentes R1–R4 afectadas; checks concretos a confirmar por `package.json`; migrations reset local, índices EXPLAIN básicos, RLS/ACL anónimo y usuarios A/B/C, políticas Storage y canales Realtime.
- UI Amanecer responsive 320/360/375/390/768/1280, altura baja, teclado abierto, foco/diálogos, 200% texto, estados loading/empty/error/retry, accesibilidad de controles; capturas reales en ubicación versionada nueva.
- Registrar resultados y límites con estado Implementado; QA pendiente hasta aceptación humana. Ningún bloque se auto-valida ni se auto-mergea.

## 8. Documentación de entrega

Archivos adjuntos: `RELEASE_5_DECISIONS_PROPOSED.md`, `RELEASE_5_ACCEPTANCE.md`, `RELEASE_5_STATUS.md`, prompts `RELEASE_5_BLOCK_0` a `..._10`. Al integrar, copiar a `docs/implementation`, `docs/requirements`/`docs/qa` y `docs/implementation/prompts` respetando convenciones; no modificar documentos históricos R4.
