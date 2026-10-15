# R6 · Bloque 6 — Productor de aviso de cupo completo

**Implementado; QA pendiente.** Sólo RF-R6-05.CA-01,03,04 servidor y D07. Sin UI nueva ni implementación de B7. Base integrada `9ba2f687cfad0ad0997d8d5a9c7f8eca83659dc1`; rama `codex/r6-block-6`. Fetch y PR #68 MERGED comprobados el 15/10/2026. [Resumen computable](summary.json). R5 mantiene su GO humano previo; no implica aceptación integral R6.

## Contrato e invariantes

- Migración `20261015185020_r6_event_full_notifications.sql`, generada con `supabase migration new`. **Creada 1 / probada local 1 / aplicada remota autorizada 0 / verificada remota 0**. No se ejecutó SQL remoto, deploy ni merge.
- Nueva función `planit_private.notify_event_full() → trigger`, VOLATILE, SECURITY INVOKER, `search_path=''`; EXECUTE revocado a PUBLIC/anon/authenticated. No nueva RPC ni cambios de firmas/ACL de las RPC existentes.
- Trigger `participations_notify_event_full`, AFTER INSERT OR UPDATE OF status sobre `event_participations`. Omite estados distintos de confirmed y UPDATE confirmed→confirmed. No modifica el trigger de historial.
- `register_for_event` y `resolve_rejoin` autorizan en servidor, rechazan snapshots congelados, bloquean evento antes de participación y confirman una sola fila por llamada. El productor vuelve a tomar el lock ya poseído y consulta el conteo derivado, excluyendo organizador. Sólo notifica si la confirmación completa exactamente capacity y el evento no está cerrado.
- INSERT en `notifications` dentro de la misma transacción, recipient=organizador, event_id real, type=`event_full`, título «Cupo completo», cuerpo genérico; actor_id y conversation_id NULL. Sin PII de participante ni título privado copiado al texto.
- Idempotencia por transición real y serialización del evento; no tabla auxiliar, contador redundante ni UNIQUE global que impida episodios posteriores. Salida/remoción libera; una inscripción/reincorporación que completa de nuevo emite otro aviso, incluso del mismo usuario. Reintentar confirmed no modifica fila ni historial.
- Editar capacidad no dispara el productor. Reducir al conteo actual no avisa; ampliar y después llenar mediante inscripción sí. Sin backfill de eventos llenos anteriores. Eventos cancelados/archivados/finalizados y organizador no generan avisos.
- Cualquier error de INSERT se propaga: revierte inscripción, historial y resolución de reingreso. RLS recipient-only y UPDATE sólo de read_at permanecen intactos; la notificación no concede acceso al evento.

La garantía corresponde a las mutaciones autorizadas de producto: las dos RPC confirman una fila bajo lock. Los clientes carecen de INSERT/UPDATE/DELETE de participaciones. Una futura carga administrativa masiva o RPC que cambie varias confirmaciones en una sentencia debe revisar el productor AFTER ROW antes de introducir ese nuevo camino; este bloque no añade ese contrato administrativo.

## Verificación reproducible

```powershell
npm run check:r6:event-full
npm run check:r6:event-full:regressions
npm run build
npm run lint
```

PostgreSQL **17.5** local efímero, 35 migraciones reproducidas, Auth/Storage scaffold SQL, SET ROLE con A propietario, B/C participantes, D tercero, anon y authenticated sin UID. No transporte Supabase real. Los procesos de prueba requirieron acceso TCP localhost fuera del sandbox.

