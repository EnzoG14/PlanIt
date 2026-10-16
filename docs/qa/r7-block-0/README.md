# Release 7 · B0 — Evidencia y reproducción

16/10/2026, Argentina. Rama `codex/r7-block-0`, base `f8dd53c136fb30fbef5f3b2d9fa7cf0359923974`. Auditoría/acta únicamente; [decisiones](../../implementation/RELEASE_7_BLOCK_0_DECISIONS.md), [contratos](../../implementation/RELEASE_7_BLOCK_0_CONTRACTS.md), [amenazas](../../implementation/RELEASE_7_BLOCK_0_THREAT_MODEL.md). **37/37 comprobaciones documentales PASS;29 CA funcionales NOT RUN. Firma humana y siguiente bloque NO-GO.**

| Capa / caso B0 | Resultado | Evidencia / alcance |
|---|---|---|
| TC-01 baseline reproducible | PASS documental | Git/base, source, catálogo sin datos personales,37 versiones sincronizadas, Storage/grants/RLS/Edge |
| TC-02 matriz completa | PASS diseño | A/B/C/D/E/F/anon, abierto/cerrado, publicar/leer/borrar/compartir/Push; pendientes humanos señalados |
| TC-03 tres discrepancias mínimas | PASS diseño | CHECK texto, Storage OR/owner, generateSW; además files_path_valid, enlaces R4 irrecuperables, QA Push contradictoria |
| TC-04 firma/GO B1 | BLOCKED | Acta NO-GO propuesta; responsable no ha firmado contratos/autorizado B1 |
| Literalidad Google Doc | PASS | source.json (revisión e índices); verify.mjs y traceability.json verifican7 RF/29 CA, acceptance sin modificar |
| Catálogo remoto | PASS inventario | catalog-readonly.sql en BEGIN READ ONLY/ROLLBACK, catalog.json capturado16/10; no smoke de negocio |
| Infraestructura/Edge | PASS inventario | infrastructure.json (helpers Storage presentes; cron/pg_net ausentes), edge-functions.json sólo social-avatar |
| SQL de propuesta/replay | NOT RUN | Diseño en Markdown no es migración ni suite SQL ejecutada |
| HTTP/JWT real / Storage GET/sign | NOT RUN | No se crearon usuarios ni fixtures remotos; R7 aún no existe |
| UI/SW/offline/install/update/Push real | NOT RUN | Sin UI nueva; SW ignorado de main sólo inspeccionado, no rebuild ni certificado |
| Build/lint / regresiones R1–R6 | NOT RUN | No cambia frontend; no extrapolar ejecución/GO R6 a validación R7 |
| Migración R7 creada/local/remota/verificada | 0 / NOT RUN /0 /0 | Sin cambios bajo supabase/migrations, funciones ni esquema |

## Archivos de evidencia

- `git-baseline.json`: HEAD/base/branch/commits/migration hashes (estos últimos en audit.json), estado del checkout al empezar y copia env validada sólo como booleano, sin leer su contenido en salida.
- `source.json`: únicamente párrafos RF/CA vigentes R7 del documento oficial, revisión, tab/índices; no copia de todo el documento.
- `traceability.json`: cada CA con texto exacto, SHA256 UTF8 sin normalización, coincidencia local y tests/bloques/capas. Los hashes excluyen ID/punto del párrafo y newline; `source.json` conserva el original.
- `catalog.json`: metadatos técnicos, no filas de negocio; funciones/policies/grants/triggers/índices/columnas/constraints/buckets/publicación; captura remota nueva, no copiada de R6.
- `catalog-readonly.sql`, `infrastructure-readonly.sql`: consultas sólo metadatos con READ ONLY/ROLLBACK; sin PII/cron.command/secrets. Consultar estos archivos no modifica esquema.
- `infrastructure.json`, `edge-functions.json`: disponibilidad y listado, nunca ejecución de funciones ni cron.
- `verify.mjs`, `audit.json`: comprobador offline reproducible y sus37 checks. Son herramientas de documentación dentro de docs; no código de feature ni permiso para SQL.
- `publication-review.json`: destino verificado por conector GitHub (`EnzoG14/PlanIt`, privado, coincide con origin) y comparación canónica contra `origin/main:docs/qa/r6-block-9/catalog.json`. Todas las secciones técnicas coinciden literalmente tras ordenar claves JSON; sólo cambia fecha de auditoría. No se añaden datos de negocio ni secretos. La nueva captura no amplía el catálogo ya versionado en ese mismo repositorio.

