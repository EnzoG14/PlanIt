# R6 B4 — Períodos aprobados y contrato histórico

15/10/2026. El responsable aprobó en este chat **«Aprobar D03 propuesta»** ante la propuesta completa de B0: ventana inicial de 30 días calendario de Argentina incluyendo hoy; presets 7/30/90 y rango personalizado hasta 366 días; agrupación por día/semana, lunes inicial y semanas parciales rotuladas. El filtro afecta sólo movimientos históricos; ocupación y demografía siguen siendo actuales. Esta adenda reemplaza el pendiente D03 de los cortes anteriores. No autoriza B5, DDL remoto, merge ni deploy.

D02 conserva tres series: `NULL→confirmed` alta nueva, `cancelled/removed→confirmed` reincorporación, `confirmed→cancelled/removed` baja. No se implementa stock histórico ni check-in. `reason=registration` no identifica exclusivamente altas nuevas.

`get_my_event_participation_series(p_event_id uuid,p_from timestamp,p_to timestamp,p_bucket text) → jsonb`. Fechas propias sin TZ, hora Argentina. Límites a medianoche local, rango `[from,to)`, `from<to`, máximo 366 días calendario; bucket `day/week`, máximo 366/54 puntos. La UI recibe fechas inclusivas y suma un día al extremo final. Se admiten semanas parciales sin contar historia anterior/posterior al rango. Fechas finitas dentro de años 0001–9999; extremos con horas parciales se rechazan para mantener el contrato de días calendario y la cota de puntos.

STABLE DEFINER por RLS de participaciones/historial que sólo permite lectura propia; verifica UID y propiedad antes de agregar. Search path vacío, nombres calificados, EXECUTE sólo authenticated. Evento ajeno/inexistente/NULL: `42501 event_unavailable`; parámetros inválidos: `22023 invalid_parameters`; sin UID: `42501 authentication_required`. Sin SQL dinámico, datos individuales, nuevas tablas, políticas, triggers, contadores ni grants de lectura.

La RPC devuelve `event_id/from/to/bucket/as_of/points`, y por punto únicamente `bucket_start/new_confirmations/reconfirmations/departures`. Un resultado correcto rellena intervalos vacíos con cero. La UI valida contexto completo, orden, cantidad de puntos y conteos; un error nunca se convierte en una serie de ceros. Cada cambio de rango reemplaza el componente de consulta por clave evento/rango/bucket/revisión: el primer render ya no contiene resultados anteriores, cleanup aborta y su guardia descarta respuestas tardías. El shell B2 conserva aislamiento usuario/token/evento, offline/ocultamiento/logout.

La aprobación de D03 y la implementación B4 no constituyen aceptación integral de los cinco CA afectados. [Evidencia y límites](../qa/r6-block-4/README.md).
