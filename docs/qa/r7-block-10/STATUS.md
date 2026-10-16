# Release 7 · Bloque 10 — Estado de entrega

16/10/2026, Argentina. **Implementación local verificada; pendiente revisión de PR y validación remota/física.** No representa aceptación completa de RF-R7-07 ni habilita ejecución de B11.

- Base limpia `origin/main`: `9d917a4765e713b1adc4f75f89a7d6b4b57c8a25`, con PR #80/B9 integrada.
- Rama: `codex/r7-block-10`; worktree: `C:/Users/enzog/planit-worktrees/r7-block-10`.
- `.env.local` copiado desde main e ignorado; sin contenido ni valores en Git/evidencia. CodeGraph inicializado con índice propio.
- PR draft: pendiente de registrar tras creación.
- Decisiones: D08 (preview real con opt-out) y D09 (Edge/cola/cron separado) confirmadas previamente; **D12 adoptada expresamente por el responsable en esta conversación**, incluyendo los parámetros y cron propuesto. El pedido actual autoriza implementación y PR, sin permisos remotos.
- El seguimiento global conserva su fotografía histórica; la consolidación de `RELEASE_7_STATUS.md` corresponde exclusivamente a B11.

## Cambios y compatibilidad

Migración nueva `20261016154257_r7_push_jobs.sql`, worker `supabase/functions/r7-push/` con dependencia Edge fijada y lock, dos scripts de verificación y este directorio QA. Cola privada con dedupe, leases, backfill, expiración y retención; trigger aislado de la transacción interna; cinco RPC service-only; cifrado/VAPID y respuesta operacional sin contenido privado. [Contrato, catálogo, reproducción y operación](README.md).

No se modificaron frontend, UI Amanecer, SW B9, Vite, migraciones históricas, productores DM/follow/event_full, políticas de Storage ni contratos R1–R6. No se agrega timezone, cache privada, suscripción automática o aviso por chat grupal. Las únicas APIs nuevas son del worker, sin EXECUTE para anon/authenticated y sin acceso directo a la tabla operativa. Storage: no aplica a B10. Fechas propias sin zona, horario Argentina.

## Evidencia por capa

| Caso/capa | Estado | Evidencia y límite |
|---|---|---|
| R7-B10-TC-01 · productores/SQL | PASS local | [11 grupos SQL](sql/sql-results.json): un aviso DM y dos jobs de dispositivos; retry idempotente; tercero excluido; productor grupal sin aviso/jobs; follow_request y event_full existentes |
| R7-B10-TC-01 · recepción de browser/SO | NOT RUN | No se desplegó ni envió a un proveedor real; requiere autorización y configuración remota |
| R7-B10-TC-02 · concurrencia/errores SQL | PASS local | Dos conexiones concurrentes y SKIP LOCKED, lease perdido, ACK obsoleto, dedupe terminal, 404/410 por revisión y dispositivo, 429, timeout, cinco intentos, todos los backoffs, expiración, retención y backfill tras error de trigger |
| R7-B10-TC-03 · privacidad/ACL | PASS local | Propietario derivado por joins; preview DM real, opt-out, bloqueo y mensaje eliminado genéricos; archivo de evento retira título/destino; seis superficies de acceso denegadas a anon/authenticated/identidad ausente; cola sin columnas privadas |
| R7-B10-TC-03 · SW/offline/clic | PASS sintético | [4 pruebas SW](sw/sw-results.json), Edge headless sobre build de producción: registro, precache, cero Supabase en caché, recarga offline, payload sanitizado y clic seguro. No equivale a Push físico ni sesión remota |
| R7-B10-TC-04 · Edge local | PASS | [Deno check + 9 tests](edge-results.json): fallo seguro de VAPID/configuración, rechazo de invocadores, clasificación de estados, SSRF/redirect, ACK perdido y topes por invocación |
| Cifrado y firma | PASS local | aes128gcm generado y descifrado con claves efímeras del receptor; firma VAPID ES256 verificada con Web Crypto, audience y subject correctos. HTTPS/RPC simulados |
| Regresión B9 | PASS local | [13 grupos SQL](subscriptions/sql-results.json) + derivación determinista de IDs: alta/baja, owner-only, privacidad, validación P-256, carreras y bandeja. La etiqueta heredada dice 39 migraciones; el inventario contiene 41. Ejecución anterior al ajuste final de selección de jobs B10; suite B10 final reproduce íntegramente la migración final |
| Build | PASS | `npm run build`: TypeScript, Vite y `injectManifest`; SW producido y probado |
| Lint | PASS con advertencias previas | `npm run lint`: sin errores; advertencias históricas en probes y `DiscoveryFilters.tsx`. Lint dirigido a archivos B10: sin errores ni advertencias |
| UI 320/375/390/768/1280 | No aplica / NOT RUN | B10 no cambia UI. No se heredan capturas B9 como nuevas pruebas B10 |
| HTTP/JWT real, cron/Vault, Edge desplegada | NOT RUN | Pruebas locales usan roles SQL y Request estándar; no sustituyen gateway, tokens Auth ni operaciones reales en Supabase |
| Android/iOS/escritorio Push real | NOT RUN | Requiere hardware/navegador, HTTPS, suscripciones y despliegue autorizado; iOS requiere PWA instalada compatible |

## RF/CA y regresión

- **RF-R7-07.CA-02:** implementación y pruebas locales PASS: mismo aviso, tres productores congelados, chat grupal excluido, jobs por dispositivo. Recepción real NOT RUN; CA global sin aceptación final.
- **RF-R7-07.CA-04:** errores no borran/duplican la bandeja; encolado roto se recupera; aceptación del proveedor y ACK se distinguen. SQL/Edge local PASS; proveedor/infraestructura real NOT RUN.
- **CA-01/03/05:** compatibilidad B9 verificada en SQL y SW; baja individual preserva historial. Opt-in, denied y recepción con interfaz integrada/dispositivos corresponden a B9/B11 y quedan NOT RUN aquí.
- R1–R6: replay limpio de **41 migraciones**, con registro/cupo de R1, chat y bandeja R2, cancelación/archivo R3, controles de acceso conservados R4, DM/follow/bloqueo R5 y productor event_full R6 ejercitados. No se declara una regresión funcional completa R1–R6 ni se abren pendientes de R6.

## Migración: cuatro marcas

| Migración | Creada | Probada local | Aplicada remota con aprobación | Verificada remota |
|---|---|---|---|---|
| `20261016154257_r7_push_jobs.sql` | Sí | PASS, 41 migraciones desde cero / PostgreSQL 17.5 | No | NOT RUN |

No se aplicó DDL remoto, configuraron secrets/Vault, instaló cron, desplegó Edge, modificó Google Doc ni fusionó a main. Proyecto histórico sin modificaciones.

## Riesgos y siguiente gate

Pérdida de ACK puede causar reenvío; no se promete exactly-once, mostrado ni leído. Cambios de permiso posteriores a la preparación del envío y previews ya entregadas no pueden revocarse retroactivamente. La allowlist de proveedores del transporte es deliberadamente estricta; un endpoint de otro proveedor termina de forma segura y requiere revisión técnica. El tope es por invocación y no sustituye controlar cron/credenciales y costos. Monitorización y SQL/Vault/cron remotos están propuestos en README, sin activación.

Gate de entrega: revisión de esta PR draft. Gate de producción: autorización separada de migraciones/secrets/deploy/cron en `planit-v2` y pruebas de recepción/dispositivos, con integración de settings/routing B11. B11 requiere revisión y aprobación humanas; no fue ejecutado automáticamente.
