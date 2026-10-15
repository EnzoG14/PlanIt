# R5 · Bloque 10 — QA integrada

**Entrega:** [PR #60 en borrador](https://github.com/EnzoG14/PlanIt/pull/60), commit de implementación/evidencia `76d2183ebf1a8fce9652680a82f95116dd5dfd75`. Commits posteriores sólo de seguimiento; sin merge.

Base `f66d70bcf4f0e28c02fe2aff88088bd238a65e1e` (`origin/main`, PR #50–#59 integradas), rama `codex/r5-block-10`. Fecha de trabajo: 14/10/2026, Argentina; timestamps de herramientas en UTC pueden indicar 15/10. **Implementado; QA pendiente**. Sólo B10, sin merge/deploy/DDL remoto ni modificaciones del documento oficial.

El checkout original con cambios del usuario se conserva. Worktree aislado; `.env.local` copiado byte a byte de `mapbox-worktree` (checkout main), ignorado y fuera del índice. La base del nuevo trabajo es origin/main actualizado; el main local antiguo no se reseteó.

Resultado final: **11 suites SQL/unit sociales,10 suites UI (560 grupos),16 regresiones R1–R4 y31 comprobaciones HTTP anónimas PASS**. Build/lint y10 verificaciones de catálogo/build PASS. [Resumen por capa](summary.json). Las11 suites incluyen10 replay SQL y1 unit del gateway; no sumar sus grupos como escenarios únicos, porque reutilizan el harness B1. Ningún PASS técnico convierte el resultado integral en Validado.

[Manifiesto de archivos y blobs Git](manifest.json): lista exacta de código/documentación/evidencias del commit de implementación. Los stdout.txt se normalizaron sólo en espacios de fin de línea/EOF para revisión Git; los harness.json conservan stdout/stderr originales.

## Fuentes y alcance

Prompt B10, plan/estado/paquete R5, contratos B0/B1, AGENTS raíz/src/Supabase/diseño, PRODUCT, DESIGN Amanecer, arquitectura/modelo, plan/estado/QA R4 y nueva lectura del Google Doc vigente: planificación, criterios y especificación. [33 CA literales](source.json), sin renumerar. D01–D05 y C01–C03 aprobados conservados; D04 añade autoaceptación transaccional y sigue pendiente de incorporación documental autorizada por separado.

Se inspeccionaron las 30 migraciones antes de ejecutar las suites. No se modifica ninguna migración histórica ni se crea SQL de producto. La matriz siguiente hereda el contrato B1/B9 y es el criterio de auditoría de las pruebas.

## Amenazas y autorización

| Consulta / columnas permitidas | Dueño | Confirmado | Tercero / grant-only | Bloqueado bilateral | Anon |
| --- | --- | --- | --- | --- | --- |
| SELECT profiles íntegro, incluidos demográficos | Sólo propia fila | Sólo propia fila | Sin filas ajenas | Sólo propia fila | Denegado |
| RPC perfil: display_name/username/avatar | Sí | Sin privilegio por evento | Mínimo privado; público ampliado | unavailable, sin identidad | Denegado |
| Bio/eventos públicos/contadores/listas | Sí | Sólo public o accepted | Sólo public o accepted; rejected/pending no amplían | Sin proyección | Denegado |
| Participantes: user_id/display_name/username/avatar | Organizador con detalle | Confirmado con detalle | Grant de detalle no habilita lista | Omitido antes de paginar | Denegado |
| Follow/solicitudes/bloqueos | auth.uid autoritativo; resolver sólo solicitudes dirigidas a sí | Sin facultad extra | Sólo relaciones propias | Sin nuevos follows; gestionar sólo propio bloqueo | Denegado |
| DM: id/sender_id/body/created_at | Miembro low/high | Evento no concede DM | Tercero ajeno denegado | Historial legible; envío nuevo denegado | Denegado |
| Avatar/signing | Archivo propio y finalidad avatar | Sin acceso Storage extra | Gateway verifica Auth y gate social | Sin nueva firma | Denegado |
| Realtime | Sólo mensajes/avisos autorizados por RLS | Chat de evento según R4 | Sin datos ajenos | DM histórico; grupo conserva permisos R4 | Denegado |

Amenazas: SELECT/PATCH directo, actor/sender forjado, consultas sociales de blocked/rejected, URL directa de perfil, reutilización de UUID/generación, doble follow/DM, block frente a send/follow/privacy, rollback, grants unlisted confundidos con facultades sociales, path/TTL de avatar controlados por cliente y datos retirados aún en UI. Se distingue SET ROLE SQL local de HTTP JWT real.

## Ejecución reproducible

```powershell
npm ci
npm run build
npm run lint
# Rutas a herramientas locales existentes; no son dependencias de producción.
$env:PLANIT_TEST_TOOLS_DIR='C:/Users/USUARIO/Desktop/PlanIt/mapbox-worktree/.participation-test-tools.local/node_modules'
$env:PLANIT_PLAYWRIGHT_PATH='C:/Users/USUARIO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
# Catálogo obtenido mediante db query READ ONLY, sin filas de usuarios.
$env:PLANIT_R5_FULL_CATALOG='docs/qa/r5-block-10/catalog.json'
node scripts/check-r5-release.mjs sql
node scripts/check-r5-release.mjs ui
node scripts/check-r5-release.mjs regressions
node scripts/check-r5-release.mjs http
node scripts/check-r5-release-audit.mjs
```

Ejecutar cada etapa una sola vez a la vez: los wrappers históricos comparten nombres temporales. El runner permite repetir suites concretas (`sql follows requests blocks`, `ui participants follows`). Las regresiones históricas requieren las herramientas PostgreSQL también en `.participation-test-tools.local/node_modules`; en esta ejecución se usó una junction local ignorada. El runner no instala dependencias ni obtiene credenciales.

Los archivos internos históricos pueden conservar el SHA/nombre de su bloque original; los manifiestos B10 y [el reporte final](../RELEASE_5_TEST_REPORT.md) identifican la base realmente ejecutada. Fixtures UI usan el build real, Auth/REST/WebSocket simulados y datos ficticios; PostgreSQL usa auth.uid y Storage scaffold. Ni esos mocks ni un inventario ACTIVE prueban JWT/Realtime/Storage reales.

## Correcciones de QA

- B2: fixture de relación/contadores actualizado para dependencias B6; se reutiliza la adaptación mínima privada B3 y la regresión administrativa existente. No se relajan aserciones de autorización.
- B4/B5/B6/B7: catálogo read-only actual configurable; las comparaciones anteriores de 28 migraciones no corresponden a las 30 actuales. Los snapshots históricos permanecen intactos.
- B9: delimitador SQL del trigger de fallo inyectado corregido a `$b9$`; conserva rollback y carrera triple. No modifica SQL del producto.
- FollowButton: usa GradientButton compartido para texto blanco sobre tinta; se conserva el secundario al dejar de seguir. Nuevo control de contraste medido en navegador para Seguir/Solicitar seguimiento, en los seis anchos.
- Runners B10: salidas separadas, hashes, tiempos, resultado por suite y servidor del build local; HTTP privado usa su variable de salida propia para no sobrescribir evidencia anterior.

Primeros intentos fallaron por sandbox (TCP local/Edge/DNS), servidor B2 ausente, catálogos históricos y trigger de prueba. Se resolvieron y se repitieron las suites afectadas; el reporte final distingue resultados posteriores y límites pendientes. No se consideran regresiones del producto esos errores del entorno/harness.

## Migraciones y entorno remoto

Creada **0**, probada local nueva **0**, aplicada remota **0**, verificada remota nueva **0**. Replay local de 30 históricas y catálogo remoto actual no equivalen a aplicación SQL. [Catálogo read-only](catalog.json), [inventario Edge](functions.json) y [auditoría](security-audit.json). El catálogo indica PostgreSQL17.11; replay local PostgreSQL18.4.

El inventario actual confirma `social-avatar` ACTIVE v1 con verify_jwt; supera la afirmación histórica de «no desplegada» únicamente en cuanto a existencia. No se desplegó ni cambió configuración en B10. Prueba funcional Auth/Storage/CDN/TTL sigue NOT RUN. C03 acepta URLs emitidas hasta60s y bytes ya descargados no son revocables.

## Revisión humana

Ver [reporte GO/NO-GO y matriz completa](../RELEASE_5_TEST_REPORT.md). Mantener **Implementado; QA pendiente** hasta aceptación expresa, conservando la aprobación histórica B5. No iniciar otra release/bloque ni fusionar o desplegar como continuación automática.
