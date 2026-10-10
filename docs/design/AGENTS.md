# PlanIt — Reglas específicas para agentes de diseño/UI

> Estas instrucciones complementan `../../AGENTS.md` y `../../src/AGENTS.md`. Leer `DESIGN_SYSTEM.md`, `SCREENS.md` y `DESIGN_GAPS.md` antes de diseñar o modificar UI. Para trabajo en `src/`, el prompt de Codex debe citar expresamente estos documentos; también conviene enlazarlos desde `src/AGENTS.md`.

## Prioridades

1. **Preservar la identidad visual original** de los siete mockups `mockups/release-N.png`. No rediseñar de cero ni imponer paletas, gradientes o navegación distintos.
2. **La lógica funcional viene de RF/CA aprobados y del contrato de datos**, no del dibujo. Si una captura representa una función fuera del alcance o contradictoria, conservar su lenguaje visual sin implementar la función.
3. Mobile-first en PWA React/TypeScript/Vite, con adaptación responsive de escritorio, accesibilidad, foco, tamaño táctil y safe-areas.
4. Reusar las skills locales instaladas de frontend-design, web-design-guidelines y React best practices si están disponibles; su consejo genérico nunca prevalece sobre el diseño específico de PlanIt.
5. No tocar RLS, SQL, datos remotos, Supabase histórico, Auth ni migraciones desde tareas puramente de diseño.

## Fuente de verdad para cada pantalla

- `mockups/release-1.png`...`mockups/release-7.png`: apariencia visual.
- `SCREENS.md`: inventario de pantallas y componentes visibles.
- `DESIGN_SYSTEM.md`: paleta, composición, densidad, navegación y adaptaciones.
- `DESIGN_GAPS.md`: contradicciones entre visual y modelo funcional.
- RF/CA originales: comportamiento y alcance por release.

## Protocolo de cambios UI

1. Inspeccionar pantalla actual y mockup objetivo.
2. Identificar qué conservar de estructura técnica y qué modificar de apariencia. Tomar una captura antes del cambio cuando sea posible.
3. Describir cambios visibles y componentes a reutilizar; si el cambio es grande, pedir aprobación antes de reescribir.
4. Implementar sin inventar acciones ni botones inertes. Ocultar features futuras en lugar de mostrarlas como funcionales.
5. Comparar screenshots después del cambio; ejecutar build/lint y probar mobile + desktop.
6. Informar excepciones visuales motivadas por requisitos, accesibilidad o limitaciones de navegador.

## Prohibiciones

- No replicar en la app los títulos “PlanIt · R1 Lanzamiento”, los círculos decorativos externos ni la numeración de las diapositivas.
- No conservar la estética verde/crema y el header de marketing provisional del BLOQUE 0 como identidad definitiva.
- No usar capturas como backgrounds de páginas ni insertar imágenes del collage como tarjetas de eventos reales.
- No agregar borradores persistidos, entradas/pagos, reseñas, rating, favoritos, listas de amigos, audio en chat, permisos granulares nuevos u otras funciones sólo porque se ven en una captura.
- No eliminar campos que exijan RF o el modelo de BD aunque no se vean en el mockup (por ejemplo `ends_at` en Crear evento).
