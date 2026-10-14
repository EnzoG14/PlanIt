# PlanIt — R5 matriz de aceptación (33 CA oficiales)

**Corte B5 (14/10/2026):** RF-R5-04.CA01..04 PASS parcial SQL/UI, CA04 HTTP anónimo real; **NOT RUN integral** hasta JWT/Storage reales y aceptación humana. D01-A/D02-A parcial SQL/UI. B0–B4 integrados; B5 autorizado. [Fuente literal nueva](r5-block-5/source.json), [contrato/evidencia](r5-block-5/README.md). Sin nuevas migraciones, deploy ni merge.

**Corte B4 (14/10/2026):** RF-R5-03.CA01..04 con PASS parcial SQL/UI y GET HTTP anónimo; **NOT RUN integral** hasta JWT autenticado, Storage/CDN reales y aceptación humana. B0–B3 integrados; B4 autorizado. [Fuente literal](r5-block-4/source.json), [entrega/evidencia](r5-block-4/README.md). POST remoto de escritura BLOCKED por revisión automática; sin migraciones nuevas/deploy/merge.

**Corte B3 (14/10/2026):** RF-R5-02.CA01..04 con PASS parcial SQL/UI y HTTP anónimo; **NOT RUN integral** hasta JWT autenticado, avatar real y aceptación humana. B0–B2 integrados (#50–#52), B3 autorizado. [Fuente literal nueva](r5-block-3/source.json), [entrega/evidencia](r5-block-3/README.md). No modifica CA históricos ni acepta B4.

**Corte B2 (14/10/2026):** R5-01.CA01..04 tienen PASS parcial SQL/UI y HTTP anónimo; continúan NOT RUN integral hasta JWT autenticado, avatar real y aceptación humana. B1 integrado por PR #51. [Lectura literal nueva](r5-block-2/source.json), [entrega B2](r5-block-2/README.md). Cortes anteriores conservados como antecedentes.

**Estado inicial:** todas `NOT RUN`; texto aquí es **resumen operativo**, el texto literal normativo permanece en Google Doc «Criterios de aceptación — R1 a R7». No sustituirlo.

**Corte B1 (14/10/2026):** las 33 filas siguen NOT RUN **integral** porque no hay UI social, HTTP JWT/transporte remoto ni aceptación humana. Hay verificaciones parciales de seguridad SQL y unit gateway PASS, vinculadas más abajo; no equivalen a aprobar un CA completo. [Fuente literal nueva](r5-block-1/source.json), [contrato B1](../implementation/RELEASE_5_BLOCK_1_CONTRACT.md).

| CA | Validación indispensable | Estado | Evidencia |
|---|---|---|---|
| RF-R5-01.CA-01 | lista sólo organizador y confirmed, nunca link-only | NOT RUN integral; PASS parcial SQL/UI | [B2](r5-block-2/README.md) |
| RF-R5-01.CA-02 | identidad y pertenencia al evento, navegación | NOT RUN integral; PASS parcial SQL/UI | [B2](r5-block-2/README.md) |
| RF-R5-01.CA-03 | proyección social sin datos restringidos | NOT RUN integral; PASS parcial SQL/UI | [B2](r5-block-2/README.md) |
| RF-R5-01.CA-04 | vacío o denegado sin mezclar otros eventos | NOT RUN integral; PASS parcial SQL/UI | [B2](r5-block-2/README.md) |
| RF-R5-02.CA-01 | público autenticado lee perfil autorizado | NOT RUN integral; PASS parcial SQL/UI | [B3](r5-block-3/README.md) |
| RF-R5-02.CA-02 | sólo eventos públicos accesibles | NOT RUN integral; PASS parcial SQL/UI | [B3](r5-block-3/README.md) |
| RF-R5-02.CA-03 | REST/RPC sin datos sensibles o credenciales | NOT RUN integral; PASS parcial SQL/UI/HTTP anon | [B3](r5-block-3/README.md) |
| RF-R5-02.CA-04 | sin foto/eventos estado legible | NOT RUN integral; PASS parcial SQL/UI | [B3](r5-block-3/README.md) |
| RF-R5-03.CA-01 | edición propia + foto persisten | PASS parcial SQL/UI; NOT RUN integral | [B4: evidencia y límites](r5-block-4/README.md) |
| RF-R5-03.CA-02 | public/private persiste entre sesiones | PASS parcial SQL/UI; NOT RUN integral | [B4: evidencia y límites](r5-block-4/README.md) |
| RF-R5-03.CA-03 | otras vistas reflejan visibilidad | PASS parcial SQL/UI; NOT RUN integral | [B4: evidencia y límites](r5-block-4/README.md) |
| RF-R5-03.CA-04 | no editar ajeno ni simular éxito inválido | PASS parcial SQL/UI; NOT RUN integral | [B4: evidencia y límites](r5-block-4/README.md) |
| RF-R5-04.CA-01 | privado sin approved muestra exactamente nombre username avatar | PASS parcial SQL/UI; NOT RUN integral | [B5: evidencia y límites](r5-block-5/README.md) |
| RF-R5-04.CA-02 | sin datos/eventos privados no autorizados | PASS parcial SQL/UI; NOT RUN integral | [B5: evidencia y límites](r5-block-5/README.md) |
| RF-R5-04.CA-03 | approved ve sólo campos seguidores | PASS parcial SQL/UI; NOT RUN integral | [B5: evidencia y límites](r5-block-5/README.md) |
| RF-R5-04.CA-04 | API directa aplica mismas restricciones | PASS parcial SQL/UI/HTTP anon; NOT RUN integral | [B5: evidencia y límites](r5-block-5/README.md) |
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

### Cobertura nueva de B2

Base `1bcef5af3397b54bae8cc18e6336092639c2b964`; `codex/r5-block-2`. Estado Implementado; QA pendiente. [Resultados/capturas/reproducción](r5-block-2/README.md).

| CA | Resultado/capa | Cobertura nueva | Pendiente integral |
| --- | --- | --- | --- |
| R5-01.CA-01 | PASS SQL local/UI + HTTP anon | Dueño/confirmed; grant-only/ajeno/anon/removido/retirado/revocado denegados; administración separada | JWT autenticado y revisión humana |
| R5-01.CA-02 | PASS SQL local/UI | 34 identidades mismo evento; páginas30+4; perfil mínimo/regreso validado; respuesta tardía descartada | Cuentas reales/fotos y aceptación |
| R5-01.CA-03; D01-A parcial | PASS SQL local/UI | Allowlist4 campos, privado mínimo; bloqueo bilateral filtrado antes de cursor; enlace directo neutro; fallback avatar | Gateway/Storage TTL/CDN/JWT reales y D01 transversal |
| R5-01.CA-04 | PASS SQL local/UI | Vacío/denegado/error/retry, limpiar al revalidar/paginar/cambiar ruta/sesión | Transporte autenticado real/aceptación |
| R1–R4 | PASS regresión local | 13 suites SQL;72 grupos UI administrativos, sólo fixture confirmed adaptado al acceso B2 | No nueva aceptación histórica |
| Diseño/accesibilidad B2 | PASS parcial UI | 66 grupos sociales; seis anchos, texto200%, Enter/foco3px, capturas reales antes/después Amanecer, mockup intacto | Dispositivo/teclado móvil/lector reales |

No migraciones nuevas en los cuatro estados. Catálogo remoto READ ONLY28/16RLS/79 funciones coincide; HTTP anon4/4 rechazos. No gateway desplegado ni33 CA aprobados. **B3 requiere autorización expresa.**

### Fixtures
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

## BLOQUE 1 — pruebas parciales de seguridad nuevas

Base `da4379f58ba60ddfa4c3d03970103b381856996b`, rama `codex/r5-block-1`. [SQL local](r5-block-1/sql-results.json), [unit gateway](r5-block-1/avatar-unit.json), [13 regresiones](r5-block-1/regressions.json), [comandos/límites](r5-block-1/README.md). Fixtures A/B/C/D +anon con SET ROLE en PostgreSQL18.4 y Auth/Storage scaffold; no JWT real ni transporte. Nuevo catálogo read-only histórico25/55 PASS; no DDL remoto. Estado Implementado; QA pendiente.

| CA/casos relacionados | Parte verificada | Resultado/capa | Parte pendiente para aceptación |
| --- | --- | --- | --- |
| R5-01.CA-01/03/04 | dueño/confirmed + detalle; grant-only/removido/revocado negados; proyección paginada sin bloqueados | PASS SQL local | UI/navegación, HTTP JWT y casos integrales B2 |
| R5-02.CA-01/02/03; R5-04.CA-01..04; D01-A/D02-A | allowlist tres mínimos/bio sólo public/accepted, ocultos excluidos, SELECT íntegro negado, 72 audiencias, bloqueo bilateral | PASS SQL local | UI/perfiles/Storage real y aceptación B3/B5 |
| R5-03.CA-02/03/04; D04-A/B | owner, PATCH visibility/avatar negado, 0/1/N pendientes, rejected intacto, conservación accepted, rollback inyectado y carreras | PASS SQL local | aviso/formulario/UI/persistencia entre sesiones, foto/transporte B4 |
| R5-05.CA-01..04; R5-06.CA-01..04 | public/accepted, private/pending, generación renovada tras rechazo, stale resolve negado, unfollow/idempotencia/listas/contadores filtrados | PASS SQL local | interfaz/botones, timeout/reconciliación y JWT B6/B7 |
| R5-07.CA-01..04; R5-08.CA-01..05; D01-B/D03-A | DM canónico, cuerpo/autor/clock/cursor/UUID retry, tercero negado, bloqueo/cleanup bilateral, historial/grupo intactos, unlock sin restore, carreras | PASS SQL local | PWA/Realtime/HTTP JWT e interfaces B8/B9 |
| R5-02/03/04; C03 | owner/purpose/metadata/cacheControl/avatar, firma socialTTL60 fija, Auth y recheck bloqueo, sin SELECT/path tercero | PASS SQL local + unit fetch simulado | headers/expiración CDN/Storage, Edge Deno y deploy autorizados |
| R1–R4 | 13 suites existentes con todas las migraciones; C01 names neutros y C02 permisos evento independientes | PASS local | no nueva aceptación R1–R4 ni E2E real por estas suites |
| D05-A; diseño/accesibilidad | B1 sin pantallas ni tab primario nuevo; mockup intacto | NOT RUN UI; integridad editorial PASS | UI de consumidores, responsive/foco/retorno y aceptación |

C02/C03 aprobados por el responsable durante B1 y registrados en contrato; C01 aplicado según D01 sin alterar facultades de administración. D04 Google Docs pendiente de autorización separada. Migraciones R5 creadas3/probadas local3/**aplicadas3/verificadas remotas3** con autorización posterior del 14/10/2026: [acta](r5-block-1/REMOTE_MIGRATION.md). Catálogo/ACL/RLS/79 funciones/smoke READ ONLY PASS; no prueba funcional HTTP JWT ni aceptación de CA. No continuar B2 sin aprobación.

## BLOQUE 5 — verificación específica de privacidad

[Entrega B5](r5-block-5/README.md):36 audiencias privadas SQL nuevas +72 B1/13 carreras,79 grupos UI de build real con fixtures y5 rechazos HTTP anónimos. CA-01 mínimo sin eventos; CA-02 demográficos/ocultos excluidos; CA-03 accepted sólo bio/públicos; CA-04 mismas restricciones en SQL directo/RPC y denegación HTTP anónima. D01-A/D02-A PASS parcial SQL/UI, NOT RUN integral. Reconciliación de revocación entre RPC y páginas verificada; no equivale a JWT autenticado/Storage/Realtime real ni aceptación humana. Migraciones nuevas0 en los cuatro estados.
