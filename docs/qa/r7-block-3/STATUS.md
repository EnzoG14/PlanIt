# R7 · Bloque 3 — Imágenes en el chat de evento

**Corrección posterior, 16/10/2026:** el responsable detectó un 403 real de Storage. [Reparación y evidencia](storage-fix/README.md), [PR draft #82](https://github.com/EnzoG14/PlanIt/pull/82): migración incremental de preflight aplicada/verificada en planit-v2, sin debilitar la validación final. Falta desplegar `r7-media-validate` con aprobación separada. Las menciones inferiores a cero migraciones describen la entrega inicial #79 y quedan complementadas por esta corrección; el flujo integral continúa sin aceptación.

16/10/2026, Argentina. **Implementado; validación de interfaz con fixtures PASS; aceptación integral pendiente de transporte real y revisión humana.** Rama `codex/r7-block-3`, worktree `r7-block-3-worktree`, base limpia `cc4e70e89f03fed2162c5477af5a5c564ad83745` (`origin/main`, PR #78/B2, #75/B1 y #74/B0 integradas tras fetch). El pedido del responsable autoriza este bloque. Entrega técnica `1fcc491a4cb7b1e31a2208f2e2195f0e39e6bebe`, [PR draft #79](https://github.com/EnzoG14/PlanIt/pull/79). La PR no habilita el bloque siguiente ni acredita aceptación humana.

## Cambios y compatibilidad

- `src/features/events/chat.ts`: lectura paginada v2 y envío v2 con cuerpo opcional/file ID, comprobación del UUID devuelto, consulta autorizada del historial para reconciliar un envío incierto y errores de permiso/estado/RPC. Se conserva la función pública histórica `sendChatMessage` y su contrato v1. Normalización Unicode igual a B2, incluyendo U+0085; contador por puntos de código, máximo 2000.
- `src/pages/EventChatPage.tsx`: una imagen JPEG/PNG/WebP de hasta 5 MiB, validación de contenido/decodificación B1, preview, reemplazo y eliminación; imagen sola o con texto. Estados de preparación, subida/validación y commit separados. Reutiliza sin modificar los helpers B1 y su reserva/attestation. El upload por sí solo nunca agrega un mensaje ni anuncia éxito.
- El bloqueo síncrono evita doble submit. Un fallo de upload conserva `MediaAttempt` y su UUID/path. Un resultado incierto del commit congela texto/imagen; **Consultar estado** recorre la RPC v2 y valida autor/body/file. Sólo una ausencia consultada habilita repetir los mismos IDs. Un commit confirmado tras perder la respuesta se reconcilia sin volver a enviar. La subida no se borra como compensación de una respuesta incierta.
- Las imágenes se descargan por GET autenticado con JWT actual de la misma cuenta, `fetch` con `cache: no-store` y cabecera `Cache-Control: no-store`; no hay URLs públicas/firmadas. Se decodifican únicamente imágenes que intersectan el historial visible; caja con dimensiones estables para evitar saltos de scroll. Blob URLs se revocan al salir del viewport, ocultar pestaña, offline, desmontar, cambiar cuenta/token, fallar o agotar 15 s de descarga. La visualización vence a los 30 s y ofrece **Ver imagen** para consultar permisos nuevamente. Este plazo es de memoria del cliente, no cambia la persistencia del chat ni pretende borrar copias ya descargadas.
- Conserva marcadores, cursores `(created_at,id)`, lookahead 51, ancla de paginación, deduplicación Realtime, foco/visibility reconnect, revalidación de cabecera cada 30 s y `chat_read_only`. La sincronización en segundo plano no deshabilita el submit entre pointerdown/click; la RPC sigue validando membresía y estado al confirmar.
- `src/pages/chat.css`: estilos de adjuntos/compositor acotados a evento, con tokens `--pi-*`. Se inspeccionó el mockup original R7; se conserva la foto como parte del mensaje y la identidad Amanecer aprobada. Sin reacciones/audio ni cambios de navegación. DM sigue sólo texto; `EventDetailPage.tsx`, `src/App.tsx`, SQL, helpers B1 y SW intactos.

Decisiones utilizadas: D01/D02 (formato, límite e imagen sola), D13 (intento estable/commit/reconciliación), D15 y D17 (alcance y ownership); contrato B0 materializado por B1/B2. No se ratifican decisiones pendientes de otros bloques. El seguimiento de B3 se registra aquí: `RELEASE_7_STATUS.md` y la matriz consolidada pertenecen a B11 según el prompt/ownership.

## Evidencia por criterio y capa

| Criterio/caso | Estado | Evidencia y límite |
|---|---|---|
| RF-R7-01.CA-01 / R7-B3-TC-01 | PASS UI con fixtures | Selector único, imagen sola/texto+imagen, submit doble con una sola RPC; [resultados](ui/results.json) y snapshots. Regresión DM texto PASS. Roles reales organizador/confirmed y POST/JWT: NOT RUN. |
| RF-R7-01.CA-02 / R7-B3-TC-01 | PASS UI con fixtures | Carga → validación Edge → commit → lectura → GET → Blob → reabrir. Persiste sólo al recibir UUID de RPC o reconciliarlo. Persistencia/bytes remotos reales: NOT RUN. |
| RF-R7-01.CA-03 / R7-B3-TC-02 | PASS UI con fixtures | Dos archivos por evento DOM (picker nativo no permite múltiple), GIF, >5 MiB, bytes falsos; fallo upload/validación; offline; UUID/path estable; respuestas perdidas con/sin commit; cierre entre selección y envío. Sin mensaje fantasma. |
| RF-R7-01.CA-04 / R7-B3-TC-04 | PASS contrato/UI; HTTP real NOT RUN | Interceptación comprueba GET, JWT y no-store; GET denegado muestra error. Pérdida de autorización elimina imágenes y revoca URLs. No acredita RLS/Storage remoto. |
| R7-B3-TC-03 | PASS emulación; físico NOT RUN | 320/375/390/768/1280 px; texto computado duplicado, foco recuperado tras envío, alt, errores con alert/status, viewport de 420 px con preview y sin overflow horizontal. Reflujo de zoom desktop 200% emulado a 640×450 CSS px. Zoom nativo, lector de pantalla, teclado móvil físico y safe areas reales: NOT RUN. |
| Ciclo de vida de Blob | PASS UI con fixtures | Visible/on demand; expiración 30 s con reloj de navegador instalado antes de crear timers; hidden/offline/autorización revocada sin URLs vivas. Desmontaje por sesión/token implementado por key/cleanup; cambio de cuenta/token durante GET no ejercitado como caso independiente. |
| R2 texto/paginación/Realtime | PASS UI con fixtures | Texto, límite, ancla al cargar anteriores, llegada duplicada sin duplicar mensaje ni mover al lector. No se modifican `reconciliation.ts`/`realtime.ts`. Transporte WebSocket real: NOT RUN. |
| R5 DM | PASS UI con fixtures | [42 checks en 6 anchos](ui/regression-dm/ui-results.json), harness histórico sin cambios y metadatos corregidos por wrapper B3: texto, retry incierto, bloqueo, histórico, paginación, ráfaga/reconexión, offline/hidden y errores. Sin adjunto en DM. |
| R1/R3/R4/R6 | NOT RUN E2E | No se alteran sus dominios. R6 se conserva como baseline con GO humano, sin reabrir pendientes ni atribuirle una nueva validación. |
| Build | PASS | `npm run build`: TypeScript/Vite y generateSW, 86 entradas. Advertencia heredada por chunk grande de mapa. |
| Lint / diff | PASS | `npm run lint` sin errores; advertencias heredadas en fixtures documentales y DiscoveryFilters. `git diff --check` sin problemas. |
| PWA/SW/Push | Build PASS; runtime NOT RUN | Sin cambios SW ni caching. `runtimeCaching: []` inspeccionado. La suite UI bloquea Service Workers deliberadamente; prueba offline del formulario no equivale a instalación/update/offline app shell ni Push físico. |
| HTTP/JWT y Storage GET reales, Edge real | NOT RUN / gate de integración pendiente | B1/B2 registran pendientes de validación del transporte y validador Edge. Este bloque no despliega funciones ni crea cuentas/fixtures remotos. Deben verificarse autorizado/denegado y flujo completo en entorno acordado antes de aceptación integral. |

**RF-R7-01.CA-01..04 no se declaran PASS integral** por las pruebas interceptadas. Los 29 CA oficiales se conservan literalmente.

## Migraciones y entorno

| Migraciones de B3 | Creada | SQL local | Aplicada remota con aprobación | Verificada remota |
|---|---|---|---|---|
| Ninguna | 0 | No aplica | 0 | 0 |

B1/B2 son dependencias integradas con sus propias [marcas B1](../r7-block-1/STATUS.md) y [marcas B2](../r7-block-2/STATUS.md). No se repiten ni se presentan como ejecución de B3. Sin DDL remoto, db push, deploy, cron, secretos, merge ni edición de Google Docs. El proyecto histórico no se toca.

`.env.local` copiado byte a byte desde el worktree de main `mapbox-worktree`, igualdad comprobada sin exponer contenido, ignorado y no versionado. Los cambios ajenos del checkout original permanecen intactos. No se agregan dependencias ni se cambian package/lockfile.

## Reproducción

Desde el worktree de B3, con Node 24, Edge y Playwright disponibles:

```powershell
npm ci --ignore-scripts
npm run build
$env:PLANIT_PLAYWRIGHT_PATH='C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/check-r7-chat-ui.mjs
$env:PLANIT_CHAT_REGRESSION='dm'
node scripts/check-r7-chat-ui.mjs
Remove-Item Env:PLANIT_CHAT_REGRESSION
npm run lint
git diff --check
```

`check-r7-chat-ui.mjs` sirve el build en loopback y usa Auth/RPC/Storage/Edge/Phoenix explícitamente interceptados. No usa credenciales reales ni escribe a Supabase. **62 comprobaciones B3 PASS y 42 comprobaciones DM PASS**. `ui/results.json` guarda versión del navegador y hashes SHA-256 de los tres archivos de producción; `ui/before/` contiene capturas de la base con `PLANIT_CHAT_BASELINE=1`. Los medios son bitmaps sintéticos rotulados de prueba, no fotos extraídas del collage. En Windows el sandbox bloqueó inicialmente Edge/loopback y npm DNS; la ejecución autorizada local produjo los resultados finales. Se corrigieron esperas de test que confundían el texto del textarea con un mensaje y un reloj instalado demasiado tarde; la evidencia final corresponde al harness corregido. La duplicación del tamaño computado del texto ejercita los tokens en px, además de la emulación de reflujo; no se presenta el cambio de font-size raíz como ampliación efectiva ni como zoom nativo.

Capturas representativas: [preview 320](ui/preview-320.png), [texto+imagen 390](ui/text-image-390.png), [chat 1280](ui/chat-1280.png), [texto duplicado 320](ui/text-200-320.png), [teclado emulado 390](ui/keyboard-height-390.png), [GET denegado](ui/image-denied-390.png), [sólo lectura](ui/readonly-390.png). En una repetición del harness DM histórico falló intermitentemente el conteo inmediato de escrituras (3 frente a 4, tras reintento; [captura](ui/regression-dm/intermittent-write-count.png)); se conservó el código histórico y se repitió la suite completa, **42/42 PASS**. No se atribuye ese intento fallido a una verificación remota ni se reabre R5.

Documentación técnica consultada: [descarga Storage autenticada](https://supabase.com/docs/reference/javascript/storage-from-download), [invocación Edge](https://supabase.com/docs/reference/javascript/functions-invoke).

**Gate humano:** revisar la PR de B3 y su accesibilidad, completar transporte real/Edge y pruebas físicas pendientes según aceptación. Cualquier despliegue remoto necesita permiso separado. No se inicia ningún bloque siguiente ni se fusiona la PR.
