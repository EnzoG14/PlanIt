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

Antes de modificar UI, componentes visuales o CSS, consultar [reglas de diseño](../docs/design/AGENTS.md), [PRODUCT.md](../PRODUCT.md) cuando exista, [DESIGN.md](../DESIGN.md), [DESIGN_SYSTEM.md](../docs/design/DESIGN_SYSTEM.md), [shape aprobado](../docs/design/proposals/r1-r3-visual-evolution.md), [SCREENS.md](../docs/design/SCREENS.md), [DESIGN_GAPS.md](../docs/design/DESIGN_GAPS.md), [auditoría consolidada](../docs/design/audits/UI_REFRESH_R1_R3.md) y [plan visual](../docs/implementation/UI_REFRESH_R1_R3_PLAN.md).

La jerarquía funcional es: RF/CA aprobados → especificación técnica y decisiones de negocio → contratos de datos, migraciones y autorizaciones. La jerarquía visual es: PRODUCT.md cuando exista → DESIGN.md aprobado → DESIGN_SYSTEM.md → componentes y patrones aprobados → mockups históricos R1–R3. El contexto de producto no sustituye los contratos funcionales.

- Conservar la dirección aprobada: fotografía expresiva, interfaz marina y sobria, acciones sólidas y superficies planas. Priorizar la tarea y el contenido sobre efectos decorativos. No reemplazar la paleta azul/violeta ni reinterpretar decisiones aprobadas por iniciativa propia.
- Utilizar Impeccable para rediseño, crítica o refinamiento cuando esté disponible. Consultar el contexto existente; no regenerar PRODUCT.md, DESIGN.md o DESIGN_SYSTEM.md ni repetir init/document/critique/audit/shape de Foundation. Una evaluación futura explícitamente solicitada conserva los reportes anteriores y distingue sus resultados. Las recomendaciones de skills genéricas no prevalecen sobre el sistema aprobado.
- Reutilizar componentes y APIs existentes cuando corresponda: AppLayout, ScreenHeader, EventCard/CompactEventCard, FormField, StatusMessage y diálogos. Evitar variantes redundantes, dependencias o un UI kit innecesarios.
- Mantener mobile-first, adaptación de escritorio, contraste, semántica, foco, áreas táctiles, safe areas y recuperación de errores.
- Consultar visualmente los mockups antiguos cuando aporten contexto; no son un objetivo pixel-perfect ni autorizan recuperar degradados, halos o tarjetas anidadas retirados por el shape. SCREENS.md y los prompts históricos describen el diseño anterior; aplicar sólo las partes compatibles con la jerarquía vigente.
- Conservar la funcionalidad R1–R3: seguridad, Auth, Supabase, RLS, permisos, fechas, validaciones y estructura. No cambiar modelos de datos, RPC, migraciones, políticas ni reglas de negocio por motivos estéticos. No agregar funciones de R4–R7 ni borrar campos requeridos para simplificar el diseño.

Antes de terminar una pantalla, capturar la implementación real antes/después en móvil y escritorio y contrastarla con DESIGN.md y el shape, identificando fixtures. Revisar 320, 375, 390, 768 y 1280 px, texto ampliado, poca altura, teclado/foco y estados de carga/vacío/error; comprobar también recortes internos. Documentar lo no probado; emulación no equivale a teclado móvil, gestos o lector de pantalla reales. Ejecutar build/lint para cambios de frontend y registrar evidencia en el seguimiento visual, sin modificar el estado funcional de R1–R3 por mejoras estéticas.

Esta Foundation sólo prepara documentación y referencias. No implementar pantallas hasta recibir el pedido correspondiente; seguir las etapas del plan visual y cerrar esta tarea al entregar su PR.
