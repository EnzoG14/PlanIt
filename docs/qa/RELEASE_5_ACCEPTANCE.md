# PlanIt — R5 matriz de aceptación (33 CA oficiales)

**Estado inicial:** todas `NOT RUN`; texto aquí es **resumen operativo**, el texto literal normativo permanece en Google Doc «Criterios de aceptación — R1 a R7». No sustituirlo.

| CA | Validación indispensable | Estado | Evidencia |
|---|---|---|---|
| RF-R5-01.CA-01 | lista sólo organizador y confirmed, nunca link-only | NOT RUN | — |
| RF-R5-01.CA-02 | identidad y pertenencia al evento, navegación | NOT RUN | — |
| RF-R5-01.CA-03 | proyección social sin datos restringidos | NOT RUN | — |
| RF-R5-01.CA-04 | vacío o denegado sin mezclar otros eventos | NOT RUN | — |
| RF-R5-02.CA-01 | público autenticado lee perfil autorizado | NOT RUN | — |
| RF-R5-02.CA-02 | sólo eventos públicos accesibles | NOT RUN | — |
| RF-R5-02.CA-03 | REST/RPC sin datos sensibles o credenciales | NOT RUN | — |
| RF-R5-02.CA-04 | sin foto/eventos estado legible | NOT RUN | — |
| RF-R5-03.CA-01 | edición propia + foto persisten | NOT RUN | — |
| RF-R5-03.CA-02 | public/private persiste entre sesiones | NOT RUN | — |
| RF-R5-03.CA-03 | otras vistas reflejan visibilidad | NOT RUN | — |
| RF-R5-03.CA-04 | no editar ajeno ni simular éxito inválido | NOT RUN | — |
| RF-R5-04.CA-01 | privado sin approved muestra exactamente nombre username avatar | NOT RUN | — |
| RF-R5-04.CA-02 | sin datos/eventos privados no autorizados | NOT RUN | — |
| RF-R5-04.CA-03 | approved ve sólo campos seguidores | NOT RUN | — |
| RF-R5-04.CA-04 | API directa aplica mismas restricciones | NOT RUN | — |
| RF-R5-05.CA-01 | público accepted y UI/listas actualizadas | NOT RUN | — |
| RF-R5-05.CA-02 | privado pending sin ampliar lectura | NOT RUN | — |
| RF-R5-05.CA-03 | unfollow revoca; public→private conserva accepted | NOT RUN | — |
| RF-R5-05.CA-04 | no auto-follow ni duplicados | NOT RUN | — |
| RF-R5-06.CA-01 | dueño ve pending | NOT RUN | — |
| RF-R5-06.CA-02 | aceptar concede approved | NOT RUN | — |
| RF-R5-06.CA-03 | rechazar no concede y permite repetir | NOT RUN | — |
| RF-R5-06.CA-04 | sólo dueño; no doble resolve | NOT RUN | — |
| RF-R5-07.CA-01 | DM entre no seguidores; bloquear impide envío y conserva historial | NOT RUN | — |
| RF-R5-07.CA-02 | persistencia mensaje/autor | NOT RUN | — |
| RF-R5-07.CA-03 | orden temporal y separación de chat evento | NOT RUN | — |
| RF-R5-07.CA-04 | tercero no lee ni escribe | NOT RUN | — |
| RF-R5-08.CA-01 | block/unblock tercero, nunca self | NOT RUN | — |
| RF-R5-08.CA-02 | limpia follows bilaterales e impide DM/follow | NOT RUN | — |
| RF-R5-08.CA-03 | historial visible, envío deshabilitado | NOT RUN | — |
| RF-R5-08.CA-04 | unlock mismo DM sin restaurar follows | NOT RUN | — |
| RF-R5-08.CA-05 | chat de evento permanece autorizado | NOT RUN | — |

