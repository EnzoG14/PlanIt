# Codex — R3, BLOQUE 6: solicitudes de reincorporación

**RF/CA:** R3-08.CA-01..04 (4) y R3-09.CA-01..05 (5). **Referencias visuales:** `docs/design/mockups/r3/05-solicitudes-reincorporacion.png`, `docs/design/mockups/r3/07-estados-dialogos.png`, `docs/design/mockups/r3/04-asistentes.png` (consultar también `docs/design/mockups/r3/README.md` y el collage original `docs/design/mockups/release-3.png`).

**Precondiciones comunes:** leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/requirements/RELEASE_3_REQUIREMENTS.md`, `docs/implementation/RELEASE_3_PLAN.md`, `RELEASE_3_STATUS.md` y `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Consultar para el RF las secciones **Flujo funcional, Datos y operaciones, Reglas y validaciones y Verificación** de «Especificación técnica — R1 a R7» en Planificación. **El PNG determina apariencia, no funcionalidades.** Si falta un PNG, registrar el bloqueo de comparación visual y no inventar que fue revisado.

**Protocolo:** partir de `main` actualizado (una rama/PR exclusiva por bloque), verificar primero código y esquema real; no asumir que las RPC propuestas existen. Migraciones incrementales, probadas localmente, RLS/grants mínimos, identidad desde `auth.uid()`. No tocar proyecto Supabase antiguo ni ejecutar SQL/configuración remota, merge o despliegue sin autorización. Ejecutar build/lint y pruebas relevantes; documentar pruebas reales vs fixtures, capturas, CA, pendientes y migraciones en STATUS. No marcar «Validado» sin aceptación humana.

## Cambios esperados
- Inspeccionar esquema real y restricciones de `event_participations`, `participation_history` y `events` antes de proponer `event_rejoin_requests`/RPC. `pending` es **estado de solicitud**, NUNCA estado de participación.
- **Usuario removido:** desde detalle de evento accesible y vigente, ofrecer solicitud inmediata si no tiene pendiente. Mostrar pendiente/resuelta, rechazo y fecha de próxima elegibilidad. Bloquear duplicados, solicitudes de no-removidos y nuevas solicitudes durante **7 días contados desde resolución del rechazo**; evento cerrado/cancelado/archivado no acepta nuevas.
- **Organizador:** bandeja de solicitudes del evento propio, aprobar/rechazar con confirmación. Cada resolución transaccional autentica al dueño, bloquea evento/participación/solicitud según necesidad, conserva historial y protege contra doble resolución.
- Aprobar sólo si vigente y **hay cupo confirmado disponible bajo concurrencia**; si está lleno, mantener `pending`, sin reservar, autoaprobar ni descartar. Rechazar fija fecha de resolución, inicia cooldown y comunica resultado. Nunca asumir una columna de mensaje/motivo que sólo existe en el PNG.

## Pruebas mínimas
1. Primera solicitud tras removed: inmediata; doble pendiente denegada; usuario `cancelled`/confirmed no solicita.
2. Rechazo: antes de 7 días no, al cumplirse 7 días sí; finalizado/cancelado/archivado bloqueado.
3. Última plaza con aprobaciones/inscripciones simultáneas: cupo nunca excedido; sin plaza sigue pending; rechazo y aprobación dejan historia.
4. Organizador de otro evento/anon y RPC directa no pueden leer ni resolver; doble clic no produce doble resolución.

Cubrir **9 CA** con SQL local y sesiones distintas cuando haya permiso, UI estados y errores, build/lint, STATUS y PR propia.