# PlanIt — instrucciones para agentes de frontend

Aplican también las reglas de `../AGENTS.md`.

- React + TypeScript + Vite; no incorporar Expo/React Native.
- Priorizar componentes funcionales, tipado explícito en los límites de datos y composición sencilla. Evitar capas, stores y abstractions que no tengan un caso real.
- Mantener vistas/páginas en `src/pages/`, componentes compartidos en `src/components/` y lógica por funcionalidad en `src/features/` cuando esas carpetas existan.
- Usar un cliente Supabase centralizado en `src/lib/`, con URL y publishable key de `import.meta.env`; nunca usar `service_role` en el navegador.
- Autenticación por Supabase Auth, respetar sesión y mostrar estados de carga/error.
- La validación del formulario mejora UX; **no reemplaza** la validación y autorización del servidor.
- No persistir borradores de eventos en PostgreSQL. Crear y duplicar eventos: prellenar/editar formulario en React y guardar una vez completo.
- Eventos públicos/ocultos, permisos de chat, bloqueo, privacidad de perfil y cupos deben aplicarse también en base/RPC; no filtrar sólo en UI.
- PWA: iconos reales en `public/icons/`, manifest consistente, service worker no debe cachear indiscriminadamente respuestas privadas de Supabase.
- Eventos y fechas: el sistema acordó horario Argentina y timestamp sin zona; centralizar parsing/formateo; nunca depender accidentalmente de la zona horaria del equipo.
- Antes de entregar cambios de código, ejecutar `npm run build` y `npm run lint` cuando esté disponible.

## Diseño visual obligatorio de PlanIt

Antes de modificar UI, componentes visuales o CSS, consultar [reglas de diseño](../docs/design/AGENTS.md), [PRODUCT.md](../PRODUCT.md) cuando exista, [DESIGN.md](../DESIGN.md), [DESIGN_SYSTEM.md](../docs/design/DESIGN_SYSTEM.md), la [decisión de dirección Amanecer](../docs/design/proposals/amanecer-direction.md), [SCREENS.md](../docs/design/SCREENS.md) (sólo funciones), [DESIGN_GAPS.md](../docs/design/DESIGN_GAPS.md), [auditoría consolidada](../docs/design/audits/UI_REFRESH_R1_R3.md) y [plan visual](../docs/implementation/UI_REFRESH_R1_R3_PLAN.md). El prototipo [design-lab](../design-lab/README.md) (`/b`) muestra composición y estados de la dirección aprobada.

La jerarquía funcional es: RF/CA aprobados → especificación técnica y decisiones de negocio → contratos de datos, migraciones y autorizaciones. La jerarquía visual es: PRODUCT.md cuando exista → DESIGN.md aprobado → DESIGN_SYSTEM.md → decisión de dirección → componentes y patrones aprobados → prototipo del lab → mockups históricos R1–R3. El contexto de producto no sustituye los contratos funcionales.

- Dirección aprobada: **B · Amanecer**. La agenda manda y el color es luz, no relleno: modo claro único (`#f6f5fd`), tinta marina `#060b27` para acción y navegación (botón principal, dock, burbuja propia, segmentos), azul `#0753ff` sólo para filtros seleccionados/progreso/envío, violeta como luz y acento. Mancha difusa superior (una por pantalla, `aria-hidden`), tarjetas blancas/cristal con sombras suaves, píldoras para lo accionable, radios de 26–36 px, Bricolage Grotesque **autoalojada**. Sin gradientes en botones, tarjetas, chips ni mensajes; sin tarjetas anidadas; sin tema oscuro. No reinterpretar decisiones aprobadas por iniciativa propia.
- **Migración gradual:** Mis eventos es el piloto Amanecer implementado y fusionado (PR #27). Tokens centrales `src/styles/tokens.css` (`--pi-*`), patrones opt-in `src/styles/amanecer.css` (`.amanecer-shell`). AppLayout sólo activa esa clase en `/my-events`; cada próximo bloque revisa su layout antes de ampliar el scope. `index.css`/`App.css` y `GradientButton` fuera del scope siguen heredados. No copiar `--color-*`/`--gradient-primary` en código nuevo ni duplicar CSS del piloto: reutilizar patrones centrales y preservar la composición local. Retirar adaptadores sólo al migrar todos sus consumidores; ver [UI_WORKFLOW.md](../docs/design/UI_WORKFLOW.md).
- Accesibilidad propia de Amanecer: violeta sólo con texto tinta; `control-border` `#7a82a8` en campos; datos operativos ≥ 13,5 px; foco violeta de 3 px; dock con nombre accesible y `aria-current`; cristal con fallback opaco (`@supports not (backdrop-filter)` y `prefers-reduced-transparency`); animaciones de entrada desactivadas con `prefers-reduced-motion`.
- Utilizar Impeccable para rediseño, crítica o refinamiento cuando esté disponible, leyendo el contexto existente. No regenerar PRODUCT.md, DESIGN.md, su sidecar o DESIGN_SYSTEM.md ni cambiar la dirección sin pedido del usuario. Una evaluación futura explícitamente solicitada conserva los reportes anteriores y distingue sus resultados. Las recomendaciones de skills genéricas no prevalecen sobre el sistema aprobado.
- Reutilizar componentes y APIs existentes cuando corresponda: AppLayout, ScreenHeader, EventCard/CompactEventCard, FormField, StatusMessage, AccountMenu y diálogos. Evitar variantes redundantes, dependencias o un UI kit innecesarios. La única fuente externa autorizada es Bricolage Grotesque, servida desde el propio bundle/PWA (nunca desde un CDN en producción).
- Mantener mobile-first, adaptación de escritorio, contraste, semántica, foco, áreas táctiles, safe areas y recuperación de errores.
- Consultar visualmente los mockups antiguos sólo para inventario funcional; no son objetivo de apariencia. SCREENS.md, los prompts históricos y el shape marino v2.0 describen diseños anteriores: aplicar únicamente lo compatible con Amanecer.
- Conservar la funcionalidad R1–R3: seguridad, Auth, Supabase, RLS, permisos, fechas, validaciones y estructura. No cambiar modelos de datos, RPC, migraciones, políticas ni reglas de negocio por motivos estéticos. No agregar funciones de R4–R7 ni borrar campos requeridos. Los elementos del lab con carga funcional (tira de días como filtro, tarjetas rápidas, contadores de perfil, buscador, chips de categoría) no se implementan sin decisión; ver la sección 4 de la decisión de dirección.

Antes de terminar una pantalla, capturar la implementación real antes/después en móvil y escritorio y contrastarla con DESIGN.md, identificando fixtures. Revisar 320, 375, 390, 768 y 1280 px, texto ampliado, poca altura, teclado/foco y estados de carga/vacío/error; comprobar recortes internos, carga y fallback de la fuente y contraste del cristal sobre la mancha. Documentar lo no probado; emulación no equivale a teclado móvil, gestos, rendimiento del desenfoque o lector de pantalla reales. Ejecutar build/lint para cambios de frontend y registrar evidencia en el seguimiento visual, sin modificar el estado funcional de R1–R3 por mejoras estéticas.

Implementar sólo el bloque del plan visual que el usuario autorice. Actualizar documentos de diseño no implica pantallas migradas.
