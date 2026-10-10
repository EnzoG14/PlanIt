# Bloque 5 — Mis eventos (R1-07)

Estado: **Implementado; QA pendiente**, 10/10/2026. Base: `main` con PR #3 integrado (`696348c`). Ningún criterio marcado **Validado**; no se inició el Bloque 6.

## Comportamiento y contrato

`/my-events` tiene dos tabs accesibles, Organizo y Participo. La selección se conserva en `?section=organizing|participating` y al volver desde una tarjeta del detalle. Crear abre `/events/new`; publicar conserva el flujo existente al detalle y desde allí a Mis eventos. Sin borradores, filtros de fecha, menú de gestión, asistentes ni solicitudes de reingreso.

RPC `get_my_events(p_section text, p_offset integer default 0)` en `20261010154930_my_events_read.sql`: **NO aplicada a Supabase remoto**. SECURITY INVOKER, `search_path=''`, EXECUTE exclusivo de authenticated y validación de sesión/sección/offset. Las filas se filtran por auth.uid() en PostgreSQL y siguen bajo RLS. No se acepta userId; no se alteran tablas, índices, políticas ni las RPC de inscripción/retiro.

Organizo deriva de organizer_id; Participo de la participación propia y excluye organizadores. Estados de evento: archivado > cancelado > finalizado según ends_at/reloj Argentina > publicado. Estado de inscripción independiente: confirmed/cancelled/removed. Removed sólo muestra historial autorizado; no revela motivo ni autor ni habilita funciones R3.

Proyección: id, title, starts_at, ends_at, location_name, address, category_name, event_state, participation_status, image_path. Sin organizer_id, user_id, perfiles, asistentes ni motivos. Portada seleccionada por sort_order en la misma consulta; URLs firmadas en un lote por página. Fallo de imágenes mantiene el evento con placeholder. Fallos RPC/RLS no se presentan como una lista vacía.

Orden starts_at DESC/id ASC, página de 30 y lookahead de una fila; Cargar más usa offset. Se eliminan duplicados por ID al concatenar. Una actualización reinicia paginación; con cambios concurrentes entre páginas se debe refrescar para obtener la lista actual. No se mantiene caché privada persistente ni se añade runtime cache PWA.

Las listas recargan al montar/volver, en foco/visibilidad y al cambiar cuenta; las respuestas de una instancia anterior se descartan. La vuelta a la página después de inscripción/retiro muestra el estado persistido, sin modificar la fila histórica desde la pantalla.

## Verificación ejecutada

| Comando | Resultado / entorno |
| --- | --- |
| `npm run build` | PASS: TypeScript, Vite y generación PWA |
| `npm run lint` | PASS |
| `npm run check:my-events` | PASS: PostgreSQL 17.5 real local, tres identidades SQL y scaffolding Auth/Storage |
| `npm run check:my-events:ui` | PASS: Edge real, Supabase HTTP interceptado, 375×812 y 1280×900, dispositivo en zona Asia/Tokyo |
| `npm run check:participations` | PASS: regresión PostgreSQL real, diez carreras multiconexión de último cupo |
| `npm run check:discovery` | PASS: regresión SQL PGlite, filtros y RLS |
| `npm run check:participations:ui` | PASS: móvil/escritorio, fixtures HTTP |
| `npm run check:discovery:ui` | PASS: móvil/tablet/escritorio, fixtures HTTP y tiles interceptados |

Datos ficticios y miniaturas SVG identificados como fixtures en los scripts; no se reutilizaron fotos del collage. PostgreSQL local no acepta URL remota. Las ejecuciones iniciales encontraron bloqueos del sandbox para TCP local y Edge; las ejecuciones PASS se realizaron con permisos locales. Se corrigieron fixtures de metadatos de Storage, selectores y notificación Auth antes de completar las pruebas.

