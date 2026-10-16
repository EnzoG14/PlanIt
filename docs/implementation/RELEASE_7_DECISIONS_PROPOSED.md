# Release 7 — Registro de decisiones (producto confirmado + técnica pendiente)

**Actualización:** 15/10/2026 · **Fuente producto:** respuestas expresas del responsable de PlanIt en esta conversación. Las especificaciones oficiales (7 RF y 29 CA) permanecen **inalteradas** en `../requirements/RELEASE_7_REQUIREMENTS.md`. **Esto no es el acta de implementación de B0 ni demuestra QA.**

## A. Decisiones de producto confirmadas

| ID | Estado | Decisión aceptada | Efecto verificable |
|---|---|---|---|
| D01 | **CONFIRMADA** | Adjuntos **sólo imágenes** JPEG, PNG y WebP de máximo **5 MiB**, una por mensaje de chat o historia. Sin videos/GIF/otros tipos. | UI, validación cliente/servidor, metadata Storage y tests de formato/peso. |
| D02 | **CONFIRMADA** | El chat de evento permite **mensaje de una única imagen sin texto**. Chat texto existente sigue funcionando; se admite texto más imagen si el modelo actual lo permite. **DM sin adjuntos**. | `messages.body` y restricción transaccional deben diferenciar chat de evento y DM. |
| D03 | **CONFIRMADA** | Una historia publicada antes del fin del evento continúa visible **hasta las 24 horas exactas desde su publicación**, incluso si el evento finaliza entre tanto, para usuarios que mantengan permiso. El fin impide publicar nuevas historias. | Expiración en servidor; no aplicar filtro de evento vigente a lectura de historias ya publicadas. Revocación de acceso sigue vigente. |
| D05 | **CONFIRMADA** | Historias con **visor tipo Instagram**: pantalla inmersiva, secuencia de historias, indicadores de progreso, avance automático, toque anterior/siguiente y cierre. | No reemplazar por galería de miniaturas; teclado, pausa de accesibilidad, reduced-motion y control de foco. |
| D06 | **CONFIRMADA** | Google Calendar por enlace con evento precargado y descarga `.ics`, sin OAuth ni sincronización. | B7: ambos botones; usuario confirma evento. |\n| D07 | **CONFIRMADA** | Evento **oculto**: sólo organizador puede compartir su **enlace válido de invitación**. No filtrar tokens/invitaciones a confirmados u otros. | Backend valida autoridad de generación/consulta; fallback sin datos privados. |
| D08 | **CONFIRMADA** | Notificaciones Web Push con **vista previa concreta** (p. ej. remitente y texto de mensaje privado), no sólo mensaje genérico. | Construir preview sólo en backend para destinatario; texto acotado y saneado; sin contenido sensible en logs; permitir al usuario ocultar vistas previas. |
| D09 | **CONFIRMADA** | Supabase **Edge Functions + cron + cola interna** para Web Push y limpieza de historias expiradas. | Workers privados y observables, secreto VAPID server-only y scheduler con despliegue sujeto a autorización. |
| D15 | **CONFIRMADA** | **Sin cuota máxima inicial de historias por usuario ni por evento.** | No crear un `max stories/day/event`; se conservan controles técnicos de tamaño, formato, autorizaciones y protección antiabuso no equivalentes a cuota de producto. |
| P01 | **CONFIRMADA** | Implementación **paralelizable por al menos dos personas**, dependencias sólo donde sean técnicamente necesarias. | Ver `RELEASE_7_PARALLEL_WORK.md`: DAG, ownership exclusivo, integraciones y ramas. |

**Precisión:** D03 confirma explícitamente la continuidad después de la finalización normal; cancelaciones y archivado deben obedecer los permisos existentes de R6. No habilitar nueva publicación tras cerrar/cancelar/archivar. D08 supone que el usuario activó Push expresamente; previsualizaciones pueden aparecer en pantalla bloqueada, razón por la que se incluye control opcional de privacidad, sin deshacer la elección de mostrar contenido concreto.

## B. Calendario: decisión de producto confirmada

**D06 — CONFIRMADA por el responsable el 15/10/2026.** Implementar dos acciones dentro del detalle de evento:

1. **«Agregar a Google Calendar»** abre un enlace oficial `https://calendar.google.com/calendar/r/eventedit?action=TEMPLATE&...` con título, inicio, fin, zona horaria, ubicación y detalle autorizados. El usuario decide guardar. **No requiere OAuth**, ni cliente secreto, ni sincroniza futuras modificaciones.
2. **«Descargar .ics»** genera un `text/calendar` RFC 5545 para Apple Calendar, Outlook, calendarios del sistema y la importación manual a Google Calendar.

