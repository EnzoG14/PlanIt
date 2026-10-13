# R4 Bloque 4 — Sugerencias determinísticas

13/10/2026 (Argentina). **Implementado; QA pendiente.** Rama `codex/r4-block-4`, base `aed91abb6ddba810d2d29de184c7768a29e11b18` (`origin/main`, PR #42 integrada). Capturas `before/` anteriores a cualquier edición de UI, con mismos fixtures/runner que `after/`. Sin sobrescribir QA histórica.

## Contrato y decisiones

Migración **creada y probada localmente, NO aplicada remotamente**: `20261014120002_get_suggested_events.sql`. RPC `get_suggested_events(p_origin_lat double precision = null, p_origin_lng double precision = null, p_limit integer = 6)`, límite 1..20 y origen opcional válido/all-or-nothing. `SECURITY INVOKER`, `search_path=''`, EXECUTE authenticated; anon denegado, sin identidad devuelve vacío. Intereses derivados de `auth.uid()` bajo RLS; sin user_id ni preferencias proporcionadas por frontend. Proyección EventCard + categoría/foto y señales `has_interests`, `matches_interest`, `distance_km`, `starts_soon`, sin scores ni datos privados ajenos.

Universo: públicos sin cancelar/archivar y ends_at futuro en hora Argentina, incluidos propios/confirmed y eventos en curso. Ranking de todo el universo autorizado **antes** de LIMIT, no de las primeras 30 cards; fotos sólo del lote seleccionado. Fórmula D07: `100*afinidad + 30*max(0,1-distancia_km/50) + 20*max(0,1-días_hasta_inicio/7)`. Haversine R=6371km; distancia nula sin origen; fecha por starts_at, días fraccionarios, cero en curso. Orden score DESC, starts_at/id ASC. Intereses inactivos guardados conservan afinidad. Con intereses sólo score>0; elección del usuario: otras categorías permitidas si distancia<50km o comienzo<7d. Sin intereses, fallback público general en starts_at/id, sin fingir personalización; sin relevantes/disponibles, vacío.

Especificación original «Planificación», pestaña técnica `t.58du83a4qpv`, RF-R4-06 consultada mediante Google Drive read-only: públicos vigentes, señales explícitas, explicación y fallback simple, sin tabla recommendations. A01–A07 intactas. Sin ML, embeddings, Edge Functions, nuevas tablas ni modificaciones de RLS/contratos existentes.

## Composición y estado

«Para vos» antes de los filtros, sección semántica con enlace a Mis intereses y motivos fuera de EventCard, sin tarjetas anidadas. Reutiliza Amanecer, fuente, fotos/fallback y cuatro destinos; hereda scope Inicio `.amanecer-shell.discovery-shell` y una sola mancha. Sin rutas nuevas ni cambios AppLayout. Enlace >=44px, foco violeta existente, retorno a Inicio con filtros mediante contrato saneado del detalle. Carga/vacío/error/retry independientes del descubrimiento.

GPS previamente autorizado o centro explícito del mapa rotulado, nunca GPS automático ni distancia simulada. Filtros de descubrimiento no se envían al ranking. Falla de intereses = error, no ausencia de preferencias. Estado remontado por identidad, peticiones abortadas y respuestas tardías descartadas. Foco/visibilidad/online, vuelta de intereses y cambio de origen reconsultan; polling visible 30s. Timer retira al vencer ends_at, interpretado en Argentina aun en navegador Tokio.

## Evidencia y reproducción

- [SQL](sql/results.json): 8 grupos PASS, PostgreSQL 17.5 real local, replay completo. Roles/Auth/Storage/claims simulados, A/B/anon, validación de parámetros, ranking/ties, dos intereses, bordes 50km/7d, sin señales/datos, afinidad inactiva, propios/confirmed, ocultos propios/cerrados y relevante después de 35 candidatos. EXPLAIN de fixtures registrado, sin benchmark de volumen.
- [UI](after/results.json): 19 grupos PASS, 320/375/390/768/1280, motivos, detalle/retorno, vacío/error/retry, fallo de intereses, seis cards, mapa identificado, A→B con respuesta tardía, fin temporal/polling con reloj controlado, texto ampliado y foco. Auth/REST interceptados, WebSocket/SW bloqueados; sin JWT reales.
- Capturas [base móvil](before/390-home.png), [final móvil](after/390-home.png), [escritorio](after/1280-home.png), [seis cards](after/1280-six.png), [general](after/390-general.png). Datos de prueba rotulados; foto/fallback cubiertos en runner existente de Inicio. Inspección móvil/escritorio conserva Amanecer.
- [Fotos](photos/results.json): PASS fixture de firma de preview público, fallback ante falla de imagen y reintento independiente; imagen sintética rotulada «Imagen de prueba», no foto real. [Intereses UI](regressions/interests-ui/results.json): 54 checks PASS. Dos intentos concurrentes tuvieron timeout en «Comprobar guardado»; main inmutable y rerun aislado de la rama pasan los 54. No se cambió código ni test de intereses.
- Regresiones SQL búsqueda/intereses/Inicio y UI Inicio/búsqueda/filtros/Mapa PASS bajo `regressions/`; build/lint/Amanecer/Mapbox/Auth/descubrimiento local PASS. Lint conserva advertencias preexistentes, build advierte tamaño Mapbox. Filtros redondea alturas a centésimas: Chromium medía 43.999969px para CSS 44px; controles no alterados. Baseline inmutable main de filtros/intereses PASS, diagnóstico de redondeo preservado en filters-probe/run.log.

```powershell
npm run check:suggestions
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4181'
npm run check:suggestions:ui
```

SQL usa herramientas locales existentes `.participation-test-tools.local/node_modules` o PLANIT_TEST_TOOLS_DIR. UI requiere Vite/Edge y admite PLANIT_PLAYWRIGHT_PATH, PLANIT_UI_ORIGIN y PLANIT_UI_OUTPUT. Baseline: PLANIT_UI_BASELINE=1 en SHA base. Windows sandbox bloqueó Edge/loopback: QA ejecutado con autorización fuera del sandbox, sin remoto.

## Límites

Cambios externos de cancelación/archivo/visibilidad pueden conservar metadata pública previa hasta reconsulta visible (30s más latencia); detalle revalida permisos existentes. Fin temporal se retira por timer. Sin caché persistida de sugerencias. Migración remota y HTTP/JWT A/B/anon real **NOT RUN**: frontend requiere aplicación separadamente autorizada, mientras falte muestra error recuperable. Sin consultas ni escrituras al Supabase actual/histórico. Fotos firmadas/Realtime/Storage reales, rendimiento con catálogo grande, dispositivos, lector de pantalla, teclado móvil y aceptación humana **NOT RUN**. Reduced motion/texto ampliado emulados; reduced transparency se apoya en fallbacks existentes, sin declarar prueba real. Sidecar visual desactualizado conservado; DESIGN.md manda. Sin merge, deploy, Validado ni bloque5.

| CA | Resultado | Evidencia |
| --- | --- | --- |
| RF-R4-06.CA-01 | PASS fixture UI | Sección autenticada en cinco tamaños |
| RF-R4-06.CA-02 | PASS SQL local + fixture UI | Orden esperado, señales/motivos y fallbacks |
| RF-R4-06.CA-03 | PASS SQL local + fixture UI | Públicos vigentes bajo RLS, sin ocultos/cerrados; expiración/cambio de cuenta |
| RF-R4-06.CA-04 | PASS SQL local + fixture UI | Detalle/retorno, vacío informativo y error diferenciado |

PASS local/fixture no equivale a JWT real ni aceptación humana.
