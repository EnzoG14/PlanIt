# PlanIt — Release 4: seguimiento de implementación

**Actualización de planificación R4 v1.2 (13/10/2026):** esta edición documental parte del `main` `a378259a6010`, con Amanecer v3.0 integrado (PR #27–#34). La línea de base anterior del 12/10 y los pasos del bloque 0 son históricos/propuestos: **no** acreditan ejecución ni QA R4. Leer `RELEASE_4_VISUAL_INTEGRATION.md`, `DESIGN.md`, `docs/design/UI_WORKFLOW.md`. R3 confirmada validada por el responsable; informe QA versionado conserva NO-GO por falta de E2E/aceptación humana documentada; reportar esa brecha de evidencia sin reabrir A07.


**Corte inicial:** 12/10/2026 (Argentina). **Estado:** planificación documental preparada; **0/39 CA verificadas**, ningún bloque R4 implementado ni aprobado según esta entrega. No confundir diseño, artefactos preparados o SQL de ejemplo con implementación.

**Decisiones del responsable (12/10/2026):** A01–A07 aprobadas; **R3 integrada y validada por confirmación expresa**, sujeto únicamente a comprobación técnica de dependencias en `main`. **Fuentes:** `RELEASE_4_PLAN.md`, `../requirements/RELEASE_4_REQUIREMENTS.md`, `RELEASE_4_DECISIONS_PROPOSED.md`, `../qa/RELEASE_4_ACCEPTANCE.md`.

**Estados permitidos:** Pendiente · En curso · Implementado; QA pendiente · Bloqueado · Validado. Sólo aceptación humana expresa habilita «Validado».

| Bloque | Alcance | RF / CA | Estado | Rama/PR | Evidencias | Migración local/remota | Pendientes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Auditoría y contratos | transversal | Pendiente | — | — | — | Verificar dependencias técnicas R3/main/SQL/PNG; no reabrir aceptación R3 |
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

### Bloque 0 — Pendiente
- SHA base: —
- Auditoría de esquema y RLS real: no ejecutada.
- Mockup R4 revisado visualmente: no ejecutado.
- Contratos/decisiones aprobadas: **A01–A07 cerradas 12/10/2026;** demás detalles técnicos pendientes de Bloque 0.

### Bloques 1–9 — Pendientes
- Sin actas, pruebas ni PR de R4 en esta entrega documental.
