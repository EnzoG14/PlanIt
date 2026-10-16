# R7 · Bloque 2 — API transaccional de adjuntos de chat

16/10/2026 (Argentina). **Implementado, probado en SQL local y aplicado/verificado remotamente con autorización posterior; revisión humana y transporte integrado pendientes.** Base `3f2a49800198825abfca660fa20acc051a31a94c` (`origin/main`, PR #75/B1 y #74/B0 integradas), rama `codex/r7-block-2`, worktree `r7-block-2-worktree`. Entrega técnica `bcbf916b9ca00e2520b3cd624608d4b5af29d699`; [PR draft #78](https://github.com/EnzoG14/PlanIt/pull/78). El pedido explícito habilita B2; no se atribuye autorización a B3 ni a despliegues remotos.

## Cambios y contratos

- Nueva migración `20261016141952_r7_chat_attachments.sql`, creada mediante CLI: `send_event_chat_message_v2(uuid,uuid,text DEFAULT NULL,uuid DEFAULT NULL) → uuid` y `get_event_chat_messages_v2(uuid,timestamp DEFAULT NULL,uuid DEFAULT NULL)` con las doce columnas del contrato B0. El nombre candidato `send_event_chat_media_message` del prompt se resuelve con la firma versionada congelada, sin endpoint duplicado.
- Envío de texto, una imagen sola o texto+imagen. Body normalizado con el mismo trim Unicode que texto/DM, vacío equivale a NULL; al menos un contenido y máximo 2000 caracteres. El autor procede de `auth.uid()`. El cliente entrega `file_id` reservado; nunca path, autor o URL arbitrarios.
- Lock evento → participación confirmada; sólo conversación `kind='event'`. Para nueva publicación se comprueba reloj servidor después del lock. La reserva debe ser del JWT, evento y propósito chat antes de llamar `register_r7_media`, que bloquea reserva/path/objeto y valida attestation/identidad/metadatos B1. `files`+claim+mensaje+attachment y transición de reserva se confirman en una transacción PostgreSQL, con las restricciones diferidas B1.
- UUID idéntico+autor+evento+body normalizado+file devuelve el mismo ID, también tras cierre si conserva autorización. Body/file diferentes o colisión global entre eventos producen `message_id_conflict`, sin sobrescribir ni filtrar payload ajeno. Un removido no puede reconciliar ni leer. No hay atomicidad distribuida con Storage: un fallo SQL conserva upload/reserva y permite retry; después de respuesta incierta se mantienen IDs y se reconsulta, jamás se borra el upload como compensación ciega. Limpieza física de huérfanos queda en B6.
- Lectura v2 autorizada con proyección social y metadata de un único adjunto, sin URLs firmadas, datos demográficos, reservas ni hashes. Cursores descendentes `(created_at,id)` y lookahead 51, con JOIN 1:1. Realtime conserva publication y reconciliación por ID; B3 debe volver a consultar v2 para obtener attachment.
- Ambas RPC son DEFINER por escritura transaccional privada/proyección social; `search_path=''`, referencias calificadas, EXECUTE revocado de PUBLIC/anon y concedido sólo a authenticated. Sin grants de DML nuevos, sin cambiar RLS/policies Storage ni exponer `files` generales. Se preservan RPC v1, DM texto obligatorio, trigger DM y bandeja única; chat grupal no genera avisos.

No se modifica frontend, páginas, CSS, router, SW ni mockups. Se inspeccionó el mockup original `docs/design/mockups/release-7.png`; la composición visual corresponde a B3. Decisiones utilizadas: D01/D02/D13/D15/D17 y aislamiento D10 ya implementado en B1; no se redefinen RF/CA ni decisiones de historias.

## Evidencia y alcance por capa

| Capa/caso | Estado | Evidencia y límite |
|---|---|---|
| Replay completo | PASS local | 39 migraciones desde cero, PostgreSQL 18.4 real; [hashes y resultados](sql/sql-results.json). Base remota B1 documenta PostgreSQL 17.11; no se afirma paridad de versión mayor ni catálogo remoto actualizado en B2. El primer rótulo de replay conserva el nombre B1 porque se reutiliza su scaffold. |
| R7-B2-TC-01 | PASS SQL local | A organizador/B confirmado: texto, imagen sola, ambos, lectura reconstruida. C pendiente/D removido/E grant-only/F tercero/anon/sin identidad negados. RPC y DML/SELECT bajo roles SQL; no equivale a POST REST/JWT real. |
| R7-B2-TC-02 | PASS SQL local | DM texto y retry: una notificación; NULL/direct media negados. Chat R2 send/get/retry conserva firma y lectura v1 sin NULL. Sin aviso de chat grupal. |
| R7-B2-TC-03 | PASS SQL local | Doble envío inicial concurrente, retry y reconexión tras commit descartando resultado; conflictos body/file/autor y UUID global cross-event. Cierre/remoción con espera observada mediante `pg_blocking_pids`; sin publicación tardía, historial y retry autorizado tras cierre. No se simula una caída TCP real. |
| R7-B2-TC-04 | PASS SQL local | Trigger de test falla en última inserción: cero mensaje/file/claim/attachment y reserva reserved; objeto conserva existencia y retry funciona. Upload sin validación, ausente, metadata inválida, story/reutilizado rechazados. FKs y ACL también ejercitados en regresión B1. Attestation es fixture service-only explícito; no prueba decodificación de bytes. |
| Paginación/proyección/ACL | PASS SQL local | Empates created_at con más de 51 mensajes, sin omisiones/duplicados; cursor inválido rechazado; proyección allowlist y [ACL reales locales](sql/api-acl.json). |
| Regresión B1 | PASS SQL local (7 grupos) | [Replay/roles/invariantes/galería/avatar/DM](regression-b1/sql-results.json); evidencia aislada de la de B1. |
| HTTP/JWT, Storage GET/sign/list/HEAD/transform/cache, Edge desplegada | NOT RUN | No se aplica B2 ni se despliega Edge. Las validaciones integradas pendientes de B1 siguen pendientes. SQL con `SET ROLE` y operación Storage simulada no las acredita. |
| UI 320/375/390/768/1280, accesibilidad, SW offline, Push y E2E R1–R6 | NOT RUN | Sin cambio visual ni SW; no se atribuye aceptación nueva por la baseline estable de R6. |
| Build | PASS | `npm run build`: TypeScript/Vite; generateSW, 86 entradas. Advertencia heredada por chunk grande de mapa. |
| Lint | PASS | `npm run lint`, sin errores; warnings heredados documentales/DiscoveryFilters. Resultado final después de retirar temporales de pruebas. |

RF-R7-01.CA-01..04: **backend SQL parcial PASS; aceptación integral NOT RUN** hasta HTTP/Storage y UI B3. Los 29 CA oficiales permanecen intactos. El seguimiento se actualiza en este reporte por ownership: `RELEASE_7_STATUS.md`/matriz final se consolidan en B11.

| Migración | Creada | Probada SQL local | Aplicada remota con aprobación | Verificada remota |
|---|---|---|---|---|
| 20261016141952 | Sí | PASS | Sí | Sí (catálogo/ACL/RLS) |

## Reproducción

```powershell
npm ci --ignore-scripts
node scripts/check-r7-chat.mjs
$env:PLANIT_SQL_OUTPUT='docs/qa/r7-block-2/regression-b1'
node scripts/check-r7-media.mjs
Remove-Item Env:PLANIT_SQL_OUTPUT
npm run build
npm run lint
git diff --check
```

Herramientas locales del harness histórico: `PLANIT_TEST_TOOLS_DIR` (default `../.participation-test-tools.local/node_modules`) con `pg` y `@embedded-postgres/windows-x64`. Cada suite inicializa un clúster y puerto loopback propios; cierra sesiones/servidor en finally. Auth/Storage son scaffolds SQL explícitos. `scripts/check-r7-chat.mjs` reutiliza el bootstrap/fixtures B1 y ejecuta `scripts/fixtures/r7-chat-tests.mjs`; los dos archivos temporales se eliminan al finalizar. El sandbox bloqueó loopback y npm DNS en intentos iniciales: se repitieron con permisos de ejecución local. Una primera aserción de fixture DM usaba actor_id, corregida a notification.id según el productor existente; la evidencia final corresponde a la suite corregida.

Se copiaron los bytes de `.env.local` desde el worktree de main (`mapbox-worktree`), ignorado y fuera del índice, sin imprimir contenido. Checkout inicial y cambios ajenos preservados. No DDL remoto, `db push`, deploy, cron, secretos, edición de Google Doc ni merge.

Referencias técnicas consultadas: [funciones PostgreSQL/Supabase](https://supabase.com/docs/guides/database/functions), [changelog](https://supabase.com/changelog) y reglas locales de privilegios/locks. El índice `.md` no respondió desde el navegador; se usó el changelog HTML. Sin cambio de SDK ni API Storage en B2.

**Gate humano:** revisar esta PR y autorizar B3 por separado. Antes de habilitar multimedia integrada: aplicar B2 con aprobación separada, completar validación Edge/Storage real pendiente de B1 y pruebas HTTP/JWT positivas/negativas de B2. No se continúa con el siguiente bloque.

## Actualización remota autorizada — 16/10/2026

El responsable solicitó explícitamente aplicar las migraciones a la base remota. Se comprobó el destino planit-v2 (`iepeqmvzjguwlhnecsdq`), 38 versiones previas sincronizadas y dry-run con sólo B2 pendiente. Se aplicó `20261016141952_r7_chat_attachments.sql` mediante CLI linked, sin seeds, roles, deploy Edge, cron, secretos ni merge. Las referencias previas a aplicación remota pendiente describen la entrega inicial y quedan superadas por esta autorización.

Verificación posterior PASS: **39 versiones sincronizadas, cero pendientes**, dos cuerpos de función idénticos al SQL versionado, EXECUTE authenticated/anon y search_path correctos, RLS y ausencia de DML genérico comprobados. Asesores: cero ERROR, 55 WARN frente a 53 antes; los dos nuevos avisos corresponden a las RPC DEFINER autenticadas intencionales. Se conserva el aviso Auth heredado sin cambiar configuración.

Evidencia: [resumen](remote/summary.json), [catálogo READ ONLY](remote/catalog.json), [asesores](remote/security-advisors.json), [consulta reproducible](remote/verify-readonly.sql), [verificador](remote/verify.mjs). Cuatro marcas: creada sí / SQL local PASS / aplicada remota con autorización sí / verificada remota por catálogo sí. HTTP/JWT y Storage reales continúan NOT RUN; esta aplicación no despliega el validador Edge ni habilita B3 automáticamente.
