# R5 · Bloque 2 — Participantes sociales

14/10/2026, Argentina. Base `1bcef5af3397b54bae8cc18e6336092639c2b964`, rama `codex/r5-block-2`. PR B0 #50 y B1 #51 integradas; R4/B9 #48 integrado y aceptado previamente. Estado **Implementado; QA pendiente**. Sólo RF-R5-01.CA-01..04; no continuar B3 sin autorización. `.env.local` copiado byte a byte de `mapbox-worktree` (checkout main) e ignorado, sin contenido en Git/logs.

Entrega: [PR #52 en borrador](https://github.com/EnzoG14/PlanIt/pull/52), sin merge. Código verificado `15d14372cf27cfed00242c2161a7df7eb02774c6`; documentos/evidencias en commits posteriores, sin cambios de producto tras ese SHA.

## Fuente y alcance

[Lectura nueva de los 33 CA literales](source.json) del Google Doc original (modificado 14/10/2026 03:30Z). Se revisaron plan/status/contratos R5, requisitos/QA R4, instrucciones raíz/src/Supabase/diseño, PRODUCT/DESIGN, arquitectura/modelo y mockup R5. La composición conserva identidad circular/nombre/username/enlace, con tokens Amanecer vigentes. No se agregaron acciones de seguir, DM, contadores, intereses, tabs ficticias, cover inventada ni buscador social sin contrato. Bio/eventos/perfil completo quedan en B3/B5.

`/events/:id/attendees` conserva administración para organizador y ofrece lectura social para confirmado. `?view=social` abre explícitamente la lectura social para ambos; no es credencial. El detalle y la administración enlazan a esta vista. `/users/:id` es el destino mínimo necesario de B2: nombre/username/avatar reconsultados por RPC; self redirige `/me`. Retorno validado a participantes, con origen de evento/Mis eventos. Un bloqueado obtiene «Perfil no disponible» sin identidad.

## Contrato y amenazas

| Consulta / columnas | Dueño del evento | Confirmado | Tercero / grant-only | Bloqueado | Anónimo |
| --- | --- | --- | --- | --- | --- |
| `get_event_social_participants(uuid,uuid,30)` → participants/next_cursor; filas user_id/display_name/username/avatar | Sí | Sí + detalle R4 | Denegado | Identidades de contraparte omitidas antes de paginar; acceso al evento independiente | Denegado |
| `get_event_attendees` / remove / solicitudes | Sólo administración existente | Denegado | Denegado | Estado neutro C01; facultad de dueño intacta | Denegado |
| `get_social_profile` → identidad mínima usada por B2 | Como cualquier autenticado | Como cualquier autenticado | Mínima si no bloqueado; grant no amplía perfil | unavailable bilateral | Denegado |
| Gateway `social-avatar` → signed_url/60s | Autorización social propia | Sin privilegio por participar | Autorización social propia | Sin nueva firma | Denegado |
| SELECT directo profiles íntegro | Sólo self | Sólo self | Sólo self | Sólo self | Denegado |

UUID mínimo identifica destino/cursor, nunca autoriza; no participation_id, email, birth_date, sex, file/path, relaciones ni bio en estado social B2. API TypeScript aplica allowlist y valida UUIDs/cursor, incluso si una respuesta añade campos. Backend B1 es la barrera de privacidad real. Avatar usa gateway de B1, jamás firma directa de Storage; acepta sólo URL del proyecto/bucket y TTL60, falla a icono neutro. No persistencia/localStorage/caché SW de proyecciones; no nueva suscripción ni publicación Realtime.

Lecturas cancelables con timeout10s y limpieza por identidad/token/ruta. Al volver/foco/online y cada30s visible se retiran datos mientras se revalida; ocultar/offline aborta y limpia. Cargar más vuelve a consultar todas las páginas anteriores y publica resultado sólo tras éxito completo; error/revocación no deja filas previas. La retirada externa puede tardar hasta30s más latencia mientras la vista permanece abierta; el enlace a perfil siempre reconsulta. No promesa de actualización instantánea.

## Verificación real

| Capa / casos | Resultado | Evidencia / límites |
| --- | --- | --- |
| Dependencias remotas READ ONLY | PASS: 28 versiones, 16 tablas RLS, 79 funciones cuerpo/ACL/config idénticas | [Catálogo](remote/catalog.json), [comparación](remote/comparison.json). Sin filas privadas ni DDL |
| PostgreSQL local B2 + suite B1 | PASS: 34 confirmados privados, páginas30+4, allowlist exacta, propio/ajeno/vacío, grant-only/retiro/remoción/revocación, bloqueo bilateral antes de cursor, administración aislada | [SQL](sql/sql-results.json), [harness](sql/harness.json). SET ROLE, Auth/Storage scaffold; PostgreSQL18.4 vs17.11 remoto; no JWT real |
| Regresiones SQL R1–R4 | PASS: 13 suites existentes | [Resultados](regressions/regressions.json). Fixtures locales; historial anterior sin sobrescribir |
| HTTPS anónimo | PASS: 4/4 rechazos401/403 | [Resultados](http-anon.json). Clave pública sola; **no JWT autenticado** |
| UI social | PASS: 66 grupos en320/360/375/390/768/1280 | [Resultados](ui/ui-results.json). Edge headless/app Vite ejecutada, Auth/REST/gateway ficticios, Asia/Tokyo |
| Confirmación UI390 | PASS: 14 grupos, incluyendo offline/reconexión, ocultar/volver, self→me y logout desde lista poblada | [Resultados](extended-ui/ui-results.json). Targets medidos≥44px; misma app con fixtures |
| UI administrativa R3/R4 | PASS: 72 grupos en seis tamaños | [Resultados](admin-ui/ui-results.json), [adaptación del invitado confirmado](admin-ui/adaptation.json) |
| Build/lint | PASS; avisos previos de chunks grandes y lint fuera del cambio | [Build](build.txt), [lint](lint.txt). npm ci PASS tras habilitar descarga fuera del sandbox; 0 vulnerabilidades informadas |
| HTTP JWT autenticado / Storage CDN / Edge desplegado / Realtime | NOT RUN | No cuentas/fixtures/deploy remotos autorizados en B2; no inferir PASS a partir de mocks o SQL |
| Teclado móvil real / gestos / safe areas / lector de pantalla / aceptación humana | NOT RUN | Emulación no sustituye dispositivos reales |

UI verifica carga/vacío/error/retry, paginación sin administración para participante, navegación teclado/regreso, bloqueo neutro, revocación al paginar y polling, fallo/red/respuesta inválida, textos largos200%, sesión/anon y respuesta tardía de otro evento. Capturas [antes390](before/before-390.png), [antes1280](before/before-1280.png), [lista320](ui/participants-320.png), [lista1280](ui/participants-1280.png), [foco](ui/focus-390.png), [texto largo/fallback](ui/long-avatar-fallback-390.png), [200%](ui/text-200-390.png), [vacío](ui/empty-390.png), [denegado](ui/denied-390.png), [error](ui/error-390.png). Todas de aplicaciones ejecutadas con fixtures, no imágenes diseñadas. Revisión visual móvil/escritorio: sin overflow horizontal; fuente autoalojada y patrones Amanecer conservados; mockup intacto.

La suite UI histórica R3 esperaba denegación completa para su invitado **confirmado**, incompatible con CA-R5-01. El adaptador `check-r5-admin-ui.mjs` añade respuesta social y espera heading Participantes sólo para ese actor; conserva todas las pruebas de remoción, errores/resultado incierto, historial/solo lectura, búsqueda, cancelación/foco, anonimato, sesión y revocación de chat. No altera runner ni evidencias históricas. [Resultados nuevos](admin-ui/ui-results.json), [adaptación](admin-ui/adaptation.json).

Incidencias de ejecución: npm ci inicial sin DNS y conexión local SQL/Edge inicial bloqueadas por sandbox; repetidas con permisos y PASS. Primer runner adicional SQL tuvo un nombre duplicado de variable, corregido en scope local antes de pasar. Runner R3 sin adaptar falló sólo en su expectativa obsolete de guest confirmado; explicación y adaptación arriba. No se ocultaron fallos de producto conocidos.

## Reproducción

```powershell
npm ci
npm run build
npm run lint
$env:PLANIT_TEST_TOOLS_DIR='C:/Users/USUARIO/Desktop/PlanIt/.participation-test-tools.local/node_modules'
npm run check:r5:participants
$env:PLANIT_SQL_OUTPUT='docs/qa/r5-block-2/regressions'
node scripts/check-r5-regressions.mjs
# Runners históricos requieren .participation-test-tools.local/node_modules como enlace local ignorado.
npm run dev -- --host 127.0.0.1 --port 4194
# Otra terminal:
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4194'
$env:PLANIT_PLAYWRIGHT_PATH='C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$env:PLANIT_UI_NO_PROXY='1'
npm run check:r5:participants:ui
node scripts/check-r5-admin-ui.mjs
node scripts/check-r5-participants-http.mjs # Sólo lecturas HTTP anónimas en planit-v2.
```

Catálogo remoto obtenido con `supabase db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r5-block-0/catalog-readonly.sql --output json`; SQL contiene BEGIN READ ONLY/ROLLBACK. Comparador B1 reutilizado con salida nueva B2. [Manifiesto](manifest.json) registra hashes de fuentes/evidencias y comandos. Guías actuales consultadas: [RPC](https://supabase.com/docs/reference/javascript/rpc), [invoke](https://supabase.com/docs/reference/javascript/functions-invoke); changelog markdown intentado, proveedor web rechazó content-type.

## Migraciones y revisión

**B2 creadas0 / probadas nuevas0 / aplicadas remotas0 / verificadas nuevas0.** Se reutilizan las tres migraciones B1 ya aplicadas por autorización anterior; revalidación nueva READ ONLY no significa nueva aplicación. No SQL remoto de escritura, deploy Edge, secrets, merge ni Google Docs editados. Gateway no desplegado: fotos reales pendientes de autorización de despliegue y QA Storage; fallback funcional mientras tanto. D04 Google Docs sigue pendiente de autorización aparte.

Archivos de producto: `src/features/social/{api,useSocialRead}.ts`, `SocialAvatar.tsx`, `EventSocialParticipants.tsx`, `SocialIdentityPage.tsx`, CSS scoped y cambios mínimos de entrada/router/layout/participación/perfil propio. Scripts B2 y seguimiento en esta PR. Revisar allowlists, origen validado, cancelación/sesión, limpieza/polling y compatibilidad administrativa. Los cuatro CA tienen PASS **parcial SQL/UI**; siguen NOT RUN **integral** hasta JWT/Storage y aceptación. B3 pendiente; detenerse para revisión humana de esta PR.
