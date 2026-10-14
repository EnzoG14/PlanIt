# R5 · Bloque 6 — Seguimientos y listas

14/10/2026, Argentina. Base `54b4749b1c12775e0d6c800b15d82aeb8ecdafbc`, rama `codex/r5-block-6`, worktree `C:/Users/USUARIO/Desktop/PlanIt/r5-block-6-worktree`. B0–B5 integrados (#50–#55), B5 aprobado por QA humana. Alcance RF-R5-05.CA-01..04, D01/D02/D04. **Implementado; QA pendiente.** [PR #56 en borrador](https://github.com/EnzoG14/PlanIt/pull/56). Sin autorización para B7, merge, deploy o DDL remoto.

## Comportamiento y archivos

El perfil ajeno muestra Seguir/Solicitar seguimiento, Dejar de seguir o Cancelar solicitud según la lectura del servidor. Una confirmación inline permite cancelar unfollow/pending sin escribir. El perfil propio no tiene botón self; ambas vistas enlazan contadores a `/users/:id/followers` y `/users/:id/following`. Cada lista autorizada pagina30 y reconsulta páginas anteriores antes de añadir, con regreso al perfil y desde cada persona a la lista.

Lecturas aisladas por cuenta/token/ruta, timeout10s, limpieza al ocultar/offline y refresco visible30s/foco/online. Una mutación oculta bio/eventos/counts derivados hasta releer; si pierde respuesta, queda deshabilitada y ofrece Consultar estado sin retransmitir. No se afirma éxito ni rollback por timeout. Una revalidación externa puede demorar hasta30s más latencia; RPC separadas no son un snapshot transaccional conjunto. Avatar conserva fallback y ventana60s aprobada C03. No nuevas publicaciones Realtime ni caché privada del SW.

Producto (bajo `src/`): `features/social/follows.ts`, `components/FollowButton.tsx`, `components/SocialCounts.tsx`, `pages/SocialFollowsPage.tsx`, `pages/social-follows.css`, cambios mínimos en `App.tsx`, `components/AppLayout.tsx`, `pages/ProfilePage.tsx`, `pages/SocialIdentityPage.tsx`. Verificación: `scripts/check-r5-follows*.mjs`, comandos npm y evidencia nueva de este directorio. Seguimiento: README/PLAN/STATUS/matriz R5, arquitectura y estado visual. No dependencias nuevas ni cambios de lockfile, SQL histórico, mockups, DESIGN o tokens. Commit de producto `671113a1c739d3ee4dce6cee94b1cf962e543cd0`; commits posteriores sólo completan seguimiento/evidencias.

## Contrato y amenazas, antes de las pruebas SQL

Se reutilizan funciones y tablas B1; no hay migraciones nuevas. `auth.uid()` define el actor; follow/unfollow sólo reciben target. El cliente jamás envía status ni asigna accepted. `get_social_relationship` devuelve visibilidad y estado propio por separado de la proyección social. No se presentan flags de bloqueo ni versiones internas en UI.

| Recurso | Propietario | Confirmed/grant-only/tercero | Accepted de privado | Bloqueado bilateral | Anónimo |
|---|---|---|---|---|---|
| follow/unfollow | Self-follow rechazado | Follow público accepted; privado pending; unfollow sólo arista propia | Idempotente / revoca al retirar | Follow denegado; no restaura aristas | EXECUTE denegado |
| Relación propia | Sin botón self | visibility + status propio | Igual | unavailable, sin controles | Denegado |
| Contadores/listas | Aceptados visibles | Público sí; privado no; grants/confirmed sin privilegio social | Sí | Sin perfil/counts/lista; personas bloqueadas excluidas antes de LIMIT | Denegado |
| Filas de listas | user_id operativo, display_name, username, avatar | Mismas cuatro columnas si lista autorizada | Igual, sin bio en lista | Sin identidad bloqueada | Denegado |
| SELECT user_follows | Sólo aristas donde actor es extremo | Sin otras aristas | Sin otras aristas | Limpieza B1; sin escritura genérica | Denegado |
| profiles / Storage | RLS propio | Sin datos íntegros, demográficos, paths o firma directa | Igual | Sin proyección social nueva | Denegado |

Las RPC B1 conservan SECURITY DEFINER/search_path vacío, ACL authenticated y filtros viewer/dueño. PK pareja/no-self y locks de perfiles ordenados serializan follow/block/privacidad. Private→public acepta pendientes atómicamente; public→private conserva accepted. Ningún cambio R1–R4 ni permisos extra por unlisted. D04 continúa decisión posterior pendiente de actualización Google Docs separada.

## Verificación

| Caso / CA | Resultado | Evidencia y límite |
|---|---|---|
| CA01: público accepted y estado/count/listas | PASS parcial SQL/UI | [SQL](sql/sql-results.json), [UI](ui/ui-results.json): ciclo/reload/30+4 y contadores |
| CA02: privado pending sin contenido | PASS parcial SQL/UI | Mínimo sin bio/eventos/counts; solicitud idempotente y cancelación |
| CA03: unfollow revoca; privatización conserva accepted | PASS parcial SQL/UI | Reconsulta retira datos derivados; accepted permanece tras cambio de privacidad |
| CA04: self/duplicados | PASS parcial SQL/UI | Self rechazado en PostgreSQL; sin botón propio; PK e idempotencia/carrera; doble envío deshabilitado |
| D01/D02/D04 adicionales | PASS parcial SQL/UI |72 audiencias B1,13 carreras con lock observado, rollback/0/1/N/rejected de B1 reproducidos; nueva lista34×ambos sentidos y bloqueos viewer/dueño; D04 UI refresca estado recibido, jamás autoacepta |
| Replay/catálogo real | PASS |28 migraciones en PostgreSQL18.4 scaffold vs remoto17; [comparación nueva](sql/remote-comparison.json):16 tablas RLS/79 cuerpos+ACL+search_path; [catálogo READ ONLY](remote/catalog.json). `remote_baseline_compared:false` del harness B1 se refiere a su baseline25 opcional; la comparación completa B6 está en archivo separado |
| UI específica B6 | PASS:54 grupos /6 tamaños | Build final `671113a` en Edge headless, REST/Auth fixtures: lost response, timeout10s, cuenta propia, retorno, bloqueo también durante mutación, error/retry/vacío y cursores inválidos; [resultados](ui/ui-results.json), [harness](ui/harness.json) |
| HTTP sin sesión | PASS:5 denegaciones401 | [HTTPS real](remote/http-anon.json), sólo consultas de lectura; no follows remotos creados |
| Regresiones SQL R1–R4 | PASS:13 suites | [Resultados](regressions.json), todos los SQL actuales con scaffold; no aceptación histórica nueva |
| Regresiones UI B2–B5 | PASS:66 participantes,72 administración,54 B3,56 B4,79 B5 | [Resumen](regressions/ui-regressions.json), [proveniencia/SHA](delivery.json); fixtures ampliados sólo con RPC de lectura B6, expectativas históricas conservadas. B5 y administración repetidos en build final tras correcciones de permisos |
| npm ci/build/lint | PASS | [Logs](checks/); instalación inicial sandbox falló por DNS, ci autorizado completó372 paquetes; warnings previos Mapbox/lint y glob de tooling |
| JWT autenticado / Storage-CDN / Realtime / dispositivos / teclado móvil / lector real | NOT RUN | No sesiones preexistentes autorizadas suministradas. No cuentas/fixtures/DDL remotos ni deploy; firma avatar/gateway conserva limitación de B1 |
| Aceptación humana CA01..04 | NOT RUN | No autovalidar; revisión de PR y QA pendientes |

Primeras ejecuciones: sandbox negó loopback SQL; repetición autorizada local PASS. Fixture accepted usaba responded clock anterior al default requested por microsegundos; se fijaron ambos con statement_timestamp, sin tocar SQL de producto. El harness UI esperaba una identidad después de activar bloqueo; se corrigió la espera neutra. El runner combinado B2 (66 participantes +72 administración) agotó300s con participantes completos; se separó administración y amplió el límite del runner para reproducción. Resultados finales enlazados corresponden a suites completas posteriores a esas correcciones, no a fallos ocultos de producto.

Lectura Google Docs vigente limitada a R5: [33 CA literales](source.json), sin alterar el documento original. [Integridad de los28 SQL, mockup, tokens y env ignorado](editorial.json): comparación LF normalizada de texto y binaria del PNG; no hashes ni valores de env registrados.

## Diseño y accesibilidad

Mockup R5 original inspeccionado e intacto: follow, solicitud privada y counters son el inventario funcional; Amanecer sigue autoridad visual. Botones tinta/píldora, filas sociales existentes, fuente autoalojada y dock de cuatro destinos. [Main antes390](baseline/before-public-390.png), [accepted390](ui/accepted-390.png), [lista1280](ui/followers-1280.png), [pending390](ui/pending-390.png), [bloqueo](ui/blocked-390.png), [resultado incierto](ui/uncertain-390.png), [vacío](ui/empty-390.png), [texto ampliado](ui/long-text-390.png). Capturas exclusivamente de builds ejecutados, contenido ficticio identificado en harness.

Verificación320/360/375/390/768/1280, texto200%, altura480, teclado Enter/foco3px y recuperación de errores. Inspección visual móvil/escritorio de acciones y listas; detector mecánico sin hallazgos. Emulación no prueba teclado móvil físico, gestos, lector o contraste de toda la app. No se regenera DESIGN/sidecar ni se introduce nueva dirección visual.

## Reproducción y revisión

```powershell
npm ci
npm run build
npm run lint
$env:PLANIT_TEST_TOOLS_DIR='C:/ruta/herramientas/node_modules' # pg + @embedded-postgres/windows-x64
npm run check:r5:follows
$env:PLANIT_PLAYWRIGHT_PATH='C:/ruta/playwright/index.mjs'
npm run check:r5:follows:ui
node scripts/check-r5-follows-regressions-ui.mjs
npm run check:r5:follows:http # .env.local, sólo lectura en planit-v2
```

SQL B6 usa el snapshot READ ONLY versionado para comparar replay; no consulta remoto durante el replay. Regresiones SQL requieren herramientas locales ignoradas donde las suites históricas las esperan. `.env.local` copiado desde `mapbox-worktree` (checkout main), ignorado/no versionado; comprobación byte a byte sin imprimir valores. Checkout original y worktrees ajenos conservados.

Migraciones nuevas: **creadas0 / probadas nuevas0 / aplicadas remotas0 / verificadas nuevas0**; replay/catálogo existente son comprobaciones distintas. No DDL remoto, escrituras remotas, merge, deploy, secrets ni edición Google Docs. Revisar ciclo público/privado, timeout/reconciliación, permisos directos SQL, paginación y límites JWT. **B7 solicitudes requiere aprobación expresa y no se inició.**
