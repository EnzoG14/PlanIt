# Codex — R2, BLOQUE 5: QA integral y cierre

**RF:** R2-01 a R2-07 (28 CA). **Precondición:** bloques 0–4 integrados y sus migraciones desplegadas sólo tras autorización.

Leé docs/implementation/RELEASE_2_PLAN.md (**D/BLOQUE 5 y F**), RELEASE_2_STATUS.md, los **28 textos originales de CA** en Planificación y el contrato visual R2. No cambiar el alcance.

Ejecutá npm ci, build/lint y checks existentes. Prepará docs/qa/RELEASE_2_ACCEPTANCE.md (28 CA con estado, prueba, evidencia y pendientes) y docs/qa/RELEASE_2_TEST_REPORT.md (seguridad, Auth/RLS/REST, chat/realtime, perfil, notificaciones, diseño, PWA y regresión R1). Si tenés autorización y credenciales de prueba locales, usá dos sesiones reales aisladas; no equiparar fixtures con E2E. Verificá casos negativos y advisors de Supabase.

Priorizá fallos reproducibles y reportá GO/NO-GO fundamentado. No «aprobar» pruebas no ejecutadas ni marcar Validado sin revisión humana. Actualizá status, abrí PR y detenete. **No borrar datos, aplicar SQL remoto ni fusionar sin autorización**.
