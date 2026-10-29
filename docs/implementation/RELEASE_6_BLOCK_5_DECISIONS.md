# R6 B5 — Contratos aprobados de exportación

**Actualización 29/10/2026:** el CSV de estadísticas incorpora edad y sexo agrupados y conserva períodos sin movimientos. [Contrato vigente y decisión aprobada](STATISTICS_DEMOGRAPHICS_CSV.md). El CSV de asistentes no cambia; el texto siguiente es el antecedente del 15/10.

15/10/2026, Argentina. El responsable aprobó expresamente el plan B5 en este chat. Alcance exclusivo RF-R6-04.CA-01..04; sin merge, DDL remoto, deploy ni avance a B6.

## Snapshot y límites

Ante la contradicción entre paginación en el prompt y snapshot en B0, el responsable eligió **Snapshot único**. Esta decisión reemplaza la paginación del prompt B5: una RPC STABLE, sin cursor, tablas de snapshots ni persistencia de reportes. Máximo 5.000 filas y 10 MiB UTF-8 de respuesta JSON en servidor; el cliente verifica también JSON y CSV final ≤10 MiB. Timeout cliente de 15 segundos, incluida preparación. Superar un límite falla íntegramente; no truncar ni descargar parcialmente.

D05/D06 quedan ratificadas por la aprobación del plan. La respuesta conjunta referenciada en la adenda B3 se conserva como antecedente. D04/D08 y los riesgos residuales aceptados en B3 no cambian. B5 **no exporta demografía**, ni agrega nuevos cruces o desgloses.

## D05 — Asistentes actuales

`get_my_event_export_rows(p_event_id uuid) → jsonb`: `{version:1,event_id,event_title,as_of,rows:[{username,display_name,status,first_registered_at}]}`. El identificador del evento es contexto para validar la respuesta y no se escribe en CSV. No se transmiten IDs de personas/participaciones.

Sólo `confirmed` actuales, excluido organizador, todos los estados de eventos propios; orden interno por participación UUID. Primera inscripción = mínimo historial `NULL→confirmed`; sin historia → null/celda vacía. Bloqueo bilateral usa `planit_private.social_blocked`: username vacío y nombre «Perfil no disponible», como gestión R5. No utilizar audiencia social para ampliar acceso.

Columnas: `evento;username;nombre_visible;estado;fecha_primera_inscripcion`. El período de movimientos no filtra asistentes. El estado exportado es `confirmed`; no acredita presencia física.

## D06 — Estadísticas y formato

Columnas: `evento;desde;hasta;granularidad;inicio_periodo;inscripciones_nuevas;reincorporaciones;bajas`. Se serializa la respuesta B4 ya mostrada, sin una segunda consulta que cambie las cifras. `[desde,hasta)` en hora Argentina; fechas ISO sin `Z`; granularidad `day/week`, lunes y semanas parciales según B4. Los buckets vacíos se conservan si existe algún movimiento; si todo el período es cero se informa ausencia sin archivo.

Dos archivos separados, UTF-8 BOM, `;`, CRLF, todas las celdas quoted, comillas duplicadas, enteros sin agrupación. Nombres de archivo constantes por tipo y fecha ISO de consulta, sin nombres de usuario ni IDs.

Neutralización reversible del contenido textual antes del quoting: si empieza con apóstrofo, duplicarlo; si empieza con `= + - @` tras espacios, controles Unicode o caracteres de formato, prefijar apóstrofo. Para recuperar el texto leído por un parser: quitar un apóstrofo inicial cuando haya dos, o cuando el resto coincida con el patrón peligroso. La reversión es para análisis controlado, no para volver a abrir el texto sin protección en una hoja de cálculo. Excel real pendiente; un parser válido no certifica ejecución de fórmulas en Excel.

## Integridad e interfaz

Validar allowlist, versión, evento, filas/timestamps, bytes y sesión antes de crear Blob. Cancelar ante cambio de usuario/token/evento/filtros, refresh, navegación, pestaña oculta, offline, timeout o acción explícita. Liberar object URLs tras iniciar la descarga. Sin datos, error o cancelación: ningún archivo. «Descarga iniciada» no afirma que el usuario haya guardado el archivo.

La autorización se impone en servidor con UID y ownership antes de leer perfiles/historia; DEFINER justificado por RLS owner-only, search_path vacío, EXECUTE authenticated y revocación PUBLIC/anon. Sin grants de tablas, políticas, triggers, tablas ni índices nuevos. La migración sólo se entrega localmente.
