# PlanIt — R6 · Decisiones de producto y pendientes técnicos

**Adenda B5 — 15/10/2026:** [D05/D06 ratificadas](RELEASE_6_BLOCK_5_DECISIONS.md) por aprobación humana del plan: snapshot único sobre paginación,5.000filas/10MiB/15s, CSV separados, formato y neutralización reversible documentados. D04 B3 conservada; sin demografía en CSV. Las propuestas inferiores son antecedentes; no autoriza B6 ni SQL remoto.

**Adenda B4 — 15/10/2026:** [D03 aprobada expresamente](RELEASE_6_BLOCK_4_DECISIONS.md). Inicial30 días incluyendo hoy en Argentina; presets7/30/90, manual≤366, día/semana lunes/parcial. Sólo filtra movimientos históricos. La matriz original debajo conserva su corte histórico; no autoriza B5 ni SQL remoto.

**Adenda posterior B3 (15/10/2026):** el responsable aprobó exactitud actual con riesgo residual y D08. [Decisión y política vigente](RELEASE_6_BLOCK_3_DECISIONS.md) sustituyen el bloqueo D04 de este corte histórico; no constituyen firma integral de B0 ni autorización de B4.

**Versión:** 1.0 · 14/10/2026. **Estado:** siete respuestas expresas del responsable incorporadas. La aprobación de alcance NO equivale a aprobación de firmas SQL, cambios remotos o cierre de un bloque. No modifica los 24 CA oficiales del Google Doc.

**Auditoría B0 — 15/10/2026:** [contratos para revisión y firma](RELEASE_6_BLOCK_0_DECISIONS.md). Conserva A01–A07; detalla D01/D03/D05/D06/D08/D11 sin atribuir aprobación humana. D04: contraejemplos reproducibles prueban que k=5 y supresión complementaria no bastan frente a diferencias temporales/multievento; decisión de garantías bloqueante antes de B3/B5. D12: PR #60/#61 integradas y catálogo vigente comprobado. La matriz debajo conserva el estado de propuesta original; no interpretar la entrega como autorización B1.

## Acuerdos confirmados por el responsable (14/10/2026)

1. **Inscripciones, no check-in (A01):** “inscripciones confirmadas”; ocupación = `confirmed_count / capacity`, excluye organizador y canceladas/removidas. No prometer asistencia presencial.
2. **Evolución por tipo (A02):** presentar **altas nuevas, reincorporaciones y bajas como series separadas**; usar transiciones históricas verificadas. No etiquetar esa visualización como ocupación histórica ni acumular reingresos como altas.
3. **Demografía por rangos (A03):** agrupar edades/sexo y proteger grupos pequeños. Umbral inicial técnico sugerido `k=5`, a verificar en B0 con supresión complementaria; “sí, agrupa” no definió tamaños exactos ni fecha de corte de edad.
4. **Dos exportaciones (A04):** un **CSV de asistentes** y un **CSV de estadísticas**, separados. Excluir fecha de nacimiento, sexo individual, correo y datos privados. El formato con `;` y UTF-8 BOM es recomendación técnica, no decisión explícita del usuario.
5. **Avisos recurrentes (A05):** avisar cuando la inscripción confirmada completa cupo y **volver a avisar** si se liberó una plaza y un movimiento posterior vuelve a llenarlo; sin duplicados por reintentos y con efecto transaccional. No incluye automáticamente cambios sólo por edición de cupo.
6. **Comparación amplia (A06):** permitir eventos **propios** públicos/ocultos, activos/finalizados/cancelados/archivados, con estado explícito, 2 a 10 eventos por comparación, ocupación actual coherente en todos.
7. **Dependencia R5 (A07):** el responsable informa que R5 ya está en **GO**. Se verificó en `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` que `RELEASE_5_TEST_REPORT.md` registra “GO por aceptación humana. Estado: Validado”, y `RELEASE_5_STATUS.md` conserva la misma aceptación. B0 sigue comprobando PR integrados y alcance de QA técnico antes de construir sobre dependencias.

