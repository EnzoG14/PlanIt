# R5 · Bloque 3 — Perfil y eventos públicos

14/10/2026, Argentina. Base `4ef0b34a789082352f8b1ca831f75761fb6e6b17`, rama `codex/r5-block-3`. PR #50/#51/#52 integradas y autorización expresa del responsable para B3. **Implementado; QA pendiente**. Sólo RF-R5-02.CA-01..04; B4 y aceptación humana pendientes. PR en borrador hacia main, sin merge.

## Alcance y contrato

La ruta existente `/users/:id` ahora muestra identidad, avatar con fallback, bio autorizada y eventos públicos vigentes organizados por esa persona. Mantiene self→`/me`, identidad mínima privada y bloqueo bilateral neutro. No agrega follows, DM, contadores, edición ni una nueva pestaña. [33 CA originales, lectura nueva](source.json), [prompt](../../implementation/prompts/RELEASE_5_BLOCK_3.md), [contrato B1](../../implementation/RELEASE_5_BLOCK_1_CONTRACT.md). Se revisaron las referencias R5, R3/R4, AGENTS, PRODUCT, DESIGN y diseño Amanecer; no se modificaron Google Docs ni criterios históricos.

`get_social_profile` permite contenido mediante presencia de la clave `bio`, incluso cuando vale null; su ausencia significa identidad mínima. `get_social_profile_events(uuid,timestamp,uuid,integer)` aplica el gate social y filtra **en PostgreSQL** organizer, `visibility='public'`, fin futuro según Argentina y ausencia de cancelación/archivo. Ningún grant R4, follow pendiente o pertenencia a un evento amplía el perfil. Nunca usar SELECT profiles ni consultas genéricas de eventos como sustituto del gate social.

Frontend aplica allowlists y valida UUID, timestamps, cursor completo y página de hasta30 filas. Respeta orden descendente del servidor por inicio+UUID. Paginar reconsulta páginas anteriores, deduplica por ID y publica sólo tras éxito completo y nueva lectura del perfil; si el gate final pasa a mínimo, elimina eventos/bio. Un cursor repetido o respuesta inválida falla sin conservar datos anteriores. Bio y textos de eventos se renderizan como texto, no HTML.

Se reutilizan `useSocialRead` y `SocialAvatar`: timeout10s, abort, limpieza en cambio de identidad/token/ruta, ocultar/offline y revalidación visible30s/foco/reconexión. No caché persistente de perfiles ni nuevos canales Realtime. La revocación externa puede tardar hasta30s más latencia; RPCs separadas no constituyen un snapshot transaccional único. La lectura final reduce carreras, sin prometer revocación instantánea. El gateway avatar no se desplegó: fallback permanece disponible; TTL60/C03 conservado.

Origen perfil→detalle validado estrictamente como `/users/<uuid>`. Regreso conserva únicamente orígenes validados de participantes, Mis eventos y descubrimiento. El resto de navegación y administración mantiene sus contratos R1–R4.

## Amenazas y autorización

| Superficie / columnas devueltas | Dueño | Confirmado | Tercero / grant-only | Bloqueado | Anónimo |
| --- | --- | --- | --- | --- | --- |
| Perfil social: display_name, username, avatar; bio sólo audiencia ampliada | RPC permite bio; UI self→me | Público o mínimo/accepted según perfil | Igual; grant no amplía | `{unavailable:true}` bilateral, sin identidad | EXECUTE denegado |
| Eventos sociales: id, title, starts_at, ends_at, category_id, location_name; cursor inicio/id | Sólo organizados públicos vigentes | Sólo perfil público/accepted | Sólo público/accepted | Denegado antes de consultar eventos | Denegado |
| SELECT profiles íntegro / email, birth_date, sex | Sólo datos propios bajo RLS | Sin acceso ajeno | Sin acceso ajeno | Sin acceso ajeno | Denegado |
| Avatar social / signed_url60 | Gateway existente | Gate social; no privilegio de evento | Gate social; no firma directa de Storage | Sin nuevas firmas | Denegado |
| Detalle R4/chat grupal/lista administrativa | Contratos R1–R4 | Contratos R1–R4 | Grant específico, sin privilegios sociales | C02 conserva permisos independientes | Contrato existente |

Pruebas de RLS usan SET ROLE authenticated/anon en PostgreSQL real local; scaffold Auth/Storage **no es JWT real**. Bloqueo en ambos sentidos, private none/pending/rejected/accepted, unfollow y visibilidad retirada probados sin filtros cliente como evidencia de autorización.

## Validación y evidencias

