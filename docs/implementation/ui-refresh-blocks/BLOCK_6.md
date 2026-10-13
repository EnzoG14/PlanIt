# Bloque 6 — Chat, Perfil y Notificaciones

Entrega independiente Amanecer B v3.0; base `origin/main` **da90d985865d9c9f681bbda0e011fa484d39040e**, sincronizada con `git fetch origin`. Rama `design/amanecer-block-6-social`, checkout `amanecer-block-6-worktree`. Los cambios locales de la rama original se conservaron. Sin fusiones de otras ramas.

## Implementación

- `/events/:id/chat`: encabezado compacto con título adaptable, entrantes blancas y propias tinta marina, autor y hora ≥13,5 px, envío azul, campo blanco con borde perceptible, contador y errores legibles. Estado de conexión anunciado mediante `role="status"`. Conserva carga anterior, vacío, error, permiso denegado y sólo lectura.
- `/me`: avatar tinta/lavanda, identidad y biografía jerarquizadas, correo del propietario, recuperación y datos ausentes. Accesos a Mis eventos y Notificaciones. Cerrar sesión conserva el recorrido existente **Cuenta → Cerrar sesión**, incluido bloqueo durante envío y error de sesión.
- `/notifications`: filas blancas con jerarquía de contenido/fecha/estado/acciones. Leído/No leído conservan texto; no leído añade pip y énfasis. Conserva paginación, destino autorizado, marcado y errores. No se agregó agrupación por fecha porque la implementación actual no la admite.

`AppLayout` agrega el opt-in `.amanecer-shell.social-shell` exclusivamente a estas tres rutas, además de los scopes que ya existían en main. Una mancha decorativa `aria-hidden` por ruta y composición local en `src/styles/social.css`. Sin cambios a tokens, Foundation, StatusMessage, servicios de negocio, Auth, RPC, SQL, RLS, Storage o migraciones. No estadísticas, seguidores, Web Push ni categorías nuevas.

## Shell y scroll

Conserva el efecto de `VisualViewport` (alto y offset), listeners/cleanup, `chat-active`, scroll único del historial, refs, ResizeObserver, anclaje al final, ancla al paginar, lectura de historial al recibir mensajes y reconciliación. Un override local de mayor especificidad mantiene `position: fixed` del chat frente al `position: relative` de Foundation. El contenido de carga/vacío/error puede desplazarse dentro de su área disponible. Ajustes de poca altura limitados al chat. No dock ni header general en esa ruta.

La prueba de chat confirma composer alcanzable, último mensaje visible, paginación sin salto, recepción durante lectura, envío, offset de viewport, altura de teclado simulada, safe areas simuladas, sólo lectura y limpieza al salir.

## Verificación

[Evidencia y límites](../../design/verification/ui-refresh/block-6-social/README.md), [checks](../../design/verification/ui-refresh/block-6-social/checks.json), [critique/audit](../../design/verification/ui-refresh/block-6-social/IMPECCABLE.md).

Pasaron build, lint, Amanecer, chat layout, Realtime unidad/UI, profile SQL/UI, notifications SQL/UI, My events UI, Auth y Auth Amanecer UI. Se incorporaron entradas npm para runners de perfil/notificaciones existentes y un runner visual social. Los runners aceptan carpeta de salida para preservar evidencia histórica; selectores de navegación y logout actualizados al menú Cuenta vigente.

Capturas antes/después en 320/360/375/390/768/1280 px. Base servida desde una copia aislada de sus fuentes, mismo navegador/configuración/fixtures. Estados adicionales a 390 px: vacío/datos ausentes, largos, error y carga; chat sólo lectura, 320×400 y teclado simulado 320×320; perfil con texto aumentado y preferencias reducidas. Lab `/b/chat`, `/b/profile`, `/b/notifications` consultado y capturado como referencia ficticia.

No se actualizó STATUS global. No se aplicaron migraciones a Supabase. PR draft hacia main; sin fusionar.

## Pendientes

Aceptación visual humana; teclado móvil, gestos, safe areas y rendimiento de blur en dispositivo real; lector de pantalla y zoom nativo. Fallback de fuente bloqueada y ausencia real de soporte de backdrop-filter no ejercitados (la Foundation conserva ambas alternativas). Emulación y fixtures no acreditan E2E remoto ni entrega real de Realtime.
