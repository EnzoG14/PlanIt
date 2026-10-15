# R6 · Bloque 4 — Períodos y movimientos históricos

**Implementado; QA pendiente.** Base `25685f04c03c5ac308fc563f2a8e565e6987f39e`, rama `codex/r6-block-4`. Tras fetch se comprobó el merge de PR #66, B3; B1/B2 también integrados. R5 conserva GO por aceptación humana, sin transformar sus NOT RUN técnicos. Checkout ajeno intacto; worktree separado y `.env.local` copiado byte a byte desde `mapbox-worktree` (main local), ignorado. No se versiona.

El pedido autoriza sólo B4 y PR draft. [D03 aprobada en el chat](../../implementation/RELEASE_6_BLOCK_4_DECISIONS.md); D02/A01–A07 y D04/D08 B3 conservados. Los textos RF/CA oficiales y mockups/DESIGN no se modifican.

## Entrega y seguridad

Nueva migración `20261015162953_r6_participation_series.sql`; RPC `get_my_event_participation_series(uuid,timestamp,timestamp,text)→jsonb`, STABLE DEFINER, `search_path=''`, EXECUTE sólo authenticated. RLS existente no permite al dueño leer todas las filas individuales, por eso requiere agregación privilegiada. UID y propiedad antes de la lectura; ID ajeno/inexistente/NULL falla genéricamente. Autorización de enlace, follow, chat o participación no concede estadísticas. Sin lectura de perfiles ni proyección de identificadores personales, correo o demografía. No se amplía ningún grant de tabla.

Historial unido a participaciones por `participation_id`, filtrado por evento y `[from,to)` antes de agrupar. Cuenta transiciones, no el estado actual. Clasificación por estados, no por `reason`. Se excluye al organizador. Una consulta agrupada y calendario acotado, sin N+1. Se conservan los índices existentes; EXPLAIN local no justificó otro.

Auditoría: trigger final `record_participation_history` en migración `20261012155501`, vinculado `AFTER INSERT OR UPDATE OF status`; `clock_timestamp() AT TIME ZONE America/Argentina/Buenos_Aires` en la columna de historia. INSERT registra estado inicial, UPDATE sólo cambio real; `registration` también se usa en cancelled→confirmed. RPC register/leave/remove/resolve bloquean evento antes de participación/solicitud. No-ops no generan filas. La historia se escribe en la misma transacción, sin cola ni latencia asíncrona; la lectura sólo ve commits de su snapshot STABLE. Timestamps empatados no sirven como orden causal total: aquí se cuentan flujos, no se reconstruye stock. Archivo/cancelación/cambio de cupo no son movimientos de participantes. Se reutilizan pruebas de concurrencia y rollback históricas; no se cambia el trigger.

Cliente `features/analytics/periods.ts` y API RPC, selector y TrendPanel en la página existente. Sin dependencias nuevas. Presets y manual ≤366, semanas lunes/parciales, etiquetas AR; gráfico con tres trazos identificados por texto/color/patrón y tabla exacta desplegable. Empty, validación, loading, error, retry y timeout separados. Cambio de período remonta consulta por clave completa y limpia datos antes del efecto; AbortController + guardia active evitan respuestas obsoletas. Sesión/token/evento aislados por shell B2. KPI/demografía actuales no reciben el rango. La actualización general del panel vuelve a la ventana inicial; el selector indica siempre el rango efectivo.

## Ejecución y reproducción

```powershell
npm ci --ignore-scripts
npm run build
npm run lint
npm run check:r6:periods:contract
$env:PLANIT_TEST_TOOLS_DIR='../.participation-test-tools.local/node_modules'
npm run check:r6:periods
npm run check:r6:periods:ui
$env:PLANIT_SQL_OUTPUT='docs/qa/r6-block-4/regression'
node scripts/check-r5-regressions.mjs
```

`PLANIT_TEST_TOOLS_DIR` requiere los paquetes `pg` y `@embedded-postgres/windows-x64` del harness existente, sin añadirlos al producto. Playwright se obtiene del runtime local configurado en el runner. Los tests SQL inicializan y detienen PostgreSQL temporal en loopback; Auth/Storage son scaffolds SQL. Ningún test conecta a una BD remota. La UI sirve `dist` real en Edge headless, Auth/RPC simulados y navegador en Tokio para detectar dependencias de zona cliente.

