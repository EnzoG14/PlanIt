# R6 · Bloque 1 — Ocupación exclusiva del organizador

15/10/2026 (Argentina). **Implementado; QA pendiente.** Base integrada `1ee60e3a1636c0ec181782343100d44b5f08be1e`, rama `codex/r6-block-1`. [PR #64 en borrador](https://github.com/EnzoG14/PlanIt/pull/64). HEAD de implementación `56dcb4bb662dd80e45878a30fa43f541d30455e4`; commits posteriores sólo enlazan seguimiento. HEAD final en la entrega. Sin B2 ni aceptación integral de CA.

## Alcance y seguridad

Fetch confirmó PR #63 integrada en main. El pedido humano habilita B1 sin atribuir firma retroactiva a todos los contratos B0. R5 mantiene GO humano de #61, conservando sus NOT RUN. A01–A07 sin cambios; D01 adopta DTO B0 numérico sin redondeo, formato es-AR de hasta un decimal; D04 no interviene.

Inventario: migración nueva, `src/features/analytics/{api,types,format}.ts`, dos runners, corrección mínima del wrapper de regresión (evita crear dos veces service_role cuando ya existe en scaffold), evidencia y seguimiento. Sin UI/rutas/panel ni cambios de mockups o DESIGN. `.env.local` copiado byte a byte de `mapbox-worktree` (main local), ignorado/no versionado; checkout original intacto.

`public.get_my_event_occupancy(p_event_id uuid) returns jsonb`, PL/pgSQL STABLE SECURITY DEFINER. DEFINER necesario: participaciones tiene RLS de filas propias; INVOKER produciría conteo incompleto. No amplía políticas ni reutiliza la autorización del resumen público R1. EXECUTE revocado a PUBLIC/anon/authenticated y otorgado sólo a authenticated; `search_path=''`, objetos calificados, sin SQL dinámico. auth.uid NULL→42501 authentication_required. El origen agregado exige organizer_id=auth.uid incluso con cero participantes. Ajeno/público/oculto/inexistente/NULL→42501 event_unavailable, sin IDs ni resultados parciales. Grant de detalle,follow,confirmed/chat no conceden analítica.

Una sentencia/snapshot devuelve event_id,title,event_state,as_of,capacity,confirmed_count,available_spots,occupancy_percent,capacity_usable. LEFT JOIN sólo confirmed,excluye organizer. Disponibles=max(capacidad-confirmados,0); porcentaje=100 numeric×confirmados/nullif(capacidad,0). CHECK histórico capacity>0 protege denominador; parser rechaza DTO inconsistente sin inventar cero; formateador usa N/D para número inválido. Estados archived>cancelled>ended>open, igual que R1. Corte statement_timestamp en Argentina,sin zona ni Z. No check-in ni ocupación histórica ni contador redundante.

Sin tablas,triggers,políticas,índices o grants de tablas nuevos ni lectura privada de profiles/history. Se inspeccionaron migraciones de eventos,participaciones,reincorporación,acceso oculto y sociales. Se conserva participations_event_status_idx(event_id,status),PK events y UNIQUE(event_id,user_id). EXPLAIN no justifica otro índice. Lectura sin locks: representa datos confirmados del snapshot,no reserva futura.

## Reproducción y evidencia

```powershell
npm ci --no-audit --no-fund
$env:PLANIT_TEST_TOOLS_DIR='../.participation-test-tools.local/node_modules'
node scripts/check-r6-occupancy.mjs
node scripts/check-r6-occupancy-contract.mjs
npm run build
npm run lint
# Suites históricas buscan herramientas en .participation-test-tools.local
$env:PLANIT_SQL_OUTPUT='docs/qa/r6-block-1/regression'
node scripts/check-r5-regressions.mjs participations rejoin attendees
git diff --check
```

SQL sólo conecta localhost/PostgreSQL efímero; no acepta URL remota. Auth/Storage scaffolds y SET ROLE no prueban JWT/PostgREST. [Replay](sql/sql-results.json), [salida](sql/harness.json), [EXPLAIN ANALYZE BUFFERS](sql/occupancy-explain.json), [contrato](contract.json), [regresiones](regression/regressions.json).

| Capa | Resultado y límite |
| --- | --- |
| SQL nuevo + social heredado | PASS PostgreSQL18.4,31 migraciones desde cero,29 grupos;72 audiencias/13 carreras sociales y última plaza R6 |
| Fórmulas | PASS:0;4 confirmed+2 cancelled+1 removed→4/6/40%;retorno→5;capacity15→10 disponibles/33,333…%;ended/cancelled/archived conservan conteo;paridad R1 |
| ACL/roles directos | PASS owner incluso oculto/archivado;confirmed/grant/follow/tercero/anon/UID ausente denegados;error ajeno/inexistente uniforme |
| Carrera cupo1 | PASS espera de lock real;segunda confirmación falla event_full;1 confirmado/0 disponibles/100% |
| Regresión R1/R3 | PASS suites históricas participations, rejoin y attendees con todas las migraciones; scaffold corregido, aserciones intactas |
| DTO/formato/adaptador | PASS inconsistencia y Z rechazados;es-AR un decimal;AbortSignal;errores permiso/red/payload sin éxito falso;transporte simulado |
| Build/PWA | PASS,81 entradas precache;aviso chunk Mapbox >500kB existente |
| Lint | PASS con18 advertencias preexistentes;ninguna de archivos nuevos |
| HTTP/JWT real | NOT RUN;migración sin aplicar y sin cuentas de fixture autorizadas |
| UI/accesibilidad/dispositivos | NOT RUN;B1 no agrega interfaz;panel B2 |
| Realtime | NOT RUN;sin suscripciones/productor nuevos |
| Catálogo remoto/advisors | NOT RUN B1;snapshot READ ONLY B0 no equivale a consulta actual |

20 muestras por tamaño0/1/10/100/1000: p95 local aprox0,53/0,24/0,27/0,28/0,51ms. Fixtures sintéticos,no SLA remoto;planes/buffers en JSON. Benchmark multi-evento queda en B8.

Incidencias resueltas: sandbox bloqueó TCP localhost,replay repetido con permiso local;build inicial sin dependencias,npm ci lo resolvió. Suites históricas requirieron junction local ignorada a herramientas existentes y wrapper corregido para no duplicar service_role;no se relajaron aserciones. Sin secretos en evidencia.

## CA y puerta de salida

| CA | Cobertura B1 | Integral |
| --- | --- | --- |
| RF-R6-01.CA-01 | DTO/fórmulas SQL;visualización pendiente B2 | NOT RUN |
| RF-R6-01.CA-02 | Cálculo manual40%,fracción sin redondeo,no negativos | PASS parcial SQL |
| RF-R6-01.CA-03 | Reconsulta tras estado/cupo;refresco panel pendiente B2 | PASS parcial SQL |
| RF-R6-01.CA-04 | SQL directo por rol/ownership/ACL;JWT y ruta pendientes | PASS parcial SQL |
| RF-R6-06 | Fórmula de soporte;sin comparativa implementada | NOT RUN |

Migración `20261015130739_r6_organizer_occupancy.sql`: **creada sí / probada local sí / aplicada remota no / verificada remota no**. Restan revisión humana,aplicación remota autorizada y HTTP autenticado. Riesgo entorno: PostgreSQL18.4 local frente a17.11 inventariado B0;SQL compatible con17,no sustituye prueba remota. Sin merge,deploy,db push,fixtures remotos ni edición Google Docs. B2 requiere permiso independiente. Detenerse en B1.
