# R5 Bloque 1 — Evidencia

**Base:** `da4379f58ba60ddfa4c3d03970103b381856996b`. **Rama:** `codex/r5-block-1`. 14/10/2026 Argentina. Estado **Implementado; QA pendiente**, sin aceptación de CA integral, merge ni deploy. [Contrato/amenazas/firmas/decisiones](../../implementation/RELEASE_5_BLOCK_1_CONTRACT.md).

**Actualización posterior autorizada:** tres migraciones aplicadas/verificadas en planit-v2 el 14/10/2026. 28 versiones al día, 16 tablas RLS, 79 funciones coincidentes y smoke read-only PASS. [Acta, comandos y límites remotos](REMOTE_MIGRATION.md). Las evidencias originales inferiores preservan el corte de implementación local; Edge/HTTP JWT/Storage/Realtime reales siguen pendientes.

[PR #51 en borrador](https://github.com/EnzoG14/PlanIt/pull/51), implementación `4e95ba247f53d7fb03917a89db76566de90df7a2`; seguimiento posterior sólo documental.

| Evidencia | Resultado y entorno |
| --- | --- |
| [source.json](source.json) | Nueva lectura de 33 CA literales, no modificación normativa; D04 posterior |
| [remote-baseline.json](remote-baseline.json) | Nueva lectura BEGIN READ ONLY/ROLLBACK, planit-v2; 25 versiones y 55 cuerpos/ACL/config coinciden con replay histórico |
| [sql-results.json](sql-results.json) | PASS replay 28 migraciones; PostgreSQL18.4 efímero, SET ROLE, cuatro perfiles ficticios +anon, SQL Auth/Storage scaffold. 72 combinaciones de audiencia ajena y 13 carreras con espera real; controles RLS/ACL/privacidad/DM/avatar/eventos |
| [regressions.json](regressions.json) | PASS 13/13 suites existentes R1–R4; salidas individuales nuevas en regressions/, evidencia anterior intacta |
| [avatar-unit.json](avatar-unit.json) | PASS handler TypeScript real transpila en Node; fetch simulado. Auth, TTL fijo60, paths/actor no elegibles, bloqueo durante firma, errores neutros/no-store |
| [explain.json](explain.json) | Índices/cursor y EXPLAIN con fixtures pequeños; no benchmark de producción |
| [commands.json](commands.json) | Instalación/build/lint/typecheck/verificaciones efectivamente ejecutadas y límites |
| [editorial.json](editorial.json) | Integridad de migraciones históricas/mockup/frontend, env ignorado/igual a main, 33CA, diff/archivos |

## Reproducción local

Desde este worktree, Node/npm y herramientas PostgreSQL ya instaladas. El runner no instala pg/binaries ni conecta a una DB remota. `PLANIT_TEST_TOOLS_DIR` debe contener pg y @embedded-postgres/windows-x64; en esta sesión se reutilizó la instalación local existente. Los runners históricos con imports relativos requieren el enlace local `.participation-test-tools.local/node_modules` a esas herramientas (ignorado, no versionado).

```powershell
npm ci
$env:PLANIT_TEST_TOOLS_DIR='C:/Users/USUARIO/Desktop/PlanIt/.participation-test-tools.local/node_modules'
npm run check:r5:social
npm run check:r5:avatar
npm run check:r5:regressions
npm run build
npm run lint
node node_modules/typescript/bin/tsc --noEmit --ignoreConfig --target es2022 --module esnext --lib es2022,dom --strict --skipLibCheck supabase/functions/social-avatar/handler.ts
git diff --check
git check-ignore .env.local
```

Comparación opcional contra catálogo recién leído, sólo read-only:

```powershell
supabase db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r5-block-0/catalog-readonly.sql --output json > .r5-catalog.local
$env:PLANIT_R5_CATALOG='.r5-catalog.local'
npm run check:r5:social
```

Los runners crean cluster nuevo, aplican todas las migraciones locales y detienen PostgreSQL en finally. Fixtures locales se destruyen lógicamente al detener el cluster; archivos de datos quedan ignorados para diagnóstico, sin eliminación recursiva. No se toca el proyecto histórico ni se crean fixtures remotos. Ningún token/clave real en evidencias.

## Exactitud y límites

SQL local usa PostgreSQL **18.4**, frente a remoto **17.11**, no misma versión mayor. Auth.uid y Storage tables/buckets son scaffold; no prueba un JWT firmado, sesión real, PostgREST, API de uploads/firmas, expiración, canal Realtime ni Deno. Checks gateway son unitarios con respuestas simuladas y secretos ficticios. Las carreras esperan un lock observado en pg_stat_activity antes de confirmar ganador; no son dos promesas sin solapamiento comprobado.

La primera ejecución local alcanzó cinco grupos y falló en invoker list_direct_conversations por falta de USAGE del esquema privado. Se concedió sólo USAGE a authenticated (sin CREATE ni EXECUTE de mutaciones internas) y retesteó completa; última ejecución incluye listas/contadores/carreras avatar y rechazo de cacheControl largo. La suite profile se repitió tras endurecer metadata de caché; las otras doce regresiones ya habían pasado y no cambiaron sus contratos. Fallos iniciales de CLI/Fetch fueron restricciones del sandbox, resueltas con ejecución permitida; no se presentan como pruebas de producto. Build conserva avisos de chunks grandes; lint sólo warnings previos, cero errores. `npm ci`: 372 paquetes, audit0.

**NOT RUN:** reset de stack Supabase completo, ejecución sobre PostgreSQL17, nuevos tests HTTP/JWT real A/B/C/D/anon, Storage/Realtime real, Edge Deno/deploy, frontend social/UI/PWA/responsive/accesibilidad y aceptación humana. 33 CA oficiales y casos D01–D05 permanecen NOT RUN integral, con seguridad parcialmente verificada en las capas indicadas. Ninguna captura de fixture se presenta como aplicación real.

**Migraciones R5 actuales:** creadas3, probadas local3, aplicadas remotas3 con autorización posterior, verificadas remotas3 ([acta](REMOTE_MIGRATION.md)). Catálogo read-only histórico original se informa por separado. Gateway social-avatar creado/probado unitariamente, no desplegado. Google Docs no editado. B2 no iniciado.
