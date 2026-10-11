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

## Notificaciones R2 — BLOQUE 4

Ruta protegida `/notifications`, campana en cabecera y consulta paginada por created_at/id. Tabla notifications con RLS propia del destinatario; sólo read_at actualizable con hora servidor y primera lectura inmutable. RPCs SECURITY INVOKER reutilizan RLS existente para destinos de eventos/chat y revalidan al abrir. Refresco explícito/al foco, estado aislado por cuenta y sin avisos generados, Push ni Realtime. Migración `20261011163653_notifications_inbox.sql` aplicada en planit-v2 el 11/10/2026 con autorización expresa del usuario; historial sincronizado y permisos verificados. [Evidencia y límites](design/verification/notifications/README.md).

## Chat R2 — BLOQUE 2

Ruta protegida `/events/:id/chat` desde detalle para organizador/confirmed. RPC autorizadas entregan header/estado e historial paginado con representación social mínima; envío transaccional con UUID idempotente y bloqueo evento/participación. Tablas con RLS sin mutaciones REST del cliente. Historial de eventos cerrados sólo lectura; retirados/removidos sin acceso. Refresco explícito y al recuperar foco, sin configuración Realtime. Migración `20261010214526_event_chat.sql` aplicada en planit-v2 el 10/10/2026 con autorización del usuario; historial sincronizado y RLS/grants verificados. [Evidencia y límites](design/verification/event-chat/README.md).

## Base frontend — BLOQUE 0

- React Router con layout común y rutas `/register`, `/login`, `/map`, `/events/new`, `/my-events`, `/events/:id` y 404; `/` redirige a `/map`.
- El BLOQUE 0 comenzó con páginas de preparación. Auth fue reemplazada por formularios y sesión real; `/events/new` y `/events/:id` ahora implementan creación y consulta mínima. Mapa y Mis eventos conservan su estado de preparación para los bloques siguientes.
- CSS propio responsive, variables compartidas y componentes sencillos. Sin biblioteca adicional de estilos.
- Cliente Supabase único: valida URL exacta de planit-v2 y formato publishable; si falta configuración, no crea cliente y muestra un aviso sin imprimir valores. Una validación local no prueba conectividad ni permisos.
- PWA con iconos propios y precache sólo de recursos estáticos del build. Sin runtime caching de Supabase, Auth, perfiles, imágenes privadas ni tiles. La app no ofrece operaciones de eventos offline.

## Decisión de mapa

PROMPT 05 implementa `/map` autenticado, tarjetas y detalle mínimo. Leaflet aislado en `src/components/maps`, dominio/consultas en `src/features/events` y geolocalización compartida en `src/features/location`. [Arquitectura de descubrimiento](map-architecture.md). RPC desplegada en planit-v2 el 10/10/2026 con autorización del usuario. Mis eventos mantiene su preparación para el bloque siguiente.

Leaflet + React Leaflet: mapa raster sencillo, suficiente para marcadores y selección de ubicación, sin infraestructura geográfica extra. Instalar al implementar su primer uso, no en BLOQUE 0.

Tiles iniciales: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, atribución visible «© OpenStreetMap contributors» con enlace a https://www.openstreetmap.org/copyright. Mantener el Referer y la caché HTTP normal del navegador; no descargar anticipadamente ni ofrecer mapas offline. Centralizar la configuración del proveedor al integrar el mapa para facilitar reemplazo. El servicio es de disponibilidad best-effort, sin SLA; revisar antes de aumentar tráfico. Política: https://operations.osmfoundation.org/policies/tiles/.

## Creación de eventos — BLOQUE 2

Formulario local en `src/pages/CreateEventPage.tsx`, validación/fechas y llamadas en `src/features/events/`. Campos de inicio y fin se envían como timestamps de Argentina sin conversión desde la zona del dispositivo. Ubicación manual y geolocalización optativa según alternativa admitida por el plan técnico; mapa de descubrimiento pendiente del BLOQUE 3.

La publicación sube fotos opcionales y llama a `create_event` para insertar evento completo y relaciones atómicamente, usando identidad derivada de Auth y RLS. Reintentos inciertos conservan un UUID, datos y archivos sólo en memoria. `/events/:id` consulta el registro y media autorizada para confirmar el resultado. Las rutas de eventos se cargan por separado para conservar el tamaño del bundle inicial. No se agregaron dependencias de producción.

SQL y bucket **aplicados en planit-v2 el 10/10/2026 con autorización del usuario**. Historial de migraciones sincronizado; creación, validaciones y permisos probados por SQL remoto con ROLLBACK, sin dejar eventos de prueba. Storage HTTP y el flujo completo desde el navegador siguen pendientes de prueba real. [Pruebas, capturas, alcance y pendientes](design/verification/create-event-r1/README.md).
