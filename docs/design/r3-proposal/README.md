# PlanIt — R3: referencias visuales individuales (propuesta)

**Referencia original preservada:** `docs/design/mockups/release-3.png`. Las imágenes generadas en la conversación son **conceptuales**, no capturas funcionales ni un contrato de datos.

## Pantallas propuestas

| Referencia visual generada | Destino UI | RF |
| --- | --- | --- |
| 01 — Mis eventos | `/my-events?section=organizing` | R3-04 |
| 02 — Editar evento | `/events/:id/edit` (ruta propuesta) | R3-01 |
| 03 — Galería | `/events/:id/images` (propuesta) | R3-03 |
| 04 — Asistentes | `/events/:id/attendees` (propuesta) | R3-05/06 |
| 05 — Solicitudes | `/events/:id/rejoin-requests` (propuesta) | R3-09 |
| 06 — Acciones de evento | `/events/:id` (integrar al detalle) | R3-02/07 |
| 07 — Estados/diálogos | Componentes reutilizables, **no páginas** | R3-02/06/08/09 |

**Estado de los PNG individuales:** producidos en la conversación, pero aún no incorporados al repositorio en esta PR. El conector disponible permite publicar archivos UTF-8, pero no dispone aquí de los bytes de esos PNG para convertirlos en blobs Git. No presentar este listado como imágenes ya subidas; conservar nombres para futura carga de binarios o usar los archivos originales cuando se habilite su transferencia.

## Correcciones obligatorias al implementar

1. **Sin «Borradores»:** no existe draft persistente; pestañas `Organizo/Participo` se conservan.
2. **Sin borrado físico:** «Eliminar» de la captura original es «Archivar»; si está vigente, primero cancelar de forma atómica.
3. **Sin pending en participación:** `pending` sólo corresponde a `event_rejoin_requests`. Los estados de participación son confirmada/cancelada/removida según contrato.
4. **Privacidad:** la lista de asistentes y solicitudes NO debe mostrar emails privados del mockup. Usar sólo nombre/username/avatar social autorizado y RLS.
5. **No inventar campos:** los mensajes/motivos escritos por solicitantes en una tarjeta ilustrativa no acreditan columna de comentario en el esquema.
6. **Máximo 10 fotos:** portada = primera por orden; carga/reordenamiento accesible; formatos/tamaños conforme a validación real, no únicamente texto de la imagen.
7. **Una categoría por evento:** chips múltiples del detalle son decorativos, no múltiples categorías reales.
8. **Sin favoritos/compartir si no corresponde:** el corazón y la acción de compartir pertenecen a otras releases; no habilitarlos en R3.
9. **Sin CSV ni analítica R6:** si alguna variante del diseño muestra Exportar lista, porcentaje, dashboard de ocupación o reporte, omitirlo. Un contador de confirmados necesario para gestionar el cupo sí es válido.
10. **Duplicar no guarda al hacer clic:** abre formulario editable precargado; no copiar inscripciones, mensajes ni estadísticas.
11. **Reincorporaciones:** primera solicitud inmediata; tras rechazo 7 días; pendientes sin reservar cupo; aprobar sólo con plaza y evento vigente.
12. **Pantallas de teléfonos son inspiración visual:** no replicar marcos de iPhone ni el fondo del póster en el runtime; preservar tokens dark-blue/violeta y responsive.

## Uso para implementación

Comparar `docs/design/mockups/release-3.png` con las referencias individuales de esta conversación cuando estén disponibles. Antes de editar frontend leer `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`. Preferir la fidelidad de diseño y la funcionalidad aprobada frente a ilustraciones con datos ficticios.
