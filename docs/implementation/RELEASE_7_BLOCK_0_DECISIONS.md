# R7 — Bloque 0 · Acta de auditoría y decisiones

**Corte:** 16/10/2026, Argentina. **Base verificada tras fetch:** `f8dd53c136fb30fbef5f3b2d9fa7cf0359923974` (`origin/main`, PR #73 integrada). **Rama:** `codex/r7-block-0`. **Autor técnico:** Codex; auditor paralelo de contratos: `audit_contracts`. **Revisor/firma humana:** PENDIENTE. **Estado:** auditoría documental entregada para revisión; **NO-GO para iniciar otro bloque**. No se atribuye aprobación al responsable por emitir esta acta.

## A. Fuentes y baseline

- [x] 7 descripciones RF y 29 CA comparados literalmente con las pestañas vigentes del [Google Doc oficial](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit). [Extracción con revisión/índices](../qa/r7-block-0/source.json), [hash UTF-8 de cada CA y trazabilidad](../qa/r7-block-0/traceability.json). Coinciden los 29 textos en requisitos y aceptación; no se editó el Doc.
- [x] Rama/base/remoto y merges verificados: #73 planificación R7, #72 cierre R6. R6 tiene GO humano registrado en `docs/qa/RELEASE_6_HUMAN_APPROVAL.json`; sus límites de pruebas conservan su significado. No se abren correcciones R6 ni se declara `main` funcionalmente validada por inspeccionar Git.
- [x] Historial remoto **37/37** coincide con los archivos locales, incluida migración vacía histórica. PostgreSQL **17.11**, CLI **2.120.0**. [Catálogo recién consultado](../qa/r7-block-0/catalog.json): **16 tablas públicas con RLS, 88 funciones públicas/privadas**, constraints, índices, triggers, grants de tabla/columna, overloads, Storage y publicación. Sin tablas R7.
- [x] Todas las secciones del catálogo coinciden con el snapshot B9 R6 ya versionado en main, ordenando claves JSON y excluyendo sólo audited_at. [Comprobación de destino y paridad](../qa/r7-block-0/publication-review.json): origin es el mismo repositorio privado del proyecto; sin nueva exposición de contenido de BD ni credenciales.
- [x] [Edge remoto](../qa/r7-block-0/edge-functions.json): sólo `social-avatar`, activa versión 1; no hay cleanup/Push R7 desplegado. [Infraestructura](../qa/r7-block-0/infrastructure.json): `pgcrypto` 1.3; **pg_cron y pg_net no instalados**, `cron.job` inexistente. D09 sigue aprobada como dirección, pero cron/worker no están operativos. No se inspeccionaron secretos ni comandos de jobs.
- [x] Leídos AGENTS raíz/src/Supabase/diseño, PRODUCT, DESIGN, arquitectura, modelo, DESIGN_SYSTEM y `docs/design/UI_WORKFLOW.md` (la referencia `UI_WORKFLOW.md` raíz no existe); prompt/plan/estado/decisiones/plan paralelo/aceptación/pruebas R7 y baseline B0/cierre R6. No existía acta B0 R7 previa que se pudiera asumir aprobada.

El checkout inicial tenía cambios ajenos en package/lockfile y `.env.example`; permanecen intactos. Se creó un worktree limpio desde `origin/main`; `.env.local` se copió byte a byte desde `mapbox-worktree` (main), está ignorado y no se versiona ni imprime. Dos árboles disponibles: main sólo para lectura y `r7-block-0-worktree` para esta entrega. Auditoría de código delegada en paralelo **sólo lectura**; no se crean ramas B1/B9 ni se ejecutan features para aparentar paralelización. La exigencia de dos worktrees de features se aplica al autorizar los frentes posteriores; hoy sólo B0 está autorizado.

## B. Inventario y compatibilidad real

| Área | Código/SQL actual confirmado en catálogo | Cambio mínimo candidato R7 | Gate/prueba posterior |
|---|---|---|---|
| Chat y DM | `messages.body NOT NULL`, CHECK texto 1..2000 no blanco; `conversations` event/direct excluyentes; SELECT miembro; sin DML genérico de mensajes | Nueva lectura/envío v2; body nullable con integridad diferida; DM sigue texto-only | B1/B2: rollback, direct SQL, DM, UUID/retry, carrera cierre/remoción |
| Archivos/Storage | `files` permite `event_media,avatars`; UNIQUE(bucket,path), uploader con lectura; `event_images` permite archivo compartido; galería retiene files al quitar asociación | Namespace `r7/chat` y `r7/stories` dentro de `event_media`, exclusividad **sólo** archivos nuevos R7; reescritura de policies y guardas de registro | B1: OR completo, namespace impostado, uploader expirado, galería/avatar intactos |
| Historias/TTL | No tabla, RPC ni Edge R7 | Historia de una imagen; servidor genera publicación/vencimiento; JWT GET sin firma; GC diferido | B4/B6: GET uploader a T+24h, sin dependencia de cron |
| Notifications/Realtime | SELECT destinatario, UPDATE(read_at); productores DM y `event_full`; publication sólo messages/notifications | Outbox desde INSERT notifications sin segundo aviso; claims/leases y preview efímera | B9/B10: reintento/concurrencia/fallo proveedor sin pérdida del inbox |
| SW/PWA | `vite.config.ts`: generateSW implícito, autoUpdate, precache local, runtimeCaching=[]; no `src/sw.ts` | injectManifest, worker propio con precache, push y click; mismo scope `/` | B9: offline/update/install y exclusión de datos privados |

### Firmas existentes que se preservan

El catálogo adjunto contiene todos los cuerpos y overloads. No inferir firma desde los paths sugeridos del prompt:

- `get_event_chat(uuid) → TABLE(conversation_id uuid,title text,event_state text)`.
- `get_event_chat_messages(p_event_id uuid,p_before_at timestamp DEFAULT NULL,p_before_id uuid DEFAULT NULL) → TABLE(id uuid,sender_id uuid,body text,created_at timestamp,display_name text,username text)`: 51 filas, cursor `(created_at,id)` descendente.
- `send_event_chat_message(p_event_id uuid,p_message_id uuid,p_body text) → uuid`. Adaptador TS actual retorna `Promise<void>`; no cambiarlo como efecto lateral. Reintento idéntico ya registrado se comprueba antes de negar un nuevo envío por cierre; conservar autorización de lectura y no generar otra fila.
- `send_direct_message(uuid,uuid,text) → uuid`; `get_direct_messages(uuid,timestamp,uuid,integer DEFAULT 30) → jsonb`; `list_direct_conversations(timestamp,uuid,integer) → jsonb`. Lectura histórica del miembro continúa aun bloqueado; bloqueo impide nuevos DM.
- `get_notifications(timestamp,uuid)` (31 filas), `get_notification_changes(uuid[])` (máximo100), `get_notification_target(uuid) → text`, `mark_notification_read(uuid) → timestamp without time zone`. Lecturas finales de B7 R6 incluyen `event_full` y nombre seguro actual.
- `create_or_rotate_event_link(uuid) → text` y `get_event_link_status(uuid) → boolean`: **no existe recuperación del token**. Sólo se persiste hash; el enlace real vive en memoria del diálogo.

### Discrepancias resueltas por diseño, todavía no implementadas

1. **CHECK text-only:** no alcanza quitar NOT NULL. B1/B2 deben comprobar al commit texto válido **o exactamente un adjunto**, prohibir adjunto en direct y cubrir INSERT/UPDATE/DELETE de ambos lados. Nueva RPC v2 evita alterar el retorno histórico y los cursores de consumidores R2/R5. Ver contrato.
2. **Storage OR/uploader:** `event_media_select_visible` permite prefijo uploader OR files visible. Agregar otra policy permisiva no restringe nada. Se propone reemplazar **esa policy** con ramas legacy/R7 disjuntas, endurecer `files_select_visible` y todas las entradas de registro (create/galería/avatar) para rechazar namespace R7 como galería. No basta RLS en stories. Rechazo de MIME/peso/cache y borrado también deben discriminar namespaces. Se conserva bucket existente según plan; buckets dedicados serían alternativa que requeriría nueva revisión de contrato, no decisión aplicada.
3. **generateSW:** no existe listener Push propio. La elección técnica propuesta es injectManifest en B9, no parchear `dist/sw.js`. Preservar autoUpdate/precache/manifest/scope, jamás cachear medios ni API privada. El artefacto ignorado `mapbox-worktree/dist/sw.js` fue inspeccionado y contiene Workbox/precache; no está ligado por build a esta entrega y **no acredita prueba PWA nueva**.
4. **Modelo objetivo ≠ catálogo:** las 19 tablas enumeradas en database.md incluyen tres futuras (`message_attachments,stories,push_subscriptions`). Catálogo tiene16; no se declara que existan por el diagrama.
5. **R4 compartir:** compartir nunca rota automáticamente ni recupera un hash como si fuera URL. Organizador con token en memoria puede compartirlo; sin token, acción separada «Generar nuevo enlace» explica invalidación y requiere gesto de confirmación del usuario final. Terceros no obtienen token aunque estén confirmed. No guardar token en localStorage/analytics.
6. **Plan de pruebas Push:** UI-06 decía «genérica» y PUSH-05 prohibía todo texto DM en lock-screen; contradicen D08 ya confirmada. Se corrigen expectativas técnicas a preview real con consentimiento y opción de ocultarla; ningún CA oficial cambia.
7. **Fuentes históricas:** el Doc tiene pestañas antiguas que enumeran6 RF R7. Se usa la pestaña vigente `t.6cfgj0znk3o` (7 RF), no se sustituye por la histórica; 29 CA de `t.89mq08i5ups2` coinciden literalmente. No contradicción en esos textos vigentes.

## C. Registro de decisiones

Las confirmaciones de producto del 15/10 se conservan como evidencia documental de #73, sin inventar firma nueva. Las propuestas técnicas se presentan **para ratificación**; no están aprobadas por el usuario ni habilitan trabajo siguiente.

| ID | Estado | Resolución precisa / default propuesto | Persona/fecha y gate |
|---|---|---|---|
| D01 | CONFIRMADA | JPEG/PNG/WebP, ≤5MiB, 1 imagen, no video/GIF | Responsable,15/10; B1–B6 |
| D02 | CONFIRMADA | Imagen sola válida en evento; DM siempre texto sin adjuntos | Responsable,15/10; B1/B2 |
| D03 | CONFIRMADA | 24h exactas desde publicación aunque fin normal; acceso vigente requerido | Responsable,15/10; B4/B6 |
| D04 | PROPUESTA PARA FIRMA | Sin archivo visible vencido; tombstone técnico privado y GC reintentable, conservar chat/galería | Codex,16/10; B4/B6 |
| D05 | CONFIRMADA | Visor secuencial tipo Instagram, progreso/autoplay/pausa/accesibilidad | Responsable,15/10; B5 |
| D06 | CONFIRMADA | Dos acciones .ics + Google Calendar template, sin OAuth/sync | Responsable,15/10; B7 |
| D07 | CONFIRMADA + precisión técnica propuesta | Oculto sólo owner, token en memoria; regenerar explícitamente si falta, nunca como side effect de share | Responsable15/10; precisión Codex16/10, B8 |
| D08 | CONFIRMADA + límites propuestos | Preview real con opt-out; título≤80 y fragmento≤120 caracteres Unicode, texto plano sin HTML/control/URLs arbitrarias; fallback genérico revalida permiso | Responsable15/10; límites Codex16/10, B9/B10 |
| D09 | CONFIRMADA | Edge+cron+cola privada; infraestructura hoy ausente; instalar/desplegar con permiso separado | Responsable,15/10; B6/B10 |
| D10 | OBLIGATORIA; diseño PARA FIRMA, validación NOT RUN | GET autenticado evalúa hora servidor en cada solicitud; sin signed URLs para R7; excluir namespace de owner/galería, no-store y Blob efímero | Codex,16/10; bloquea B1/B4 |
| D11 | PROPUESTA PARA FIRMA | Gesto para permiso; múltiples dispositivos; baja individual; preview activada sólo tras explicar consentimiento; logout desvincula endpoint antes de nueva cuenta, jamás reasignación ciega | Codex,16/10; B9 |
| D12 | PROPUESTA PARA FIRMA/MEDIR | GC15min; Push cron1min; lease60s; máximo5 intentos, backoff30/60/120/240s con jitter; TTL entrega15min; lotes≤100; tombstones/jobs finales7d | Codex,16/10; B6/B10; no SLA ni cron creado |
| D13 | OBLIGATORIA; diseño PARA FIRMA | UUID/path inmutable por intento, reserva privada de objeto; publicar en TX, retry mismo payload o conflicto, GC huérfanos≥24h con lease y revalidación de referencias | Codex,16/10; bloquea B1/B2/B4 |
| D14 | PLAN DE VALIDACIÓN; NOT RUN | Desktop Chrome/Edge, Android, iOS instalado vs Safari tab; hardware/HTTPS reales, aceptar explícitamente limitaciones | Codex,16/10; B9/B11 |
| D15 | CONFIRMADA | Sin máximo de historias por usuario/evento; controles técnicos no se convierten en cuota de producto | Responsable,15/10; B4/B5 |
| D16 | PROPUESTA PARA FIRMA | Autoplay5s; pausa en carga, interacción, pestaña oculta y reduced-motion; controles manuales | Codex,16/10; B5 |
| D17 | CONTRATO v1 PARA FIRMA | DTO/RPC/Storage/ownership en contrato adjunto; B11 único integrador de detalle/router | Codex,16/10; todo frente posterior |
| P01 | CONFIRMADA | ≥2 implementadores y ramas aisladas cuando se autoricen frentes; auditores B0 trabajaron en paralelo sin features | Responsable,15/10; DAG conservado |

**Precisión que requiere responsable antes B4:** fin normal está resuelto por D03; cancelación/archivo no tiene decisión literal equivalente. Default propuesto: lectura hasta24h también al cancelar/archivar **si** `can_read_event_chat` sigue autorizando (owner/confirmed y detalle permitido). El helper actual no niega todo archivo: owner, grant activo o participación histórica pública pueden conservar detalle; no inventar una prohibición global. Publicar siempre se impide al cerrar. Ratificar lectura de canceladas/archivadas explícitamente con D04/D10; no se congela como decisión humana. Ninguna prueba futura debe ocultar ese pendiente.

## D. Contratos antes de programar

- [x] [Contrato v1 para revisión](RELEASE_7_BLOCK_0_CONTRACTS.md): propuesta SQL por cada migración, FKs/índices, algoritmos RPC/GC y compensación, DTO, errores y versionado. Es diseño; no migración ejecutable ni SQL ensayado.
- [x] [Modelo de amenazas y matriz de roles/estados/acciones](RELEASE_7_BLOCK_0_THREAT_MODEL.md): uploader, archivo compartido, revocación, link-only, pending, DM, TTL, endpoint Push, ventanas residuales.
- [x] [29 CA → bloques/tests/capas/hashes](../qa/r7-block-0/traceability.json) y casos de frontera reproducibles. Los 29 siguen NOT RUN; no hay aceptación funcional por estos checks documentales.
- [x] Ownership y DAG de `RELEASE_7_PARALLEL_WORK.md` conservados. Slots lógicos B1 media→B2 chat/B4 stories→B6 GC y B9 subscriptions→B10 jobs; version SQL definitiva sólo al implementar/integrar, sin timestamps ficticios.
- [ ] Firma del responsable de contratos técnicos, estados de historias cerradas y parámetros operativos.
- [ ] Autorización expresa para B1 u otro bloque; no inferirla del pedido B0 ni de P01.

## E. Gate humano y reporte de cierre

**Dictamen B1: NO-GO hasta revisión y autorización humana de esta acta**, D10/D13/D17 y contrato media (body/DM, namespaces/RLS y reserva). **B4:** además B1 integrado, D04/estado cancelado y TTL exacto probados desde la primera migración de historias. **B9:** D11/preview/identidad/SW v1 aprobados y autorización propia; secretos/deploy/cron son gates posteriores independientes. B7/B8 también requieren autorización: estar sin dependencia de B1 no significa estar autorizados.

**Verificación realizada:** `node docs/qa/r7-block-0/verify.mjs` **37/37 PASS documentales**, incluidas7 descripciones y29 CA literales, historial37, RLS, CHECK, Storage OR, publicación y estrategia PWA. Catálogo remoto READ ONLY/ROLLBACK, migration list y functions list sin DDL ni fixtures. Ver [reproducción y resultados](../qa/r7-block-0/README.md). Build/lint **NOT RUN** (entrega sólo documental, sin frontend); SQL de propuesta **NOT RUN**, HTTP/JWT/Storage GET/UI/SW/Push/dispositivos/concurrencia/errores/regresiones R1–R6 **NOT RUN en B0**. No se heredan PASS de R6 como ejecución nueva.

**Migraciones R7:** 0 creadas / SQL local NOT RUN / 0 aplicadas remotamente / 0 verificadas como aplicación R7. La lectura del catálogo no es aplicación/verificación de migración nueva. Sin deploy, cron, secretos, merge, cambios visuales ni bloque siguiente. Mockup original inspeccionado: se preserva como referencia funcional de chat/alta/lista/visor/calendario/share; sin agregar editor de texto, música, stickers, reacciones o favoritos sólo porque aparecen dibujados. Amanecer permanece identidad vigente; B0 no toca apariencia ni altera el mockup.

Revisión cruzada B0: el auditor detectó incompatibilidad del namespace nuevo con `files_path_valid` (primer segmento legacy=UID) y precisó retorno timestamp de `mark_notification_read`; ambos corregidos documentalmente antes de entregar. Firma técnica: **Codex,16/10/2026**. Firma humana/aprobación de contrato/permiso de siguiente bloque: **PENDIENTES**. PR draft documental: se registra en seguimiento al crearla; no supone GO.