| Capa | Resultado / evidencia | Límite |
| --- | --- | --- |
| Build/lint | PASS, [build](build.txt), [lint](lint.txt) | Advertencias heredadas de chunks/lint, sin errores nuevos |
| Contratos | PASS, [contract.json](contract.json) | Código real de calendario/parser; no transporte |
| SQL local | PASS, [sql-results](sql/sql-results.json), [harness](sql/harness.json) | Replay 33 migraciones, PostgreSQL18.4, roles/claims SQL; no JWT real |
| Rendimiento local | PASS medición, [benchmark](sql/benchmark.json) | 0/1/10/100/1000 filas, 20 muestras por tamaño + EXPLAIN ANALYZE BUFFERS; no SLA remoto |
| UI navegador | PASS37, [Resultados](ui/results.json) | React compilado con fixtures; no certifica RLS remoto |
| Regresiones R1–R5 | PASS16 suites, [Resultados](regression/regressions.json) | SQL local; R5 social incluido además en harness de B4 |
| HTTP JWT real | NOT RUN | Sin migración remota ni cuentas de prueba autorizadas |
| Realtime/dispositivos/lector físico | NOT RUN | B4 no añade suscripciones ni altera SW; PWA generada en build |
| Aceptación integral | NOT RUN | 0/24 aceptados R6; requiere responsable |

SQL verifica alta lunes, baja martes, retorno jueves, remoción y reincorporación aprobada con las RPC reales, incluyendo reintentos. Luego reasigna **sólo en fixture local** timestamps a cortes conocidos. Aserciones de medianoche exclusiva, disjuntos, semanas parciales, febrero bisiesto, mes/año, 366 días/54 semanas; identidad, ACL, acceso directo RLS, oculto/archivado, anon/participante/link-only/ajeno/missing UID. Sin datos privados reales.

UI: seis anchos 320/360/375/390/768/1280, texto200%, altura480, reduced-motion, foco/teclado, tabla, período inicial y manual, errores sin sentinel privado, DTO de otro evento rechazado, vacío sin gráfico inventado, carrera90→7→30, timeout, offline, ruta ajena y logout. Los valores de los fixtures no representan eventos reales. Capturas `ui/series-*`, `table-*`, `partial-week-*`, `empty-*`, `error-*`, `text-200-*`, `short-*`. Baseline visual B3: capturas versionadas en `../r6-block-3/ui/` del código integrado; Amanecer conservado. Se movieron los rótulos del gráfico fuera del SVG para evitar texto escalado ilegible en320. Emulación no acredita zoom nativo, lector o dispositivo móvil real.

## Cobertura y puerta

| CA literal en RELEASE_6_REQUIREMENTS | SQL local | UI fixtures | HTTP JWT / integral |
| --- | --- | --- | --- |
| RF-R6-02.CA-02 | PASS parcial historia/primera vs retorno | Ventana inicial30 | NOT RUN |
| RF-R6-03.CA-01 | PASS parcial límites/calendario | Presets/manual/día/semana | NOT RUN |
| RF-R6-03.CA-02 | PASS parcial rangos disjuntos | Sólo respuesta del rango activo | NOT RUN |
| RF-R6-03.CA-03 | PASS parcial22023 | Mensajes claro, faltantes/invertido/excesivo | NOT RUN |
| RF-R6-03.CA-04 | PASS parcial roles/RLS | Abort/remount/carrera/evento/logout | NOT RUN |

Migración B4: **creada1 / probada local1 / aplicada remota0 / verificada remota0**. No DDL remoto, deploy, merge ni escritura de Google Docs. Sin stock histórico, CSV, avisos ni comparación anticipados. Aplicación remota y QA JWT siguen pendientes de autorización/contexto; el responsable revisa PR draft y autoriza separadamente B5.

Incidencias de verificación: sandbox bloqueó fetch Git, registry y loopback; se usó ejecución elevada autorizada. Primer benchmark omitía claim del actor y falló NOT NULL; corregido sólo fixture. Pruebas UI iniciales usaban nombre exacto de select sin aria-label, innerText en details cerrado y esperaban30 filas aún agrupadas en semanas; corregidos label/runner sin relajar el contrato. Resultados enlazados corresponden a corridas finales; no se presentan errores de entorno como fallos de permisos de producto ni como PASS remoto.

Seis regresiones históricas usaban imports fijos de `.participation-test-tools.local/node_modules`: primer intento falló por paquete no encontrado. Se creó un junction local ignorado a las herramientas ya instaladas y se repitieron sólo esas seis; resultado final16/16 PASS, sin modificar las aserciones históricas. Benchmark B4: p95 local≈2,5–3,1ms hasta100 filas y≈64,6ms en1000; no SLA. [Resumen computable y hash del mockup intacto](summary.json).