**NO incluir en R7 por defecto:** creación silenciosa mediante Google Calendar API (`events.insert`). Exige Google OAuth, consentimiento, scopes (p. ej. `calendar.events`), posible verificación, manejo seguro de tokens, casos de error y permisos, borrados, reintentos e integración por cuenta. Complejidad **media-alta** comparada con el enlace/ICS (**baja**). Si el responsable prefiere API/OAuth, registrar como ampliación con estimación y aceptación separadas. Fuentes oficiales: https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events y https://developers.google.com/workspace/calendar/api/auth y https://developers.google.com/workspace/calendar/api/v3/reference/events/insert .

## C. Decisiones técnicas que debe cerrar B0 (no preguntas de producto ya contestadas)

| ID | Estado | Propuesta o análisis pendiente | Gate |
|---|---|---|---|
| D04 | TÉCNICA PROPUESTA | No mantener archivo visible de historias caducadas; borrar objetos exclusivos de manera diferida. | B4/B6 |
| D10 | TÉCNICA OBLIGATORIA A VALIDAR | Denegación real del GET de historia vencida incluso al uploader: no signed URL reutilizable que sobreviva a T+24 h; auditar policies OR y cachés de Storage/Service Worker. | B1/B4/B6 |
| D11 | TÉCNICA PROPUESTA | Pedir permiso Push sólo por gesto explícito; soportar varios dispositivos y desactivación individual; preferencia «Mostrar vistas previas» activada tras consentir Push, desactivable. | B9 |
| D12 | TÉCNICA PROPUESTA | Frecuencias operativas: cleanup cada ~15 min; Push de baja latencia según plan de Supabase/costo; retries con backoff, métricas sin texto privado. No confundir cron con expiración efectiva. | B6/B10 |
| D13 | TÉCNICA OBLIGATORIA A VALIDAR | Idempotencia y limpieza de uploads huérfanos, sin borrar archivos en uso; modelo transaccional real entre Storage y DB. | B1/B2/B4 |
| D14 | TÉCNICA A MEDIR | Web Push en escritorio/Android e iOS cuando la PWA instalada/navegador lo soporte; marcar NOT RUN cuando falte hardware. | B9/B11 |
| D16 | TÉCNICA PROPUESTA | Duración por historia para autoplay: aprox. 5 s configurable en componente; detener progreso mientras carga imagen, está en pausa, pestaña no visible o reduce-motion. | B5 |
| D17 | TÉCNICA OBLIGATORIA | Congelar interfaces y ownership por frente; integración de `EventDetailPage.tsx`, `src/App.tsx` y archivos compartidos en B11 o PR integradora designada. | B0/B11 |

## D. Comportamiento de Push con contenido concreto

- Mostrar, **si existe autorización y datos disponibles**, tipo/actor/resumen útil. Para `direct_message`, remitente y **fragmento real** del mensaje dirigido al destinatario, escapado como texto, con longitud máxima de presentación definida y probada. No incluir texto de chat grupal ni convertir imágenes/eventos ocultos en adjuntos Push.
- No almacenar payload en logs, trazas, URL, analytics o columnas de diagnóstico. Los jobs guardan IDs, estado y reintentos. El worker resuelve la información autorizada para el destinatario antes del envío. Si el mensaje ya no existe, hubo revocación o no hay preview válida, usar texto genérico como fallback.
- Mostrar a usuarios que la **pantalla bloqueada** podría exponer la vista previa y ofrecer ajuste «Mostrar vistas previas» sin desactivar las notificaciones. Cualquier click revalida sesión y autorización antes de mostrar el contenido dentro de PlanIt.
- Separar **aceptado por servicio Push**, **mostrado por navegador** y **leído en aplicación**; nunca afirmar entrega garantizada.

## E. B0: documento de control

Completar `RELEASE_7_BLOCK_0_DECISIONS_TEMPLATE.md` sin pedir nuevamente D01/D02/D03/D05/D06/D07/D08/D09/D15/P01. Cerrar detalles técnicos D04/D10–D17 con responsables, evidencia y los acuerdos API del plan paralelo. Ningún acuerdo constituye permiso automático para modificar Supabase, lanzar cron, aplicar migraciones o hacer merge.