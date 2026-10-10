# R2 — BLOQUE 2: chat por evento

Implementado; QA pendiente. Base `18457eac3fb1cfe8b33a875c55c620df4bf3d607`; rama `codex/r2-block-2-event-chat`. Ninguna migración aplicada remotamente.

## Contrato y seguridad

Ruta `/events/:id/chat`, protegida por Auth y autorización PostgreSQL; enlace desde detalle sólo para organizador/confirmed. Una conversación por evento, backfill ON CONFLICT y trigger al publicar. kind restringido a event: R5 debe ampliar CHECK y autorización para direct, sin DMs actuales.

Organizador y confirmed leen incluso ended/cancelled/archived; cancelled/removed no leen. Retirarse revoca también historial conforme al plan. RLS + grants mínimos, sin INSERT/UPDATE/DELETE del cliente. Definer justificado para locking y proyección social privada: sólo display_name/username, identidad auth.uid(), search_path vacío, sin SQL dinámico y EXECUTE sólo authenticated. No se abre SELECT de profiles.

Envío de texto trim 1–2000 caracteres Unicode; rechaza blancos ASCII/Unicode. Lock evento y luego participación; READ COMMITTED y reloj posterior al lock. UUID cliente conservado en memoria para reintentar el mismo texto sin duplicar. Tras cierre sólo puede devolver el resultado ya persistido al mismo emisor/evento/texto. Cambiar texto tras resultado incierto es otro envío; no se promete deduplicación tras recargar o entre pestañas.

Historial de 51 filas consultadas/50 visibles con cursor compuesto, microsegundos y desempate UUID; UI invierte página para cronología. Actualizar vuelve a últimas 50; Cargar anteriores antepone otra página. Refresco explícito y foco/visibilidad, sin Realtime. Sin avisos, audio ni adjuntos.

## Matriz de CA

Textos oficiales en [RELEASE_2_REQUIREMENTS.md](../../../requirements/RELEASE_2_REQUIREMENTS.md), sin cambios. Los ocho casos requieren aceptación humana y QA remoto.

| CA | Evidencia local |
| --- | --- |
| R2-04.CA-01 | Backfill repetido sin duplicar, trigger nuevo evento; organizador/confirmed; historial y envío denegado en ended/cancelled/archived; UI sólo lectura. |
| R2-04.CA-02 | Persistencia evento/emisor; proyección mínima, paginación determinista y cronología; UI muestra nombre/username/fecha Argentina aun en navegador Tokyo. |
| R2-04.CA-03 | Lectura directa por conversation ID devuelve cero a no miembro; RPC niega IDs a no miembro/removed/cancelled/anon; ruta fixture denegada. |
| R2-04.CA-04 | Historia vacía desde publicación, UI vacío/error descarta datos anteriores y ofrece Actualizar chat. |
| R2-05.CA-01 | Participante envía en PostgreSQL; UI muestra burbuja propia tras recuperar historial. |
| R2-05.CA-02 | Reapertura por otra conexión/sesión local y UI; reintentos concurrentes/respuesta perdida conservan UUID sin duplicar. |
| R2-05.CA-03 | SQL rechaza vacío/blancos ASCII/Unicode/>2000, acepta 2000; UI deshabilita blanco/exceso. |
| R2-05.CA-04 | Denegación a no miembro/removed/anon, suplantación y mutaciones directas; cierre impide envío; carrera de dos conexiones espera lock y rechaza tras commit de cancelación. |

## Pruebas y reproducción

- `npm run build`, `npm run lint`, `npm run check:events`, `npm run check:auth`, `npm run check:participations`, `npm run check:my-events`, `npm run check:home-events` y `git diff --check`.
- `node scripts/check-chat.mjs`: [postgres-results.json](postgres-results.json). PostgreSQL real aislado en 127.0.0.1, roles Auth/Storage scaffold. Instalar herramientas fuera de dependencias del proyecto: `npm install --prefix .participation-test-tools.local --no-save pg @embedded-postgres/windows-x64`. Se detiene el servidor en finally; datos temporales ignorados quedan para diagnóstico.
- `npm run dev -- --host 127.0.0.1 --port 4181`; en otra PowerShell `$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4181'` y `node scripts/check-chat-ui.mjs`: [ui-results.json](ui-results.json). Playwright + Edge, respuestas interceptadas. PLANIT_PLAYWRIGHT_PATH permite indicar módulo Playwright del runtime.

SQL local no acredita JWT/REST real. Primer intento sandbox falló EACCES de loopback; ejecuciones posteriores fuera del sandbox pasaron. El test SQL conserva microsegundos del cursor como PostgREST; convertirlos a Date truncaba precisión, corregido en el harness.

## Comparación visual

[Móvil 375×812](chat-mobile.png), [escritorio 1280×900](chat-desktop.png), [sólo lectura móvil](chat-read-only-mobile.png), [sólo lectura escritorio](chat-read-only-desktop.png), contrastadas con teléfono 3 de [mockup R2](../../mockups/release-2.png).

Fondo marino, burbujas entrantes oscuras/propias azul-violeta, header, fecha/emisor y composer inferior conservan identidad. Adaptaciones: shell y navegación existentes, nombre/username sin fotos privadas de personas, icono de evento sin fotografía ilustrativa, fecha completa y Enviar con label. Refresco, labels y límite funcionan; sin adjuntar, menú decorativo o contador ficticio. No se usan fotos del collage.

## Pendientes

Migración `20261010214526_event_chat.sql` requiere permiso remoto. Inspeccionar migration list/dry-run/advisors antes/después de aplicar. Probar JWT/REST real con dos cuentas/no miembro: historial/envío/ID directo/retiro/remoción/cierre. Revisar teléfono físico con teclado/safe areas y smoke R1 real. No se modificó Realtime ni otro recurso remoto.
