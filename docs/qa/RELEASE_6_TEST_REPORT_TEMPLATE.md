# PlanIt — Release 6 · Plantilla de reporte de QA integral

> **TEMPLATE, NO EVIDENCIA.** Completar al ejecutar el bloque 9. Este archivo no confirma pruebas ni cambios.

**Fecha y corte:** ___  
**SHA base y final:** ___  
**Rama / PR:** ___  
**R5 estado aceptado / bloqueos:** ___  
**R6 GO / NO-GO / PENDIENTE:** PENDIENTE  
**Aprobación del responsable:** NO CONSTA

## Estado de migraciones y despliegue

| Versión SQL | Creada | Validada local | Aplicada remota CON PERMISO | Verificada remota | Evidencia |
| --- | --- | --- | --- | --- | --- |
| — | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |

## Resumen por capa

| Capa | PASS/FAIL/NOT RUN/BLOCKED | Evidencia, actor y limitaciones |
| --- | --- | --- |
| SQL local / ACL / RLS | NOT RUN | — |
| HTTP JWT autenticado A/B/C/D/anon | NOT RUN | — |
| UI real móvil/escritorio | NOT RUN | — |
| Realtime entre sesiones | NOT RUN | — |
| CSV parser e inyección | NOT RUN | — |
| Carreras/rollback aviso full | NOT RUN | — |
| Rendimiento EXPLAIN | NOT RUN | — |
| PWA/dispositivo físico | NOT RUN | — |
| Regresión R1–R5 | NOT RUN | — |
| Aceptación humana | NOT RUN | — |

## Criterios de aceptación

Reproducir las 24 filas exactas de [`RELEASE_6_ACCEPTANCE.md`](RELEASE_6_ACCEPTANCE.md) sin reescribir el texto oficial. Enlazar el caso, evidencias y resultados por capa.

## Incidencias y riesgos

| ID | Severidad | Descripción | Reproducción | Estado |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Determinación de cierre

- GO sólo si 24/24 CA aceptados integralmente, QA de seguridad/privacy, R5 dependencias, migraciones necesarias correctamente aplicadas y aprobadas, regresiones y decisión humana expresas.
- En caso de dependencia pendiente, fuga de datos, CSV vulnerable, notificaciones inconsistentes o tests críticos no ejecutados: NO-GO.
- Nunca afirmar que el bloque ha completado una prueba sin comando/evidencia reales.
