# PlanIt — Paquete de planificación Release 6

**R6 vigente:** «Gestión avanzada y analítica» — 6 RF oficiales, 24 criterios de aceptación, 2 sprints. **Fecha de fotografía:** 14/10/2026.  
**Estado:** documentación con decisiones A01–A07 aprobadas, **cero bloques R6 ejecutados**. R5 consta **GO por aceptación humana** en `main`. Antes de ejecutar R6 auditar BD y dependencias y aprobar independientemente cada PR, migración remota o despliegue. No se modificó el código ni Supabase por preparar este paquete.

## Fuentes prevalentes

1. Google Docs «[Nueva planificación — RF R1 a R7](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.6cfgj0znk3o)», «Criterios de aceptación — R1 a R7» y «Especificación técnica — R1 a R7».
2. [`../requirements/RELEASE_6_REQUIREMENTS.md`](../requirements/RELEASE_6_REQUIREMENTS.md) transcribe los 6 RF y 24 CA literales. Ningún comentario técnico del paquete debe suplantar el texto.
3. Repositorio `EnzoG14/PlanIt` `main` commit verificado `66e24d85f32123ecd70f457f8381c68ae5af1603`, reglas `AGENTS.md`, modelo/SQL real y `DESIGN.md` (Amanecer). Verificar HEAD al iniciar implementación.
4. [`RELEASE_6_DECISIONS_PROPOSED.md`](RELEASE_6_DECISIONS_PROPOSED.md) separa **acuerdos A01–A07 aprobados** de detalles técnicos pendientes; no afirmar que se incorporaron al Google Doc.

## Decisiones ya confirmadas

A01 confirmado vs check-in; A02 tres series temporales independientes (altas, reincorporaciones, bajas); A03 edades/sexo agrupados con protección de cohortes pequeñas; A04 dos CSV separados; A05 aviso renovable por episodio lleno→libre→lleno; A06 comparación 2–10 de propios públicos/ocultos en cualquier estado; A07 R5 GO humano validado en `main`. Los detalles todavía abiertos (umbral exacto, rango temporal, columnas CSV, formato y edad de referencia) se resuelven técnicamente en B0 con las decisiones de producto preservadas.

## Inventario de entregables

| Archivo | Propósito |
| --- | --- |
| [`RELEASE_6_PLAN.md`](RELEASE_6_PLAN.md) | Arquitectura, alcance, base inspeccionada, RPC, seguridad, modelos de KPIs, privacidad, CSV, alertas, bloques y DoD |
| [`../requirements/RELEASE_6_REQUIREMENTS.md`](../requirements/RELEASE_6_REQUIREMENTS.md) | Contrato funcional oficial literal, 6 RF/24 CA |
| [`RELEASE_6_DECISIONS_PROPOSED.md`](RELEASE_6_DECISIONS_PROPOSED.md) | 7 acuerdos aprobados, 12 registros D01–D12, precisiones técnicas pendientes |
| [`RELEASE_6_BLOCK_0_DECISIONS_TEMPLATE.md`](RELEASE_6_BLOCK_0_DECISIONS_TEMPLATE.md) | Plantilla B0 para contratos verificados, pendientes, permisos y SHA |
| [`RELEASE_6_STATUS.md`](RELEASE_6_STATUS.md) | Seguimiento transparente por bloque, migraciones y evidencia |
| [`prompts/RELEASE_6_BLOCK_0.md`](prompts/RELEASE_6_BLOCK_0.md) … [`BLOCK_9.md`](prompts/RELEASE_6_BLOCK_9.md) | 10 prompts autocontenidos de implementación secuencial con stops/gates |
| [`../qa/RELEASE_6_ACCEPTANCE.md`](../qa/RELEASE_6_ACCEPTANCE.md) | Matriz 24 CA, 24/24 `NOT RUN` inicialmente |
| [`../qa/RELEASE_6_TEST_PLAN.md`](../qa/RELEASE_6_TEST_PLAN.md) | Pruebas funcionales, SQL/JWT, amenazas, concurrencia, CSV, responsive y regresiones |
| [`../qa/RELEASE_6_TRACEABILITY.csv`](../qa/RELEASE_6_TRACEABILITY.csv) | Matriz tabular 24 CA para revisión/importación externa |
| [`../qa/RELEASE_6_TEST_REPORT_TEMPLATE.md`](../qa/RELEASE_6_TEST_REPORT_TEMPLATE.md) | Plantilla del reporte QA final, sin resultados inventados |

## Secuencia (no ejecutar en una sola sesión)

| Orden | Bloque | Entrega |
| --- | --- | --- |
| Preparación | **B0** | Auditoría read-only y aprobación de definiciones, permisos, CSV y alertas |
| Sprint 1 | **B1** | RPC owner-only de ocupación con RLS/ACL |
| Sprint 1 | **B2** | Panel KPIs y navegación desde gestión |
| Sprint 1 | **B3** | Demografía agregada protegida |
| Sprint 1 | **B4** | Evolución por período e históricos |
| Sprint 2 | **B5** | CSV autorizados y seguros |
| Sprint 2 | **B6** | Notificación transaccional al completar cupo |
| Sprint 2 | **B7** | Bandeja + campana + Realtime del nuevo aviso |
| Sprint 2 | **B8** | Comparación de eventos propios |
| Cierre | **B9** | QA integral/24 CA/regresiones y GO/NO-GO humano |

**Cómo usar cada prompt:** copiar/adjuntar sólo el prompt del bloque activo al agente de código. El prompt ordena leer otros archivos y no implementar bloques siguientes. Antes de cada PR, verificar branch/HEAD y integración de dependencias; no trabajar contra PR no fusionadas como si fueran base aprobada. Documentar pruebas ejecutadas por capa. Cualquier migración remota, despliegue, cambios en `main` y transición al bloque siguiente requieren autorización expresa. No utilizar proyecto Supabase antiguo.

**Puerta de entrada vigente:** `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` contiene `RELEASE_5_TEST_REPORT.md` y `RELEASE_5_STATUS.md` con **GO por aceptación humana, Validado (14/10/2026)**. B0 comprobará SHA y dependencias integradas; las limitaciones técnicas de R5 siguen identificadas. Decisiones R6 A01–A07 ya respondidas, sin autorización de SQL remoto, deploy ni merge.
