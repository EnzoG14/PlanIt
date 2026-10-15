# Release 6 — QA integral · Bloque 9

**Decisión: NO-GO. Estado: Implementado; QA pendiente. 0/24 CA aceptados integralmente.**

15/10/2026, Argentina. Base integrada `120d50a2ccfc9fc107b5d01e994c40b493bcbe79`, rama `codex/r6-block-9`. B0–B8 integrados: PR #63–#71, incluido B7 #70 después de la espera acordada. R5 conserva GO/Validado por aceptación humana; no se reclasifican sus NOT RUN técnicos. [Baseline](r6-block-9/git-baseline.txt), [resumen computable](r6-block-9/summary.json), [reproducción](r6-block-9/README.md). HEAD final y PR: [acta de entrega](r6-block-9/delivery.json).

## Resultados y límites

| Capa/suite | Resultado | Evidencia |
| --- | --- | --- |
| sql | 7/7 PASS | [manifiesto](r6-block-9/sql.json) |
| contract | 5/5 PASS | [manifiesto](r6-block-9/contract.json) |
| ui | 6/6 PASS | [manifiesto](r6-block-9/ui.json) |
| r5 | 11/11 PASS | [manifiesto](r6-block-9/r5.json) |
| regression | 16/16 PASS | [manifiesto](r6-block-9/regression.json) |
| checks | 5/5 PASS | [manifiesto](r6-block-9/checks.json) |
| regression-ui | 4/5 PASS | [manifiesto](r6-block-9/regression-ui.json) |
| Catálogo remoto READ ONLY | PASS; PostgreSQL 17.11,37 versiones,16 tablas RLS,88 funciones | [auditoría](r6-block-9/audit.json), [catálogo](r6-block-9/catalog.json) |
| HTTP anónimo real | PASS;9 denegaciones401; no JWT de usuario | [HTTP](r6-block-9/http-anon.json) |
| Service Worker/offline shell | PASS; Edge real, shell anónimo localhost | [PWA](r6-block-9/pwa/results.json) |
| Accesibilidad ampliada | FAIL; foco3px,targets muestreados≥44px,contraste texto/fondo 5.71:1; zoom CSS falla en4 anchos | [mediciones](r6-block-9/accessibility-extended/results.json) |
| JWT autenticado A/B/C/D y Realtime real | BLOCKED; faltan cuentas/fixtures autorizados | No sustituir con SET ROLE/WebSocket simulado |
| Dispositivo físico,instalación/upgrade,lector,zoom nativo,Excel real | NOT RUN | Emulación/parser no certifica estas superficies |
| Aceptación humana R6 | PENDIENTE | Requiere declaración expresa del responsable |

Las suites SQL usan PostgreSQL local real con scaffolds Auth/Storage y claims SQL; no PostgREST autenticado. La UI ejecuta React compilado y SDK real con Auth/REST/WebSocket interceptados. Todas las pruebas nuevas viven en B9: etiquetas SHA históricas dentro de runners heredados no son la versión de esta auditoría; mandan los manifiestos B9 y hashes de fuente. No se copiaron resultados históricos como pruebas nuevas.

## Los 24 CA oficiales

Transcripción literal desde requisitos versionados. Cada fila tiene caso positivo/adversarial, actor,dataset,fuente SHA y aserciones ejecutadas en summary.json. PASS parcial significa cobertura técnica de la suite citada; no prueba de aceptación funcional completa.

| CA | Texto literal | SQL local | UI fixtures | HTTP JWT | Realtime real | Integral | Evidencia |
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

## Seguridad, decisiones e integridad

- RPC owner-only: ocupación,demografía,series,export y comparación; UID/ownership antes de agregar,DEFINER/search_path vacío y EXECUTE authenticated. B7 conserva tres RPC INVOKER restringidas. Productor privado INVOKER sin EXECUTE de clientes. [Firmas/ACL](r6-block-9/audit.json); comparación completa de cuerpos/ACL/config con replay en la suite R5 edit-profile.
- A/B/C/D/anon/sin UID,public/unlisted,cancelled/removed,ended/cancelled/archived; acceso directo y mezcla de IDs rechazada íntegramente. Perfil completo privado; sin DOB/sexo individual/email en DTO/CSV. Realtime publica sólo messages/notifications; no demografía/historial. SQL y mocks no certifican entrega/revocación remota.
- D04/D08 vigentes: k5 y supresión completa por dimensión,edad al día AR; riesgo residual de inferencia temporal/multievento **aceptado expresamente en B3**. No volver a exigir anonimato absoluto ni presentarlo como garantía probada.
- D03: inicial30,presets7/30/90,manual≤366 y semanas parciales; tres flujos por historial. D05/D06: snapshot≤5000filas/10MiB/15s,CSV separados sin demografía; mismo conjunto de buckets que la gráfica y neutralización reversible de fórmulas. D07: aviso atómico por cada episodio libre→lleno,con reintentos,carreras,rollback y rejoin. D09/D10: 2–10 propios de todos los estados; misma fórmula que panel. D01/D11 conservan precisión de presentación y actualización existentes,sin nueva promesa push.
- Historial remoto37/37 y cuerpos coincidentes con replay; B8 aparece aplicada y se verifica por catálogo actual,aunque el seguimiento integrado conservaba1/1/0/0. B9 no aplicó ninguna migración ni creó nuevas. Mantener independientes aplicación histórica y verificación nueva de catálogo.
- Asesores actuales:50 hallazgos WARN de DEFINER authenticated,1 WARN de protección de contraseñas y1 INFO de tabla RLS sin políticas (enlaces server-only). Se mantienen; no son nuevos cambios B9. [Asesores y enlaces de remediación](r6-block-9/advisors.json). npm audit:0 vulnerabilidades, [resultado](r6-block-9/npm-audit.json).

