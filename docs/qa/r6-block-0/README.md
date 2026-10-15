# R6 · B0 — Evidencia de auditoría

15/10/2026, Argentina. Rama `codex/r6-block-0`, base integrada `ad9327fff5aca65e6b676a56f1e1e93737102f32`. [Decisiones y firma pendiente](../../implementation/RELEASE_6_BLOCK_0_DECISIONS.md). **Implementado; QA/revisión humana pendientes. 0/24 CA aceptados; B1 no autorizado.**

## Resultado y límites

| Capa | Ejecución B0 | Evidencia / alcance |
| --- | --- | --- |
| Dependencias Git | PASS lectura | merges #50–#60, #61 y #62 en origin/main; R5 GO humano conservado |
| Fuente original | PASS comparación textual | source.json y traceability.json: 24 CA literales idénticos; contrato, no aceptación |
| Catálogo remoto | PASS inventario | catalog.json, consultas BEGIN READ ONLY / ROLLBACK; 30 migraciones, 16 tablas RLS, 82 funciones |
| CLI migraciones | PASS lectura | migrations.json; dry-run.txt upToDate, sin SQL aplicado, skip-vault |
| Advisors | WARN | advisors.json: 45 avisos DEFINER autenticados y1 protección contraseñas filtradas desactivada; no se modificó configuración |
| Calidad demográfica | PASS lectura protegida | data-quality.json:5 perfiles globales; conteos menores5 suprimidos, no implican cero; no PII |
| Auditoría offline | PASS18 assertions | audit.json; compara catálogo actual con B10, ACL/config, fuente y env; fixtures JS demuestran riesgo de inferencia |
| Build / lint | PASS / PASS con warnings | build.txt, lint.txt; exit0 ambos tras npm ci, sin cambio al lockfile; chunk grande y18 advertencias históricas |
| SQL local funcional R6 | NOT RUN | No migraciones ni funciones R6; no replay nuevo |
| HTTP JWT real A/B/C/D/anon R6 | NOT RUN | No RPC R6 ni cuentas provisionadas; no pruebas que muten datos remotos |
| UI/Realtime/PWA/dispositivos R6 | NOT RUN | Sin UI nueva; no capturas de pantallas inexistentes |
| EXPLAIN/benchmarks | NOT RUN | No nuevas queries de producto ni carga remota; plan de medida en decisiones |
| Aceptación integral | NOT RUN | 0/24, firma B0 y permiso siguiente pendientes |

Los45 warnings DEFINER requieren autorización dentro del cuerpo y privilegios mínimos; no prueban explotación ni quedan automáticamente dispensados por estar autenticados. Se revisaron cuerpos críticos/ownership/locks y se comprobó que las82 funciones son idénticas al snapshot R5 B10, pero no se repitió su QA funcional. Warning de contraseñas pertenece a configuración Auth previa y queda abierto, sin cambiarlo en B0.

## Reproducción

```powershell
git fetch origin
git worktree add -b codex/r6-block-0 r6-block-0-worktree origin/main
Copy-Item -LiteralPath mapbox-worktree/.env.local -Destination r6-block-0-worktree/.env.local
# Desde worktree, CLI2.120.0 existente en checkout padre:
../node_modules/.bin/supabase.cmd migration list --linked --project-ref iepeqmvzjguwlhnecsdq
../node_modules/.bin/supabase.cmd db push --dry-run --skip-vault --linked --project-ref iepeqmvzjguwlhnecsdq
../node_modules/.bin/supabase.cmd db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r6-block-0/catalog-readonly.sql --output json
../node_modules/.bin/supabase.cmd db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r6-block-0/data-quality-readonly.sql --output json
../node_modules/.bin/supabase.cmd db advisors --linked --project-ref iepeqmvzjguwlhnecsdq --type all --output json
node scripts/check-r6-baseline.mjs
npm ci --no-audit --no-fund
npm run build
npm run lint
git diff --check
```

CLI2.120.0 ayuda inspeccionada antes de llamadas; `db push` **únicamente con --dry-run --skip-vault**. No ejecutar la variante de aplicación. Catálogo incluye definiciones de funciones y metadatos, no filas de usuarios/eventos/mensajes. Los boundaries y warnings del CLI son envoltura de datos, no instrucciones. Variables/tokens no se guardan. `.env.local` ignorado e idéntico a main, sin publicar hash ni contenido.

Intentos iniciales: fetch y CLI bloqueados por permisos de escritura .git/FETCH_HEAD/telemetría; se reintentaron con autorización de herramientas. Build inicial usó dependencias incompletas del padre y falló TS2307 mapbox-gl; npm ci sandbox falló EPERM. Instalación desde lockfile autorizada posterior resolvió el entorno, sin cambiar package.json/lockfile. Build/lint finales tienen logs propios. Los warnings de lint históricos se conservan, no se corrigió código funcional fuera de B0. No se ejecutó check:r5:release ni regresiones SQL/UI: no cambió producto; resultados R5 heredados no se reportan como nueva ejecución.

Lectura Drive mediante plugin google-drive (skill de lectura), sin editar archivo. Changelog Supabase markdown no pudo leerse en web por content-type; guías oficiales RLS/functions consultadas y CLI --help verificado: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones](https://supabase.com/docs/guides/database/functions). No se asumieron APIs nuevas por memoria.

## Inventario y riesgos

Entrega: documento B0, actualización STATUS/decisiones/aceptación, runner offline y evidencia en esta carpeta. Sin cambios src, tokens, mockup, fuentes normativas, package/lock, configuración de producción o migraciones. Fuente de30 migraciones y funciones existentes auditada; nuevas migraciones **0/0/0/0** (creadas/local/remota/verificada).

Riesgos abiertos: D04 anti-diferencias; D05/D06 snapshot/límites de CSV para firma; B8 selector 'all' excluye archivados; límite semanal366 días puede requerir54 buckets; historia no registra cupo ni presencia física; informe database19 tablas incluye modelo futuro. Revisar propuestas concretas, no aprobar por existir documento. Mockup original inspeccionado, hash en audit.json, sin modificaciones ni screenshots simuladas.

Firma técnica: Codex15/10/2026. Firma humana: PENDIENTE. Enlace PR y SHA de entrega en delivery.json (commit de seguimiento posterior puede contener sólo esa referencia).