| Capa / escenarios | Resultado | Evidencia / límites |
| --- | --- | --- |
| SQL local B3 + B1 | PASS: 28 migraciones, 72 audiencias, 13 carreras B1 y tres grupos nuevos B3 | [SQL](sql/sql-results.json), [harness](sql/harness.json); PostgreSQL17.5 local vs17.11 remoto, Auth/Storage scaffold |
| Regresiones SQL R1–R4 | PASS: 13 suites existentes | [Resultados](regressions/regressions.json); ningún runner histórico ni expectativa SQL modificado |
| UI B3 | PASS: 54 grupos en320/360/375/390/768/1280 | [Resultados](ui/ui-results.json); build Vite real, Edge headless, Auth/RPC/avatar fixtures, timezone Asia/Tokyo |
| UI B2 / administración | PASS:66 grupos de participantes y72 administrativos en seis tamaños | [Participantes](participants-ui/ui-results.json), [adaptación](participants-ui/regression.json), [administración](admin-ui/ui-results.json). Fixture privado reemplaza el fixture con bio pública diferida de B2; B3 verifica contenido público. Runner/expectativas históricos intactos |
| HTTP anónimo real B3 | PASS: perfil, eventos sociales y profiles rechazados401/403 | [HTTP B3](http-profile-anon.json); clave pública, sin JWT autenticado ni payload guardado |
| HTTP anónimo de regresión | PASS: cuatro rechazos401/403 | [HTTP B2](http-anon.json) |
| Catálogo remoto READ ONLY | PASS: 28 migraciones,16 tablas RLS; firmas, cuerpos/gates y ACL de las dos RPC inspeccionadas | [Catálogo](remote/catalog.json); schema metadata, sin filas privadas; no auditoría nueva de las79 funciones |
| Build/lint | PASS, avisos previos de chunks grandes/lint fuera del cambio | [Build](build.txt), [lint](lint.txt) |
| JWT autenticado / avatar Storage/CDN/Edge real / Realtime | NOT RUN | Sin cuentas/fixtures/deploy remotos autorizados; no inferir de SQL/mocks |
| Dispositivos reales, teclado móvil, lector de pantalla, aceptación humana | NOT RUN | Emulación no equivale a dispositivos o aceptación |

CA02 cubre página30+4 con fechas iguales, detalle y retorno completo participantes→perfil→evento→perfil→participantes. SQL excluye unlisted incluso para dueño/grant, vencidos/cancelados/archivados y cambios de visibilidad; private approved sólo permite bio/públicos. UI cubre bloqueo neutro, mínimo sin consultar eventos, null bio, vacío, fallo de red/retry, cursor inválido, textos largos200%, altura480, foco3px/targets≥44, polling/reconexión, respuesta tardía de otra ruta, UUID inválido, self y logout. Campos privados de fixture se omiten por allowlist y no aparecen en el DOM; ningún dato real en capturas.

Amanecer conserva tokens, fuente autoalojada, mancha y navegación actual. Capturas de app ejecutada: [antes390](before/before-390.png), [antes1280](before/before-1280.png), [perfil320](ui/profile-320.png), [vacío1280](ui/empty-1280.png), [foco390](ui/focus-390.png), [texto200%](ui/text-200-390.png), [error390](ui/error-390.png), [bloqueo390](ui/unavailable-390.png). El baseline usa el componente de HEAD base, compilado a un directorio ignorado antes de capturar, y restaura el componente B3. Inspección visual móvil/escritorio y mediciones sin overflow horizontal; no se rediseñan tokens ni mockups. Sidecar Impeccable desactualizado conservado; autoridad DESIGN.md.

Incidencias: sandbox negó conexiones PostgreSQL/Vite locales; SQL repetido fuera del aislamiento PASS, navegador servido desde build real por servidor de test. Primera extensión SQL intentó cambiar visibility sin actor de organizador; fixture corregido. Primera expectativa de logout no admitía `?next=`; corregida y suite completa PASS. Son incidencias del entorno/runner, no pruebas omitidas ni cambios de autorización del producto.

## Archivos y reproducción

Producto: `src/features/social/api.ts`, `src/pages/SocialIdentityPage.tsx`, `src/pages/EventDetailPage.tsx`, `src/pages/social-profile.css`. Verificación: cuatro scripts `check-r5-profile*.mjs` y entradas npm. Seguimiento: plan/estado/resumen R5, matriz de aceptación, estado visual y esta evidencia. Sin nuevas dependencias ni cambios de SQL/Edge/Storage/PWA config.

```powershell
npm run build
npm run lint
npm run check:r5:profile
$env:PLANIT_SQL_OUTPUT='docs/qa/r5-block-3/regressions'
node scripts/check-r5-regressions.mjs
Remove-Item Env:PLANIT_SQL_OUTPUT
npm run check:r5:profile:ui
node scripts/check-r5-profile-regression-ui.mjs
npm run check:r5:profile:http
```

SQL requiere `.participation-test-tools.local/node_modules` con pg y embedded-postgres (o `PLANIT_TEST_TOOLS_DIR`). UI requiere Edge y Playwright; override portable `PLANIT_PLAYWRIGHT_PATH`. El runner UI sirve el build de `dist` en puerto efímero, sin depender de Vite dev ni datos remotos. Evidencias se escriben sólo bajo B3. Revisar allowlists, puerta por bio, cursor y retorno validado; ejecutar pruebas JWT/Storage reales sólo con su autorización correspondiente.

`.env.local` copiado desde el checkout temporal de `origin/main` en el mismo directorio y comparado byte a byte, luego regreso a B3; archivo y copia temporal ignorados, sin claves en Git/logs. Migraciones B3 **creadas0 / probadas nuevas0 / aplicadas0 / verificadas nuevas0**. El replay de28 existentes no implica una migración nueva. Sin DDL remoto, deploy, secrets, merge ni edición Google Docs. Detenerse en revisión humana de PR; siguiente bloque B4, pendiente de autorización.
