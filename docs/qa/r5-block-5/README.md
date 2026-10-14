# R5 · Bloque 5 — Visibilidad de perfiles privados

14/10/2026, Argentina. Base `24c24cee44725cfa2fa4c2a3668474e891417ad3`, rama `codex/r5-block-5`, worktree `C:/Users/enzog/planit-worktrees/r5-block-5`. B0–B4 integrados por #50–#54; R4/B9 integrado por #48. **Implementado; QA pendiente.** Sólo RF-R5-04.CA-01..04 y verificaciones D01/D02. [PR #55 en borrador](https://github.com/EnzoG14/PlanIt/pull/55) hacia main; sin merge, migración nueva ni deploy.

Código y evidencia de pruebas del producto en `a32f041`; commits posteriores completan el seguimiento.

## Cambio y contrato

La frontera de seguridad B1 y la vista B3 ya implementan los niveles de privacidad. B5 agrega verificación específica y corrige una carrera reproducida en la aplicación de main: después de leer un perfil ampliado, la revocación del seguimiento puede hacer que la RPC de eventos devuelva `42501`. Antes, esto ocultaba también la identidad mínima todavía autorizada. Ahora se relee `get_social_profile` con la misma sesión y señal de cancelación; una proyección mínima elimina bio, todas las páginas de eventos y cursor. Bloqueo/inexistencia siguen devolviendo «Perfil no disponible». Si la relectura falla, se muestra error seguro/reintento; si aún autoriza contenido ampliado, se conserva la denegación original, sin inventar una lista vacía.

No se cambia la API pública: `get_social_profile(uuid)` y `get_social_profile_events(uuid,timestamp,uuid,integer)` conservan firmas, `auth.uid()`, DEFINER/search_path y ACL authenticated. `profiles` íntegro sigue sólo propio. El cliente conserva allowlists como defensa adicional; la restricción de columnas se prueba en PostgreSQL, no se atribuye al filtrado React. Sin controles de follows, solicitudes, DM o bloqueo de bloques futuros.

Se conserva `/users/:id`, self→`/me`, retorno validado, Amanecer, avatar con fallback, loading/empty/error/retry, timeout10s, limpieza por sesión/token/ruta/ocultar/offline y revalidación visible30s/foco/online. Lecturas RPC separadas no son una transacción única: la lectura final reduce carreras, sin prometer revocación instantánea. Cambios externos pueden verse hasta30s más latencia; firmas de avatar previas conservan la ventana60s C03 aprobada.

## Matriz de amenazas y autorización

| Superficie | Propietario | Confirmed / grant-only / tercero | Accepted | Bloqueo bilateral | Anónimo |
|---|---|---|---|---|---|
| Perfil social | Proyección social; UI propia `/me` | Privado: exactamente display_name, username, avatar; pending/rejected igual | Tres mínimos + bio | `{unavailable:true}` sin datos | EXECUTE denegado |
| Eventos del perfil | Sólo públicos vigentes organizados | Privado sin accepted: denegado; grant/confirmed no amplían | Sólo public, nunca unlisted/cancelado/archivado/vencido | Denegado | Denegado |
| profiles íntegro / demográficos | Sólo self por RLS | Sin filas ajenas | Sin filas ajenas | Sin filas ajenas | Denegado |
| files/Storage avatars | Sólo propietario según B1 | Sin metadata/path ni firma directa | Sin metadata/path ni firma directa | Sin nueva firma social | Denegado |
| Gateway avatar | Firma autorizada60s | Identidad mínima permite avatar | Igual | Sin URL nueva | 401 |
| Detalle/grants/chat de evento | R1–R4 | R1–R4 independientemente del perfil | No concede permisos extra | C02 conserva permisos R4/chat grupal | Reglas vigentes |

