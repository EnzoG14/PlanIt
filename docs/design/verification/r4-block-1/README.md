# R4 BLOQUE 1 — evidencia: búsqueda textual y categorías

**Fecha:** 14/10/2026 (Argentina). **Base:** `main` `ffed0ff`. **Rama:** `codex/r4-block-1`. Evidencia **nueva**; no sobrescribe QA histórica ni la evidencia del bloque 0 o del refresh Amanecer.

## Qué acredita y qué no

| Artefacto | Acredita | No acredita |
| --- | --- | --- |
| `postgres-results.json` (`npm run check:search`) | Replay de todas las migraciones en PostgreSQL local con andamiaje de Auth/Storage de prueba; `search_public_events`: texto (título/descripción, mayúsculas, vacío, wildcards literales, inyección inerte, largo), categorías (una/varias, inactiva, `[]`/null), AND texto+categoría+bounds, universo público vigente (unlisted/cancelado/archivado/terminado ausentes, en curso incluido), cursor `(starts_at,id)` sin duplicados, anon denegado, usuarios A/B autenticados | Supabase real, JWT/HTTP/PostgREST reales, advisors, rendimiento |
| `ui-results.json` (`npm run check:search:ui`) | Navegador (Edge) con Vite local y Auth/REST/Storage interceptados: búsqueda, píldoras `aria-pressed`, quitar categoría, vacío con criterios visibles, error ≠ vacío + reintento, respuesta lenta descartada, foco al borrar, URL saneada, retorno del detalle con filtros, falla de URL firmada sin perder resultados, Mapa con los mismos filtros y RPC con bounds, sin overflow a 320/375/390/768/1280, objetivos ≥44 px | Dispositivos físicos, lector de pantalla, JWT reales, mapa con proveedor real |
| `home-filters-{320,375,390,768,1280}.png`, `home-no-match-375.png` | Composición Amanecer (fondo claro, píldora azul para el filtro seleccionado, tinta para el dock) con datos de prueba | Pixel-perfect contra `release-4.png`: ese PNG es sólo inventario funcional histórico |

## Migración

`supabase/migrations/20261013160000_search_public_events.sql`: **creada y probada localmente; NO aplicada** a `planit-v2` ni a ningún remoto. Hasta aplicarla con autorización, Inicio y Mapa responden con el error de consulta (PGRST202).

## Criterios de aceptación (8 CA)

Todos los resultados son **local SQL / fixture UI**, no JWT real, y ninguno está «Validado».

| CA | Resultado | Prueba |
| --- | --- | --- |
| R4-01.CA-01 | PASS (local) | `check:search`, `check:search:ui` |
| R4-01.CA-02 | PASS (local) | ídem (mayúsculas, repetición al cambiar texto) |
| R4-01.CA-03 | PASS (local) | ídem |
| R4-01.CA-04 | PASS (local) | vacío vs error HTTP diferenciados |
| R4-02.CA-01 | PASS (local) | multiselección OR |
| R4-02.CA-02 | PARCIAL | texto+categoría(+bounds) PASS; fecha y radio NOT RUN (bloque 2) |
| R4-02.CA-03 | PASS (local) | quitar categoría actualiza |
| R4-02.CA-04 | PASS (local) | vacío conserva criterios visibles |

## Reproducción

```powershell
$env:VITE_SUPABASE_URL = 'https://iepeqmvzjguwlhnecsdq.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fixture'
$env:VITE_MAPBOX_ACCESS_TOKEN = ''
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4180 --strictPort
# otra terminal
npm run check:search
npm run check:search:ui
```

## Decisiones y límites

- Inicio usa ahora `ends_at` futuro (incluye eventos en curso), igual que Mapa; antes `starts_at` futuro.
- Búsqueda insensible a mayúsculas y **sensible a acentos** (sin `unaccent`); no es CA.
- `check:discovery:ui` falla en el paso del marcador del mapa **también en `main` sin estos cambios**: problema de entorno previo, no verificado aquí.
- Los filtros viven en la URL (`q`, `categories`) y en memoria de sesión (sin localStorage) para conservarlos al usar el dock. Sólo el detalle devuelve filtros; las páginas de gestión conservan el retorno exacto `/home`/`/map`.
- Contrato para el bloque 2: `search_public_events` se extenderá con parámetros de fecha/radio con default null y `DiscoveryFilters` con los campos correspondientes.
- NO EJECUTADO: HTTP/JWT real, Storage/Realtime reales, dispositivos físicos, `check:discovery:ui`, regresión completa R1–R3.