## Matriz D01–D12: respuesta, recomendación o pendiente

| ID | Estado | Contrato adoptado / detalle que falta cerrar | Gate |
| --- | --- | --- | --- |
| D01 | **APROBADO en esencia** | confirmed / capacity; representación a **1 decimal** es propuesta de UI | B1/B2 |
| D02 | **APROBADO** | tres series independientes: alta, reincorporación, baja; no inventar histórico neto | B4 |
| D03 | **PENDIENTE TÉCNICO** | Presets sugeridos 7/30/90 días y rango personalizado ≤366 días, lunes al inicio de semana y zona Argentina; B0 congela | B4 |
| D04 | **APROBADO en principio / PRECISIÓN PENDIENTE** | bandas demográficas y supresión; umbral inicial **k=5 propuesto**, corroborar ausencia de diferencias inferibles | B3/B5 |
| D05 | **APROBADO en categoría / CAMPOS PENDIENTES** | CSV asistentes separado; sólo datos autorizados. Propuesta: evento, username, nombre visible, estado confirmado, fecha de inscripción; sin identificadores privados | B5 |
| D06 | **APROBADO: 2 CSV / FORMATO PENDIENTE** | CSV de estadísticas distinto; propuesta: UTF-8 BOM, `;`, validación CSV injection, límite de filas documentado | B5 |
| D07 | **APROBADO para inscripciones** | aviso por **cada episodio** lleno→libre→lleno; duplicados de mismo episodio prohibidos. Edición de capacity no origina aviso por sí sola sin nuevo acuerdo | B6 |
| D08 | **PENDIENTE TÉCNICO** | edad a fecha de consulta vs fecha del evento; buckets `<18,18–24,25–34,35–44,45–54,55+` propuestos | B3 |
| D09 | **APROBADO** | todos los eventos propios, incluidos unlisted, terminados, cancelados y archivados, con estado visible | B2/B8 |
| D10 | **APROBADO** | comparación de **2 a 10 eventos propios únicos**, confirmados y porcentaje actual, mismo método | B8 |
| D11 | **PENDIENTE TÉCNICO** | re-fetch autoritativo al entrar, después de mutaciones y manual; Realtime sólo campana/notificaciones. Dashboards push-vivo no solicitado | B2/B7 |
| D12 | **DEPENDENCIA SUPERADA, OTRAS AUTORIZACIONES VIGENTES** | R5 GO/Validado según repositorio; B0 valida base. Cada bloque mantiene autorización para SQL remoto, deploy, PR merge y siguiente bloque | B0 y todos |

## Pendientes que resolverá B0 sin volver a preguntar decisiones contestadas

- Umbral de privacidad y mecanismo de supresión complementaria (D04), con tests contra inferencia por sumas y diferenciales; si se requiere decidir entre garantías alternativas, documentar el bloqueo antes de B3.
- Campos exactos/corte temporal en CSV de asistentes, formato de delimitación y tamaño/paginación (D05/D06), sin incluir datos de perfil privados.
- Presets y límites temporales (D03), método de cálculo etario/bandas (D08), refresco del dashboard (D11).
- Validar integración real de R5 B10, SHA, migraciones, ACL y Realtime; GO humano no convierte automáticamente verificaciones HTTP/JWT no ejecutadas en PASS.
- Aclaración técnica: si una persona pasa de `removed/cancelled` a `confirmed`, clasificar como **reincorporación**; si pasa de `confirmed` a `cancelled/removed`, clasificar como **baja**; `NULL→confirmed` es **alta**. Desglosar bajas por motivo opcionalmente, conservando tres series primarias.

## Origen y precedencia

Las respuestas anteriores son aprobación de **comportamientos R6**, posteriores al Google Doc. Permanecen literales los RF y los 24 CA. Si hay divergencia de alcance con el documento normativo, registrar una adenda de decisión y solicitar actualización separada; ningún prompt debe modificar el Google Doc automáticamente.