## Repetir checks offline

Desde la raíz del worktree:

```powershell
node docs/qa/r7-block-0/verify.mjs
git diff --check
git diff --name-only origin/main
git status --short
git check-ignore .env.local
```

El verificador sólo lee snapshots y archivos versionados y escribe audit/traceability en esta carpeta. No usa env, tokens ni red. Captura base origin/main; si main avanzó, conservar evidencia del corte y generar un corte nuevo deliberadamente. No sustituye replay/migración ni JWT.

## Repetir inventario remoto de sólo lectura

Se usó CLI2.120.0 instalado en `mapbox-worktree/node_modules`, workdir main **sin editar sus archivos versionados**, proyecto explícito planit-v2. Puede requerir acceso de CLI a keychain/red y escribir caché/rol de conexión de plataforma; no se extrajeron tokens. Ejemplo desde `mapbox-worktree` con rutas locales verificadas (no ejecutar contra proyecto histórico):

```powershell
./node_modules/.bin/supabase.cmd migration list --linked --project-ref iepeqmvzjguwlhnecsdq
./node_modules/.bin/supabase.cmd db query --linked --project-ref iepeqmvzjguwlhnecsdq --file ../r7-block-0-worktree/docs/qa/r7-block-0/catalog-readonly.sql --output json
./node_modules/.bin/supabase.cmd db query --linked --project-ref iepeqmvzjguwlhnecsdq --file ../r7-block-0-worktree/docs/qa/r7-block-0/infrastructure-readonly.sql --output json
./node_modules/.bin/supabase.cmd functions list --project-ref iepeqmvzjguwlhnecsdq --output json
```

Historial CLI37 local/remote y catálogo de versions coinciden; lista durable en catalog.json más hashes de cada archivo en audit.json. No se ejecutó db push (ni dry-run), cron/deploy/secrets/advisors con cambios. Transacciones no leyeron perfiles, mensajes, endpoint Push ni contenido de uploads. La base antigua no fue consultada.

## Series preparadas, no ejecutadas

La trazabilidad enlaza los casos de RELEASE_7_TEST_PLAN.md por RF; cada CA conserva todas sus capas NOT RUN. SQL-01..11 cubren integridad/ACL/concurrencia/TTL/GC/queue; UI-01..07 chat/visor/nav/ICS/share/Push/accesibilidad; PUSH-01..06 install/offline/dispositivo/retry/aislamiento/cron. Amenazas adjuntas añaden casos a23:59:59.999999,24:00:00 y+1µs, hora tras lock, firmas obtenidas antes del TTL, reloj cliente±48h, uploader y políticas OR. Escenarios cancelado/archivado requieren firma antes de fijar expected.

QA visual futura320/375/390/768/1280, zoom200%, teclado/lector/gestos/dispositivo; ninguna captura emulada será prueba de recepción Push. D08 ya aprobada requiere preview concreta cuando consentida y genérica al ocultarla, sin reinterpretar el CA ni duplicar inbox. Matriz oficial permanece29 NOT RUN; los37 PASS aquí son de auditoría documental.

## Referencias técnicas verificadas

[Storage RLS](https://supabase.com/docs/guides/storage/security/access-control), [helpers por operación](https://supabase.com/docs/guides/storage/schema/helper-functions), [injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest). Changelog oficial consultado16/10: [retiro de ciphers TLS CBC](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) anunciado para noviembre; registrar compatibilidad de navegadores físicos, sin cambiar esquema por ese aviso. No se actualizó CLI/dependencias por disponibilidad de versión nueva.
