# Codex — R3, BLOQUE 3: administrar galería

**RF/CA:** R3-03.CA-01..04 (4). **Referencias visuales:** `docs/design/mockups/r3/03-galeria.png` (consultar también `docs/design/mockups/r3/README.md` y el collage original `docs/design/mockups/release-3.png`).

**Precondiciones comunes:** leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/requirements/RELEASE_3_REQUIREMENTS.md`, `docs/implementation/RELEASE_3_PLAN.md`, `RELEASE_3_STATUS.md` y `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Consultar para el RF las secciones **Flujo funcional, Datos y operaciones, Reglas y validaciones y Verificación** de «Especificación técnica — R1 a R7» en Planificación. **El PNG determina apariencia, no funcionalidades.** Si falta un PNG, registrar el bloqueo de comparación visual y no inventar que fue revisado.

**Protocolo:** partir de `main` actualizado (una rama/PR exclusiva por bloque), verificar primero código y esquema real; no asumir que las RPC propuestas existen. Migraciones incrementales, probadas localmente, RLS/grants mínimos, identidad desde `auth.uid()`. No tocar proyecto Supabase antiguo ni ejecutar SQL/configuración remota, merge o despliegue sin autorización. Ejecutar build/lint y pruebas relevantes; documentar pruebas reales vs fixtures, capturas, CA, pendientes y migraciones en STATUS. No marcar «Validado» sin aceptación humana.

## Cambios esperados
- Revisar flujo de publicación y lectura actual de `src/features/events/api.ts`, `event_media` privado, `files` y `event_images`, firmas de URL y límites reales del backend. No codificar 5 MB o formatos sólo porque aparecen en una imagen.
- Crear galería del evento propio: selección móvil (drag-and-drop opcional en desktop), previews, progreso real/error por carga, contador de máximo **10 imágenes por evento**, quitar imagen con confirmación y reordenar con controles accesibles además de drag si se incorpora.
- Definir **primera imagen según `sort_order` como portada**, actualizar detalle y tarjetas; no asociar archivo a evento antes de confirmar su subida. Autorizar añadir/quitar/ordenar sólo al organizador en BD y Storage, no por ocultar botones.
- Diseñar manejo de fallos intermedios (Storage vs registro), limpieza de huérfanos de subidas fallidas, reintentos idempotentes y no destruir objetos usados por otro evento. Revisar duplicación futura antes de adoptar borrados físicos.

## Pruebas mínimas
1. Imagen 10 válida, imagen 11 rechazada; orden y portada persisten al reabrir y al cargar detalle.
2. Archivo inválido, carga interrumpida y firma vencida: sin registro falso ni fuga, con recuperación explícita.
3. Cuenta B y REST/Storage directo no alteran galería de A; archivo reutilizado por otro evento se conserva.

Capturas móvil/escritorio, CA con evidencia real/fixture diferenciada, build/lint, STATUS y PR propia.