Fixture SQL nuevo: T perfil privado con bio/demográficos y avatar propio; A confirmed del evento oculto de T, C con grant-only, D ajeno. 34 eventos public futuros con igual fecha y un unlisted autorizado por R4 a A/C. 36 audiencias: tres lectores × none/pending/rejected/accepted × sin bloqueo/A→T/T→A. Escrituras de preparación únicamente en PostgreSQL efímero; lecturas de autorización con SET ROLE authenticated/anon. Signing privilegiado se verifica en SQL por separado y con handler/fetch unitario; no equivale a Storage real.

## Resultados y límites

| Verificación | Resultado | Evidencia / límite |
|---|---|---|
| Caso de revocación antes del cambio | FAIL esperado: identidad mínima no disponible | [Captura de main](baseline/revoked-before-fix-390.png), [salida](baseline/ui-results.json). Build de main ejecutado antes de editar; fixture REST |
| SQL B5 + B1 | PASS: replay28,36 audiencias nuevas,72 existentes,13 carreras observadas y escenarios entre sesiones/páginas | [SQL](sql/sql-results.json), [harness/hash](sql/harness.json). PostgreSQL17.5, Auth/Storage scaffold, sin JWT/transporte |
| Catálogo remoto READ ONLY | PASS:28 versiones,16 tablas RLS,79 funciones comparadas (stub rls_auto_enable excluido) | [Catálogo](remote/catalog.json), [comparación de cuerpos/ACL/config](sql/remote-comparison.json). No filas de usuarios ni DDL |
| UI B5 | PASS:79 grupos en320/360/375/390/768/1280 | [Resultados](ui/ui-results.json), [harness](ui/harness.json). Build real, Edge headless, sesiones/RPC/gateway interceptados |
| Regresiones SQL R1–R4 | PASS:13 suites | [Resultados](regressions.json). Primera ejecución:5 imports ausentes; herramientas locales reutilizadas y sólo esas5 repetidas |
| Regresiones UI B2/administración | PASS:66 y72 grupos | [Participantes](regressions/b2/participants-ui/ui-results.json), [administración](regressions/b2/admin-ui/ui-results.json); adaptación B3 existente |
| Regresiones UI B3/B4 | PASS:54 y56 grupos | [B3](regressions/b3-ui/ui-results.json), [B4](regressions/b4-ui/results.json). Fixtures de build real |
| Regresiones SQL B2/B3/B4 | PASS | [Logs](checks/), [B2](regressions/b2-sql/sql-results.json), [B3](regressions/b3-sql/sql-results.json), [B4](regressions/b4-sql/sql-results.json). Catálogo fresco de B5 es la comparación remota vigente |
| Gateway avatar unitario | PASS:5 grupos | [Unit](avatar-unit.json); handler real transpile en Node y fetch simulado, no Deno/Storage real |
| HTTPS anónimo B5 | PASS:5 rechazos401 | [HTTP](remote/http.json): perfil/eventos/profiles/files/avatar. Sólo operaciones de lectura; no JWT autenticado |
| npm ci/build/lint | PASS;0 vulnerabilidades en npm ci, avisos previos de chunk Mapbox/lint | [Logs](checks/). Sin dependencias del producto nuevas ni lockfile modificado |
| JWT autenticado/Storage-CDN real/Realtime | NOT RUN | No sesiones de prueba preexistentes suministradas; sin crear cuentas/relaciones remotas. No nueva publicación/caché de datos sociales |
| Dispositivos reales/teclado móvil/lector de pantalla/aceptación | NOT RUN | Emulación y fixtures no equivalen a aceptación humana |

Las regresiones UI B2–B4 pasaron en los seis tamaños; resultados definitivos en `checks/` y `regressions/`. El runner B2 histórico contiene una bio pública diferida a B3: para probar el mínimo se reutiliza la adaptación existente `check-r5-profile-regression-ui.mjs`, sin modificar expectativas históricas. La suite B3 verifica bio/contenido ampliado.

