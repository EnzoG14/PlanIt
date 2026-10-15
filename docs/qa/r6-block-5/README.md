# R6 · Bloque 5 — CSV seguros

15/10/2026, Argentina. **Implementado; QA pendiente.** Sólo RF-R6-04.CA-01..04. Sin aceptación integral, merge, deploy ni B6. Aplicación remota autorizada registrada en la adenda final.

## Procedencia y decisiones

- Base tras `git fetch origin`: `edaa0c5bc8785dad371736be8e16d693966fb4cf`; `main` local coincidía y estaba limpio. Merges B0–B4 #63–#67 y GO humano R5 #61 comprobados en Git; los NOT RUN previos no cambian.
- Rama `codex/r6-block-5` creada desde `origin/main` en el mismo checkout de main. `.env.local` de main permanece intacto e ignorado; no necesitó traslado entre directorios, no se imprimió ni versionó. El CLI actualizó su aviso de versión; ese cambio ajeno al bloque fue revertido.
- [Adenda aprobada D05/D06](../../implementation/RELEASE_6_BLOCK_5_DECISIONS.md): el responsable eligió snapshot único sobre paginación. 5.000 filas/10 MiB/15 s, sin archivo para ausencia de datos. D04 B3 conservada; no demografía en CSV.
- Commit funcional `c574440b133c24e52fff98df225eb4c892146f42`; [PR #68 draft](https://github.com/EnzoG14/PlanIt/pull/68). El HEAD definitivo es el de la rama/PR, incluyendo el commit documental de enlace.

## Cambio e inventario

RPC nueva, adaptador/parser CSV y serializador, control reutilizado de descarga, integración en contexto de evento y movimientos B4, estilos mínimos Amanecer y tres scripts `check:r6:csv*` en package.json. Sin dependencias nuevas ni cambios a DESIGN, fuentes oficiales RF/CA o Google Doc. Seguimiento actualizado en PLAN/STATUS/DECISIONS_PROPOSED y matriz de aceptación.

Migración `20261015173426_r6_export_projection.sql`: **creada 1 / probada local 1 / aplicada remota autorizada 1 / verificada remota 1** (actualizadas con autorización posterior; el corte de entrega inicial era1/1/0/0). Replay de 34 migraciones en PostgreSQL **17.5 Windows** con scaffolds Auth/Storage y roles reales SQL; no es Supabase remoto ni JWT HTTP.

`public.get_my_event_export_rows(uuid)→jsonb`, STABLE DEFINER, `search_path=''`, EXECUTE sólo authenticated; UID/ownership antes de consultar. Sin nuevas tablas, triggers, índices, políticas ni grants de lectura. Perfiles completos e historia conservan RLS. La proyección transmite únicamente campos autorizados y usa el enmascarado administrativo bilateral R5. Primera inscripción se obtiene del historial, no del último reingreso.

Amenazas cubiertas: evento ajeno/inexistente/NULL, acceso social insuficiente, UID ausente, filtración de campos extra, versión/evento incorrectos, nombre bloqueado, fórmula CSV, alteración entre consultas, exceso de filas/bytes y respuesta tardía después de invalidación. STABLE usa el snapshot de la sentencia; no hay páginas que puedan mezclar estados. El test concurrente determinista usa REPEATABLE READ con retiro en otra conexión y posterior reconciliación; no atribuye otra política de aislamiento a producción.

## Resultados reproducibles

| Capa / comando | Resultado | Evidencia y límites |
| --- | --- | --- |
| `npm run build` | PASS | [Log](checks/build.txt); build TypeScript/Vite y SW; advertencia heredada de bundle grande del mapa |
| `npm run lint` | PASS | [Log](checks/lint.txt); advertencias previas en probes de diseño |
| `npm run check:r6:csv:contract` | PASS | [5 grupos](contract/results.json); parser Python estándar independiente, BOM, quoting, ataques, reversibilidad, bytes y DTO |
| `npm run check:r6:csv` | PASS | [29 checks](sql/sql-results.json), replay34, 72 combinaciones sociales y 13 carreras heredadas; cuatro grupos específicos B5 |
| `npm run check:r6:csv:ui` | PASS fixtures | [14 checks](ui/results.json), Edge production, seis anchos, Tokio como zona del navegador, dos descargas reales por ancho |
| Regresión SQL ocupación B1 | PASS | [29 checks](checks/occupancy/sql-results.json); copia temporal de `scripts/check-r6-occupancy.mjs` cambiando sólo destino a B5, replay34 y carrera última plaza |
| Contratos B3/B4 | PASS | [Demografía](checks/demographics-contract.json), [períodos](checks/periods-contract.json); evidencia histórica preservada |
| HTTP/JWT real / permisos remotos | NOT RUN | Sin credenciales de usuarios de prueba; instalación remota posterior verificada por catálogo/SQL |
| Excel / PWA instalada / dispositivos / lector real | NOT RUN | Parser independiente y emulación web no sustituyen estas capas |
| Realtime | NOT RUN | B5 no agrega productor ni consumidor Realtime |
| Aceptación humana integral | NOT RUN | No autovalidada |

Herramientas: Node24.19, Supabase CLI2.120 (sólo creación del archivo), PostgreSQL17.5, Python y Playwright del runtime local. La regresión B1 se ejecutó mediante `.r6-check.local/occupancy-regression.mjs`, una copia de `scripts/check-r6-occupancy.mjs` con `docs/qa/r6-block-1/sql` reemplazado por `docs/qa/r6-block-5/checks/occupancy`; su metadata conserva la identificación del harness heredado. La suite SQL reutiliza `.participation-test-tools.local/node_modules` como las suites existentes. Para UI en este equipo: `$env:PLANIT_PLAYWRIGHT_PATH='C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'`; luego `npm run check:r6:csv:ui`. El parser usa `PLANIT_PYTHON_PATH` si se necesita cambiar el runtime.

El sandbox impidió inicialmente conexión local y arranque fiable de Edge; se repitieron ambas suites con ejecución autorizada fuera del sandbox. Se corrigieron dos expectativas del harness: identidad SQL de la conexión del fixture de tamaño y coordinación de click/evento de descarga. Los resultados enlazados corresponden a la ejecución final, no a los intentos fallidos.

### Rendimiento local

[5 muestras por tamaño y EXPLAIN ANALYZE BUFFERS](sql/benchmark.json): máximos observados ≈1,29 ms (0), 1,06 ms (1), 76,74 ms (1.001), 278,55 ms (5.000) y 3,35 ms (rechazo 5.001). Son fixtures locales, no SLA remoto. Se mantienen los índices existentes. El guard de 10 MiB se ejercitó con título sintético sobredimensionado relajando un CHECK sólo en una transacción local revertida; los constraints de producto no cambiaron.

### UI y matriz de CA

Capturas [antes móvil](ui-before/series-390.png), [antes escritorio](ui-before/series-1280.png), [después móvil](ui/exports-390.png), [después escritorio](ui/exports-1280.png), [carga/cancelar](ui/pending-390.png), [vacío](ui/empty-390.png), [error](ui/error-390.png). La carpeta UI incluye 320/360/375/390/768/1280, texto200% y altura480. App realmente ejecutada con fixtures RPC/Auth, sin PII real. Revisión visual móvil/escritorio contra Amanecer; teclado/foco3px, reduced-motion y ausencia de overflow comprobados. Zoom real del navegador, contraste instrumental nuevo y lector real pendientes; texto200% no equivale a todo el zoom200%.

| CA literal | Verificación B5 | Estado |
| --- | --- | --- |
| RF-R6-04.CA-01 | Dos CSV separados, propietario servidor y descargas efectivas navegador | PASS parcial SQL/UI fixtures; HTTP real pendiente |
| RF-R6-04.CA-02 | Encabezados identificables; misma respuesta/rango/buckets/cantidades B4; asistentes actuales | PASS contrato/SQL/UI fixtures |
| RF-R6-04.CA-03 | Allowlist sin microdemografía, correo ni IDs; enmascarado; parser independiente y fórmulas neutralizadas | PASS parcial; Excel real pendiente |
| RF-R6-04.CA-04 | Vacío, error, límites, versión/evento incorrectos, timeout, cancelación y cambios de contexto sin Blob/descarga | PASS contrato/SQL/UI fixtures |

Los CSV de `contract/` y `ui/` son fixtures de prueba, incluidos textos con ataques deliberados. El prefijo protector se aplica antes del quoting; no ejecutar ni quitar protección al abrirlos como planilla. La convención de reversión se documenta en la adenda, no elimina la necesidad de probar Excel real.

B6 requiere autorización humana independiente. La migración ya se aplicó en `planit-v2` con autorización posterior. HTTP autenticado permanece pendiente; no se usó el proyecto histórico.


## Aplicación remota autorizada — 15/10/2026

Pedido humano: «Aplicá la migracion a la db remota por favor». Aplicada únicamente `20261015173426_r6_export_projection.sql` desde la rama B5, fuente `6fb3bbd2292a8984f7fba7933aeb0e372f6e4b75`, a `planit-v2` (`iepeqmvzjguwlhnecsdq`). Sin seeds/roles/Vault, fixtures de negocio remotos, merge, deploy ni B6. Los cortes locales anteriores se conservan como antecedentes; marcas actuales **1/1/1/1**.

- `supabase migration list --linked --project-ref iepeqmvzjguwlhnecsdq`:33 aplicadas y sólo B5 pendiente antes; [34/34 después](remote/migrations-after.txt), [tabla convertida a JSON](remote/migrations-after.json).
- `supabase db push --linked --project-ref iepeqmvzjguwlhnecsdq --dry-run --skip-vault`: [antes](remote/dry-run-before.txt) una pendiente; [después](remote/dry-run-after.txt) ninguna.
- Mismo comando sin `--dry-run`, con `--yes`: [aplicación](remote/apply.txt), una sola migración.
- `supabase db query --linked --project-ref iepeqmvzjguwlhnecsdq --file <SQL> --output json`: [catálogo READ ONLY](remote/catalog-readonly.sql), [resultado](remote/catalog.json), [rechazos READ ONLY](remote/verify-readonly.sql), [resultado](remote/verification.json). Cuerpo coincide con Git normalizando CRLF en ambos lados; PostgreSQL17.11, STABLE/DEFINER/search_path vacío, EXECUTE authenticated, sin PUBLIC/anon; cero tablas públicas sin RLS. Authenticated sin UID y con evento NULL rechazados42501. Sin lectura de filas privadas.
- `supabase db advisors --linked --project-ref iepeqmvzjguwlhnecsdq --type security --output json`:49→50 WARN. El único nuevo aviso corresponde a `get_my_event_export_rows` DEFINER authenticated: exposición RPC intencional protegida por ownership, no un permiso de tabla. [Referencia del asesor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). No se aplicaron recomendaciones automáticas.

[Resumen verificable](remote/summary.json). La instalación remota no sustituye HTTP/JWT real, Excel, dispositivos ni aceptación humana; estos siguen pendientes. PR #68 permanece draft.
