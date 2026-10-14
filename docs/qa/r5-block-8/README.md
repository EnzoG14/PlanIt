# R5 · Bloque 8 — Mensajería privada

14/10/2026, Argentina. **Implementado; QA pendiente**. Base `0116fd30478dea8a6851b7a97cac518abded3925`, rama `codex/r5-block-8`, [PR #58 en borrador](https://github.com/EnzoG14/PlanIt/pull/58), implementación `fbb38f2d0565efd96269371dfac1babb61fbca78`; B0–B7 integrados (#50–#57). Sólo RF-R5-07.CA-01..04 y comprobaciones relacionadas D01-B/D03-A/D05-A. Sin merge, deploy, DDL remoto, edición Google Docs ni controles nuevos B9.

## Contrato y decisiones

`/me` abre `/messages`; el perfil ajeno disponible permite iniciar DM aun siendo privado y sin follow. `/messages/:conversationId` valida `kind=direct` y membresía con SELECT RLS de `user_low_id,user_high_id`; un UUID de chat de evento no sirve. Regreso al origen validado, sin quinto tab primario. La bandeja usa orden de creación descendente, no actividad ni contadores de no leídos. Páginas de30 con cursor servidor+UUID; historial ascendente al mostrar, anteriores paginados y ancla de desplazamiento conservada.

Se reutilizan cuatro RPC B1 **sin cambiar firmas**: `get_or_create_direct_conversation(uuid) → uuid`, `list_direct_conversations(timestamp,uuid,integer) → conversations/next_cursor`, `get_direct_messages(uuid,timestamp,uuid,integer) → messages/next_cursor`, `send_direct_message(uuid,uuid,text) → uuid`. DEFINER sólo las dos mutaciones, `search_path=''`, EXECUTE authenticated y sin anon. Reintentos automáticos del SDK desactivados para mutaciones. Identidad y autorización derivadas por servidor, no por parámetros de actor.

Servicios TypeScript nuevos para apertura, bandeja, cabecera, mensajes, envío y conciliación por SELECT `id,sender_id,body,created_at` filtrado por conversación/UUID. Allowlist, tipos, tamaño30 y cursor/orden comprobados en cliente. Texto normalizado con los mismos espacios Unicode de SQL, 1–2000 caracteres; pendiente/error y UUID conservados en memoria. Un fallo no demuestra rollback: Consultar estado relee el efecto; ausencia permite reintentar **el mismo UUID/cuerpo**, nunca otro automático. Si la operación original aún estaba en vuelo, la idempotencia de BD evita duplicación.

Identidad sólo desde RPC social autorizada. Bloqueo bilateral retira nombre/username/avatar y deja historial con «Perfil no disponible» y compositor desactivado. El cliente nunca publica perfil histórico; reconsulta la cabecera tras leer mensajes. Servidor serializa create/send con block usando locks de perfiles en orden UUID. Reintento de efecto ya confirmado bajo bloqueo es lectura, no nuevo mensaje. Sin follow obligatorio, adjuntos, presencia, recibos de lectura o avisos DM; el chat grupal conserva permisos R4.

Realtime usa `subscribeToChanges`, `createReconciler` y `mergeRows` existentes: INSERT de messages filtrado por conversación, sólo invalidación (no render del payload). Relee desde más reciente hasta el límite histórico cargado, cubriendo más de una página y deduplicando IDs. Suscripción/reconexión/foco/online y respaldo visible30s; lecturas/escrituras con timeout10s. Al ocultar/offline se aborta la espera, elimina canal y limpia historial/cabecera. Abortar una escritura no garantiza cancelación en BD. Cambio de cuenta/token/ruta desmonta estado; no se persisten mensajes ni borradores.

## Matriz de amenazas y autorización

| Operación / columnas | Miembro A/B | Confirmed/grant-only/tercero | Bloqueado A/B | Anónimo |
|---|---|---|---|---|
| Abrir DM / UUID | Cualquier autenticado distinto, sin follow | Puede iniciar únicamente su propia pareja, no acceder a A/B | Apertura denegada; historial por ruta existente | EXECUTE denegado |
| Cabecera / low/high operativos | SELECT RLS propio, kind direct | A/B invisibles; un evento no concede DM | IDs operativos propios; sin perfil social | SELECT denegado |
| Bandeja / id,created_at,peer_id,read_only | Sólo conversaciones propias | Sólo las propias, sin facultades por evento/unlisted | Historial visible, proyección neutra | EXECUTE denegado |
| Historial/conciliación / id,sender_id,body,created_at | Sólo conversación propia | Lectura A/B denegada incluso con IDs conocidos | Lectura permitida, sin join profiles | Denegado |
| Envío / UUID y texto | Miembro sin bloqueo, sender=auth.uid() | Denegado sobre A/B; evento rechazado | Nuevo efecto denegado también concurrente | Denegado |
| REST INSERT/UPDATE/DELETE messages | Denegado; sólo RPC | Denegado | Denegado | Denegado |
| Realtime messages INSERT | RLS de conversación propia | Sin payload ajeno | Historial sigue autorizado; enviar no | Sin lectura |
| Perfil/avatar / mínimos sociales | Proyección según D02, firma existente | Ninguna ampliación por DM/evento/grant | Sin proyección/nueva firma | Denegado |

No email, birth_date, sex, files/path, tokens o credenciales en proyección DM, DOM, capturas o logs. IDs de conversación/autor/cursor son operativos. El catálogo remoto de sólo lectura confirma29 migraciones y publicación existente messages/notifications, sin agregar tablas, políticas o grants: [catálogo](remote/catalog.json). No equivale a prueba de entrega autenticada Realtime.

## Pruebas y evidencia

| Caso | Resultado y entorno | Evidencia |
|---|---|---|
| CA01: no follow, pareja única A→B/B→A, bloqueo/historial/unblock | PASS SQL local + UI fixture | [SQL](sql/sql-results.json), [UI](ui/ui-results.json) |
| CA02: autor, persistencia/retorno, pending/error y UUID retry | PASS SQL local + UI fixture | Mismos resultados; conciliación sin reenviar al confirmar |
| CA03: orden servidor+UUID, empates30+6, separación event/direct | PASS SQL local + UI fixture | SQL36 mensajes; UI30+4 y ráfaga66 mensajes |
| CA04: tercero/anon/escritura forjada y RLS directo | PASS SQL local; HTTP anon4/4 | [HTTPS real sólo lectura](remote/http-anon.json) |
| Bloqueo contra envío y creación simultánea | PASS13 carreras heredadas B1, wait_event_type=Lock observado | [Harness](sql/harness.json) |
| Confirmed/grant-only/unlisted no amplía social; chat grupal intacto | PASS SQL local | SQL B1 reproducida con29 migraciones |
| Realtime, duplicados y catch-up >30 | PASS WebSocket/REST simulados en build real | UI, no prueba RLS remota |
| R1–R4 | PASS13 suites SQL existentes | [Resultados](regressions.json) |
| Perfiles sociales | PASS54 grupos UI existentes | [Regresión B3](regression-ui/profile/ui-results.json) |
| Solicitudes de seguimiento | PASS78 grupos UI existentes | [Regresión B7](regression-ui/requests/ui-results.json) |
| Comprobación final de integración | PASS7 grupos en390px sobre build final | [Smoke final](final-smoke/ui-results.json) |
| Build/lint | PASS, avisos históricos | [Build](commands/build.log), [lint](commands/lint.log) |
| HTTP JWT autenticado/Realtime real/Storage y dispositivos | NOT RUN | Sin sesiones/escrituras remotas autorizadas para fixtures |
| Aceptación humana de los4 CA | NOT RUN | Estado Implementado; QA pendiente |

SQL: PostgreSQL17.5 local efímero y SET ROLE authenticated/anon con scaffold Auth/Storage, **no** stack Supabase ni JWT real. UI: Edge headless con fixtures de sesión/REST/WebSocket, seis tamaños320/360/375/390/768/1280 y42 grupos PASS. [33 CA originales](source.json) conservados, sin renumerar ni atribuir aceptación integral.

### Diseño, accesibilidad y límites

Amanecer Operate existente, fuente autoalojada, tokens centrales y patrones de chat; entrantes blancas/salientes tinta, envío azul y foco3px. Se verificó visualmente bandeja/chat móvil; capturas de aplicación ejecutada [bandeja390](ui/inbox-390.png), [historial390](ui/history-390.png), [bloqueado390](ui/blocked-390.png), [bandeja1280](ui/inbox-1280.png), [historial1280](ui/history-1280.png), vacío/error/resultado incierto en el mismo directorio. Sin baseline preimplementación nuevo; capturas nuevas no se presentan como antes/después. Mockups/DESIGN/tokens intactos; sidecar desactualizado no regenerado.

Automatizado: navegación y foco de regreso a perfil propio, teclado, 200% de raíz tipográfica, altura400, texto largo, limpieza offline/oculto, estados y ausencia de overflow horizontal. No equivale a teclado móvil/lector de pantalla/dispositivo reales, ni medición exhaustiva de contraste o texto200% nativo. Revalidación de bloqueo puede demorar30s más latencia; la BD impide envíos nuevos mientras la UI todavía no conoce el bloqueo. Avatar conserva ventana residual60s aprobada C03. No se promete revocación instantánea de bytes descargados.

La inspección corrigió un token de radio inexistente. Pruebas funcionales detectaron reintentos del SDK y un clic perdido cuando refrescar por foco deshabilitaba Enviar; se desactivaron retries de mutaciones y el refresco ya no deshabilita ese botón. El servidor revalida cada envío. La prueba heredada B3 instalaba el reloj después de crear timers; se movió antes de navegar sin relajar expectativas. El sandbox inicial negó loopback/Edge; las ejecuciones finales autorizadas fuera del sandbox pasaron.

## Reproducción y entrega

```powershell
npm run build
npm run lint
npm run check:r5:messages
npm run check:r5:messages:ui
npm run check:r5:messages:http
$env:PLANIT_SQL_OUTPUT='docs/qa/r5-block-8'
node scripts/check-r5-regressions.mjs
$env:PLANIT_UI_OUTPUT='docs/qa/r5-block-8/regression-ui/profile'
node scripts/check-r5-profile-ui.mjs
$env:PLANIT_UI_OUTPUT='docs/qa/r5-block-8/regression-ui/requests'
node scripts/check-r5-requests-ui.mjs
```

La configuración `.env.local` existente en main se conserva en el mismo checkout al crear la rama; ignorada y no versionada, sin imprimir contenido. No se creó otro worktree ni se copiaron índices CodeGraph. Producto: dos páginas DM/CSS, servicio tipado, disparador e integración mínima de router/layout/perfiles. Runners nuevos SQL/UI/HTTP y corrección de reloj del harness B3; scripts npm sin dependencias/lockfile nuevos. [Manifiesto](manifest.json) enumera archivos y hashes.

Migraciones nuevas **creadas0 / probadas local0 / aplicadas remotas0 / verificadas remotas0**. El replay de29 existentes y la lectura de catálogo no son aplicación remota. PR en borrador hacia main, detenerse para revisión humana. Revisar retry/locks, aislamiento de sesión, historia bloqueada, flujo de retorno y límites de fixtures. Siguiente bloque B9 requiere instrucción independiente; D04 Google Docs sigue pendiente de autorización separada.