## Defectos, discrepancias y gate

- **P0/P1 de producto confirmados en lo ejecutado: ninguno.** Esto no acredita las capas bloqueadas.
- **P2 R6-B9-01 — desbordamiento con zoom CSS200%:** documento640px a viewport320/360/375/390;768/1280 pasan. La base limita el ancho mínimo a320px; al escalar por2 produce640px y el dock puede recortarse. [Captura390](r6-block-9/accessibility-extended/css-zoom-200-390.png), [mediciones](r6-block-9/accessibility-extended/results.json). Texto200% pasa. Investigar reflow y confirmar con zoom nativo antes de proponer corrección; esta reproducción CSS no se presenta como prueba WCAG de zoom nativo. Sin cambios de producto B9.
- **P2 de harness corregido:** contrato B1 no resolvía imports añadidos B3–B8 al ejecutar un data URL. Se resuelven contra archivos reales; todas las aserciones se conservan. [Intento original](r6-block-9/contract/occupancy/attempt-1/run.json), [repetición](r6-block-9/contract/occupancy/attempt-2/run.json). El probe HTTP inicial usó p_before_created_at en lugar de p_before_at:404 de llamada inválida, no fallo de autorización; [intento](r6-block-9/http-anon-attempt-1.json) y resultado corregido conservados.
- **P2 R6-B9-02 — harness histórico de Mis eventos:** falla la aserción «other routes preserve the current header» en `/me` (1 menú Cuenta observado frente a0 esperado), igual que en B8. El menú coincide con la navegación vigente; no se modifica la expectativa en esta auditoría. [stderr reproducible](r6-block-9/regression-ui/my-events-refresh/attempt-1/stderr.txt). Las fallas quedan además en summary.failures.
- **P2 documental:** STATUS de main aún hablaba de PR #70 pendiente y marcas B8 anteriores; se corrige el corte actual manteniendo las bitácoras históricas. R5 PLAN conserva NO-GO histórico,pero STATUS/reporte/acta posteriores acreditan GO humano. DESIGN.md normativo se mantiene; Impeccable detecta sidecar antiguo y no se regenera.
- **Bloqueos de entrega:** sin JWT autenticado ni Realtime real ni aceptación humana R6. Resolver esos pendientes, revisar hallazgo zoom y todos los FAIL antes del GO. PR draft no autoriza merge/deploy/DDL ni nueva release.

## Auditoría visual Amanecer

App real con fixtures en320/360/375/390/768/1280,fuente local,foco,altura corta,reduced-motion,errores,offline y aislamiento. Revisión visual de comparación320,zoom CSS390 y bandeja1280: composición y datos legibles en tamaño normal,estado por texto,tabla/tarjetas equivalentes y aviso identifica evento. [Capturas](r6-block-9/ui/), [detector mecánico sin hallazgos](r6-block-9/impeccable-detector.json). Muestreo de contraste no acredita toda la interfaz ni lector real.

| Dimensión Impeccable | Nota/4 | Base |
| --- | --- | --- |
| Accesibilidad |3| Foco/contraste/semántica medidos;lector y zoom nativo pendientes |
| Rendimiento |2| EXPLAIN sintético y lazy routes;chunk Mapbox grande y dispositivo sin medir |
| Theming |4| Tokens Amanecer,modo claro aprobado,fuente local;sin tema oscuro requerido |
| Responsive |2| Seis anchos/texto200 pasan;zoom CSS estrecho falla |
| Integridad |4| Producto y jerarquía preservados,detector sin hallazgos |
| Total |15/20| Evaluación acotada,no certificación WCAG ni aceptación |

Recomendación para trabajo posterior autorizado: investigar R6-B9-01 con Impeccable adapt y confirmar el resultado con polish; no ejecutar rediseño ni reparación de sidecar dentro de B9.
