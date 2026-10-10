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
