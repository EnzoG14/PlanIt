# R6 · B9 — QA integral

15/10/2026, Argentina. **Implementado; QA pendiente. NO-GO.**

Base `120d50a2ccfc9fc107b5d01e994c40b493bcbe79`, `origin/main` después de integrar B7 #70 y B8 #71. Rama `codex/r6-block-9`; worktree independiente bajo el home. Cambios de B8 del checkout original preservados; `.env.local` copiado byte a byte, ignorado y no versionado. [Reporte](../RELEASE_6_TEST_REPORT.md), [24 CA/casos/evidencias](summary.json), [entrega](delivery.json).

## Reproducción

Usar Node24, dependencias de `package-lock.json`, Edge y Playwright externo. PostgreSQL/pg externos en `.participation-test-tools.local/node_modules` o `PLANIT_TEST_TOOLS_DIR`. Este worktree reutilizó dependencias locales mediante junctions ignoradas; no se agregan dependencias de producto. `PLANIT_PLAYWRIGHT_PATH` y `PLANIT_PYTHON_PATH` admiten las rutas del runtime local. El índice `.codegraph/` se inicializó propio, sin copiar otro checkout.

```powershell
npm run check:r6:release -- checks
npm run check:r6:release -- sql
npm run check:r6:release -- contract
npm run check:r6:release -- ui
npm run check:r6:release -- r5
npm run check:r6:release -- regression
npm run check:r6:release -- regression-ui
npm run check:r6:release:ui
npm run check:r6:release:pwa
npm run check:r6:release:audit
npm run check:r6:release:report
```

El runner exige etapa explícita. Para repetir sólo una suite: `npm run check:r6:release -- contract occupancy`. Las etapas guardan `attempt-N` y no borran intentos previos. Se conservan aserciones originales y se relocalizan salidas hacia B9; en regresiones R1/R2 se añade sólo `service_role` faltante en el scaffold SQL local, igual que en R5. Los wrappers internos mantienen sus etiquetas históricas; la versión auditada y hash de cada fuente están en `run.json` B9. Pruebas secuenciales dentro de cada etapa evitan colisiones de sus fixtures temporales.

`audit` consume un **snapshot remoto fresco** `catalog.json`, capturado con `catalog-readonly.sql` por MCP en READ ONLY/ROLLBACK, y el snapshot `advisors.json`. No volver a presentarlo como lectura remota nueva al repetir el script. Su fecha está en `audit.json`. La parte HTTP sí llama nuevamente a endpoints de lectura con publishable key y actor anónimo; nunca guarda claves/tokens ni cuerpos de respuesta. Para repetir la auditoría remota completa, volver a capturar esos dos snapshots con los conectores de sólo lectura y registrar fecha.

`report` exige manifiestos completos de las siete etapas, 24 CA únicos y aserciones reales referenciadas. Mantiene NO-GO y devuelve código1 si hay suites fallidas; no convierte una auditoría entregada en aceptación funcional. La matriz por capa es parcial y la aceptación humana permanece pendiente.

## Capas y evidencia

- SQL: siete suites R6,11 SQL R5 y16 regresiones R1–R4; PostgreSQL local real con Auth/Storage scaffold y `SET ROLE`, no JWT/HTTP reales.
- UI: seis suites R6 y regresiones de bandeja/Realtime/DM/follow/Mis eventos; app compilada en Edge y transporte sintético, incluyendo canales Phoenix. Las capturas muestran la app ejecutada con fixtures.
- `accessibility-extended`: mediciones de fuente/foco/targets y zoom CSS200 en seis anchos. Cuatro FAIL a320/360/375/390;768/1280 PASS. `accessibility` conserva el primer intento que se detuvo en el primer overflow. Zoom CSS/texto ampliado no equivale a zoom nativo ni lector/dispositivo físico.
- `pwa`: SW/CacheStorage/recarga offline reales del shell anónimo en localhost; sin instalación, actualización ni sesión privada offline certificadas.
- Remoto: catálogo PostgreSQL17.11,37 migraciones,16 tablas públicas RLS,88 funciones. R5 edit-profile compara todos los cuerpos/ACL/config salvo el stub local del event trigger de Supabase. `migration-list.txt` confirma37/37 y `dry-run.txt` no tiene pendientes; **cero aplicaciones B9**.
- HTTP:9 denegaciones anónimas401. JWT real A/B/C/D y entrega Realtime real BLOCKED por falta de cuentas/fixtures autorizados. No se crean usuarios ni datos de prueba remotos.

## Hallazgos y límites

- P2: zoom CSS200 causa documento640px en anchos estrechos por el mínimo320px del body; confirmar zoom nativo antes de corregir. Sin cambios de UI o DESIGN en B9.
- P2 de harness resuelto: contrato ocupación no resolvía nuevos imports en data URLs; resolución a módulos reales y aserciones intactas, con intento original y repetición. El probe HTTP de bandeja inicial usó parámetro equivocado (404), corregido a `p_before_at` (401); ambos resultados preservados.
- FAIL histórico de `check-my-events-refresh-ui`: espera ausencia de menú Cuenta en `/me`, pero la app lo muestra. Se conserva el fallo y no se modifica la expectativa; separado del hallazgo zoom.
- D04 B3 permite cifras exactas con riesgo residual temporal/multievento aceptado; no se certifica anonimato absoluto. D03/D05/D06/D08 y D07 se mantienen según adendas aprobadas.
- Asesores mantienen50 WARN de DEFINER autenticado,1 WARN de contraseñas filtradas y1 INFO de enlaces sin políticas. Remediaciones en `advisors.json`; cambiar ACL sin analizar ownership rompería los contratos.
- Impeccable: detector sobre superficies R6 sin hallazgos; sidecar desactualizado reportado y preservado. Evaluación acotada15/20 en el reporte; no es certificación WCAG.

## Entrega

Inventario: runners de coordinación/auditoría/reporte/UI/PWA, scripts npm, reparación del contrato B1, reporte/matriz/seguimiento y evidencia B9. **Sin nuevas RPC, tipos de producto, tablas, índices, triggers, políticas o migraciones.** No se modifica el diseño vigente ni se aplican cambios remotos.

R5 conserva su GO humano histórico. R6 mantiene0/24 CA aceptados integralmente hasta pruebas pendientes y aprobación humana expresa. PR draft; sin merge/deploy ni siguiente bloque. El SHA del commit de auditoría y la PR se registran en `delivery.json`; HEAD final se consulta en Git/PR para evitar un SHA autorreferencial dentro de su propio commit.
