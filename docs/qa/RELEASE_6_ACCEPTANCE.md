# PlanIt — Release 6 · Matriz de aceptación y evidencia

**Fuente literal:** `../requirements/RELEASE_6_REQUIREMENTS.md`, 24 CA. **Versión:** 0.1, 14/10/2026. **TODOS los CA: NOT RUN**. Ni documentación, ni auditoría, ni test unitario aislado otorgan aceptación integral.

**B0 — 15/10/2026:** auditoría documental/catálogo entregada, sin ejecución funcional R6. [24 CA literales y traza a contratos](r6-block-0/traceability.json), [resultados baseline](r6-block-0/audit.json), [límites y pendientes](r6-block-0/README.md). Se mantienen **0/24 aceptados** y todas las capas de esta matriz NOT RUN. Riesgo D04 anti-diferencias bloquea B3/B5; revisión/firma humana B0 y aprobación de B1 pendientes.

## Convenciones de QA

`PASS` únicamente con aserciones y evidencia efectivamente ejecutadas en una capa; `FAIL` fallo comprobado; `BLOCKED` dependencia/permiso impide ejecución; `NOT RUN` no ejecutado. Registrar por separado capas `SQL-local`, `HTTP-JWT-real`, `UI-browser`, `Realtime/PWA` (cuando aplique) y `Aceptación-integral`. `PASS SQL-local` no convierte automáticamente la última columna a `PASS`. Fixture: A organizador, B confirmado, C cancelado/removido o link-only, D otro organizador, anon; entre 0 y 1.000 participaciones sintéticas. Los datos reales privados nunca se guardan en reportes.

## Matriz oficial: 24 criterios

| CA | Verificación mínima propuesta | SQL | HTTP-JWT | UI | Realtime (si aplica) | Integral | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-R6-01.CA-01 | evento capacity=10 con 4 confirmed/cancelled/removed; propietario y evento archivado | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-01.CA-02 | aserción capacity=10, confirmed=4, avail=6, percent=40; sin contar organizador | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-01.CA-03 | registrar/retirar/remover/reincorporar y refrescar; reconciliar | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-01.CA-04 | actor B confirmed, C link-only, D ajeno, anon contra ruta/RPC/REST | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-02.CA-01 | propietario; demografía optativa mixta sin fuga, 0/1/5/10 participantes | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-02.CA-02 | historial registration y rejoin dentro de ventana inicial; bins conocidos | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-02.CA-03 | NULLs, fechas límite, sexo otros, coherencia de cohortes y privacidad | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-02.CA-04 | cohortes diminutas suprimidas, 0 datos y error versus gráfico falso | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-03.CA-01 | presets y rango personalizado; boundaries en Argentina | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-03.CA-02 | dos rangos disjuntos producen series distintas y sólo movimientos respectivos | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-03.CA-03 | desde > hasta, rango excesivo y fecha malformada devuelven error seguro | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-03.CA-04 | cambio rápido de filtro/reorden de respuestas, evento ajeno y unlisted link-only | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-04.CA-01 | descarga propietario dos CSV distintos, asistentes y estadísticas (acuerdo A04) | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-04.CA-02 | cabeceras, encoding/quoting, filtros y cifras coinciden con RPC | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-04.CA-03 | Excel/CSV parser y ataques fórmula =,+,-,@, tabs/saltos; excluir PII | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-04.CA-04 | 0 filas/fallo chunk/timeout, revocación/permisos; no descarga de archivo parcial | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-05.CA-01 | última inscripción confirmed bajo lock llena capacity y crea 1 notificación | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-05.CA-02 | recipient organizador, event_id, type y target seguro, bandeja | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-05.CA-03 | con 1 lugar disponible no aviso; reintento/rollback y concurrencia | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-05.CA-04 | 2 usuarios simultáneos; nadie más lee, no dup tras respuesta ambigua | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-06.CA-01 | selector de al menos dos eventos organizados | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-06.CA-02 | dos eventos cap10/4 y cap20/15 deben mostrar 40% y 75% | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-06.CA-03 | cambiar filtro y revalidar resultados; eventos finalizados/archivados | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |
| RF-R6-06.CA-04 | mix propio+ajeno rechaza totalidad; cap0 legacy/NULL controlado; UI no NaN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | — |

### Fuente oficial íntegra para la revisión

No reinterpretar la columna «Verificación mínima propuesta» como reemplazo de los textos. Para aprobar cada CA, leer la descripción literal correspondiente en `../requirements/RELEASE_6_REQUIREMENTS.md`, registrar prueba reproducible, dataset y actor, comprobación de permisos directa y aceptación humana.

## Gate global

- 24/24 CA satisfechos integralmente, con evidencias trazables y revisión del responsable.
- A/B/C/D/anon; public/unlisted; estados confirmed/cancelled/removed; evento open/ended/cancelled/archived.
- Sin filtración demográfica en SELECT/RPC/exportación/errores/Realtime, incluso bajo tamaños pequeños y filtros combinables.
- Inscripciones concurrentes y duplicación de avisos; CSV formula injection y fallos parciales; coherencia de series históricas/ocupación.
- Build/lint, SQL replay/ACL, pruebas HTTP autenticadas y UI/PWA reales cuando procedan; regresiones R1–R5 y especificación Amanecer.
- Gate humano GO/NO-GO. Si sólo se corren fixtures/mock o se carece de despliegue autorizado, dejar integral `NOT RUN/BLOCKED`, NO-GO.