## Identidades de prueba
A dueño de evento, B confirmed, C lector únicamente de evento oculto por enlace, D ajeno; P perfil público, Q privado, F accepted, R rejected; X/Y DM, Z tercero; K blocker. Usar usuarios ficticios, no exponer tokens reales.

## Resultado por prueba
Cada fila debe adjuntar tipo (`unit`/`SQL local`/`HTTP JWT real`/`Storage`/`Realtime`/`UI`/`revisión humana`), fixture/entorno, SHA, pasos, salida esperada, salida obtenida, evidencia y estado `PASS|FAIL|NOT RUN|BLOCKED`. **PASS de fixture no implica PASS de HTTP real**.

## Reporte final
Crear `docs/qa/RELEASE_5_TEST_REPORT.md` con 33 CA, regresiones R1–R4, fallas conocidas, seguridad, accesibilidad, resultados de scripts, SQL remoto autorizado o no, y decisión GO/NO-GO; validación sólo por aprobación humana expresa.

## Pruebas adicionales vinculantes por decisiones D01–D05 (sin renumerar los 33 CA)

| Caso | CA vinculadas | Resultado esperado | Estado |
|---|---|---|---|
| R5-D01-A | R5-02/04/08 | Bloqueado recibe «Perfil no disponible» sin nombre, username, avatar, bio, contadores ni eventos por UI, REST/RPC, listados | NOT RUN |
| R5-D01-B | R5-07/08 | DM histórico legible para ambas partes durante bloqueo, envío impedido; chat grupal conserva acceso autorizado | NOT RUN |
| R5-D02-A | R5-04.CA-01/03/04 | Privado no aceptado: sólo 3 campos; accepted: 3 + bio + eventos públicos, nunca `unlisted` ni demográficos | NOT RUN |
| R5-D03-A | R5-07.CA-01/04 | No seguidores pueden crear un solo DM sin bloqueo; bloqueo mutuo impide apertura nueva | NOT RUN |
| R5-D04-A | R5-03.CA-02/03, R5-05.CA-03, R5-06.CA-01/02 | Cambio private→public convierte todos los pending no bloqueados en accepted atómicamente; rejected intactos | NOT RUN |
| R5-D04-B | mismos | Reintento idempotente; concurrencia follow/cambio y block/cambio; rollback completo ante error; sin pending residuales | NOT RUN |
| R5-D05-A | R5-07 | Bandeja accesible desde perfil/contextos; sin nuevo tab principal; foco, responsive y navegación | NOT RUN |

**Nota normativa:** los CA oficiales actuales no expresan textualmente la aprobación automática por cambio a público. D04 es una decisión posterior del responsable, aquí documentada como aceptación adicional; actualizar explícitamente la fuente Google Docs cuando se autorice, sin simular que ya estaba acordada allí.

## Auditoría BLOQUE 0 — 14/10/2026

Base `1b77b377e0a335f70bb7458be74122e1de70b43f`, rama `codex/r5-block-0`. Se leyeron los 8 RF y 33 CA literales de Google Docs: [snapshot limitado a CA](r5-block-0/source.json). Todos los estados oficiales y casos D01–D05 siguen **NOT RUN**: las referencias de auditoría no son PASS de aceptación.

[Contratos/amenazas/decisiones](../implementation/RELEASE_5_BLOCK_0_DECISIONS.md), [matriz objetivo A/B/C/D](r5-block-0/authorization-matrix.csv), [inventario remoto read-only](r5-block-0/catalog.json), [replay/comparación de 55 funciones](r5-block-0/comparison.json) y [HTTP anon 5/5 denegado](r5-block-0/http-anon.json). SQL local de catálogo y HTTP sin sesión no equivalen a pruebas JWT reales A/B/C/D, Storage, Realtime o UI. Ninguna migración R5 creada/aplicada; conflictos C01–C03 requieren revisión antes de B1. Build/lint/regresiones de frontend no ejecutados porque el cambio es documental.