| Capa | Resultado / evidencia | Límite |
| --- | --- | --- |
| SQL específico + base social | PASS, 41 grupos, [resultados](sql/sql-results.json), [salida/harness](sql/harness.json) | Incluye 72 audiencias sociales y 13 carreras heredadas; no JWT |
| Carreras B6 | PASS, ocho esperas de lock observadas | Mismo actor; última plaza ambos órdenes; rollback del primero; salida/remoción; aprobación; edición de capacidad |
| Atomicidad B6 | PASS | Fallo inyectado en INSERT de aviso para alta, reactivación cancelled y aprobación removed; rollback explícito y visibilidad antes de commit |
| ACL/RLS/triggers | PASS, [catálogo local](sql/catalog.json) | Acceso directo real SQL; no REST ni entrega Realtime |
| Performance | PASS comprobaciones de conteo, [20 muestras por tamaño y EXPLAIN ANALYZE BUFFERS](sql/benchmark.json) | 0/1/10/100/1000; máximo observado <1 ms por consulta en esta corrida; no SLA remoto ni benchmark de carga concurrente |
| Regresiones | PASS: 11 suites SQL R5 + 16 R1–R5 + 4 aisladas; [manifiesto](regressions/results.json), [R5 SQL](regressions/r5-release/sql.json), [R1–R5](regressions/r5-release/regressions/regressions/regressions.json) | Aserciones existentes, evidencia redirigida; referencias históricas de rama/base en salidas hijas no sustituyen el manifiesto B6 |
| Build/lint | PASS | Avisos previos de chunks grandes, probes de QA y DiscoveryFilters; sin cambios de frontend |
| HTTP/JWT real | NOT RUN | Requiere entorno/fixtures autorizados y migración aplicada |
| UI/Realtime/PWA/dispositivos | NOT RUN | Sin UI nueva; bandeja y entrega real corresponden a B7 |
| Aceptación integral | NOT RUN | No se autovalidan CA ni release |

Regresión R5: se ejecuta el mismo runner de `npm run check:r5:release` para SQL y regresiones mediante copia temporal, cambiando sólo la ruta de evidencia y etiqueta de rama. Las suites antiguas B4–B7 comparan por defecto catálogos anteriores a R6: el wrapper proporciona las definiciones/ACL/RLS históricas auditadas en B0 y un manifiesto explícito de las migraciones locales actuales. [Origen y versiones](regressions/catalog-manifest.json). Los archivos hijos llamados `remote-comparison.json` comparan ese fixture local; **no acreditan una lectura ni verificación remota nueva**. El catálogo específico del trigger B6 se comprueba aparte.

Incidencias de ejecución: primer intento sandbox denegó TCP local; se repitió fuera del sandbox. Un fixture histórico estaba sin confirmar en otra sesión y fue corregido. La primera corrida de cuatro suites R5 encontró catálogos históricos incompatibles; se repitieron con el fixture descrito. La suite aislada R1 de participaciones necesitaba crear el rol local `service_role`; se repitió con la misma adaptación de scaffold usada por el wrapper R5. Se conservaron las aserciones funcionales y los archivos de QA anteriores. [Repetición de catálogos](regressions/catalog-retry.json), [repetición de participaciones](regressions/participations-retry.json); el manifiesto final conserva las marcas de intentos previos fallidos.

## Cobertura y revisión

- CA-01: primera/última inscripción, aprobación de reingreso, evento oculto con grant, destinatario y payload correcto.
- CA-03: plazas libres, edición de cupo, rechazos, estados cerrados, rollback y carrera de reducción de capacidad.
- CA-04: reintento tras respuesta perdida, carreras de usuarios/sesiones independientes, nuevo episodio legítimo, lectura/escritura directa ajena/anon negada.
- CA-02 queda en B7: las comprobaciones del payload B6 no acreditan bandeja, navegación o entrega Realtime.

Inventario: una migración, dos scripts de verificación, dos comandos npm, esta evidencia, plan/estado y matriz de aceptación R6. Diseño Amanecer, fuentes normativas de RF/CA y migraciones históricas sin cambios. `.env.local` de la copia local de main se conservó en el mismo checkout, ignorado y sin versionar.

Riesgos pendientes: aplicación y verificación remotas expresamente autorizadas, pruebas JWT/Realtime reales, revisión humana y aceptación integral. B7 requiere instrucción humana independiente. Commit funcional `3932449`; [PR #69 draft](https://github.com/EnzoG14/PlanIt/pull/69). El commit documental posterior sólo enlaza la entrega; HEAD final se consulta en Git/PR para evitar una referencia circular dentro del propio commit.