Reproducción: usar las herramientas locales preexistentes de pruebas (`.participation-test-tools.local` con pg/embedded-postgres, `.event-test-tools.local` con PGlite y Playwright del runtime). Iniciar Vite; asignar `PLANIT_UI_ORIGIN` al puerto elegido (verificado en `http://127.0.0.1:4187`) y ejecutar los comandos. Estos helpers están ignorados por Git; no se añadieron dependencias de producción.

Resultados estructurados: [PostgreSQL](postgres-results.json), [UI](ui-results.json), [regresión de participaciones](regressions/postgres-results.json). Las capturas regeneradas de detalle de discovery se guardaron bajo `regressions/` para conservar intacta la evidencia de bloques anteriores.

## Matriz operativa RF-R1-07.CA-01..04

La agrupación sigue el alcance del Bloque 5 del plan R1 versionado: separación por rol, detalle, actualización y vacíos/privacidad. El cotejo final con los CA originales y su aprobación corresponden a la revisión humana.

| Criterio | Cobertura y evidencia | Resultado |
| --- | --- | --- |
| CA-01 | Organizo sólo devuelve eventos propios; organizador fuera de Participo; categoría/fecha/lugar/estado. SQL con organizador/participante/tercero y UI dos cuentas fixture. | PASS local; QA pendiente |
| CA-02 | Participo sólo muestra vínculos propios; confirmed → cancelled → confirmed conserva fila; removed e históricos autorizados, sin datos ajenos. SQL RLS de evento, files, event_images y storage.objects. | PASS local; QA pendiente |
| CA-03 | Crear → detalle → lista; tarjeta → detalle → retiro/reinscripción → regreso; back del navegador, refresco en foco/visibilidad, respuesta anterior descartada y cambio de cuenta. | PASS fixtures; Auth/REST real pendiente |
| CA-04 | Vacíos por rol, sesión inválida/ruta directa, error de red/permisos/RPC no desplegada y reintento, miniatura fallida, paginación sin duplicados, teclado y sin overflow. | PASS local/fixtures; QA pendiente |

## Capturas y comparación visual

| Estado | Móvil 375×812 | Escritorio 1280×900 |
| --- | --- | --- |
| Organizo | [Captura](organizing-375x812.png) | [Captura](organizing-1280x900.png) |
| Participo | [Captura](participating-375x812.png) | [Captura](participating-1280x900.png) |
| Historial archivado/removido | [Captura](history-375x812.png) | [Captura](history-1280x900.png) |
| Vacío | [Captura](empty-375x812.png) | [Captura](empty-1280x900.png) |
| Error | [Captura](error-375x812.png) | [Captura](error-1280x900.png) |
| Permisos denegados | [Captura](permissions-375x812.png) | [Captura](permissions-1280x900.png) |

Comparación realizada con el primer teléfono R3 y navegación/detalle R1. Se preservan fondo marino, superficies elevadas, miniatura lateral, título/fecha/lugar, badges y botón agregar azul/violeta. Diferencias deliberadas: tabs de roles R1 en lugar de filtros de R3, sin menú de gestión ni Borradores, badges independientes para evento e inscripción, cabecera/navegación existente de la PWA. Escritorio conserva las filas en ancho limitado. Verificados target Crear 48×48, tabs ≥44 px, foco de teclado y scrollWidth ≤ viewport; safe-area usa el AppLayout existente.

## Pendientes y riesgos

- Revisión humana; no marcar Validado automáticamente.
- Aplicar la migración sólo con autorización en planit-v2. Mientras falte, la pantalla informa indisponibilidad y permite reintentar.
- Dos sesiones Auth/REST reales y Storage HTTP real tras despliegue: los roles SQL y los fixtures no equivalen a login real.
- Docker instalado sin daemon operativo; no se iniciaron contenedores ni se modificó la validación del destino Supabase para permitir otro backend.
- Prueba en teléfono físico/PWA y revisión visual humana.
- Ninguna modificación remota, ningún merge y ningún trabajo del Bloque 6.
