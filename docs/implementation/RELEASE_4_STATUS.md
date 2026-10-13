# PlanIt — Release 4: seguimiento de implementación

**Actualización de planificación R4 v1.2 (13/10/2026):** esta edición documental parte del `main` `a378259a6010`, con Amanecer v3.0 integrado (PR #27–#34). La línea de base anterior del 12/10 y los pasos del bloque 0 son históricos/propuestos: **no** acreditan ejecución ni QA R4. Leer `RELEASE_4_VISUAL_INTEGRATION.md`, `DESIGN.md`, `docs/design/UI_WORKFLOW.md`. R3 confirmada validada por el responsable; informe QA versionado conserva NO-GO por falta de E2E/aceptación humana documentada; reportar esa brecha de evidencia sin reabrir A07.


**Corte de ejecución:** 13/10/2026 (Argentina). **Estado:** BLOQUE 0 documental implementado; QA/revisión humana pendiente. **0/39 CA funcionales verificadas**; 39/39 trazadas y comparadas con la fuente original. Bloques 1–9 pendientes. La auditoría no implementa funcionalidades ni corrige seguridad R4.

**Decisiones del responsable (12/10/2026):** A01–A07 aprobadas; **R3 integrada y validada por confirmación expresa**, sujeto únicamente a comprobación técnica de dependencias en `main`. **Fuentes:** `RELEASE_4_PLAN.md`, `../requirements/RELEASE_4_REQUIREMENTS.md`, `RELEASE_4_DECISIONS_PROPOSED.md`, `../qa/RELEASE_4_ACCEPTANCE.md`.

**Estados permitidos:** Pendiente · En curso · Implementado; QA pendiente · Bloqueado · Validado. Sólo aceptación humana expresa habilita «Validado».

| Bloque | Alcance | RF / CA | Estado | Rama/PR | Evidencias | Migración local/remota | Pendientes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Auditoría y contratos | transversal | Implementado; QA pendiente | `codex/r4-block-0`; [PR #38](https://github.com/EnzoG14/PlanIt/pull/38) en borrador | [Auditoría](RELEASE_4_BLOCK_0_DECISIONS.md), [evidencia nueva](../design/verification/r4-block-0/README.md) | Ninguna creada/aplicada; remoto no inspeccionado | Revisión humana de contratos; seguridad/CA funcionales en bloques posteriores |
| 1 | Texto + categorías | 01/02, 8 CA | Pendiente | — | — | — | API y UI |
| 2 | Fecha + radio | 03/04, 8 CA | Pendiente | — | — | — | TZ y mapa/lista |
| 3 | Intereses | 05, 4 CA | Pendiente | — | — | — | Tabla y RLS |
| 4 | Sugerencias | 06, 4 CA | Pendiente | — | — | — | Ranking |
| 5 | Seguridad ocultos | transversal 07–09 | Pendiente | — | — | — | RLS, RPC, media |
| 6 | Visibilidad y links | 07, 5 CA | Pendiente | — | — | — | Token y create/edit |
| 7 | Canje y detalle | 08, 5 CA | Pendiente | — | — | — | Grant y login |
| 8 | Revocación | 09, 5 CA | Pendiente | — | — | — | Historial y cupo |
| 9 | QA / cierre | todos, 39 CA | Pendiente | — | — | — | Casos real/fixture y aceptación |

## Procedimiento por bloque

1. Registrar SHA `main` base, rama y PR, versiones SQL locales/remotas verificadas, permisos de pruebas autorizados y dependencias integradas.
2. Documentar archivos y rutas editados, firmas RPC y migraciones; todo `SECURITY DEFINER` nuevo debe tener justificación de privilegios/grants.
3. En CA por bloque indicar: PASS/FAIL/NOT RUN/BLOCKED; tipo de prueba (`unit`, `fixture`, `local SQL`, `HTTP JWT A/B`, `Storage`, `UI navegador`, `revisión visual`) y prueba reproducible.
4. Mencionar números de usuarios ficticios en fixtures, sin correos reales, secretos, tokens ni keys en evidencia.
5. Registrar posibles regresiones en `R1–R3`, screenshots comparativos con mockups, dispositivos, problemas conocidos y análisis de seguridad.
6. Diferenciar migración **creada**, **probada localmente**, **aplicada remotamente con permiso** y **verificada**.
7. No pasar a «Validado» sin la revisión de 39 CA y aceptación humana; cada PR debe detenerse para revisión.

## Actas de ejecución

### Bloque 0 — Implementado; QA pendiente

- **Base/rama:** fetch de origin; `main` `42af4e42d032637b1363e207714e86c297d8c3b1` → `codex/r4-block-0`, checkout independiente bajo home e índice CodeGraph propio. Cambio previo de `vite.config.ts` en D:/planit preservado/excluido. [PR #38](https://github.com/EnzoG14/PlanIt/pull/38) documental en borrador; base/head verificados al crearla.
- **Entrega:** decisiones verificadas/propuestas/no inspeccionadas diferenciadas; rutas/scopes/props, contratos Auth y retorno, inventario estático SQL/RLS/EXECUTE, 39 filas de trazabilidad y 288 combinaciones de autorización objetivo. Sin rutas vacías ni SQL nuevo.
- **Dependencias:** Git acredita R3 #18–#25 y refresh #27–#34 integrados; base también incluye #35–#37. RPC/migraciones de cierre/duplicación/reincorporación presentes. A07 mantiene aceptación confirmada; STATUS/TEST_REPORT R3 conservan NO-GO/E2E pendiente como brecha documental, sin afirmar nuevas pruebas remotas ni reabrir aceptación.
- **Esquema inspeccionado:** 17 migraciones, 11 tablas públicas con RLS declarado, 31 funciones públicas de negocio, 12 privadas y 20 políticas finales declaradas. Tablas R4 ausentes en Git. Firmas, dependencias, search_path/EXECUTE y hashes en [inventario](../design/verification/r4-block-0/sql-inventory.json). Catálogos remotos, drift efectivo, roles/advisors y replay no inspeccionados/ejecutados.
- **Riesgos priorizados:** events_select_participating y RPC summary/organizer/rejoin admiten histórico sin grant; chat confirmed no verifica grant oculto; media hereda autorización transitoria y URLs actuales de 300 s. Registrar reparación obligatoria en bloque 5 antes de habilitar ocultos. No vulnerabilidad remota explotada ni seguridad corregida por esta documentación.
- **Decisiones:** A01–A07 preservadas. Usuario eligió el 13/10 D12 revocar enlace al volver público, conservando grants, y D14 TTL objetivo 60 s para multimedia oculta. Defaults restantes se registran como propuestas técnicas, no aprobaciones funcionales adicionales. Login SPA con token sólo en memoria; confirmar email/recargar exige reabrir enlace.
- **Fuente original:** Google Drive read-only, pestañas vigentes de RF/CA/especificación/modelo consultadas; 39/39 textos de CA coinciden tras normalizar sólo Unicode/espacios. Contrato literal y estados Pendiente intactos.
- **Visual:** release-4.png abierto (1491×1055), cinco experiencias históricas contrastadas con Amanecer y lab /b/home/map/profile/event; paneles de enlaces/grants no están en collage. Base inmutable: 10 PNG app en móvil/escritorio y 4 lab; SVG de prueba identificados, mapa fallback sin proveedor real. Fondo/fuente/scopes/dock/overflow medidos. Sin cambios a DESIGN, sidecar, tokens, reportes ni QA histórica; desfases de documentación visual registrados.
- **Verificación:** comparación original, trazabilidad, inventario estático, capturas Edge con Auth/REST/Storage interceptados y WebSocket bloqueado, enlaces/hashes/alcance, sintaxis de herramientas de evidencia y git diff --check. Build/lint NO EJECUTADOS: diff exclusivamente documental. SQL local, HTTP/JWT A/B, Storage/Realtime reales, dispositivos físicos y 39 CA funcionales NO EJECUTADOS.
- **Pendientes/fin:** revisión humana de la auditoría; sin cambios remotos, proyecto antiguo, merge, deploy ni Validado. Detenerse con esta PR, sin iniciar bloque 1.

### Bloques 1–9 — Pendientes
- Sin actas, pruebas ni PR de R4 en esta entrega documental.
