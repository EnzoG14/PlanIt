# Release 7 · Bloque 10 — Estado de entrega

16/10/2026, Argentina. **Migración y worker desplegados, UI integrada en Perfil y recepción real confirmada por el responsable.** No representa aceptación completa de RF-R7-07 ni habilita ejecución de B11.

- Base limpia `origin/main`: `9d917a4765e713b1adc4f75f89a7d6b4b57c8a25`, con PR #80/B9 integrada.
- Rama: `codex/r7-block-10`; worktree: `C:/Users/enzog/planit-worktrees/r7-block-10`.
- `.env.local` copiado desde main e ignorado; sin contenido ni valores en Git/evidencia. CodeGraph inicializado con índice propio.
- Implementación: `d10fb35`; PR draft: [#81](https://github.com/EnzoG14/PlanIt/pull/81).
- Decisiones: D08 (preview real con opt-out) y D09 (Edge/cola/cron separado) confirmadas previamente; **D12 adoptada expresamente por el responsable en esta conversación**, incluyendo los parámetros y cron propuesto. El pedido inicial autorizó implementación y PR; posteriormente el responsable autorizó expresamente la migración remota. Después se autorizaron claves/respaldo, secrets, deploy y preparación del circuito completo, incluyendo el panel en Perfil. El responsable autorizó específicamente `jmt17.google.com/fcm/send/` y redeploy tras un bloqueo de revisión automática. Cron y Vault siguen pendientes.
- El seguimiento global conserva su fotografía histórica; la consolidación de `RELEASE_7_STATUS.md` corresponde exclusivamente a B11.

## Cambios y compatibilidad

Migración nueva `20261016154257_r7_push_jobs.sql`, worker `supabase/functions/r7-push/` con dependencia Edge fijada y lock, dos scripts de verificación y este directorio QA. Cola privada con dedupe, leases, backfill, expiración y retención; trigger aislado de la transacción interna; cinco RPC service-only; cifrado/VAPID y respuesta operacional sin contenido privado. [Contrato, catálogo, reproducción y operación](README.md).

La entrega inicial no cambió frontend; el pedido posterior conecta el componente PushSettings existente en Perfil y añade un margen con tokens Amanecer. Este wiring se adelanta expresamente a B11 sin ejecutar el resto del bloque. Se conservan SW B9, Vite, migraciones históricas, productores DM/follow/event_full, políticas Storage y contratos R1–R6. No se agrega timezone, cache privada, suscripción automática o aviso por chat grupal. Las únicas APIs nuevas son del worker, sin EXECUTE para anon/authenticated y sin acceso directo a la tabla operativa. Storage: no aplica a B10. Fechas propias sin zona, horario Argentina.

## Evidencia por capa

| Caso/capa | Estado | Evidencia y límite |
|---|---|---|
| R7-B10-TC-01 · productores/SQL | PASS local | [11 grupos SQL](sql/sql-results.json): un aviso DM y dos jobs de dispositivos; retry idempotente; tercero excluido; productor grupal sin aviso/jobs; follow_request y event_full existentes |
| R7-B10-TC-01 · recepción de browser/SO | PASS del navegador probado | [Prueba real](deploy/live-dm-results.json): un DM y aviso, proveedor aceptó y responsable confirmó que apareció. No acredita lectura ni Android/iOS |
| R7-B10-TC-02 · concurrencia/errores SQL | PASS local | Dos conexiones concurrentes y SKIP LOCKED, lease perdido, ACK obsoleto, dedupe terminal, 404/410 por revisión y dispositivo, 429, timeout, cinco intentos, todos los backoffs, expiración, retención y backfill tras error de trigger |
| R7-B10-TC-03 · privacidad/ACL | PASS local | Propietario derivado por joins; preview DM real, opt-out, bloqueo y mensaje eliminado genéricos; archivo de evento retira título/destino; seis superficies de acceso denegadas a anon/authenticated/identidad ausente; cola sin columnas privadas |
| R7-B10-TC-03 · SW/offline/clic | PASS sintético | [4 pruebas SW](sw/sw-results.json), Edge headless sobre build de producción: registro, precache, cero Supabase en caché, recarga offline, payload sanitizado y clic seguro. No equivale a Push físico ni sesión remota |
| R7-B10-TC-04 · Edge local | PASS | [Deno check + 9 tests](edge-results.json): fallo seguro de VAPID/configuración, rechazo de invocadores, clasificación de estados, SSRF/redirect, ACK perdido y topes por invocación |
| Cifrado y firma | PASS local | aes128gcm generado y descifrado con claves efímeras del receptor; firma VAPID ES256 verificada con Web Crypto, audience y subject correctos. HTTPS/RPC simulados |
| Migración y ACL remotas | PASS | [Acta remota](remote/README.md), [catálogo y verificación](remote/verification.json): 41 versiones sincronizadas, seis cuerpos iguales al SQL local, trigger activo, RLS, grants, negativos con SET ROLE y lookup service-only sin fixtures. No equivale a HTTP/JWT |
| Regresión B9 | PASS local | [13 grupos SQL](subscriptions/sql-results.json) + derivación determinista de IDs: alta/baja, owner-only, privacidad, validación P-256, carreras y bandeja. La etiqueta heredada dice 39 migraciones; el inventario contiene 41. Ejecución anterior al ajuste final de selección de jobs B10; suite B10 final reproduce íntegramente la migración final |
| Build | PASS | `npm run build`: TypeScript, Vite y `injectManifest`; SW producido y probado |
| Lint | PASS con advertencias previas | `npm run lint`: sin errores; advertencias históricas en probes y `DiscoveryFilters.tsx`. Lint dirigido a archivos B10: sin errores ni advertencias |
| UI 320/375/390/768/1280 | PASS con fixtures | [Perfil integrado](deploy/ui/results.json), capturas antes/después, preview editable, sin autoprompt, permiso denied tras gesto y sin overflow |
| HTTP/Auth/Edge real | PASS del circuito probado | [Smoke real](deploy/http-results.json): 405/401/401/200; JWT real de cuenta técnica, RPC DM y proveedor reales; worker v2 activo. Cron/Vault NOT RUN |
| Matriz de dispositivos | PARCIAL | Mostrado confirmado por el responsable en su navegador. Android/iOS y matriz completa de navegadores/versiones NOT RUN |

## RF/CA y regresión

- **RF-R7-07.CA-02:** implementación y pruebas locales PASS: mismo aviso, tres productores congelados, chat grupal excluido, jobs por dispositivo. Recepción real del caso DM confirmada; CA global sin aceptación final de todas las variantes.
- **RF-R7-07.CA-04:** errores no borran/duplican la bandeja; encolado roto se recupera; aceptación del proveedor y ACK se distinguen. SQL/Edge local PASS; proveedor/Edge real PASS para el caso DM, sin acreditar todos los fallos en infraestructura real.
- **CA-01/03/05:** compatibilidad B9 verificada en SQL y SW; baja individual preserva historial. Opt-in y mostrado real confirmados por el responsable; denied/preview se verificaron además con fixtures. La matriz completa de baja/identidad/otros dispositivos sigue pendiente.
- R1–R6: replay limpio de **41 migraciones**, con registro/cupo de R1, chat y bandeja R2, cancelación/archivo R3, controles de acceso conservados R4, DM/follow/bloqueo R5 y productor event_full R6 ejercitados. No se declara una regresión funcional completa R1–R6 ni se abren pendientes de R6.

## Migración: cuatro marcas

| Migración | Creada | Probada local | Aplicada remota con aprobación | Verificada remota |
|---|---|---|---|---|
| `20261016154257_r7_push_jobs.sql` | Sí | PASS, 41 migraciones desde cero / PostgreSQL 17.5 | Sí, autorización expresa posterior | PASS, planit-v2 / PostgreSQL 17.11 |

Entrega inicial sin operaciones remotas. Posteriormente se aplicó únicamente la migración B10 a `planit-v2`, con autorización expresa y `--skip-vault`; B9 ya estaba aplicada. Posteriormente se guardaron claves con ACL restringida y respaldo DPAPI, se configuraron cuatro secrets y se desplegó Edge con autorización; [acta de deploy](deploy/README.md). Sin cron, cambios Vault, Google Doc o merge. Proyecto histórico sin modificaciones. Advisors: sin nuevas categorías WARN/ERROR; un INFO adicional por RLS sin policies en la cola privada, con DML directo revocado, intencional.

## Riesgos y siguiente gate

Pérdida de ACK puede causar reenvío; no se promete exactly-once, mostrado ni leído. Cambios de permiso posteriores a la preparación del envío y previews ya entregadas no pueden revocarse retroactivamente. La allowlist de proveedores del transporte es deliberadamente estricta; un endpoint de otro proveedor termina de forma segura y requiere revisión técnica. El tope es por invocación y no sustituye controlar cron/credenciales y costos. Monitorización y SQL/Vault/cron remotos están propuestos en README, sin activación.

Gate de entrega: revisión de esta PR draft. Migración B10 aplicada/verificada. Secrets y deploy ejecutados con autorización; Perfil conectado para la prueba y recepción del DM confirmada. Pendientes: cron, revisión y matriz completa de dispositivos/variantes, más integración restante B11. B11 requiere revisión y aprobación humanas; no fue ejecutado automáticamente.
