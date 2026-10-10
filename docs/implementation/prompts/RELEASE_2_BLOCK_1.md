# Codex — R2, BLOQUE 1: Inicio, categorías y detalle ampliado

**Requisitos funcionales y CA oficiales:** `docs/requirements/RELEASE_2_REQUIREMENTS.md`. Leé la sección de los RF correspondientes; la copia local tiene prioridad operativa frente a depender de acceso a Google Docs. No cambies sus textos sin aprobación.

**RF:** R2-01, R2-02 y R2-03 (12 CA).

Leé docs/implementation/RELEASE_2_PLAN.md (**B, C, D/BLOQUE 1, E y F**), RELEASE_2_STATUS.md, los RF/CA originales en Planificación, las instrucciones AGENTS y docs/design/mockups/release-2.png (pantallas 1 y 2). Trabajá desde main actualizado en rama propia.

Implementá Inicio con eventos públicos vigentes, próximos y agrupados por categoría; navegación al detalle ampliado con organizador, imágenes y los datos reales de R1. Reutilizá componentes y servicios, sin acoplar Inicio a Leaflet. **Nunca abrir perfiles privados a terceros**: crear una proyección mínima segura si hace falta. No implementar favoritos, filtros avanzados, asistentes identificados ni datos ficticios.

Validá RF-R2-01/02/03.CA-01..04, RLS, vacíos, fotos faltantes, móvil y regresión R1. Documentá pruebas verdaderas y migraciones propuestas, si las hubiera. Actualizá status, prepará PR y detenete. **No SQL remoto ni merge sin autorización**.
