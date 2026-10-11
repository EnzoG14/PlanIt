# PlanIt — Mockups individuales de Release 3

**Carpeta canónica:** `docs/design/mockups/r3/`. Referencia previa: `../release-3.png`.

Este índice fija los nombres exactos para las **siete imágenes individuales** del diseño R3. **Los siete PNG originales se incorporan en la PR del Bloque 0** y fueron abiertos visualmente junto con el collage original el 11/10/2026. Se conservan sin transformación; son referencias de diseño, no capturas de UI implementada. [Correspondencia con rutas/componentes, RF y bloques](../../../implementation/RELEASE_3_BLOCK_0_DECISIONS.md#5-correspondencia-visual-y-excepciones).

| Archivo disponible | Pantalla o conjunto | Usado en el bloque |
| --- | --- | --- |
| `01-mis-eventos.png` | Organizo / Participo; estados | 0, 1, 7 |
| `02-editar-evento.png` | Formulario de edición | 0, 2, 5, 7 |
| `03-galeria.png` | Subida, orden, portada y baja de fotos | 0, 3, 7 |
| `04-asistentes.png` | Administración de asistentes | 0, 4, 6, 7 |
| `05-solicitudes-reincorporacion.png` | Bandeja del organizador | 0, 6, 7 |
| `06-acciones-evento.png` | Acciones del organizador en detalle | 0, 5, 7 |
| `07-estados-dialogos.png` | Confirmaciones, removido y solicitudes | 0, 4, 5, 6, 7 |

## Conservación y revisión de las imágenes

1. Conservar cada PNG original **con el nombre exacto de la tabla**, sin cambiar los nombres de los prompts.
2. Mantener sólo las imágenes de referencia (no generar mockups de pantallas falsas).
3. Antes de empezar cada bloque de frontend, Codex debe abrir el/los PNG correspondientes. Si faltan, indicar qué archivo falta y dejar la comparación visual pendiente, sin declarar que el diseño fue verificado.

## Correcciones funcionales obligatorias frente a las ilustraciones

- **Sin drafts:** no hay «Borradores» persistentes; se conservan Organizo/Participo.
- **Sin DELETE físico:** el evento se **archiva**, preservando historial y cancelando primero si aún está vigente.
- **Sin emails privados ni campos demográficos:** nombres/username/avatar exclusivamente si son una proyección social autorizada por la BD.
- `pending` designa **solicitudes de reincorporación**, nunca un estado normal de participación.
- **Sin motivos/comentarios** de readmisión si el esquema aprobado no los contiene.
- **Sin exportación CSV ni panel de ocupación:** pertenecen a R6. El contador operativo de inscriptos es válido para capacidad.
- **Una categoría** por evento, sin favoritos, compartir o tags sociales inventados.
- Galería **máximo 10** y portada por orden; formato/tamaño se valida con backend real, no por etiqueta del mockup.
- Duplicar **sólo precarga formulario**; no crea registro ni copia asistentes o chats hasta confirmación del nuevo evento.
- Las ilustraciones incluyen marcos de teléfono/fondos decorativos que **no** deben introducirse como parte de la PWA.

**Orden de prioridad:** RF y CA vigentes de `docs/requirements/RELEASE_3_REQUIREMENTS.md` + especificación técnica aprobada → contratos y seguridad existentes → mockups para composición y estilo. Consultar también `docs/design/{DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md`.
