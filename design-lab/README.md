# PlanIt · Design Lab

Servidor aparte para comparar **tres direcciones de UI** (A · Marea nocturna, B · Amanecer, C · Bento tonal) sobre las mismas cuatro pantallas: **Inicio, Mapa, Mis eventos y Perfil**. No toca `src/`, Supabase ni la PWA real.

> **Decisión — 12/10/2026: se aprobó la dirección B · Amanecer.** Quedó consolidada en [DESIGN.md](../DESIGN.md) y [docs/design/DESIGN_SYSTEM.md](../docs/design/DESIGN_SYSTEM.md); ver [la decisión](../docs/design/proposals/amanecer-direction.md). A y C se conservan como alternativas descartadas. El lab es un prototipo de referencia (composición, estados, movimiento), no fuente de tokens: donde difiere de DESIGN.md manda DESIGN.md (p. ej. `control-border` `#7a82a8` en lugar de `#8c93b8`, violeta sólo con texto tinta, fuente autoalojada). Algunos elementos del mock (tira de días, tarjetas rápidas, contadores de perfil) requieren decisión funcional antes de implementarse.

## Cómo correrlo

Desde la raíz del repo (reutiliza React y Vite ya instalados):

```bash
npx vite --config design-lab/vite.config.ts
```

Abre en `http://localhost:5180`. Typecheck del lab: `npx tsc -p design-lab/tsconfig.json`.

## Rutas

| Ruta | Qué muestra |
|---|---|
| `/` | Galería: tesis, paleta, qué conserva y qué rompe cada dirección |
| `/a`, `/b`, `/c` | Las 4 pantallas de una dirección, lado a lado |
| `/a/home`, `/b/map`, `/c/events`… | Pantalla interactiva (la barra inferior navega; en un teléfono real ocupa toda la pantalla) |
| `/compare/home`, `/compare/map`, `/compare/events`, `/compare/profile` | La misma pantalla en A, B y C |

Interacciones del mock: corazón y categorías (A), tira de días (B), selección de pin/fila en el mapa (A, B, C), Organizo/Participo y filtros de estado en Mis eventos (A, B, C, con estados vacíos).

## Dirección B: pantallas de R1–R3 más allá de las pestañas

Ya incluidas en `/b` y navegables desde las pestañas (tocar una tarjeta de evento, la campana, el + o "Notificaciones" en Perfil). Cada una tiene **estados** que se cambian con la barra "Estado" del modo interactivo (`/b/<pantalla>?v=<estado>`).

| Ruta | Pantalla | Estados |
|---|---|---|
| `/b/event?e=<id>` | Detalle del evento | Unirme · Ya inscripto · Cupo completo · Removido (reingreso) · Solicitud en revisión · Finalizado · Organizador (con gestión: editar, imágenes, asistentes, duplicar, cancelar, archivar) |
| `/b/attendees` | Asistentes | Abierto · Finalizado (solo lectura) · Sin asistentes; búsqueda, Confirmados/Removidos, remover con confirmación |
| `/b/requests` | Solicitudes de reincorporación | Con solicitudes · Sin solicitudes · Evento cerrado; aprobar/rechazar con confirmación |
| `/b/chat` | Chat del evento | Conversación · Sin mensajes · Solo lectura; envío con contador de 2000 caracteres |
| `/b/notifications` | Notificaciones | Con avisos · Sin notificaciones; marcar leído y acceso al evento/chat/solicitudes |
| `/b/create` | Crear evento | Formulario · Con errores · Publicación por confirmar; Publicar valida y lleva al detalle |

Los contenidos y reglas de cada estado salen de las pantallas reales (`EventParticipation`, `EventAttendeesPage`, `EventRejoinRequestsPage`, `EventChatPage`, `NotificationsPage`, `CreateEventPage`). Se agregaron dos eventos de descubrimiento (sin rol del usuario) para mostrar "Unirme" y "Cupo completo".

## Qué es mock

- Eventos, personas y números son **ficticios** (`src/shared/data.ts`); los tres primeros títulos salen de la captura actual de PlanIt.
- Las "fotos" son ilustraciones SVG de reemplazo (`src/shared/Scene.tsx`). En la app real irían fotografías autorizadas.
- El mapa es un dibujo (`MapSketch.tsx`), no Mapbox.
- Buscador y chips de categoría de Inicio son composición visual; no implican funciones de R4.
- Tipografías vía Google Fonts (Urbanist, Bricolage Grotesque, Onest) con fallback a Segoe UI, sólo por conveniencia del prototipo. En la app, la dirección aprobada usa Bricolage Grotesque **autoalojada**; Urbanist y Onest se descartan.

## Comparación

| | A · Marea nocturna | B · Amanecer | C · Bento tonal |
|---|---|---|---|
| Referencia | Cruceros | Agenda con luz difusa | Panel de reuniones |
| Modo | Oscuro | Claro | Claro |
| Protagonista | Fotografía | Agenda / tipografía | Datos en baldosas |
| Acción primaria | Píldora azul | Píldora de tinta | Botón marino + FAB central |
| Navegación | Barra flotante de vidrio | Dock oscuro con píldora activa | Barra blanca con acción central |
| Continuidad con PlanIt hoy | Alta (dark-first) | Media (cambia a claro) | Media (cambia a claro) |
| Riesgo | Depende de buenas fotos | Contraste sobre la mancha | Puede sentirse "dashboard" |

Contratos de dirección: `directions/a.md`, `b.md`, `c.md`.

## Verificación hecha

- `tsc` y `oxlint` sin errores/avisos en `design-lab/`.
- `impeccable detect` sin hallazgos bloqueantes; solo advisories esperables de salirse de DESIGN.md (colores, radios y tamaños fuera de la escala actual).
- Contraste medido en pares clave: texto sobre fondo ≥ 4,9:1 en las tres (la mancha de B usa texto `#2f3664`, ≥ 5,2:1).
- Revisión visual en el navegador integrado de las 12 pantallas y de la vista móvil. Sin lectores de pantalla ni dispositivos reales.
