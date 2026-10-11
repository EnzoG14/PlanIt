# Codex — R3, BLOQUE 0: preparación y contrato de navegación

**RF:** transversal, sin CA propios. **Referencias visuales:** `docs/design/mockups/r3/01-mis-eventos.png`, `docs/design/mockups/r3/02-editar-evento.png`, `docs/design/mockups/r3/03-galeria.png`, `docs/design/mockups/r3/04-asistentes.png`, `docs/design/mockups/r3/05-solicitudes-reincorporacion.png`, `docs/design/mockups/r3/06-acciones-evento.png`, `docs/design/mockups/r3/07-estados-dialogos.png` (consultar también `docs/design/mockups/r3/README.md` y el collage original `docs/design/mockups/release-3.png`).

**Precondiciones comunes:** leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/requirements/RELEASE_3_REQUIREMENTS.md`, `docs/implementation/RELEASE_3_PLAN.md`, `RELEASE_3_STATUS.md` y `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Consultar para el RF las secciones **Flujo funcional, Datos y operaciones, Reglas y validaciones y Verificación** de «Especificación técnica — R1 a R7» en Planificación. **El PNG determina apariencia, no funcionalidades.** Si falta un PNG, registrar el bloqueo de comparación visual y no inventar que fue revisado.

**Protocolo:** partir de `main` actualizado (una rama/PR exclusiva por bloque), verificar primero código y esquema real; no asumir que las RPC propuestas existen. Migraciones incrementales, probadas localmente, RLS/grants mínimos, identidad desde `auth.uid()`. No tocar proyecto Supabase antiguo ni ejecutar SQL/configuración remota, merge o despliegue sin autorización. Ejecutar build/lint y pruebas relevantes; documentar pruebas reales vs fixtures, capturas, CA, pendientes y migraciones en STATUS. No marcar «Validado» sin aceptación humana.

## Trabajo
1. Auditar rutas de `src/App.tsx`, `AppLayout.tsx`, `MyEventsPage.tsx`, `EventDetailPage.tsx`, `CreateEventPage.tsx`, y servicios `src/features/events/`. Inspeccionar `events`, `event_images/files`, participaciones, historial, chat y permisos; escribir qué existe, qué falta y cuáles son las restricciones efectivas.
2. Definir rutas finales y flujo de regreso para editar, galería, asistentes, solicitudes y duplicar. Preferir `/my-events?section=organizing` y `/events/:id` existentes. Especificar acceso para organizador vs participante/removido.
3. Identificar formulario reutilizable, tarjetas, navegación, diálogos de confirmación y componentes compartidos; describir contratos de datos mínimos (campos, estados, error/loading/empty). Conservar campos de inicio **y fin** de evento.
4. Establecer un cuadro de correspondencia **PNG → ruta/componente → RF → bloque** y anotar excepciones respecto del mockup. No crear destinos o controles inertes, ni SQL.

## Entrega y aceptación
Entregar un documento de decisiones de rutas/componentes y actualizar STATUS con brechas y dependencias de bloques 1–6. Confirmar que R1/R2 no cambian. Si no se toca UI, no presentar capturas nuevas como implementadas. PR documental/preparatoria y detenerse.