# Codex — R3, BLOQUE 2: editar evento propio

**RF/CA:** R3-01.CA-01..04 (4). **Referencias visuales:** `docs/design/mockups/r3/02-editar-evento.png` (consultar también `docs/design/mockups/r3/README.md` y el collage original `docs/design/mockups/release-3.png`).

**Precondiciones comunes:** leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/requirements/RELEASE_3_REQUIREMENTS.md`, `docs/implementation/RELEASE_3_PLAN.md`, `RELEASE_3_STATUS.md` y `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Consultar para el RF las secciones **Flujo funcional, Datos y operaciones, Reglas y validaciones y Verificación** de «Especificación técnica — R1 a R7» en Planificación. **El PNG determina apariencia, no funcionalidades.** Si falta un PNG, registrar el bloqueo de comparación visual y no inventar que fue revisado.

**Protocolo:** partir de `main` actualizado (una rama/PR exclusiva por bloque), verificar primero código y esquema real; no asumir que las RPC propuestas existen. Migraciones incrementales, probadas localmente, RLS/grants mínimos, identidad desde `auth.uid()`. No tocar proyecto Supabase antiguo ni ejecutar SQL/configuración remota, merge o despliegue sin autorización. Ejecutar build/lint y pruebas relevantes; documentar pruebas reales vs fixtures, capturas, CA, pendientes y migraciones en STATUS. No marcar «Validado» sin aceptación humana.

## Cambios esperados
- Inspeccionar `CreateEventPage.tsx`, `src/features/events/{api,validation}.ts` y esquema `events`. Extraer o compartir inputs, tipos y validaciones, **sin convertir edición en una publicación nueva**. Precargar título, descripción, inicio/fin, dirección/nombre del lugar, coordenadas, categoría y cupo (más cualquier campo existente exigido por creación).
- Añadir ruta protegida según contrato del bloque 0. Mostrar loading/error/no autorizado/no encontrado y conservar valores editados ante fallos de guardado; prevenir doble envío.
- Implementar actualización del **mismo ID** autorizada en BD al organizador; validar campos y fechas futuras, inicio anterior a fin, cupo entero y `capacity >= COUNT(confirmed)`, **dentro de una transacción protegida contra inscripciones simultáneas**. Verificar que editar un evento en estado no editable se deniegue según reglas actuales.
- Tras éxito, reflejar cambios en detalle, `Mis eventos` y mapa al reconsultar. No modificar media en este bloque salvo que el contrato de edición lo requiera explícitamente.

## Pruebas mínimas
1. Cambio válido persiste y reaparece en vistas; inicio/fin cruzando medianoche respetan hora Argentina.
2. Fecha pasada, fin anterior a inicio y cupo menor que confirmados: error claro, sin mutación parcial; carrera inscripción vs reducción de cupo.
3. Cuenta B y acceso RPC/REST directo no pueden editar un evento de A; reintento tras fallo no duplica operación.

Dejar migración local/SQL probado si se necesita, evidencia por CA, build/lint/responsive y STATUS. PR propia.