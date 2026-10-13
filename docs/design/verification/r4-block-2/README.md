# R4 BLOQUE 2 — evidencia: fecha, radio y sincronización Inicio/Mapa

**Fecha:** 14/10/2026 (Argentina). **Base:** `main` `a76247d`. **Rama:** `codex/r4-block-2`. Evidencia **nueva**; no sobrescribe QA histórica ni la evidencia de los bloques 0–1 o del refresh Amanecer.

## Decisiones de diseño/contrato

- **SQL (`20261014120000_search_public_events_date_radius.sql`):** reemplaza la firma de 9 argumentos de `search_public_events` por una de 14 (`p_date_from`, `p_date_to` `date`; `p_origin_lat`, `p_origin_lng`, `p_radius_km`). `SECURITY INVOKER`, `search_path=''`, EXECUTE sólo `authenticated`, igual que el bloque 1. La función vieja se elimina en la nueva migración (la anterior no se edita).
- **Fechas (A02):** `[desde 00:00, día siguiente a "hasta" 00:00)` sobre `starts_at` únicamente; fecha única = `desde = hasta`; `ends_at` nunca decide. El cliente envía el día calendario como texto `YYYY-MM-DD` (no un `Date`), así la zona horaria del navegador no interviene. SQL rechaza `hasta` sin `desde`, rango invertido y años fuera de 2000–2100.
- **Radio (D02):** 5/10/25/50/100 km y «Sin límite» (ninguno preseleccionado). SQL exige origen y radio juntos, finitos, `0 < radio ≤ 20000` y lat/lon válidas. Prefiltro de caja (con cruce de antimeridiano y sin límite de longitud cerca de los polos) y confirmación Haversine (R = 6371 km) en la misma consulta, **antes** del `limit`. Bounds, fecha, radio, texto y categorías se combinan con AND. Sin PostGIS.
- **Origen (A01, D01):** `features/location/origin.ts` guarda en memoria (nunca URL ni storage) el GPS consentido y el último centro del mapa. Al elegir un radio por primera vez se pide GPS una vez. El GPS queda fijo mientras se mueve el mapa; si no hay GPS, el origen es el **centro del mapa y sigue el viewport** (ya con debounce). Rótulos: «Tu ubicación» / «Centro del mapa» / «Centro del mapa (Buenos Aires, punto inicial)»; el centro inicial nunca se llama GPS. Sin GPS y sin centro (Inicio sin haber abierto el mapa) se informa la limitación, **no se consulta** y no se muestra una lista como si la distancia estuviera calculada (R4-04.CA-04). Con GPS y centro disponibles se ofrece cambiar entre ambos.
- **Estado compartido (A03/D05):** `from`, `to` y `radius` viven en los query params junto con `q`/`categories` (saneados; origen y coordenadas NO). Mismo componente `DiscoveryFilters` y mismo RPC en Inicio y Mapa. Sin ruta nueva ni cambios en dock/`AppLayout`.
- **UI:** una píldora «Fecha y distancia» (`aria-expanded`; el foco permanece en ella) abre un panel sobre tarjeta blanca con dos `FormField type="date"` (≥52 px), píldoras de radio con `aria-pressed` (azul = seleccionado, como las categorías) y una línea de origen con `role="status"`. Un rango inválido muestra el error en el campo (`aria-invalid`) y **no** se aplica. Los criterios activos quedan en «Filtros aplicados». Sin gradientes, sin tarjetas anidadas, sin controles nuevos de navegación.

## Qué acredita y qué no

