# R7 · Bloque 5 — Publicador y visor de historias

17/10/2026, Argentina. **IMPLEMENTADO / UI local PASS / integración y seguridad remotas pendientes.** Sólo B5; ningún bloque posterior iniciado.

Base `origin/main` tras fetch: `9d3117dd3c45b12dcae75f5d7f536a99e8a691d2`. Rama nueva `codex/r7-block-5`, worktree `r7-block-5-worktree`. B4 integrado por PR #83 (`1364e21`), B1/B2/B3 y correctiva #82 presentes; B10 #81 también integrado en la base. Checkout original con cambios ajenos preservado. `.env.local` copiado desde `mapbox-worktree` (main), ignorado y fuera del commit. PR draft: pendiente de creación al preparar este reporte.

Leídos prompt, plan y estado R7 antes del cambio; contratos/acta B0, decisiones/ownership, RF/CA, aceptación y plan QA; instrucciones raíz/src/diseño/Supabase, PRODUCT/DESIGN, arquitectura/modelo, sistema/workflow visual y referencias del refresh. `UI_WORKFLOW.md` raíz no existe: se consultó `docs/design/UI_WORKFLOW.md`. R6 conserva su aceptación humana como baseline, sin abrir correcciones. Mockup original `release-7.png` inspeccionado y conservado: se mantiene publicador/entrada/secuencia; no se implementan texto, música, stickers, likes ni reacciones dibujadas fuera del contrato. Apariencia según Amanecer vigente.

## Implementación y contrato para B11

Entrada exportada desde `src/features/events/stories/EventStoriesEntry.tsx`:

```tsx
<EventStoriesEntry
  eventId={event.id}
  returnTo={`/events/${event.id}`}
  permissions={{ can_read_stories: canReadStories, can_publish_story: canPublishStory }}
/>
```

Requiere el `AuthProvider` existente y tokens globales. `returnTo` conserva la firma B0; esta variante inline no navega ni interpola ese string en enlaces: cerrar restaura el foco y mantiene la misma ficha/scroll. B11 es único dueño de insertarla en la ficha y del routing. **`src/App.tsx` y `EventDetailPage.tsx` no cambian.** Ninguna ruta nueva desprotegida.

- `EventStoriesEntry`: carrusel horizontal de autores, cantidad real de historias, orden de la RPC y apertura en la primera historia del autor dentro de ese orden; paginación por cursor y revalidación de las páginas cargadas. Vacío, carga, error/reintento y evento sin permiso de publicación son estados distintos. Los permisos recibidos son UX; RPC/Edge autorizan cada operación.
- `StoryPublisher`: exactamente una imagen, MIME/tamaño/magic bytes/decodificación mediante B1, preview y descarte sólo local. Pipeline existente `createMediaAttempt`/`uploadEventMedia`; estado subiendo/validando y confirmando RPC. UUID de historia/reserva/archivo invariables durante retry; tras upload confirmado sólo se repite la RPC B4. Sin éxito optimista, sin borrar objetos ante resultado incierto, sin persistencia del formulario. El servidor rechaza cierre/remoción concurrentes.
- `StoryViewer`: dialog nativo a pantalla completa clara, imagen íntegra, autor/fecha AR, segmentos/progreso y anuncio «Historia N de M». Avance de 5s configurable (`durationMs`, mínimo efectivo 1s), anterior/siguiente por extremos de imagen, botones y flechas, Escape/cierre y final de secuencia. Pausa explícita persistente entre historias, mantener pulsado, carga/error, foco fuera y reduced motion. Con reduced motion inicia detenido; Reanudar es opt-in explícito. No se agrega swipe.
- Blob autenticado on-demand con lector B4, sin signed/public URLs, caché persistente ni cambios SW. Fetch abortado y URL revocada en cambio de historia, retry, cierre, desmontaje/cambio de evento/cuenta/token o vencimiento. Al ocultar la pestaña se cierra el visor y se descarta contenido; al volver/foco/online se reconsulta autorización. El publicador se descarta al ocultar; un upload ya iniciado puede terminar, pero no inicia la RPC tras desmontaje.
- Caducidad UI: `expires_at - server_now` con offset AR explícito y `performance.now()`, descontando conservadoramente latencia de la consulta. No depende de `Date.now()`. Barrido 100ms; GET siempre tiene el gate servidor B4. Revalidación visible cada 15s elimina contenido al fallar o desaparecer de la lista; revocación de bytes ya descargados no es instantánea por transporte. Nuevos GET deben denegarse inmediatamente en servidor. No se presenta polling ni revocación de Blob como prueba de permisos reales.

D01, D03, D05, D10, D13, D15, D17 y propuesta técnica D16 (5s) aplicadas. Decisión B4 de conservar historias hasta 24h tras fin/cancelación/archivo se respeta: lectura no se corta por `can_publish_story=false`. No cambia contrato, identidad visual, tipos de fecha, migraciones, API B4, Storage, Auth ni PWA.

## Evidencia y estados por capa

