# R4 bloque 6 — Visibilidad y enlaces

13/10/2026, Argentina. Rama `codex/r4-block-6`, base `origin/main` **0428d4ff601056fa60d61788087ff352c310e070** después del fetch; PR #44/B5 integrado. [PR #45 en borrador](https://github.com/EnzoG14/PlanIt/pull/45). Checkout aislado; cambios anteriores del checkout raíz preservados. **Implementado; QA humana/remota pendiente.** Migración aplicada/verificada posteriormente en planit-v2 el 13/10/2026 con autorización expresa; sin merge/despliegue frontend ni bloque 7.

## Contrato y cambios

Prompt B6, plan/STATUS/RF/CA, arquitectura/modelo y guías AGENTS leídos. Especificación original RF-R4-07/08 consultada mediante Google Drive read-only. A01–A07 no se reabren; A07 conserva la aprobación del responsable y su brecha histórica de evidencia HTTP/JWT versionada. D12 ya fue elegido expresamente el 13/10: se reutiliza el trigger B5, no se registra como aprobación nueva.

Referencias técnicas: [funciones y privilegios Supabase](https://supabase.com/docs/guides/database/functions), [pgcrypto de PostgreSQL](https://www.postgresql.org/docs/current/pgcrypto.html). Changelog.md no pudo leerse con web por formato; no se acredita una verificación inexistente. No se introducen dependencias/API de Supabase nuevas.

- `create_event` inserta public/unlisted desde el comienzo, mantiene UUID idempotente, validaciones, fotos y conversación nueva. INSERT own admite ambas visibilidades; sin UPDATE cliente ni identidad suministrada por navegador. La duplicación sigue usando RPC de fuente propia y formulario local con visibilidad inicial pública explícita; no hereda grants, enlaces, fotos, participantes ni mensajes.
- `update_event` guarda contenido y visibilidad en una transacción; `set_event_visibility` ofrece la operación de dueño por separado. El conflicto confirmed+revoked revierte todo y UI pide resolución expresa; no reactiva a nadie. Se puede resolver mediante remoción explícita R3 antes de ocultar; restitución/panel de grants queda en B8. Público vuelve a permitir lectura sin restaurar revoked/removed.
- `create_or_rotate_event_link` genera 32 bytes CSPRNG en PostgreSQL y persiste sólo SHA-256; lock de evento, revocación e INSERT atómicos, un hash activo. `get_event_link_status` devuelve sólo booleano al dueño, sin SELECT de hashes. A06: no existe recuperación del secreto. Sin expires_at; fin/cierre impide generar/rotar.
- Formularios actuales con selector, detalle organizador con panel embebido, diálogo nativo con el patrón/estilos EventActionDialog, advertencia de regeneración, copia y fallback manual. Token únicamente en memoria/DOM durante el diálogo y en portapapeles por acción expresa; se borra al cerrar, salir/cambiar cuenta. No se navega a la invitación desde gestión; no se escribe token en URL actual, router state, storage, logs o evidencia. Respuesta perdida exige regenerar conscientemente; nunca se recupera ni reintenta automáticamente.

## Dependencia que no debe ocultarse

**/invite y redeem_event_link no existen aún: son B7. Los enlaces generados por B6 todavía no permiten canjear acceso en esta versión.** Este bloque prueba revocación del hash anterior y bloqueo de generación al cierre; no afirma haber probado un canje antiguo/finalizado/cancelado/archivado. CA-04 tiene PASS local de rotación/grants y canje pendiente; CA-05 conserva evidencia parcial. No se amplía el alcance para implementar B7 sin aprobación.

## Migración y compatibilidad

`20261014120004_event_visibility_links.sql`: creada con CLI como `20261013223733`, renombrada después de B5; ninguna migración aplicada editada. Reemplazo sin CASCADE, sin dependientes SQL encontrados en migraciones; único overload de create/update con parámetros finales por defecto (llamadas R1–R3 siguen funcionando). Creación invoker bajo RLS; mutaciones de dueño DEFINER/search_path vacío/EXECUTE authenticated. UPDATE/DELETE de eventos y hashes/grants siguen inaccesibles. pgcrypto en extensions, sin tablas/fechas nuevas ni secretos cliente. **Aplicada/verificada remotamente el 13/10/2026 con autorización expresa posterior**: dependencias inspeccionadas, pgcrypto en extensions, 23 versiones sincronizadas, dry-run sin pendientes, 5 cuerpos idénticos a Git, RLS/ACL/defaults/índice y guardas sin identidad PASS. [Acta remota](remote-migration-summary.json). Asesores: 23→26 avisos, ningún error; tres nuevas RPC de dueño DEFINER son intencionales y la edición sustituye el aviso anterior por su nueva firma. Smoke con rol SQL sin identidad y ROLLBACK; no fixtures de negocio ni HTTP/JWT real.

## Evidencia clasificada

| Comando | Resultado | Entorno / evidencia |
| --- | --- | --- |
| `npm run build` | PASS | TypeScript + Vite + PWA; aviso preexistente de chunks grandes |
| `npm run lint` | PASS (avisos previos) | Sin errores/avisos nuevos en archivos B6; probes históricos y DiscoveryFilters conservan avisos |
| `npm run check:amanecer` | PASS | 83 valores normativos/fuente/referencias |
| `npm run check:event-links` | PASS | [7 grupos SQL](postgres-results.json), PostgreSQL real efímero/SET ROLE/Auth-Storage scaffold; no HTTP/JWT |
| `npm run check:hidden-access` | PASS | [96 combinaciones, siete grupos y locks](security-regression/postgres-results.json), replay incluye B6 |
| `npm run check:events` | PASS | Validación TS de R1; no flag PGlite histórico |
| `npm run check:edit-event` | PASS | [8 grupos SQL](regressions/edit-sql/postgres-results.json), concurrencia/cupo/denegación |
| `npm run check:event-actions` | PASS | [7 grupos SQL](regressions/actions-sql/postgres-results.json), duplicación/cierre/12 carreras |
| `npm run check:event-links:ui` | PASS | [36 grupos UI](visual/results.json), seis anchos, Auth/REST interceptados |
| `node scripts/check-event-links-ui.mjs 390` | PASS | [Confirmación y stress](visual-confirm/results.json), permiso, 44px, texto aumentado/poco alto |
| `npm run check:events:ui` | PASS | [Mediciones](regressions/create-ui/measurements.json), fotos/límites/limpieza/respuesta incierta |
| `npm run check:edit-event:ui` | PASS | [40 grupos fixture](regressions/edit-ui/ui-results.json), carga, permiso, resultado incierto, retorno/filtro |
| `npm run check:event-actions:ui` | PASS | [Regresión fixture](regressions/actions-ui/ui-results.json), duplicación, cuentas, cierre/chat histórico |
| HTTP/JWT A/B, Storage/Realtime remoto, PWA/dispositivo real | NOT RUN | Sin mutaciones/credenciales/sesiones reales |
| Canje de token anterior o evento cerrado | NOT RUN | RPC/ruta corresponden a B7 |
| Aceptación humana | PENDIENTE | Ningún CA Validado |

Incidencias corregidas de los runners nuevos: selector description inicialmente coincidía con meta; remoción SQL usaba user_id en lugar de participation_id. Reejecuciones finales PASS. Runner histórico de edición sobre baseline tuvo un timeout antes de ajustar el contrato de fixtures (11→12 parámetros); suite final de edición completa PASS sobre implementación. La comparación before final sale del runner B6, contra fuentes inmutables de 0428d4f en `.baseline.local`, nunca de reemplazar código mientras se captura. Capturas históricas intactas.

## Composición y revisión de diseño

Se hereda B · Amanecer: tokens/fuente/paleta y dock intactos, una mancha por pantalla. Selector en EventFields, sección Visibilidad con ayuda dependiente del estado; inicio/fin, file-picker, reconciliación y edición conservados. Panel como flujo de gestión sin tarjeta anidada, botones en tinta, confirmación blanca. Scopes actuales `event-form-shell` y `discovery-shell`; sin rutas ni shell alternativos. Volver/Cancelar conserva origen; foco de error del formulario existente; diálogo enfoca Volver, atrapa Tab y restaura trigger con Escape/ cierre. Copy fallback enfoca/selecciona el campo; éxito elimina el aviso de fallo anterior.

Comparación seis tamaños 320/360/375/390/768/1280; navegador Tokyo verifica horario Argentina. Capturas seleccionadas versionadas para limitar el diff (los runners generan el conjunto completo): [editar antes](visual/before-edit-390.png), [editar después](visual/after-edit-390.png), [gestión oculta](visual/hidden-detail-390.png), [conflicto](visual/conflict-390.png), [diálogo de enlace](visual-confirm/one-time-link-masked-390.png), [poco alto/texto aumentado](visual-confirm/stress-320x400-large-text.png). Token ficticio enmascarado incluso en QA. Mockup R4 abierto visualmente: es inventario de discovery/intereses/sugerencias, no incluye gestión de links; no autoriza favoritos/precios/tickets ni volver al tema oscuro. [Revisión manual Impeccable](IMPECCABLE.md).

No acreditado: reduced-transparency emulado específico, falta real de blur/fuente, zoom/lector de pantalla/teclado/PWA/teléfono/safe areas físicos. El fallback central se conserva. TTL firmado residual B5 de 60s/bytes ya recibidos y metadata pública hasta reconsulta mantienen sus límites; no se promete borrar contenido descargado. Rotaciones entre dos sesiones pueden volver obsoleto el token recién copiado por otra sesión: el servidor conserva sólo el último hash activo.

No había uso de navigator.share en src: se conserva el flujo de copiar/fallback sin introducir integración R7. Se reutilizó la instalación local de dependencias del bloque 5, sin cambios de lockfile/dependencias ni afirmar npm ci ejecutado.
