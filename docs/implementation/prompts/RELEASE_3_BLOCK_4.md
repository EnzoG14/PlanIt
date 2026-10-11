# Codex — R3, BLOQUE 4: asistentes y remoción

**RF/CA:** R3-05.CA-01..04 y R3-06.CA-01..04 (8). **Referencias visuales:** `docs/design/mockups/r3/04-asistentes.png`, `docs/design/mockups/r3/07-estados-dialogos.png` (consultar también `docs/design/mockups/r3/README.md` y el collage original `docs/design/mockups/release-3.png`).

**Precondiciones comunes:** leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/requirements/RELEASE_3_REQUIREMENTS.md`, `docs/implementation/RELEASE_3_PLAN.md`, `RELEASE_3_STATUS.md` y `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Consultar para el RF las secciones **Flujo funcional, Datos y operaciones, Reglas y validaciones y Verificación** de «Especificación técnica — R1 a R7» en Planificación. **El PNG determina apariencia, no funcionalidades.** Si falta un PNG, registrar el bloqueo de comparación visual y no inventar que fue revisado.

**Protocolo:** partir de `main` actualizado (una rama/PR exclusiva por bloque), verificar primero código y esquema real; no asumir que las RPC propuestas existen. Migraciones incrementales, probadas localmente, RLS/grants mínimos, identidad desde `auth.uid()`. No tocar proyecto Supabase antiguo ni ejecutar SQL/configuración remota, merge o despliegue sin autorización. Ejecutar build/lint y pruebas relevantes; documentar pruebas reales vs fixtures, capturas, CA, pendientes y migraciones en STATUS. No marcar «Validado» sin aceptación humana.

## Cambios esperados
- Inspeccionar `event_participations`, `participation_history` y autorización del chat R2. Crear vista de administración **sólo para el organizador** del evento seleccionado, con búsqueda por nombre, confirmados y removidos diferenciados, paginación/estados si hace falta.
- Consultar una **proyección social mínima autorizada** (nombre, username, avatar permitido). El PNG muestra emails: **no revelarlos**, ni fecha de nacimiento/sexo. No confundir esta lista administrativa con la vista social de asistentes prevista para R5.
- Acción Remover sólo para `confirmed`, con diálogo confirmable/cancelable. Operación atómica con identidad de `auth.uid()`, verifica autoría y vinculación al evento, cambia a `removed`, inserta movimiento de historial y libera cupo. No borrar la fila; no tratar `removed` como `cancelled`.
- Tras remoción, actualizar asistentes/cupo y comprobar la pérdida efectiva de lectura/envío al chat, no sólo ocultar el enlace.

## Pruebas mínimas
1. Cuenta A lista sólo asistentes de evento propio; cuenta B/no miembro/anon no accede por ruta ni por RPC/REST directo.
2. Cancelar diálogo no cambia nada; confirmar remueve una sola vez y deja historial; falla transaccional sin estado parcial.
3. Removido no figura entre confirmados ni puede enviar/leer chat vigente; nuevas altas y bajas se reflejan al refrescar.

Build/lint, comparación visual, evidencias de 8 CA en STATUS y PR independiente.