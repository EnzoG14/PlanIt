# PlanIt — Release 6 · Matriz de aceptación y evidencia

**Fuente literal:** `../requirements/RELEASE_6_REQUIREMENTS.md`, 24 CA. **Versión:** 0.1, 14/10/2026. **Aceptación integral de todos los CA: NOT RUN**. Ni documentación, ni auditoría, ni test unitario aislado otorgan aceptación integral.

**B0 — 15/10/2026:** auditoría documental/catálogo entregada, sin ejecución funcional R6. [24 CA literales y traza a contratos](r6-block-0/traceability.json), [resultados baseline](r6-block-0/audit.json), [límites y pendientes](r6-block-0/README.md). Se mantienen **0/24 aceptados** y todas las capas de esta matriz NOT RUN. Riesgo D04 anti-diferencias bloquea B3/B5; revisión/firma humana B0 y aprobación de B1 pendientes.

**B3 — 15/10/2026:** [implementación y pruebas por capa](r6-block-3/README.md), [adenda humana D04/D08](../implementation/RELEASE_6_BLOCK_3_DECISIONS.md). Exactitud actual con riesgo residual aceptado; no se afirma anonimato. CA01/03/04 parcialmente cubiertos SQL local/UI fixtures; CA02 pertenece a B4. HTTP JWT real e integral NOT RUN. Migración B3 1/1/1/1 tras aplicación remota autorizada; HTTP JWT real sigue NOT RUN. El bloqueo D04 en el corte B0 anterior es histórico.

**B9 — 15/10/2026:** QA integral ejecutada sobre B0–B8 integrados,base120d50a. [Reporte](RELEASE_6_TEST_REPORT.md) y [24 casos/evidencias por capa](r6-block-9/summary.json). **NO-GO,0/24 aceptados integralmente**: JWT/Realtime reales bloqueados y firma humana pendiente;UI con fixtures y SQL no los sustituyen. D04 B3 vigente,con riesgo residual aceptado.

## Convenciones de QA

**B7 remoto — 15/10/2026:** aplicada/verificada `20261015201034` con autorización humana posterior; marcas **1/1/1/1**, historial36/36, cuerpos/firmas/ACL/RLS y preservación de productor/historial/publicación PASS en READ ONLY. [Acta](r6-block-7/remote/summary.json). No cambia el alcance de las pruebas UI con fixtures ni convierte HTTP JWT/Realtime reales o aceptación integral en PASS. El corte local B7 siguiente es histórico.

**B7 — 15/10/2026:** [bandeja `event_full`, navegación y evidencia](r6-block-7/README.md). Nombre actual autorizado, archivado/sin ownership genérico y target NULL; CA02/04 parcialmente cubiertos SQL local y UI con fixtures. Regresión productor B6 y DM/seguimiento PASS. Migración B7 **1/1/0/0**; HTTP JWT/Realtime reales e integral siguen NOT RUN. No se altera la aceptación humana R5 ni se declara R6 validada.

**B6 remoto — 15/10/2026:** migración aplicada/verificada con autorización humana, marcas1/1/1/1; cuerpo, trigger, ACL/RLS y rechazo de ejecución directa comprobados en READ ONLY. [Acta](r6-block-6/remote/summary.json). No se elevan HTTP JWT, UI/Realtime ni aceptación integral desde esta verificación de catálogo.

**B4 — 15/10/2026:** [D03 aprobada](../implementation/RELEASE_6_BLOCK_4_DECISIONS.md); [RPC, selector y evidencia](r6-block-4/README.md). Cinco CA parcialmente cubiertos por SQL local y UI con fixtures. Migración1/1/1/1 tras aplicación remota autorizada y verificación; HTTP JWT real e integral NOT RUN, sin avance a B5.

`PASS` únicamente con aserciones y evidencia efectivamente ejecutadas en una capa; `FAIL` fallo comprobado; `BLOCKED` dependencia/permiso impide ejecución; `NOT RUN` no ejecutado. Registrar por separado capas `SQL-local`, `HTTP-JWT-real`, `UI-browser`, `Realtime/PWA` (cuando aplique) y `Aceptación-integral`. `PASS SQL-local` no convierte automáticamente la última columna a `PASS`. Fixture: A organizador, B confirmado, C cancelado/removido o link-only, D otro organizador, anon; entre 0 y 1.000 participaciones sintéticas. Los datos reales privados nunca se guardan en reportes.

## Matriz oficial: 24 criterios

