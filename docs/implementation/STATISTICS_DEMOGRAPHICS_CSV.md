# Estadísticas: CSV combinado y grupos desde una persona

Decisión aprobada por el responsable el 29/10/2026 al solicitar implementar el plan de este chat. Esta adenda reemplaza el umbral `k=5` y el estado `suppressed` de B3, y el formato de estadísticas y la exclusión de demografía de B5. Los documentos anteriores se conservan como antecedentes históricos.

## Demografía y autorización

`get_my_event_demographics(uuid)` mantiene firma, campos, ownership antes de leer datos privados, `STABLE SECURITY DEFINER`, `search_path=''` y EXECUTE sólo para authenticated. No cambia RLS ni concede SELECT de perfiles ajenos. Sólo considera inscripciones confirmadas actuales, excluido el organizador.

Cada dimensión contiene `state: empty | available` y `groups`. Cero participantes devuelve `empty` y grupos vacíos en ambas dimensiones. Desde una persona devuelve `available`, con todas las categorías fijas, ceros incluidos. El frontend rechaza `suppressed`, grupos incompletos, cantidades negativas/no enteras, distribuciones disponibles sin personas y totales distintos entre edad y sexo.

Los rangos publicados son `18–24`, `25–34`, `35–44`, `45–54`, `55+` y Sin informar; sexo declarado Femenino/Masculino/Otro/Sin informar. Edad en años cumplidos al día argentino de consulta, indicado por `age_as_of`. No se exportan cumpleaños, edades individuales, identificadores de personas ni cruces edad/sexo. El responsable acepta que con una persona se puede deducir su rango y sexo declarado; no hay garantía de anonimato.

## Contrato CSV de estadísticas

`statisticsCsv(title, series, demographics) → string` valida el DTO demográfico y exige el mismo `event_id` que la serie. El CSV contiene exactamente estas columnas:

```text
evento_id;evento;tipo;grupo;desde;hasta;granularidad;inicio_periodo;fecha_consulta;cantidad
```

- Primero, tres filas por bucket, en orden: `inscripciones_nuevas`, `reincorporaciones`, `bajas`. Grupo vacío; período `[desde,hasta)`, granularidad `day/week`, inicio del bucket y `fecha_consulta` de la serie mostrada. Se conservan todos los períodos, incluidos los que tienen cero movimientos.
- Luego, seis filas de tipo `edad` y cuatro de tipo `sexo`, en el orden de categorías anterior. Grupo usa la misma etiqueta que la pantalla; campos de período vacíos, fecha de consulta del DTO demográfico y cantidad exacta. No representan demografía histórica del período elegido.
- Sin participantes, las diez categorías se exportan con cero. Sin movimientos, se descarga igualmente el reporte completo. Los porcentajes permanecen en pantalla; no se agregan al CSV.

Ambas fuentes se toman de las consultas ya mostradas, sin volver a consultar durante la exportación y sin prometer un snapshot atómico entre RPC distintas. Cada fila conserva su fecha de consulta. Fechas ISO sin zona interpretadas como Argentina. UTF-8 con BOM, delimitador `;`, CRLF, todas las celdas entre comillas, escape de comillas y protección reversible contra fórmulas. Límite final de 10 MiB, timeout y cancelación por sesión, navegación, pestaña oculta y desconexión conservados.

Si demografía falla, se preservan los indicadores válidos, se ofrece Reintentar y se deshabilita la descarga de estadísticas. No se genera un reporte incompleto. El CSV de asistentes mantiene su contrato y su manejo de lista vacía.

## Aplicación y comprobación

Migración nueva: `20261029180809_r6_demographics_without_suppression.sql`. Se prepara localmente; no autoriza aplicación remota, deploy ni merge. Aplicar la migración autorizada antes de publicar el frontend, porque el nuevo cliente rechaza el antiguo estado `suppressed`.

Pruebas y límites: [registro QA](../qa/statistics-demographics/README.md). La verificación con fixtures no acredita JWT remoto, dispositivos físicos ni ejecución de fórmulas en Excel real.

## Ajuste solicitado: retirar menores de 18

Se retira la categoría de menores de 18 de pantalla y CSV. El contrato RPC conserva `under_18` para validar sumas; los porcentajes de pantalla conservan como denominador todos los confirmados. No se reclasifican menores como Sin informar ni se alteran participantes, movimientos o sexo. El CSV publica seis grupos de edad y cuatro de sexo; por esta exclusión sus totales pueden diferir. No requiere otra migración.
