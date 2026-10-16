# R7 · Bloque 1 — Modelo multimedia y aislamiento

16/10/2026, Argentina. **BD aplicada con autorización posterior y verificada por catálogo; validación integrada Storage/Edge pendiente.** Base `5adf8e455c90d46adc0f5477c5d3e9ee06eb2461` (`origin/main`, #74 integrada), rama `codex/r7-block-1`, worktree `r7-block-1-worktree`. Entrega técnica `894fc6ce8922d3ba65f0d6f04c37266c70de5afd`, [PR draft #75](https://github.com/EnzoG14/PlanIt/pull/75). Ver actualización remota autorizada al final.

El pedido humano de implementar B1 habilita este bloque sobre el contrato B0 integrado. El responsable autorizó además «Ampliar B1 con validación en Edge», exclusivamente código y pruebas locales, sin deploy. No se atribuye aprobación a los demás bloques ni a decisiones de historias canceladas/archivadas pendientes de B4.

## Entrega y compatibilidad

- Migración `20261016131118_r7_media_contract.sql`: reservas privadas/idempotencia/hash del payload, claims exclusivos, `message_attachments` 1:1, FKs RESTRICT, índices y RLS/ACL mínimos. `messages.body` nullable con CHECK local y constraint triggers diferidos que observan mensaje, attachment, claim, file y reserva al commit. DM exige texto y cero adjuntos. No se crea `stories` ni una API pública de envío multimedia (B2/B4).
- Reemplazo de las policies existentes de Storage y `files`, separando legacy de `r7/chat/<uid>/<event>/<attempt>.ext` y `r7/stories/...`. No hay segunda policy SELECT que amplíe mediante OR. Lectura R7 únicamente por asociación de chat autorizada y operación `object.get_authenticated`; huérfano, uploader sin permiso, sign/list/info/transform y namespace stories se deniegan. B4 debe extender la rama de historias con su tabla y TTL servidor; B1 no simula expiración de una tabla inexistente.
- CHECK de paths disjunto y guardas contra blanqueo por galería/avatar o registro legacy; archivos R7 inmutables. Galería y avatar mantienen sus namespaces/policies y contratos. `get_event_chat_messages` conserva firma/cursor y excluye mensajes sin texto; `send_event_chat_message`/RPC DM/notifications/Realtime conservan firmas y productores. SELECT directo/Realtime de `messages.body` pasa a ser nullable: B3 debe reconciliar por RPC v2.
- Helpers nuevos `src/features/events/media/`: reutilizan tipos/límite de `validation.ts`, validan selección/magic/decode, mantienen UUIDs y path en retries, upload raw `upsert:false` con `cache-control:no-store`, reconciliación metadata tras 409 y validación Edge antes de devolver el archivo. Upload verificado todavía no equivale a mensaje/historia publicado; nunca compensan borrando tras un timeout. `gallery.ts`, páginas, CSS, router y SW intactos.
- Ampliación autorizada `supabase/functions/r7-media-validate/`: Auth.getUser deriva viewer; servicio obtiene path desde reserva propia/autorizada, descarga bytes con límite 5MiB, decodifica JPEG/PNG/WebP y calcula SHA-256. SQL service-only vuelve a bloquear evento→participación→reserva→path→objeto y coteja id/eTag, estado, membresía, MIME/tamaño/cache antes de registrar attestation. `register_r7_media` falla con `image_verification_required` sin ella. Ningún parámetro de autor/path/URL del navegador autoriza la operación.

El hash de reserva identifica parámetros/idempotencia; **no se confunde con SHA-256 de bytes**, producido sólo por Edge. `verified_at` usa timestamp sin zona Argentina. Secretos de servicio sólo se leen del runtime servidor; no hay valores reales en Git, cliente o evidencia.

## Evidencia y estado por capa

| Capa/caso | Estado | Alcance real |
|---|---|---|
| R7-B1-TC-01 replay | PASS local | 38 migraciones desde cero, PostgreSQL 18.4 real; [hashes/resultados](sql/sql-results.json), [RLS/ACL/policies](sql/inventory.json). Remoto B0 era PostgreSQL 17.11; no se afirma paridad de versión mayor. |
| R7-B1-TC-02 SQL roles | PASS local parcial | A organizer/B confirmed/C pending/D removed/E grant-only/F tercero/anon, uploader huérfano, miembro retirado, GET vs sign/list/info con operación simulada SQL. No prueba transporte Storage. |
| R7-B1-TC-02 HTTP/JWT/TTL | NOT RUN / gate | Faltan GET/sign/list/HEAD/transforms y cache headers con Storage/Auth reales; stories y frontera T+24h pertenecen B4/B6 y aún no existen. No usar este PASS SQL para afirmar D10 cumplida. |
| R7-B1-TC-03 regresión | PASS SQL local | Texto/UUID retry, DM, galería/avatar, file legacy compartido, exactamente dos SELECT policies Storage disjuntas por bucket; sin ampliación OR R7. |
| R7-B1-TC-04 | PASS SQL local parcial | Payload conflict, subida inválida, rollback, reserva simultánea y cierre mientras espera lock; cliente no puede borrar/reescribir objeto registrado. GC físico no implementado aquí (B6). |
| Cliente | PASS unitario | [Resultados](client-results.json): límites/MIME/magic, errores, retries/409, no publicación/borrado; API y decoder browser stubbed. |
| Edge decoder | PASS bytes reales local | [Resultados](edge-results.json): WASM real con JPEG/PNG/WebP, truncados/MIME falso/GIF/vacío/sobretamaño. Handler usa HTTP stubs; prueba Deno real adicional 1/1 PASS. |
| Deno check | PASS local | Tipos del entrypoint y dependencia fijada; no equivale a Supabase Edge Runtime desplegado. |
| Build / lint | PASS | `npm run build`; `npm run lint` (warnings heredados, sin errores). Instalada copia de dependencias del lock mediante `npm ci --ignore-scripts`; no cambios package/lock. Build genera SW generateSW con 86 entradas, sin modificar su fuente/configuración. |
| UI / SW offline / Push / regresión E2E R1–R6 | NOT RUN | Sin cambios visuales; viewports 320/375/390/768/1280 no aplican a este diff. Mockup original inspeccionado y sin modificaciones. No se hereda aceptación funcional de R6 como ejecución nueva. |

RF-R7-01.CA-03/04 y RF-R7-02.CA-03/04 tienen infraestructura y evidencia parcial, **no aceptación funcional completa**; RF-R7-04 sólo base fail-closed. Los 29 CA oficiales no cambian. El seguimiento de este bloque vive aquí conforme al ownership; `RELEASE_7_STATUS.md` y matriz final quedan para B11.

| Migración | Creada | SQL local | Aplicada remota con aprobación | Verificada remota |
|---|---|---|---|---|
| 20261016131118 | Sí | PASS | Sí, 1 | Sí, 1 (catálogo/ACL/RLS) |

## Reproducción

Desde este worktree, Node 24 y herramientas PostgreSQL del harness histórico:

```powershell
npm ci --ignore-scripts
node scripts/check-r7-media.mjs
node scripts/check-r7-media-client.mjs
npm install --prefix .r7-test-tools.local --ignore-scripts --save-exact @imagemagick/magick-wasm@0.0.44 @deno/win32-x64@2.9.6
node scripts/check-r7-media-edge.mjs
$env:DENO_DIR = (Join-Path (Get-Location) '.r7-deno-cache.local')
./.r7-test-tools.local/node_modules/@deno/win32-x64/deno.exe check --config supabase/functions/r7-media-validate/deno.json supabase/functions/r7-media-validate/index.ts
./.r7-test-tools.local/node_modules/@deno/win32-x64/deno.exe test --allow-read --config supabase/functions/r7-media-validate/deno.json supabase/functions/r7-media-validate/decoder_test.ts
npm run build
npm run lint
git diff --check
```

SQL usa `PLANIT_TEST_TOOLS_DIR`, default `../.participation-test-tools.local/node_modules`, con `pg` y `@embedded-postgres/windows-x64`, bootstrap/shutdown del harness existente. Inicializa un clúster nuevo en carpeta `.local`, puerto loopback libre, cierra conexiones y servidor incluso ante error; no elimina recursivamente archivos ni toca bases existentes. `PLANIT_SQL_OUTPUT` permite aislar evidencia de otra ejecución. El generador temporal se elimina al terminar. Primeros intentos detectaron limitación de sandbox localhost y diferencias del scaffold/códigos RI de PostgreSQL18; los resultados versionados corresponden a la suite corregida final.

## Contrato de integración y riesgos pendientes

1. D01/D02/D03/D10/D13/D15/D17 usados sin cambiar RF/CA. B2 debe llamar `register_r7_media(file_id,message_id)` dentro de su transacción, después de resolver autorización/idempotencia de mensaje y siguiendo orden de locks, e insertar mensaje/attachment antes del commit. Helpers privados no tienen EXECUTE cliente. B4 debe extender **ambas** validaciones diferidas de claims/files para `story`, registro y lectura con su tabla/TTL; hoy una historia no puede registrarse ni leerse.
2. D10 requiere prueba **real** de operación Storage y ausencia de firma/cache que sobreviva al TTL. Sin Docker/Storage/Auth local disponibles en PATH, esta entrega no inventa HTTP/JWT PASS ni aplica DDL remoto para obtenerlos. Si la operación no distingue sign en la versión destino, mantener NO-GO y revisar gateway autenticado según B0.
3. DELETE cliente R7 se mantiene cerrado incluso para huérfanos; reintento conserva reserva. Es una restricción conservadora respecto de la limpieza interactiva propuesta en B0, documentada para revisión. B6 implementa GC service-only con lease y revalidación de referencias; nunca borrar SQL directo de `storage.objects` ni borrar chat/galería/avatar. No se reclama GC operativo.
4. El único decoder nuevo es **servidor**, `@imagemagick/magick-wasm@0.0.44`, fijado con `deno.lock`; justificado por validación confiable de los tres formatos. WASM x86 15.447.097 bytes, asset CDN con versión exacta y SHA-256 obligatorio en arranque. La verificación de integridad evita cargar otro binario; caída del CDN/cold start impide iniciar y no permite publicar sin validar. Límites de memoria/tiempo protegen runtime; medir despliegue/carga y compatibilidad real antes de habilitar. No aumenta bundle frontend ni instala ORM/backend paralelo.
5. `.env.local` copiado byte a byte desde worktree de main (`mapbox-worktree`), ignorado y fuera del índice; checkout inicial y sus cambios ajenos preservados. No se versionan clústeres, tools, variables ni logs privados.

Revisión cruzada de seguridad sólo lectura por `media_audit`: corrigió claim huérfano al borrar attachment con texto; reforzadas comprobaciones de ambas direcciones. Pruebas locales incluyen ese negativo. La ampliación Edge también fue revisada sin defecto bloqueante concreto; como endurecimiento adicional, attestation persiste object_id/eTag y registro/lectura cotejan esa identidad, evitando aceptar un objeto reemplazado en el mismo path.

**Gate humano:** revisar PR y completar evidencia Storage HTTP/GET/sign real antes de integrar/habilitar dependientes; autorización remota y deploy son posteriores y separados. No se ejecutó otro bloque, deploy, secrets, cron ni merge.

## Actualización remota autorizada — 16/10/2026

El responsable pidió expresamente aplicar las migraciones remotas pendientes. Se verificó el destino `planit-v2` (`iepeqmvzjguwlhnecsdq`), 37 versiones previas coincidentes y dry-run con únicamente B1 pendiente. Se aplicó `20261016131118_r7_media_contract.sql` con `--skip-vault`, sin seeds, roles, deploy Edge, cron, secretos ni merge. El gate anterior describía la entrega inicial: esta autorización posterior habilitó la aplicación de BD, sin convertir las pruebas HTTP pendientes en PASS ni autorizar otro bloque.

Verificación posterior: **38/38 versiones sincronizadas, 0 pendientes**, 19/19 cuerpos de función idénticos al SQL de Git; ACL, search_path, RLS y policies Storage comprobados. Asesores: 0 ERROR, 53 WARN (`authenticated_security_definer_function_executable` y `auth_leaked_password_protection`); no se atribuyen todos esos warnings a B1 ni se cambian ajustes Auth. [Resumen reproducible](remote/summary.json), [catálogo READ ONLY](remote/catalog.json), [asesores](remote/security-advisors.json), [consulta](remote/verify-readonly.sql), [verificador](remote/verify.mjs).

Cuatro marcas actuales: **creada sí / SQL local PASS / aplicada remotamente con autorización sí / verificada remota por catálogo sí**. GET/sign/list/HEAD/transform/cache con JWT reales siguen NOT RUN; validación y funcionamiento integrado requieren desplegar Edge por separado con autorización. B2/B4 no iniciados.
