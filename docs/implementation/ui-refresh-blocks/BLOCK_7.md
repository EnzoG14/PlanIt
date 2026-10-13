# Bloque 7 — Acciones y reincorporaciones

13/10/2026. Dirección B · Amanecer v3.0. Rama `design/amanecer-block-7-actions`, base `origin/main` **bdba68af06e1462f8250dc6200b8a2009b682cc6** (PR #33 ya integrada). Worktree independiente bajo home, con índice CodeGraph propio. El cambio local de `D:/planit/vite.config.ts` se conservó en el checkout original. No se fusionó a main.

## Implementación

- Gestión embebida con título visible, filas claras, separación de cancelación/archivo, estados de hover/foco/deshabilitado y tokens `--pi-*`. Los estilos no activan el tema de la página que contiene el componente.
- Confirmaciones de gestión autónomas: superficie blanca, acción destructiva roja sólida, mensajes semánticos, scroll y botones apilables. La salida segura dice «Conservar evento» al cancelar y «Volver» en archivo/duplicación. `EventActionDialog.dismissLabel` es opcional y conserva «Cancelar» por defecto en Mis eventos; no cambia sus handlers ni el contrato funcional.
- `/events/:id/rejoin-requests` activa Amanecer sólo por su propia ruta. Reutiliza composición, mancha aria-hidden y diálogo de gestión ya aprobados. Tarjetas con identidad autorizada, fecha Argentina, pendiente y acciones de aprobar/rechazar. Aviso de falta de cupo informativo: no modifica habilitación, autorización ni resolución de la operación.
- Estados embebidos de solicitud: elegible/pendiente, rechazo con fecha de espera y aprobación. La participación sigue siendo `confirmed`, `cancelled` o `removed`; `pending` pertenece únicamente a la solicitud. Feedback, recuperación y acción no disponible se encapsulan cuando está presente la superficie de reincorporación.

`actions.ts`, `rejoin.ts`, `participation.ts`, Supabase, SQL, migraciones y permisos permanecen sin cambios. Se conservan reconciliación de resultado incierto, doble envío, transacciones, historial y espera de siete días. No se modificaron EventDetailPage, MyEventsPage, EventCard ni pantallas de Galería/Asistentes.

## Independencia e integración

Autónomos: gestión y sus confirmaciones, tarjeta/feedback de solicitud removida y aviso de aprobación. Se verificó el componente con `.amanecer-shell` retirado únicamente del DOM de fixture. La bandeja tiene shell y composición propios por ruta.

El orden del contenido, la barra persistente y la ubicación de EventParticipation siguen siendo responsabilidad de Detalle. La crítica observa distancia entre el CTA real de solicitud y el mensaje persistente deshabilitado; se registra como límite de integración de Detalle, sin rediseñarlo en este bloque. El refresco periódico que puede retirar temporalmente el elemento enfocado es comportamiento previo; requiere evaluación con lector de pantalla antes de otro cambio funcional.

## Verificación y evidencia

[Registro completo](../../design/verification/ui-refresh/block-7-actions/README.md), [crítica/auditoría](../../design/verification/ui-refresh/block-7-actions/IMPECCABLE.md), resultados JSON y capturas en carpeta exclusiva. El STATUS central y la evidencia histórica están intactos.

Checks específicos: build, lint, tokens Amanecer, acciones SQL/UI, reincorporación SQL/UI, participaciones UI y Mis eventos UI. La regresión R3 completa incluye Asistentes, Galería y chat. Resultado final: todos los comandos solicitados PASS, 28/28 checks R3 PASS y 18/18 diálogos del piloto idénticos. El registro conserva incidencias de entorno y reejecuciones.

Seis anchos: 320/360/375/390/768/1280. Texto simulado al 200 %, nombres sin espacios, viewport de 240 px, foco inicial/ciclo/retorno y Escape, targets, estados de red/permisos/cupo y comparación de los tres diálogos del piloto contra la base inmutable. Fuente autoalojada/fallback y preferencias emuladas de movimiento/transparencia verificadas. Los detalles de igualdad de píxeles y pequeñas variaciones de raster periféricas se registran en `visual/results.json`.

No hubo escrituras remotas. PostgreSQL real efímero con scaffolding local e interceptación de Auth/REST/Storage/WebSocket en navegador no acreditan JWT/HTTP remoto ni aceptación humana. Pendientes: lector de pantalla, zoom nativo, teléfono/PWA, teclado móvil, safe areas y rendimiento físico.
