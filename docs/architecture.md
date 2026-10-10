# PlanIt — Arquitectura

PlanIt es una PWA universitaria para descubrir, organizar y participar en eventos. No se utiliza React Native ni Expo.

## Stack
- React + TypeScript + Vite; React Router; vite-plugin-pwa.
- Supabase Auth, PostgreSQL con RLS, Storage y Realtime.
- Edge Functions sólo para funcionalidades que requieran secretos (por ejemplo, Web Push).
- Un repositorio: frontend en src/ y migraciones en supabase/migrations/.

## Principios funcionales
- Todos los usuarios pueden organizar e inscribirse, pero un organizador no consume cupo de su evento.
- Eventos completos desde su primera persistencia: NO hay drafts en PostgreSQL.
- Una categoría por evento, múltiples intereses por usuario.
- Eventos públicos y ocultos (unlisted); los ocultos requieren autenticación y autorización persistente. Una revocación individual prevalece sobre un enlace válido.
- Cupos, inscripciones y reingresos se resuelven transaccionalmente.
- Los eventos se cancelan o archivan, nunca se eliminan físicamente. Chats de eventos finalizados o cancelados quedan en sólo lectura para la audiencia histórica autorizada.
- DM entre dos personas; bloquear impide mensajes privados y seguimientos, no chat grupal.
- Máximo 10 imágenes por evento, una por mensaje grupal y una por historia. Historias vencen a las 24 horas.
- Bandeja interna de notificaciones; Web Push opcional. Mensajes grupales no generan notificación.
- Fecha-hora propia: timestamp without time zone, interpretado como horario Argentina (America/Argentina/Buenos_Aires). No agregar events.timezone.

## Reglas de ingeniería
- Código legible, simple y orientado a requisitos, sin capas empresariales superfluas.
- RLS en cada tabla pública y acceso restringido a datos de perfil.
- Sin secretos en frontend, repositorio o configuración pública.
- Revisar y probar SQL en una rama; no modificar bases remotas sin permiso.
- Repositorio GitHub: EnzoG14/PlanIt.
- Supabase nuevo: planit-v2 (iepeqmvzjguwlhnecsdq); antiguo PlanIt (fmqzokxvpqxfzvcnzvjm) sólo lectura.

Ver ../AGENTS.md, ../src/AGENTS.md, ../supabase/AGENTS.md y database.md.

## Base frontend — BLOQUE 0

- React Router con layout común y rutas `/register`, `/login`, `/map`, `/events/new`, `/my-events`, `/events/:id` y 404; `/` redirige a `/map`.
- Son páginas de preparación: todavía no implementan formularios, autenticación, consultas de eventos ni protección por sesión. La pantalla de detalle no confirma que un ID exista.
- CSS propio responsive, variables compartidas y componentes sencillos. Sin biblioteca adicional de estilos.
- Cliente Supabase único: valida URL exacta de planit-v2 y formato publishable; si falta configuración, no crea cliente y muestra un aviso sin imprimir valores. Una validación local no prueba conectividad ni permisos.
- PWA con iconos propios y precache sólo de recursos estáticos del build. Sin runtime caching de Supabase, Auth, perfiles, imágenes privadas ni tiles. La app no ofrece operaciones de eventos offline.

## Decisión de mapa

Leaflet + React Leaflet: mapa raster sencillo, suficiente para marcadores y selección de ubicación, sin infraestructura geográfica extra. Instalar al implementar su primer uso, no en BLOQUE 0.

Tiles iniciales: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, atribución visible «© OpenStreetMap contributors» con enlace a https://www.openstreetmap.org/copyright. Mantener el Referer y la caché HTTP normal del navegador; no descargar anticipadamente ni ofrecer mapas offline. Centralizar la configuración del proveedor al integrar el mapa para facilitar reemplazo. El servicio es de disponibilidad best-effort, sin SLA; revisar antes de aumentar tráfico. Política: https://operations.osmfoundation.org/policies/tiles/.