Incidencias del harness resueltas: import/ruta de runtime y servidor faltantes en el runner B2 original; su fixture con bio pública diferida usa la adaptación B3 existente. Cinco suites SQL requerían imports estáticos de herramientas locales; se proporcionaron fuera de dependencias del producto. La suite UI B5 instala su reloj antes de recrear los intervalos, para probar30s/10s virtuales sin que el polling real oculte fallos. Ninguna de estas incidencias cambió autorización de servidor.

Los cuatro CA tienen **PASS parcial SQL/UI**, CA-04 agrega HTTP anónimo real; todos **NOT RUN integral** hasta pruebas autenticadas reales y aceptación humana. D01-A/D02-A tienen evidencia parcial SQL/UI, sin aprobar los casos integrales de otros bloques. No renumerar ni alterar los33 CA [literales de Google Docs](source.json).

## Diseño y accesibilidad

Sin CSS, tokens, DESIGN, branding, dock ni mockups modificados. Capturas de aplicación ejecutada con datos ficticios: [mínimo390](ui/private-minimum-390.png), [accepted1280](ui/private-accepted-1280.png), [bloqueo390](ui/private-blocked-denied-390.png), [mínimo tras revocación](ui/private-minimal-denied-390.png), [vacío390](ui/private-accepted-empty-390.png), [foco](ui/keyboard-focus-390.png), [texto200%](ui/text-200-390.png), [reintento](ui/recheck-error-390.png). Se inspeccionaron móvil/escritorio y el fallo previo; se comprobó sin overflow, targets44, foco3px, Enter/regreso, texto largo200%, altura480 y estados.

Impeccable reporta sidecar desactualizado; DESIGN.md sigue siendo autoridad, sin regenerarlo. Su sincronización mediante `document` queda disponible como tarea separada si se solicita.

## Reproducción y archivos

```powershell
npm ci
npm run build
npm run lint
# Requiere pg y @embedded-postgres/windows-x64 en .participation-test-tools.local,
# o PLANIT_TEST_TOOLS_DIR para el harness B5; no son dependencias del producto.
npm run check:r5:private-profile
npm run check:r5:private-profile:ui
npm run check:r5:private-profile:http
```

La suite HTTP admite `PLANIT_B5_QA_CASES` apuntando a un archivo local ignorado con sesiones de prueba **preexistentes y autorizadas**: array de `{jwt,target_id,audience}` donde audience es minimal/accepted/blocked. Sólo lee; nunca registra tokens, URLs firmadas o payloads personales. Sin ese archivo, deja los escenarios autenticados NOT RUN. El catálogo versionado es un snapshot de sólo lectura obtenido durante B5, no una llamada remota oculta del runner SQL.

Producto: `src/pages/SocialIdentityPage.tsx`. Verificación: `scripts/check-r5-private-profile.mjs`, `scripts/check-r5-private-profile-ui.mjs`, `scripts/check-r5-private-profile-http.mjs`, entradas npm y evidencia B5. Seguimiento: plan/estado/matriz R5 y estado visual. [Inventario exacto/integridad](editorial.json).

`.env.local` copiado byte a byte desde D:/planit, configuración con procedencia de main documentada por B3/B4; Git no asocia archivos ignorados a ramas. Igualdad y exclusión verificadas sin imprimir claves. Índice CodeGraph inicializado para este worktree, sin compartir otro índice. Herramientas PostgreSQL reutilizadas mediante carpeta ignorada; no versionadas.

Migraciones nuevas: **creadas0 / probadas nuevas0 / aplicadas remotas0 / verificadas nuevas0**. Replay28 existente y catálogo son comprobaciones distintas. Sin DDL remoto, deploy, secrets, merge ni edición Google Docs. D04 sigue posterior al documento original y pendiente de incorporación documental separada.

Revisión: contrastar rama/base, matriz mínima/accepted/bloqueado, captura del fallo previo, reconciliación de permiso durante ambas páginas, y límites de fixtures/JWT. **Implementado; QA pendiente.** Siguiente bloque B6 requiere instrucción independiente; esta entrega termina en revisión de PR.