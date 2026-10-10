# Codex — R2, BLOQUE 4: bandeja de notificaciones

**RF:** R2-07 (4 CA).

Leé docs/implementation/RELEASE_2_PLAN.md (**B, D/BLOQUE 4, E y F**), RELEASE_2_STATUS.md, el diseño de notifications en docs/database.md/documento Planificación, los CA originales y pantalla 5 del mockup R2. Partí de main actualizado.

Creá la migración mínima de notifications con RLS/grants para que cada persona sólo lea y marque como leídos **sus** avisos. Implementá /notifications con lista paginada, fecha, leído/no leído, navegación autorizada y estados loading/error/vacío. No permitir INSERT/UPDATE arbitrario ni identidad recipient_id elegida desde el cliente. **R2 puede tener bandeja vacía: no inventar avisos, recordatorios, generación automática, Web Push ni filtros inertes** (generadores R6).

Probar RF-R2-07.CA-01..04, permisos A/B/anon, marcado de lectura y vacíos con datos controlados. Build/lint, evidencia, status actualizado, PR propia. **No SQL remoto ni merge sin aprobación**.
