# Correcciones de layout y simplificación de controles

Rama: `codex/ui-layout-fixes`, basada en main de `mapbox-worktree`. Incluye main actualizado (`b57580c`, PR #92 de precarga) mediante merge en esta rama; se repitieron build, lint y pruebas de interfaz después de integrarlo.

Cambios: avatar social con estilos propios; dock sólo en las cuatro rutas principales;
fondo continuo en seguidores, siguiendo, perfiles y solicitudes de seguimiento;
Unirme flotante sin halo, Retirarme al final y enlaces separados por 12 px;
controles del header de DM con iconos; eliminación de los botones manuales de actualizar
y de los textos de sincronización de chats. El detalle omite el recuadro sin portada y la descarga ICS; el mapa omite el subtítulo y la ubicación predeterminada con su botón de restauración. Reintentar sigue disponible ante errores.
Editar perfil conserva una consulta automática opcional de cargas y su limpieza explícita;
se retiran los botones Revisar cargas interrumpidas/Actualizar relaciones y el aviso de búsqueda vacía.

## Verificación

- `npm run build` y `npm run lint` (advertencias heredadas).
- `node scripts/check-ui-layout-fixes.mjs`: aplicación compilada en Edge headless,
  Auth/REST/WebSocket interceptados con fixtures explícitos, sin escrituras remotas.
- Anchos 320, 375, 390, 768 y 1280 px; avatar de 2400 × 1400, acceso directo,
  recarga, fallback, nombres largos, navegación sin remontar layout, headers sociales,
  inscripción/retiro, reincorporación aprobada, error/reintento y notificaciones.
- `results.json` y capturas móvil/escritorio acompañan este documento.
- Emulación de poca altura y zoom 200%; sin prueba en teléfono físico ni lector de pantalla.
- Los fixtures validan la interfaz de limpiar y recargar la bandeja, incluso avisos no
  paginados, fallos y nuevas llegadas; no prueban ejecución PostgreSQL ni RLS reales.

## Limpieza persistente aplicada en planit-v2

`20261020120000_notifications_clear_inbox.sql` fue **aplicada en planit-v2** (`iepeqmvzjguwlhnecsdq`) el 19/10/2026 con autorización explícita del usuario.
Añade `notifications.dismissed_at` y `clear_notifications()` sin parámetros de identidad;
reutiliza RLS por destinatario y permisos por columna, SECURITY INVOKER y reloj Argentina.
La limpieza marca también lectura, conserva la primera lectura y el historial, excluye
avisos de las proyecciones de bandeja y descarta Push pendientes al comprobar entrega.
Los avisos nuevos siguen entrando. Realtime fuerza reconciliación completa al descartar avisos.

`supabase/verification/notifications-clear.sql` prepara casos de dos destinatarios,
anon/sesión sin identidad, idempotencia, paginación, primera lectura y nuevas llegadas.
**Ejecutado y aprobado** en planit-v2 dentro de transacciones con rollback, antes de aplicar la migración (DDL temporal) y después de aplicarla. No quedaron fixtures ni cambios en las bandejas reales. Migration list y dry-run confirmaron que era la única pendiente; el dry-run posterior quedó sin pendientes. Los asesores de seguridad se consultaron antes y después: se comparan sus resultados en `remote-verification.json`.