| Artefacto | Acredita | No acredita |
| --- | --- | --- |
| `postgres-results.json` (`npm run check:search`) | Replay de todas las migraciones en PostgreSQL local (andamiaje Auth/Storage de prueba). Fecha: día completo, evento que cruza medianoche, borde superior exclusivo, evento iniciado antes pero que termina dentro del rango excluido, rango/vacío, rechazo de invertido/«hasta» solo/años absurdos, sesión en `Asia/Tokyo` con el mismo resultado. Radio: 5/25/100 km, puntos a 24,9 y 25,1 km, AND con categoría+fecha+bounds+texto, 0/negativo/NaN/enorme/parcial/fuera de rango rechazados, antimeridiano en ambos sentidos, cercanía al polo, ocultos/cancelados/archivados/terminados ausentes con fecha y radio | Supabase real, JWT/HTTP reales, advisors, rendimiento con volumen (la medición comparativa caja vs Haversine **no se ejecutó**; sólo se garantiza que la caja precede al Haversine en la misma sentencia) |
| `ui-results.json` (`npm run check:filters:ui`) | Edge + Vite local con Auth/REST interceptados y navegador en `Asia/Tokyo`: fecha única y rango, rango invertido sin petición, quitar fechas, vacío vs error, radio con GPS denegado y sin centro (limitación, sin consulta), GPS denegado → «Centro del mapa (Buenos Aires, punto inicial)» sin decir «Tu ubicación», Mapa y vuelta a Inicio con el mismo estado, GPS concedido (5 vs 50 km con categoría y rango), cambio GPS↔centro, Mapa con radio+fechas+bounds en una consulta, sin overflow a 320/360/375/390/768/1280, objetivos ≥44 px. El servidor de fixture **replica** la semántica SQL; no la prueba | JWT reales, dispositivos, lector de pantalla, GPS real, arrastre manual del mapa (el centro se movió con «Mi ubicación»/«Usar Buenos Aires»; el pan real lo cubre `onBoundsChange`, probado en `check:discovery:ui`) |
| `home-date-radius-*.png`, `map-date-radius-375.png` | Composición Amanecer del panel (datos de prueba; el mapa de la captura usa el token público local) | Pixel-perfect contra `release-4.png` (inventario funcional histórico) |

Regresiones ejecutadas: `check:search`, `check:search:ui` (su selector de objetivos táctiles ahora ignora el panel colapsado), `check:home-events`, `check:home:ui`, `check:discovery`, `check:discovery:ui` (contra Vite en el puerto 4180), `check:amanecer`, `check:mapbox`, `build`, `lint`. Los artefactos que esos scripts regeneran en carpetas históricas se restauraron; no hay cambios en ellas.

## Migración

`20261014120000_search_public_events_date_radius.sql`: **creada, probada localmente y **aplicada a `planit-v2`** (`iepeqmvzjguwlhnecsdq`) el 14/10/2026 con `supabase db push` por autorización expresa del responsable (dry-run previo: era la única pendiente). Verificación remota de sólo lectura: migración registrada, una única función de 14 argumentos (la de 9 fue eliminada), `prosecdef=false`, `search_path=""`, EXECUTE `anon`=false / `authenticated`=true. Sin consultas HTTP con JWT reales; proyecto histórico intacto.

## Criterios de aceptación (8 CA + cierre de R4-02.CA-02)

Todos **local SQL / fixture UI**; ninguno con JWT real ni «Validado».

| CA | Resultado | Prueba |
| --- | --- | --- |
| R4-03.CA-01 | PASS (local) | día único y rango, SQL y UI |
| R4-03.CA-02 | PASS (local) | fuera del período excluido; `starts_at` solamente |
| R4-03.CA-03 | PASS (local) | inválido rechazado en SQL y no aplicado en UI, con mensaje |
| R4-03.CA-04 | PASS (local) | quitar fechas restaura y conserva el resto |
| R4-04.CA-01 | PASS (local) | radio con GPS o centro del mapa |
| R4-04.CA-02 | PASS (local) | 5/25/100 km y bordes |
| R4-04.CA-03 | PASS (local) | AND con categoría, fecha, texto y bounds |
| R4-04.CA-04 | PASS (local) | sin origen: limitación visible y sin consulta; radio inválido rechazado |
| R4-02.CA-02 | PASS (local) | los cuatro grupos combinados (sólo falta JWT real) |

## Riesgos y límites

- Búsqueda de texto sensible a acentos (heredado del bloque 1). En Mapa el `limit` de 100 se aplica después de todos los filtros; el aviso de truncado se conserva.
- Con origen = centro del mapa, el círculo y las bounds se intersectan (el radio no sustituye las bounds).
- Un refresco completo de la página vuelve a pedir GPS (el origen es sólo memoria por privacidad); `radius` persiste en la URL.
- `check:mapbox` imprime «failed to load config» de `vite.config.ts` (estado de `main`, ajeno al bloque) pero su aserción termina en PASS.