| Caso/capa | Resultado | Evidencia y límites |
|---|---|---|
| Build y lint | PASS | `npm run build`, `npm run lint`; avisos anteriores en probes/DiscoveryFilters y chunk Mapbox. Cero avisos nuevos en componentes B5. Vite no integra el entrypoint hasta B11; TypeScript comprueba los archivos nuevos y el runner Vite carga sus módulos reales. |
| R7-B5-TC-01 | PASS UI parcial / HTTP real NOT RUN | Entry sólo con sesión/permisos; fixture de denegación y cambio de cuenta. A/B frente C/D/E/F/anon, publicación y GET reales requieren JWT/fixtures remotos autorizados. |
| R7-B5-TC-02 | PASS UI parcial | Vacío, consulta denegada/retry, expiración con visor abierto y reloj local alterado, cambio de cuenta y retiro de permiso de entrada. Unlisted/autor removido/cancelado en servidor: NOT RUN aquí. |
| R7-B5-TC-03 | PASS emulado parcial | 320/375/390/768/1280, teclado izquierda/derecha/Tab/Escape, foco restaurado, Blob liberado, reduced motion. Misma ficha sin cambios de historial. Zoom nativo 200%, lector de pantalla, touch/safe areas/teclado físico móvil: NOT RUN. Integración con navegación real de ficha: B11. |
| R7-B5-TC-04 | PASS UI | Storage/validación simulados exitosos y RPC fallida: no éxito; retry usa exactamente los mismos argumentos y no repite upload confirmado; éxito sólo tras ACK exacto. |
| TC-S1 | PASS UI | Tres historias/autores alternados, avance explícito bajo reduced motion, continuidad entre historias, última cierra, flechas y retorno de foco. |
| TC-S2 | PASS UI parcial | Pausa mantener pulsado y manual detienen progreso; Tab queda en dialog, reduced motion no avanza solo; GET imagen denegado muestra error y botón de reintento funciona con puntero. Browser visibility/foco fuera e imagen lenta implementados por inspección, sin caso automatizado separado; lector de pantalla y gesto físico NOT RUN. |
| TC-S3 | PASS TTL UI parcial / remoto NOT RUN | Fixture de servidor a 1s de vencimiento, `Date.now=()=>0`, visor desaparece y Blob revocado; GET temporal/remoción/cierre real pendientes. |
| API B4, regresión local | PASS, 3 grupos | [Resultados](api/results.json): ACK/idempotencia/errores, cursor/abort/aislamiento evento, descarga no-store/cambio de sesión/403/bytes inválidos. Se ejecuta código TS real con Supabase/fetch simulados; no prueba RLS. |
| Seguridad, SQL/concurrencia y regresiones R1–R6 E2E | NOT RUN en B5 | No SQL cambiado. Evidencia SQL B4 permanece en su carpeta; no se convierte en un test ejecutado en B5. |
| SW/offline, Push y dispositivos | NOT RUN | Sin cambios SW; build conserva 86 entradas de precache. No se acredita caché/offline por compilar. |
| Revisión visual | ship, alcance aislado | Revisor independiente `impeccable_finish_reviewer`: inspección de 15 capturas y código, sin hallazgos materiales. Detector mecánico `[]`. [Acta](review.md). |

RF-R7-02.CA-01..04 y RF-R7-03.CA-01..04: **implementación de presentación entregada, aceptación integral pendiente de integración B11 y permisos/GET reales**. No se marcan los 8 CA PASS sólo por las fixtures.

[Resultados reproducibles UI](ui/results.json), con hashes SHA256 de fuentes; 13 grupos PASS. Capturas `ui/entry-{320,375,390,768,1280}.png`, `ui/viewer-*.png`, `ui/publisher-*.png`: datos sintéticos rotulados e HTTP/Auth/Storage interceptados, nunca contenido de usuarios ni credenciales. La superficie es nueva: no existía una UI anterior de historias que comparar; ficha/routing vigentes se preservan byte a byte.

### Migraciones: cuatro marcas

| Alcance B5 | Creadas | SQL local | Aplicadas remotamente con aprobación | Verificadas remotamente |
|---|---|---|---|---|
| Ninguna migración nueva | 0 | N/A | 0 | 0 |

El acta B4 registra su migración aplicada/verificada, pero lector `r7-story-image` sin deploy en ese corte. **No se inspeccionó ni alteró el remoto en B5.** Habilitar visualización real requiere comprobar/desplegar ese lector con permiso separado y ejecutar pruebas reales. No se modificó proyecto histórico.

## Reproducción

```powershell
npm ci --ignore-scripts
npm run build
npm run lint
node scripts/check-r7-stories-ui.mjs
git diff --check
```

El runner requiere Edge y Playwright disponible en el runtime de Codex o `PLANIT_PLAYWRIGHT_PATH` absoluto. Crea `.r7-stories-ui.local/` ignorada, sirve el componente real con Vite, intercepta todas las solicitudes Supabase y sólo produce evidencia local bajo esta carpeta. No añade dependencia de producto ni modifica wiring. API: ejecutar `scripts/check-r7-stories-client.mjs` redirigiendo su carpeta de salida literal `docs/qa/r7-block-4/client` a `docs/qa/r7-block-5/api` en una copia temporal `.local`; se conserva el runner original.

El primer intento de Edge dentro del sandbox no pudo arrancar; ejecución local autorizada fuera del sandbox PASS. Pruebas iniciales descubrieron apertura en última historia del autor y reinicio de pausa entre historias; corregidos y suite final PASS. La selección accesible del publicador recibió nombre explícito. La captura de puntero excluye botones para no interceptar Reintentar imagen; caso negativo de GET y recuperación añadido.

## Gate y seguimiento

Este archivo actualiza el seguimiento propio de B5 conforme al prompt/ownership. **B11 consolida `RELEASE_7_STATUS.md`**, cuyas filas históricas aún muestran bloques pendientes; no se reescribe desde un frente paralelo. Revisar PR draft y UX. Validación JWT/Storage/Edge real y composición de ficha siguen pendientes; ningún deploy, DDL remoto, cron, secreto, merge ni Google Doc modificado. No se ejecutó B6 ni B11. Próximo bloque sólo con aprobación humana expresa.