| CA | Texto literal | SQL | UI fixtures | HTTP JWT | Realtime real | Integral | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-R6-01.CA-01 | El organizador puede ver para uno de sus eventos el cupo configurado, inscripciones vigentes, lugares disponibles y porcentaje de ocupación. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-01.CA-02 | Los lugares disponibles corresponden al cupo menos las inscripciones vigentes, sin mostrar valores negativos; el porcentaje es consistente con esos datos. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-01.CA-03 | Las altas y bajas de participantes modifican los indicadores después de actualizar los datos. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-01.CA-04 | El usuario no puede consultar el panel de gestión de eventos ajenos mediante acceso directo. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-02.CA-01 | El organizador puede acceder a estadísticas de uno de sus eventos y visualizar distribuciones de asistentes por edad y sexo cuando existan datos autorizados. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-02.CA-02 | El panel permite consultar la evolución de nuevas inscripciones dentro de una ventana inicial definida, de forma coherente con los registros del evento. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-02.CA-03 | Las cantidades y agrupaciones son consistentes con el conjunto de asistentes considerado; se especifica cuándo faltan datos para algún grupo. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-02.CA-04 | Si no hay suficientes datos se muestran indicadores vacíos o informativos, sin gráficos con valores inventados. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-03.CA-01 | El organizador puede elegir entre períodos disponibles o un intervalo válido de análisis para su evento. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-03.CA-02 | Al cambiar el período, se recalculan y actualizan los indicadores temporales utilizando sólo datos comprendidos en el intervalo seleccionado. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-03.CA-03 | El sistema rechaza fechas de inicio posteriores a la fecha final y presenta un mensaje claro. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-03.CA-04 | Los resultados de un período distinto no permanecen visibles como si correspondieran al nuevo filtro, y la consulta sólo considera eventos autorizados. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-04.CA-01 | El organizador puede solicitar un archivo CSV de asistentes y estadísticas de uno de sus eventos. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-04.CA-02 | El archivo generado contiene encabezados identificables y valores consistentes con los datos autorizados y los filtros aplicados. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-04.CA-03 | El archivo puede abrirse con herramientas de lectura CSV y no incluye información privada que el organizador no tenga autorización para exportar. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-04.CA-04 | Si no existen datos o la exportación falla, el sistema lo informa y no presenta una exportación incompleta como exitosa. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-05.CA-01 | Cuando un evento alcanza su cupo máximo mediante una inscripción confirmada, se registra un aviso dirigido al organizador. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-05.CA-02 | El aviso identifica el evento que alcanzó su capacidad y está disponible en la bandeja de notificaciones de la cuenta correspondiente. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-05.CA-03 | No se genera un aviso de cupo completo mientras queden lugares disponibles. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-05.CA-04 | El evento no genera avisos duplicados por reintentos del mismo cambio de estado y otras cuentas no pueden consultar el aviso privado. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-06.CA-01 | El organizador puede seleccionar al menos dos eventos de su autoría para incluirlos en una comparación. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-06.CA-02 | La comparación muestra, para cada evento seleccionado, la cantidad de inscriptos y el porcentaje de ocupación utilizando el mismo criterio de cálculo. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-06.CA-03 | Al cambiar los eventos seleccionados, la vista se actualiza y permite identificar las diferencias entre sus valores. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |
| RF-R6-06.CA-04 | No se permite incluir eventos ajenos ni presentar un porcentaje inválido cuando un evento no tiene un cupo utilizable; se informa esa situación. | PASS parcial | PASS parcial | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |

### Fuente oficial íntegra para la revisión

No reinterpretar la columna «Verificación mínima propuesta» como reemplazo de los textos. Para aprobar cada CA, leer la descripción literal correspondiente en `../requirements/RELEASE_6_REQUIREMENTS.md`, registrar prueba reproducible, dataset y actor, comprobación de permisos directa y aceptación humana.

## Gate global

- 24/24 CA satisfechos integralmente, con evidencias trazables y revisión del responsable.
- A/B/C/D/anon; public/unlisted; estados confirmed/cancelled/removed; evento open/ended/cancelled/archived.
- Sin filtración demográfica en SELECT/RPC/exportación/errores/Realtime, incluso bajo tamaños pequeños y filtros combinables.
- Inscripciones concurrentes y duplicación de avisos; CSV formula injection y fallos parciales; coherencia de series históricas/ocupación.
- Build/lint, SQL replay/ACL, pruebas HTTP autenticadas y UI/PWA reales cuando procedan; regresiones R1–R5 y especificación Amanecer.
- Gate humano GO/NO-GO. Si sólo se corren fixtures/mock o se carece de despliegue autorizado, dejar integral `NOT RUN/BLOCKED`, NO-GO.


**B2 — 15/10/2026:** panel RF-R6-01 implementado; evidencia UI con fixtures y límites en [reporte B2](r6-block-2/README.md). No modifica los 24 CA ni atribuye aceptación integral. B3 pendiente de aprobación humana.
