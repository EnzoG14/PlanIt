# Codex — R3, BLOQUE 1: Mis eventos organizados

**RF/CA:** R3-04.CA-01..04 (4). **Referencias visuales:** `docs/design/mockups/r3/01-mis-eventos.png` (consultar también `docs/design/mockups/r3/README.md` y el collage original `docs/design/mockups/release-3.png`).

**Precondiciones comunes:** leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/requirements/RELEASE_3_REQUIREMENTS.md`, `docs/implementation/RELEASE_3_PLAN.md`, `RELEASE_3_STATUS.md` y `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Consultar para el RF las secciones **Flujo funcional, Datos y operaciones, Reglas y validaciones y Verificación** de «Especificación técnica — R1 a R7» en Planificación. **El PNG determina apariencia, no funcionalidades.** Si falta un PNG, registrar el bloqueo de comparación visual y no inventar que fue revisado.

**Protocolo:** partir de `main` actualizado (una rama/PR exclusiva por bloque), verificar primero código y esquema real; no asumir que las RPC propuestas existen. Migraciones incrementales, probadas localmente, RLS/grants mínimos, identidad desde `auth.uid()`. No tocar proyecto Supabase antiguo ni ejecutar SQL/configuración remota, merge o despliegue sin autorización. Ejecutar build/lint y pruebas relevantes; documentar pruebas reales vs fixtures, capturas, CA, pendientes y migraciones en STATUS. No marcar «Validado» sin aceptación humana.

## Cambios esperados
- Reutilizar `src/pages/MyEventsPage.tsx`, `src/features/events/my-events.ts` y `CompactEventCard`. Mantener exactamente la separación `Organizo`/`Participo`, su paginación y el retorno a detalle.
- Mostrar sólo eventos del organizador autenticado (incluidos históricos), con filtros funcionales `Todos`, `Próximos`, `Pasados`, `Cancelados`, `Archivados`; aclarar precedencia de estados (archivado/cancelado vs pasado), paginación y filtros en resultados. Evitar falsas listas vacías cuando aún hay páginas por cargar.
- Conservar datos reales y foto/placeholder firmada. Menú contextual sólo con acciones disponibles **en el bloque efectivamente integrado**; no añadir pantalla de borradores.
- Auditar permisos de `get_my_events` y accesos directos: nunca incluir eventos de otro organizador en `Organizo`, aunque se altere un parámetro cliente.

## Pruebas mínimas
1. Cuenta A con activo, finalizado, cancelado y archivado; filtros y detalle correctos, incluidos estados sin resultados.
2. Cuenta B no ve eventos exclusivos de A. Actualización de un evento aparece tras reconsulta sin recargar la PWA entera.
3. `Participo` conserva contenido, navegación, carga adicional y tratamiento de errores. Verificar 375×812 y escritorio sin overflow.

Registrar correspondencia **CA → caso → evidencia**, build/lint/checks y STATUS; abrir PR propia.