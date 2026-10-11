# Codex — R3, BLOQUE 5: cancelar, archivar y duplicar

**RF/CA:** R3-02.CA-01..04 y R3-07.CA-01..04 (8). **Referencias visuales:** `docs/design/mockups/r3/06-acciones-evento.png`, `docs/design/mockups/r3/07-estados-dialogos.png`, `docs/design/mockups/r3/02-editar-evento.png` (consultar también `docs/design/mockups/r3/README.md` y el collage original `docs/design/mockups/release-3.png`).

**Precondiciones comunes:** leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/requirements/RELEASE_3_REQUIREMENTS.md`, `docs/implementation/RELEASE_3_PLAN.md`, `RELEASE_3_STATUS.md` y `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Consultar para el RF las secciones **Flujo funcional, Datos y operaciones, Reglas y validaciones y Verificación** de «Especificación técnica — R1 a R7» en Planificación. **El PNG determina apariencia, no funcionalidades.** Si falta un PNG, registrar el bloqueo de comparación visual y no inventar que fue revisado.

**Protocolo:** partir de `main` actualizado (una rama/PR exclusiva por bloque), verificar primero código y esquema real; no asumir que las RPC propuestas existen. Migraciones incrementales, probadas localmente, RLS/grants mínimos, identidad desde `auth.uid()`. No tocar proyecto Supabase antiguo ni ejecutar SQL/configuración remota, merge o despliegue sin autorización. Ejecutar build/lint y pruebas relevantes; documentar pruebas reales vs fixtures, capturas, CA, pendientes y migraciones en STATUS. No marcar «Validado» sin aceptación humana.

## Cambios esperados
- Integrar en `EventDetailPage.tsx` (y menús propios de Mis eventos si corresponde) acciones del organizador según estado: cancelar, archivar, duplicar; editar/galería/asistentes enlazan sólo a bloques ya integrados. Eliminar opción **DELETE** físico. Usar diálogos reales, sin disparar la operación antes de confirmar.
- Cancelar/archivar requieren autorización BD del dueño; cancelar conserva eventos, participaciones, media, chat e historial y detiene nuevas inscripciones y escritura del chat. Archivar oculta de vistas activas y, si el evento aún está vigente, **cancela antes en la misma operación atómica**. Sigue accesible en histórico propio.
- Duplicar abre formulario reutilizado de crear con datos precargados (título, descripción, categoría, ubicación, cupo); exige nuevas fechas futuras. **No INSERT** al abrir ni persistencia de draft. Al guardar crea ID nuevo y mismo organizador; NO copiar asistentes, historial, conversaciones ni estadísticas. Decidir reutilización de fotos únicamente después de revisar referencias/ownership y registrar la decisión.
- Evitar doble ejecución de acciones; mostrar error sin éxito ficticio, actualizar navegación/listados/detalle y preservar evento original.

## Pruebas mínimas
1. Cancelar un diálogo no escribe; falla parcial de archivar no deja estados inconsistentes; no hay DELETE físico.
2. Cancelado/archivado no acepta inscripción ni mensaje nuevo; historial y datos accesibles según autorización; archivo fuera de listados activos.
3. Duplicar y salir sin guardar no crea ID; duplicado válido tiene ID distinto, datos editables y ninguna participación/conversación heredada; tercero no duplica evento ajeno.

Registrar los 8 CA, regresión chat/mapa/Mis eventos, responsive, build/lint, STATUS y PR propia.