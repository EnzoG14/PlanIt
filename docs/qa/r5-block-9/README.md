# R5 · Bloque 9 — Bloqueo y desbloqueo

14/10/2026 · Base `65b46ab69d6f7b75a0f9996b0d091395c0bffab6` · Rama `codex/r5-block-9` · **Implementado; QA pendiente**.

B0–B8 integrados en main (#50–#58), comprobados con fetch y Git. Checkout aislado `r5-block-9-worktree`; configuración copiada byte a byte del checkout main `mapbox-worktree`, ignorada y fuera del índice. Cambios iniciales del usuario preservados. Sólo B9: **B10 requiere aprobación independiente**. [PR #59 en borrador](https://github.com/EnzoG14/PlanIt/pull/59) hacia main; producto/evidencia `27dd331c7247a7d0320d8013510a355245fe7758`; commits posteriores sólo seguimiento. No merge ni deploy.

## Fuentes y contrato

Lectura del prompt B9, plan/estado/paquete R5, AGENTS raíz/src/Supabase/diseño, PRODUCT, DESIGN, arquitectura/modelo y planes/estado/QA R4. Nueva lectura de planificación, criterios y especificación vigentes en Google Docs: [33 CA literales](source.json). D01–D05 conservadas, D04 sigue pendiente de edición de Google Docs con autorización separada.

Las 30 migraciones existentes se inspeccionaron y reprodujeron localmente. **No se modificó SQL del producto**: B1 ya implementa bloqueo dirigido, no-self, cleanup bilateral, RLS/ACL, locks ordenados y gates de follow/DM/perfil/avatar. No asumir que una prueba local demuestra catálogo o JWT remoto: el catálogo remoto nuevo no se consultó en B9; las aplicaciones autorizadas B1/B7/B8 están documentadas en sus actas históricas.

### Amenazas y autorización

| Operación / respuesta | Dueño / actor autenticado | Confirmado de evento | Tercero autenticado | Contraparte bloqueada | Anónimo |
| --- | --- | --- | --- | --- | --- |
| `get_social_relationship(target)` | Estado dirigido por auth.uid; disponible devuelve visibility/follow | Ningún privilegio social adicional | Mismo contrato | Sólo unavailable y blocked_by_me propio; sin identidad | EXECUTE negado |
| `block_user(target)` / `unblock_user(target)` | Actor implícito; target distinto, existente; void | Mismo contrato; pertenencia irrelevante | Puede bloquear para sí, nunca operar como otro | Unblock elimina sólo su propia dirección; no quita bloqueo ajeno | EXECUTE negado |
| SELECT `user_blocks` | Sólo filas con blocker_id=auth.uid | Ninguna lectura extra | No lee bloques ajenos | No ve fila de quien lo bloqueó | Sin ACL |
| Perfil / contadores / follows / avatar | Contrato D01/D02 y allowlist vigente | Grant/confirmed no supera gate social | Mismas restricciones | Perfil neutro; sin nombre/avatar/bio/eventos/contadores; sin nuevos follows | Sin acceso |
| Historial DM / messages | Sólo low/high de conversación canónica | No concede DM | Tercero ajeno denegado | Ambos conservan historial; RPC send y apertura nueva denegadas | Sin acceso |
| Chat grupal | Permisos R2–R4 de evento | Permisos existentes | Sin acceso por ser tercero | Bloqueo social no altera permisos de evento | Sin acceso |

Cliente nuevo conserva únicamente `{available, blockedByMe}`; nunca retiene toda la respuesta social. Escrituras envían exclusivamente `p_target_id`, sin actor ni estado de follow. RLS activa, sin grants INSERT/UPDATE/DELETE cliente en bloques; DEFINER existentes con search_path vacío y ACL authenticated. SELECT/SQL directo, actores/roles falsos, PK/CHECK y funciones internas revisados mediante SET ROLE local.

## Implementación

- `src/features/social/blocks.ts`: consulta tipada del bit propio y RPC block/unblock, AbortSignal y retry automático desactivado.
- `src/components/BlockUserAction.tsx` y CSS propio: control compartido, confirmación nativa modal, explicación de efectos, cancelar/Escape, foco inicial/retorno, guards de doble envío, timeout10s y consulta de resultado incierto.
- `SocialIdentityPage.tsx`: bloquea desde perfil disponible; al operar elimina la proyección visible. En perfil neutro sólo el bloqueador puede desbloquear. Refresco sincroniza opciones y perfil; nunca muestra éxito por timeout.
- `DirectChatPage.tsx`: mismas acciones en DM existente; oculta identidad y deshabilita envío/retry durante resultado incierto, conserva historial. Unblock reconsulta permisos y conserva ID canónico; no restaura follows. Sesión/token/ruta remonta y aborta trabajo anterior.
- Tres runners B9 y scripts npm, sin dependencias nuevas ni cambios de lockfile. Seguimiento en PLAN/STATUS/READ ME, matriz de aceptación y estado visual.

Al perder respuesta se consulta el bit propio antes de permitir nueva confirmación. Cerrar el aviso no habilita otra escritura: conserva “Consultar estado del bloqueo”. Consultar no repite la mutación. Cambios de permiso por otras sesiones se revalidan cada30s, foco, visibilidad y reconexión mediante infraestructura existente. No se publica perfiles/bloques por Realtime. La ventana de revalidación cliente y URLs de avatar previamente firmadas de hasta60s siguen el contrato aprobado; las RPC impiden interacciones inmediatamente.

### Migraciones B9

| Creada | Probada local nueva | Aplicada remota | Verificada remota nueva |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 0 |

Replay local de30 históricas no significa aplicar SQL remotamente. Sin DDL remoto, cuentas fixture remotas, secretos, deploy ni edición de Google Docs.

## Pruebas y aceptación

| CA / caso | Resultado real | Evidencia | Pendiente integral |
| --- | --- | --- | --- |
| RF-R5-08.CA-01 | PASS parcial SQL/UI: own bit, self/anon negados, cancelación, idempotencia, block/unblock persistido en fixture | [SQL](sql/sql-results.json), [UI](ui/ui-results.json) | JWT autenticado, sesiones reales y aceptación humana |
| CA-02 | PASS parcial SQL/UI: limpieza bilateral, bloqueos simultáneos contra send/follow; perfil neutro y acciones retiradas | mismos resultados | Transporte autenticado real |
| CA-03 | PASS parcial SQL/UI: historial DM preservado, lectura autorizada, composer y send denegados | mismos resultados, [captura DM](ui/chat-blocked-390.png) | Realtime real |
| CA-04 | PASS parcial SQL/UI: mismo ID de conversación, sin restore de follows; bloqueo ajeno persiste | mismos resultados | Dos sesiones reales |
| CA-05 | PASS SQL local: chat de evento bajo bloqueo mantiene consulta/envío autorizado; grant-only no da participantes sociales | [SQL](sql/sql-results.json) | UI/chat grupal y JWT remotos integrados |
| D01-A/B, D03-A, D04-B | PASS parcial: gates bilaterales, 72 audiencias, privacidad versus block; rollback total y carrera de3 sesiones | [harness](sql/harness.json) | Casos remotos/integrales |
| Lectura HTTP anónima | PASS4/4 GET real denegado: blocks/follows/relationship/profile | [HTTPS](remote/http-anon.json) | No es JWT autenticado |
| Build/lint | PASS; avisos anteriores de chunks y lint documental/DiscoveryFilters | [build](build.txt), [lint](lint.txt) | No avisos nuevos en producto B9 |
| Regresión R1–R4 | 13 suites SQL locales; resultado final en evidencia | [regresiones](regressions.json) | No nueva aceptación de CA históricos |
| Regresión perfiles/DM | PASS54 y42 grupos UI fixture del build real | [perfil](regression-ui/profile/ui-results.json), [DM](regression-ui/messages/ui-results.json) | No RLS/JWT real por estos fixtures |

SQL: PostgreSQL18.4,30 migraciones,28 grupos (72 audiencias,13 carreras originales más carrera triple B9). Auth/Storage son scaffold SQL y auth.uid mediante SET ROLE; no Supabase Auth/PostgREST real. Nuevo fixture inyecta fallo de DELETE y demuestra rollback del INSERT de block y conservación de dos pending; después prueba cleanup exitoso. Dos bloqueos opuestos y envío simultáneo observan esperas PostgreSQL reales, finalizan sin deadlock y no persisten el mensaje rechazado.

UI: Edge headless, build Vite real, Auth/REST/WebSocket explícitamente simulados; seis anchos320/360/375/390/768/1280. Confirma ausencia de identidad/sentinel, recarga, cancelación, fallos/red/retry, respuesta perdida committed/uncommitted, estado propietario/contraparte, mismo DM, retorno/foco, texto200% y altura400. El runner adicional a390 verifica timeout real10s, doble confirmación y Escape mientras procesa. **Fixtures no prueban RLS remota**.

Incidencias del entorno resueltas: instalación restringida falló por DNS; npm ci posterior PASS. Primer wrapper SQL de rollback convirtió $$ a $ al usar reemplazo por string: corregido a callback y rerun PASS. Una prueba UI de red reveló opciones independientes sin refresco manual: se sincronizó revisión. Cinco runners históricos fallaron por módulos PostgreSQL en ruta fija ausentes; conexión local de herramientas y rerun en evidencia final. Primer revisión visual encontró contraste oscuro en confirmar desbloqueo; corregido, rebuild/recaptura y revisión puntuó resuelto.

## Diseño y límites

Mockup original R5 inspeccionado, intacto, conserva inventario perfiles/DM; no se extraen fotos ni funciones ajenas (llamadas, audio, historias). Sistema Amanecer y cuatro tabs intactos. Diálogo blanco, radios/tokens/fuente existentes, danger sólido al bloquear, acción marino con texto blanco al desbloquear, targets48px, foco3px y scroll nativo con poca altura. [Revisión](design-review.md), [documentación visual](design-documentation.md).

[Antes móvil](before/history-390.png) · [Antes escritorio](before-desktop/history-1280.png) · [Confirmar bloqueo](ui/block-confirm-390.png) · [Confirmar desbloqueo](ui/unblock-confirm-1280.png) · [Perfil neutro](ui/profile-blocked-390.png). Capturas de aplicaciones ejecutadas con datos ficticios, no mockups fabricados. Regresiones prueban nombres largos, texto ampliado, permisos retirados, offline/hidden, logout y navegación.

**NOT RUN:** JWT autenticado remoto, Storage/CDN/avatar real, entrega Realtime real, dispositivos/teclado móvil/lector reales y QA humana; nuevo inventario remoto de catálogo. No hay migraciones nuevas pendientes de aplicar. Mantener estado **Implementado; QA pendiente** hasta aceptación expresa.

## Reproducir y revisar

```powershell
npm ci
npm run build
npm run lint
# Runners requieren pg + embedded-postgres local y Playwright/Edge.
$env:PLANIT_TEST_TOOLS_DIR='C:/Users/USUARIO/Desktop/PlanIt/mapbox-worktree/.participation-test-tools.local/node_modules'
$env:PLANIT_PLAYWRIGHT_PATH='C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
npm run check:r5:blocks
npm run check:r5:blocks:ui
npm run check:r5:blocks:http
$env:PLANIT_SQL_OUTPUT='docs/qa/r5-block-9'
node scripts/check-r5-regressions.mjs
```

Revisar cancelación/confirmación desde perfil y DM; resultado incierto y consulta sin escritura repetida; bloqueo en ambos sentidos, unlock parcial y conversación canónica; grupos y permisos R4 sin cambios. Revisar [manifiesto](manifest.json) y evidencia con sus límites. **Detenerse en esta PR; no iniciar B10 sin aprobación.**
