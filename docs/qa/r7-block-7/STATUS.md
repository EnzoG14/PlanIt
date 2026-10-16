# R7 B7 — Calendario personal

16/10/2026 · **Implementado; QA integrada y aceptación humana pendientes.**

## Alcance y autorización

El responsable confirmó que corresponde `RELEASE_7_BLOCK_7.md` (no el prompt R6 inicialmente nombrado), aprobó el plan e indicó implementarlo. Autorizó para eventos ocultos exportar título, horarios y ubicación **con confirmación previa en cada acción**, sin enlaces/tokens. Esta autorización es específica de B7; no firma B0 completo ni habilita otros bloques.

Base actualizada: `5adf8e455c90d46adc0f5477c5d3e9ee06eb2461`, PR B0 #74 integrada. Rama `codex/r7-block-7`, worktree `C:/Users/enzog/planit-worktrees/r7-block-7`. Implementación/evidencia: consultar el commit productor en la PR; HEAD de entrega y URL quedan en el reporte de cierre y el historial de la PR. `.env.local` copiado byte a byte de main, ignorado, no versionado ni impreso. CodeGraph propio inicializado; sync puntual porque el estado siguió mostrando altas pendientes sin refresco automático.

D06 se conserva: ICS + template Google, sin OAuth ni sincronización. DTO/ownership D17 adoptados sólo para B7 por el plan aprobado. R6 se considera baseline estable; sin correcciones de otras releases. Se conserva PRODUCT/DESIGN Amanecer; Impeccable context y craft-floor leídos. Sidecar de diseño señalado desactualizado por context: no reparado fuera de alcance.

## Entrega y contrato para B11

- `calendar.ts`: exporta `EventIntegrationV1`, `calendarInstant`, `createEventCalendar(event, now?)`, `eventGoogleCalendarUrl(event)` y `downloadEventCalendar(event)`. DTO: id/title/starts_at/ends_at/location_name/address/visibility/state, igual al contrato B0. No nueva consulta/RPC ni dependencia de producción.
- `EventCalendarAction({event})`: dos acciones con estilos Amanecer autónomos incluso fuera del shell; confirmación modal nativa para ocultos, cancelar/Escape/foco de retorno, feedback neutral y errores recuperables. Cambiar el DTO descarta confirmaciones/avisos previos. Los helpers puros no piden consentimiento: el componente es la frontera de interacción.
- B11 debe construir el DTO mediante selección explícita desde `loadEvent/EventRecord` autorizado; derivar `state` con las reglas existentes, montar sólo cuando el detalle siga permitido y **remontar/retirar al cambiar sesión/token o perder acceso**. No requiere inscripción si el detalle es visible. No pasar el objeto completo ni listas privadas; ningún booleano cliente concede permiso servidor.
- B11 importa `EventCalendarAction` desde `src/features/events/EventCalendarAction.tsx`; mantiene revalidación actual del detalle y conecta la acción. No se modificaron `EventDetailPage.tsx`, `src/App.tsx`, helpers compartidos de fechas, share ni seguimiento global R7.
- Las fechas sin zona son wall-clock AR: offset explícito -03:00, coherente con `formatEventTime`; nunca se interpreta la zona del equipo. Se admiten timestamps SQL con espacio/T y fracciones; exportación con precisión de segundos, rechaza fin no posterior al inicio a esa precisión. La exportación es una copia de datos autorizados; no agrega una política nueva por estado del evento.
- ICS: CRLF, escape TEXT, fold <=75 octetos UTF-8 sin dividir caracteres, UID estable UUID@planit.invalid (namespace reservado, no enlace), DTSTAMP UTC inyectable, ubicación sin duplicación. Sin descripción, URLs, invitados, contactos ni campos extra. Google: origen fijo, URLSearchParams, dates UTC, stz/etz IANA, sólo título/ubicación.
- Descarga con MIME `text/calendar;charset=utf-8`, filename sólo UUID y revocación de URL al segundo, incluso al fallar click. Google se abre con `noopener,noreferrer`; no se afirma éxito por el retorno de window.open (puede ser null incluso con apertura correcta). No se solicitan permisos web que estas acciones no necesitan.

## Evidencia y pruebas

| Capa | Estado | Evidencia / límite |
|---|---|---|
| Generador / parser independiente | PASS | `unit/results.json`: 5 grupos con aserciones; ical.js 2.2.1 temporal, fuera de dependencias de producto |
| Zonas horarias | PASS | Procesos AR/UTC/Tokyo/Nueva York/Madrid; navegador Tokyo; cruces de día/mes/año, bisiesto, fechas inválidas |
| UI aislada real | PASS | `ui/results.json`: 41 comprobaciones; Edge headless, StrictMode, 320/375/390/768/1280, capturas reales de fixture |
| Descarga de navegador | PASS | Archivo real `ui/browser-download.ics`; nombre/fechas/contenido, URL liberada, fallos y retry |
| Teclado / texto | PASS parcial | Foco inicial y retorno, Escape, Tab entre acciones, outline 3px, texto del componente al 200%; no es zoom nativo del navegador |
| Google URL y acción | PASS local | Parámetros exactos + window.open instrumentado; esto no acredita editor externo |
| Google editor real | BLOCKED | `google/attempt.json`: HTTP 200 redirige a sitio informativo Workspace en navegador sin sesión; precarga no verificada. Sin login ni guardado |
| Importación cliente calendario real | NOT RUN | Parser y descarga no sustituyen importación/confirmación en cliente final |
| Build / lint | PASS | `build.txt` / `lint.txt`; lint conserva avisos preexistentes, ninguno de archivos B7. Advertencia de chunks existente |
| Regresiones fechas/eventos | PASS | `events-regression.txt`, suite existente sin PostgreSQL |
| Regresión reconciliación/Realtime | PASS simulada | `realtime-regression.txt`; no acredita entrega remota |
| HTTP/JWT/RLS/Storage, SQL, SW/offline, dispositivos/lector/zoom nativo | NOT RUN | No cambios en esas capas; emulación no acredita hardware, permisos o QA integrada |

La primera ejecución UI se detuvo por selector de arnés: `getByRole('status')` excluye el aviso vacío oculto. Se corrigió a locator explícito del aviso. `ui/first-attempt-results.json` conserva la ejecución parcial; la segunda completó 41 checks. No fue un defecto de autorización ni un PASS completo de esa primera ejecución.

Migraciones: **0 creadas / SQL local NOT RUN / 0 aplicadas remotamente / 0 verificadas remotamente**. Ninguna modificación DB/RPC/ACL/triggers/Storage/SW, deploy, secretos, Google Doc, merge o calendario externo guardado. Sin benchmark SQL porque no cambia SQL. No se ejecutó regresión integral R1–R6: sólo las dos suites locales indicadas.

## RF/CA y gate

| Criterio | Estado B7 | Pendiente integrado |
|---|---|---|
| RF-R7-05.CA-01 | Componente probado aisladamente | B11: acción desde detalle real autorizado |
| RF-R7-05.CA-02 | PASS local en parser y archivo descargado | Confirmación en cliente representativo |
| RF-R7-05.CA-03 | PASS local de consentimiento/cancelación, sin permisos ficticios | Validación de flujo y plataforma final |
| RF-R7-05.CA-04 | PASS del archivo; cliente/Google NOT RUN/BLOCKED | Importación externa y precarga real |

No se marca cerrado RF-R7-05 ni se actualiza aceptación final R7. Entrega lista para revisión técnica; B11 integra y consolida `RELEASE_7_STATUS.md`. Gate humano de integración/aceptación pendiente; no se fusiona ni continúa otro bloque.
