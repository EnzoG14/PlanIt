# PlanIt — informe integral de QA Release 2

Fecha: 11/10/2026, Argentina. Rama `codex/r2-block-5-qa`, base `origin/main` en `8d21ed4` (bloques 0–4, Mapbox, Realtime y PR #15 de layout de chat integrados). Entorno: Windows, Node.js 24.19.0, Vite 8.3.4 instalado por lockfile, PostgreSQL temporal 17.5 y Edge/Playwright. Destino remoto exclusivo: `planit-v2` (`iepeqmvzjguwlhnecsdq`).

## Decisión

**Actualización humana — 11/10/2026, 18:46 ART:** el usuario corroboró a mano los cambios y aprobó la PR #16. Se acepta la corrección y los entregables de esta PR. No aportó resultados por CA ni confirmación específica de los E2E y excepciones pendientes; la aprobación de la PR no modifica retrospectivamente los resultados de Codex ni acredita el cierre integral de R2. Sin merge autorizado por este mensaje.

**NO-GO para declarar R2 validada/cerrada.** Hay evidencia local automatizada para los 28 CA y lectura real con dos cuentas existentes, pero faltan envío/entrega/reconexión reales de chat, JWT de no miembro/removido, eventos cerrados reales, marca de lectura real, smoke completo de escrituras R1 y aceptación humana. Ninguno de esos pendientes fue aceptado explícitamente. No hay defectos funcionales altos/críticos reproducibles abiertos en las pruebas ejecutadas; el defecto de ficha obsoleta se corrigió y tiene regresión PASS. La ausencia de fallos en la muestra no acredita los escenarios pendientes.

La PR entrega el bloque 5 para revisión, sin marcar **Validado**, cerrar la release, aplicar SQL remoto, cambiar Auth/Realtime/Storage ni fusionar. [Matriz literal de 28 CA](RELEASE_2_ACCEPTANCE.md).

## Verificaciones ejecutadas

| Comando / suite | Resultado final | Entorno y alcance | Evidencia |
| --- | --- | --- | --- |
| `npm ci` | PASS, 372 paquetes instalados, 0 vulnerabilidades | Lockfile vigente; aviso de deprecación de glob 11.1.0 | Registro de ejecución; instalación sin cambios del lockfile |
| `npm run build` | PASS con WARN de chunk >500 kB | TypeScript, Vite y generación PWA; Mapbox diferido continúa siendo grande | [build](evidence/release-2/build.txt) |
| `npm run lint` | PASS | oxlint, incluido el script de lectura real | [lint](evidence/release-2/lint.txt) |
| `check-foundation`, `check-auth`, `check-events`, `check-mapbox`, `check-realtime` | PASS | Configuración/manifest, validaciones, fechas e imágenes; reconciliador/SDK simulado. No registro Auth real | [12 checks locales](evidence/release-2/local-results.json) y sus `.txt` |
| `check-discovery.mjs` | PASS | PGlite, scaffold de Auth/Storage y migraciones R1 seleccionadas | [discovery](evidence/release-2/discovery.txt) |
| `check-home-events`, `check-chat`, `check-profile`, `check-notifications`, `check-participations`, `check-my-events` | PASS | PostgreSQL real temporal, replay de migraciones, roles A/B/stranger/anon. Auth y Storage son scaffold, no servidores Supabase | [resultados](evidence/release-2/local-results.json), JSON por área |
| UI Home/detalle, chat, perfil, avisos, Realtime y layout | PASS | Edge, HTTP/Auth/Storage y Phoenix WS interceptados; 375×812 / 1280×900. Layout también 360×800 / 390×844 y altura de teclado simulada | [UI](evidence/release-2/ui-results.json), [layout](evidence/release-2/chat-layout-results.json) |
| UI creación, participaciones, Mis eventos y mapa | PASS | Regresión R1 fixture. Mapbox GL real con estilo interceptado, token `pk.fixture`, 375×812 / 768×1024 / 1280×900; modo engine y WebGL fallido | [UI](evidence/release-2/ui-results.json), [mapa](evidence/release-2/mapbox/results.json), [fallback](evidence/release-2/mapbox-webgl/results.json) |
| `npm run check:r2:live` | PASS de lo ejecutado; 3 escenarios PENDING explícitos | Auth/REST/Storage HTTPS real, dos identidades y contextos Edge separados; sólo lectura de datos existentes | [lectura real](evidence/release-2/live-readonly.json), [salida](evidence/release-2/live-readonly.txt) |
| Supabase `list_migrations` antes/después y advisors | 11 versiones coincidentes; avisos descritos abajo | MCP de lectura; sin `execute_sql`, `apply_migration` ni cambios de configuración | [migraciones](evidence/release-2/migrations.json), [advisors](evidence/release-2/advisors.json) |

No se informa una suite E2E integral PASS. El exit 0 del script real significa que pasaron sus aserciones de lectura; sus PENDING siguen bloqueando el cierre. Los resultados anteriores de R1 y las actas antiguas de R2 conservan su contexto histórico.

## Seguridad, Auth, RLS, REST y Storage

Se inspeccionaron las cuatro migraciones R2 y sus dependencias mediante los checks de replay. RLS se activa al crear conversations/messages/notifications; grants mínimos, `search_path` vacío y EXECUTE revocado a PUBLIC/anon. El chat exige organizador o participación confirmed; conocer UUID no autoriza. No hay INSERT/UPDATE/DELETE directo de messages ni identidad emisor elegida por el cliente. La operación bloquea evento y participación, usa reloj Argentina posterior al lock e idempotencia UUID. La carrera envío/cancelación y diez carreras de último cupo R1 pasaron en conexiones PostgreSQL independientes.

Notificaciones: SELECT de destinatario, UPDATE únicamente read_at, USING/WITH CHECK de propietario, trigger de hora servidor con primera lectura inmutable; inserción/falsificación/borrado desde cliente negados. Los destinos heredan RLS de evento/chat. Las RPC de bandeja/lotes son invoker, y no hay generadores R6 ni Web Push. [SQL de avisos](evidence/release-2/notifications/postgres-results.json).

Perfil completo permanece propio. Organizador y emisores salen de proyecciones explícitas de display_name/username; no exponen email, birth_date o sex. La revisión de código y las pruebas locales/REST no usan user_metadata como autorización. Con JWT reales A/B, consultas de columnas privadas por ID ajeno devolvieron cero filas; consultas sin filtro de perfiles devolvieron sólo el propio. Los avisos también quedaron aislados por recipient_id, y anon recibió denegación para profiles/conversations/messages/notifications y RPC Home/bandeja.

Las dos cuentas tenían credenciales en `.auth-test.local` ignorado y lograron login real. No se publicaron sus nombres, emails, UUID, tokens, avisos ni fotos en esta evidencia. El script mantiene las sesiones en memoria/contextos aislados y cierra únicamente sus propias sesiones de prueba. No crea cuentas ni altera contraseñas, perfiles, eventos o notificaciones. Se recuperaron dos fotos existentes mediante firmas y GET HTTPS (una lectura por cuenta); no se probó upload/limpieza real ni revocación de una firma ya emitida. Las imágenes privadas firmadas conservan su TTL; no equivalen a revocación instantánea.

### Advisors remotos

| Hallazgo | Cantidad | Evaluación y pendiente |
| --- | --- | --- |
| SECURITY DEFINER ejecutable por authenticated | 7 WARN | get_event_chat, get_event_chat_messages, get_event_organizer, get_event_participation_summary, leave_event, register_for_event, send_event_chat_message. Son entradas deliberadas con autorización explícita; tests negativos locales y proyección real PASS. Mantener revisión/aceptación humana de la excepción; no revocar sin evaluar contratos. [Guía 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) |
| Leaked Password Protection desactivada | 1 WARN | Heredado; protección adicional pendiente de configuración/aceptación humana, no se alteró Auth. [Remediación](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |
| events SELECT con dos políticas permisivas | 1 WARN de rendimiento | OR deliberado de lectura pública/propia y participación histórica. No demuestra fuga; consolidar sólo tras medir y conservar reglas. [Guía 0006](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) |
| Índices sin uso registrado | 8 INFO | No eliminados: carga de proyecto pequeña y varios índices respaldan FK/consultas previstas. [Guía 0005](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) |

No hubo ERROR en advisors. El WARN de políticas se clasifica como rendimiento, no vulnerabilidad demostrada. No se declara que desaparecieron las advertencias ni que el usuario aceptó los riesgos.

## Chat y Realtime

PostgreSQL local: backfill y trigger de chat único desde publicación; nombres sociales, cursor con microsegundos/UUID, reapertura, idempotencia, texto vacío/largo, emisor falso, outsider/removido/cancelled, mutaciones directas y cierre del evento PASS. UI fixture: vacío/error, lectura histórica, sólo lectura, envío, deduplicación, ráfagas, respuestas tardías, recuperación de 120 mensajes, orden, paginación, scroll y cambio de cuenta/logout PASS. [Chat SQL](evidence/release-2/event-chat/postgres-results.json), [Realtime simulado](evidence/release-2/realtime/ui-results.json).

Remoto real: ambas cuentas comparten una conversación existente, consultaron header/historial por RPC y abrieron el chat en navegador; ambos canales mostraron conexión autenticada. **Conexión no acredita entrega.** No se enviaron mensajes ni se desconectó/rotó JWT deliberadamente. No había membresía disjunta para probar outsider real sin cambiar datos. Sigue pendiente la denegación JWT real de un tercero/removido, mensajes nuevos recibidos en B, reconexión/expiry, y closed-event real. Una revocación silenciosa se detecta en la siguiente revalidación; no se afirma limpieza instantánea de contenido ya leído.

## Perfil y notificaciones

Fixtures perfil: avatar propio/ausente/roto/denegado, campos ausentes, error, actualización al foco/reabrir y cambio A/B con respuesta tardía PASS. SQL permite lectura/actualización propia y niega ajena. Navegador real: datos propios distintos y restauración tras recarga en ambas cuentas PASS; no se cambió un perfil remoto para provocar actualización.

En la muestra real, A tenía 0 avisos y B 1 aviso persistido. La bandeja A vacía y el título/tiempo del aviso B se comprobaron en Edge; las consultas por destinatario ajeno no devolvieron filas. No se pulsó Marcar leído ni Abrir desde un aviso (esa acción puede marcarlo). SQL/fixture verifican marca idempotente, reloj servidor, negativos de UPDATE/INSERT y revocación de destinos. La marca real y sincronización UPDATE entre pestañas siguen pendientes.

## Diseño, navegación y PWA

Se abrió visualmente el [mockup original R2](../design/mockups/release-2.png) y se contrastaron las cinco pantallas fixture a 375×812 y 1280×900. Mantienen fondo marino, acentos azul/violeta, cards/hero, avatar circular, burbujas propias y filas de avisos. El chat dedica el viewport al historial/composer y usa Volver al evento; no conserva navegación inferior superpuesta. Fotos y avatar fixture son placeholders de pruebas, nunca fotos recortadas del collage.

Las diferencias documentadas siguen dentro de DESIGN_GAPS: sin filtros/favoritos/seguir/entradas/métricas sociales, categoría única, fecha de fin explícita, placeholders claros y acciones reales. No se modificó CSS ni branding. [Galería de la corrida](evidence/release-2/README.md).

Revisión acotada con [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): controles semánticos, textarea con label, acciones de icono con aria-label, skip-link, foco visible, imágenes con dimensiones/alt y safe-area CSS presentes. Los UI checks ejercitan teclado/layout; no es una auditoría completa WCAG ni prueba de lector de pantalla. `src/pages/EventChatPage.tsx:159`: historial potencialmente grande sin virtualización; rendimiento de sesiones muy extensas pendiente, sin fallo medido en esta muestra. No se incorpora una dependencia nueva por esa observación.

Foundation verifica manifest standalone, scope/start_url, PNG opacos 192/512 y maskable, registro SW y precache estático; no caching de Supabase/tiles. Build genera 32 entradas (~2466 KiB), con chunk Mapbox grande. HTTPS real se usó para APIs; UI fue localhost. Instalación/update/offline PWA sobre hosting HTTPS, dispositivo físico, teclado y safe areas reales quedan pendientes. No afirmar soporte de operaciones privadas offline.

## Regresión R1

PASS: validaciones Auth locales; publicación/formulario/fotos simuladas; discovery PGlite; Mapbox GL con estilo fixture, geolocalización denegada y fallback de WebGL; participación/retiro/reinscripción/cupo e historial con rollback de error y carreras locales; Mis eventos separados por rol con errores/vacíos/privacidad en SQL/UI. Login y restauración de sesión reales y RPC Mis eventos Organizo/Participo reales PASS.

No se repitió registro real ni creación/upload, alta/retiro y carreras sobre Supabase real. La aceptación manual previa de R1 consta en RELEASE_1_STATUS.md y no sustituye esta regresión parcial ni valida R2. Sin roturas observadas en los smoke ejecutados.

## Incidencias y límites priorizados

| ID | Prioridad / estado | Reproducción, evidencia y acción |
| --- | --- | --- |
| R2-QA-01 | Alta, corregida | Abrir detalle, hacer que REST devuelva sin acceso y recuperar foco: la ficha previa seguía visible. [Prueba antes](evidence/release-2/detail-regression-before.txt). Ahora revalida foco/visibilidad/online, limpia datos, aísla identidad/token y descarta respuestas anteriores. [Regresión final](evidence/release-2/home-detail/ui-results.json) PASS para revocación, error/reintento y respuesta tardía. Revalidación por eventos, sin polling ni cambios visuales. |
| R2-QA-02 | Alta para cierre, pendiente de evidencia | Envío/recepción/closed-event/outsider/JWT real no ejecutados; fixture y SQL local PASS no satisfacen el E2E integral. Completar el recorrido manual autorizado de abajo. |
| R2-QA-03 | Media, heredada | WARN Auth/definer pendientes de decisión humana; sin configuración modificada. |
| R2-QA-04 | Baja, pendiente | Instalación PWA/teclado/safe areas físicos, payload grande y carga extensa de historial. |

Incidentes del entorno: `npm ci` inicialmente falló EPERM por Vite manteniendo abierto el binario rolldown; se detuvieron sólo los Vite de este checkout y la instalación posterior pasó. Sandbox denegó loopback PostgreSQL/lanzamiento Edge/red Auth: repeticiones con permisos de herramienta pasaron. Mapbox engine inicialmente no mostró marcador porque faltaba token en ese servidor; repetición en servidor QA con `pk.fixture` y estilo interceptado pasó. Esos intentos no se registran como fallos de producto. El primer script live usó un selector de chat inexistente; corregido, la ejecución completa PASS.

## Pasos pendientes para GO humano

1. Con cuentas/entorno de prueba autorizados, confirmar A organizador y B confirmed; agregar un tercero no miembro y luego revocar B con operación permitida. Probar RPC/REST directo además de la UI y descartar datos privados al revalidar.
2. Enviar un mensaje A → B sin refrescar; reabrir historial y reintentar ante respuesta perdida, sin duplicados. Interrumpir WS/red, reconectar/renovar JWT, verificar orden y scroll. Probar blancos/límite y direct INSERT/identidad falsa; registrar errores recibidos.
3. Finalizar/cancelar/archivar un evento de prueba mediante operación autorizada: historial legible por audiencia vigente, sin escritura. Revocar acceso con detalle abierto y volver al foco para confirmar R2-QA-01 real.
4. Verificar avisos propios, marca read_at real/sincronización del contador y denegación cruzada; productores de prueba sólo en entorno autorizado. No agregar generadores R6.
5. Completar registro → crear con foto → mapa → inscripción/retiro/cupo → Mis eventos con datos de prueba; revisar instalación PWA/HTTPS y teléfono físico. Registrar resultados por CA y aceptar explícitamente las excepciones/avisos.

No se borra ni se prepara una limpieza destructiva de datos existentes. Registrar aceptación humana en matriz/status antes de declarar GO y fusionar deliberadamente.

## Reproducción de lo ejecutado

`npm ci`, `npm run build`, `npm run lint`; ejecutar los doce scripts de `local-results.json`. Los checks PostgreSQL requieren `.participation-test-tools.local/node_modules` (pg + embedded PostgreSQL Windows); discovery requiere `.event-test-tools.local/node_modules/@electric-sql/pglite`. Estas herramientas ignoradas ya estaban disponibles, no son dependencias nuevas de producción.

Para UI, iniciar Vite en `http://127.0.0.1:4180`, definir `PLANIT_UI_ORIGIN` y `PLANIT_PLAYWRIGHT_PATH` al Playwright disponible, y ejecutar los scripts `check-*-ui.mjs` del manifiesto. Para Mapbox engine/WebGL, usar otro servidor con token ficticio **sólo con el script que intercepta tráfico Mapbox**, y `PLANIT_MAP_MODE=webgl` para el fallback. Las suites existentes escriben en docs/design/verification; guardar evidencia aparte para no reemplazar actas históricas.

Para la lectura remota optativa: `.env.local` con URL/publishable key del proyecto correcto y `.auth-test.local` con dos cuentas existentes autorizadas; `npm run check:r2:live`. No usar `--signup`, claves admin ni credenciales VITE. El script produce un resumen sin contenido personal y no ejecuta ninguna RPC de escritura. No se ejecutó `db push --dry-run` en este bloque; coincidencia de versiones no prueba igualdad de cada definición remota y local. Las pruebas REST reducen ese límite para las funciones consultadas.
