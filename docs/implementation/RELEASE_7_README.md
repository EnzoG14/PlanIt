# Release 7 — Paquete de implementación

## Cómo usar este paquete

1. Revisar `../requirements/RELEASE_7_REQUIREMENTS.md`: **7 RF/29 CA oficiales**, sin ediciones de Codex.
2. Tomar las decisiones de producto ya **CONFIRMADAS** en `RELEASE_7_DECISIONS_PROPOSED.md`; cerrar las cuestiones técnicas pendientes (D06 ya está aprobada) en `RELEASE_7_BLOCK_0_DECISIONS_TEMPLATE.md`.
3. Leer `RELEASE_7_PLAN.md` y **`RELEASE_7_PARALLEL_WORK.md`**; ejecutar **varios prompts en paralelo cuando NO tengan dependencia ni solapamiento de archivos**, según `RELEASE_7_PARALLEL_WORK.md`. Cada bloque termina en PR draft, evidencia y revisión humana.
4. Mantener `RELEASE_7_STATUS.md` actualizado y completar `../qa/RELEASE_7_ACCEPTANCE.md`, `RELEASE_7_TEST_PLAN.md` y `RELEASE_7_TEST_REPORT_TEMPLATE.md`.

## Bloques y dependencias

| Bloque | Resultado principal | Requiere |
|---|---|---|
| B0 | Auditoría, decisiones, contratos y plan de migración | — |
| B1 | Esquema/Storage multimedia + autorización y pruebas | B0 GO |
| B2 | RPC chat con adjunto y lectura idempotente | B1 |
| B3 | UI chat imagen y regresión DM | B2 |
| B4 | Publicación de historias backend | B1 |
| B5 | Publicación + **visor Instagram** secuencial/autoplay | B4 |
| B6 | Expiración estricta y garbage collection | B4 (independiente de B5) |
| B7 | `.ics` + enlace directo Google Calendar (sin OAuth) | B0 (contratos técnicos; D06 confirmada) |
| B8 | Web Share y enlace seguro | B0 |
| B9 | Subscripciones Web Push + service worker | B0 |
| B10 | Entrega segura Web Push/cola/observabilidad | B9 |
| B11 | QA 29 CA, regresiones y acta GO/NO-GO | B3/B6/B7/B8/B10 |

**Desarrollo paralelo recomendado:** Ola 1 = B1+B7+B8+B9; ola 2 = B2+B4+B10; ola 3 = B3+B5+B6, siempre que los prerequisitos individuales estén integrados; B11 compone y verifica. B5/B7/B8 no editan `EventDetailPage.tsx` ni `src/App.tsx` durante sus ramas: integrador único B11.

**Sprints funcionales:** Sprint 1 R7-01..03 (B1–B5); Sprint 2 R7-04..07 (B6–B10). B0/B11 transversales.

## Instrucción esencial

R6 se **presume correcta para esta planificación**, pero no se reescriben documentos de R6 ni se atribuyen `PASS` retrospectivos. Ningún archivo de este paquete es una migración aplicada, PR integrada ni evidencia de ejecución.

Para asignar tareas a dos personas, usar el cuadro del capítulo 3 de `RELEASE_7_PARALLEL_WORK.md`. Cada bloque se detiene al cerrar **su PR**, no exige que los demás bloques esperen.