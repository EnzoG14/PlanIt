# PlanIt · Paquete documental de implementación Release 7

Preparado el **15/10/2026** con lectura de `EnzoG14/PlanIt` `main`, especificación Google Doc y patrones R6. **No incluye implementación ni migraciones SQL ejecutables**, sólo planificación y prompts. R6 se presume funcionalmente correcta tal como pidió el responsable.

## Índice

- `docs/requirements/RELEASE_7_REQUIREMENTS.md` — 7 RF / 29 CA **literales**.
- `docs/implementation/RELEASE_7_PLAN.md` — arquitectura actualizada, escenarios, riesgos y DoD.
- `docs/implementation/RELEASE_7_PARALLEL_WORK.md` — **DAG, tareas para 2–4 personas, ownership, worktrees y merges/migraciones**.
- `docs/implementation/RELEASE_7_DECISIONS_PROPOSED.md` — decisiones de producto confirmadas y puntos técnicos pendientes.
- `docs/implementation/RELEASE_7_BLOCK_0_DECISIONS_TEMPLATE.md` — acta B0.
- `docs/implementation/RELEASE_7_README.md` — guía de ejecución B0..B11.
- `docs/implementation/RELEASE_7_STATUS.md` — seguimiento inicial.
- `docs/implementation/prompts/RELEASE_7_BLOCK_0.md` a `_11.md` — 12 prompts aislados **adaptados a ejecución concurrente por dependencias**.
- `docs/qa/RELEASE_7_ACCEPTANCE.md` — matriz oficial CA vs test/resultado.
- `docs/qa/RELEASE_7_TEST_PLAN.md` — pruebas SQL/HTTP/Storage/UI/SW/Edge/PWA.
- `docs/qa/RELEASE_7_TEST_REPORT_TEMPLATE.md` — acta final sin resultados falsos.
- `docs/qa/RELEASE_7_TRACEABILITY.json` — mapping estructurado RF/CA/sprint/bloque.

**Estado de incorporación:** documentos propuestos en una rama documental mediante pull request hacia `main`; no representan implementación ni cambios de producción. **No se modificó Supabase ni Google Doc.** El README principal de la aplicación se conserva.

Fuentes: [https://github.com/EnzoG14/PlanIt](https://github.com/EnzoG14/PlanIt) y [https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), pestañas Planificación nueva, Criterios de aceptación y Especificación técnica.

**Ajustes posteriores:** historias en visor Instagram, Web Push con vistas previas, imagen sola en chat, Google Calendar por enlace + `.ics` confirmados, sin máximo de historias, y trabajo paralelo. Las pruebas y migraciones siguen sin ejecutarse.