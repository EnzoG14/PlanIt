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

Antes de modificar cualquier interfaz, componente visual o archivo CSS, leer:

- `docs/design/AGENTS.md`
- `docs/design/DESIGN_SYSTEM.md`
- `docs/design/SCREENS.md`
- `docs/design/DESIGN_GAPS.md`

Abrir visualmente las imágenes relevantes de `docs/design/mockups/`.

**CRÍTICO:** preservar la identidad visual original de PlanIt. No crear un diseño alternativo ni reemplazar la paleta azul oscuro/violeta.

Los mockups definen la apariencia; los requisitos funcionales y el modelo de datos aprobado definen el comportamiento.

Utilizar las skills de diseño frontend, UX y React disponibles cuando correspondan.

Antes de dar una pantalla por terminada, contrastarla visualmente con su mockup y verificar su funcionamiento en dispositivos móviles.