# PlanIt R4 — contrato de integración UI v1.2 · Amanecer

**Corte comparado:** `main` `a378259a60106ddd07b111080a24677ad509bc49`, 13/10/2026, contra `d9c0a6984e4e99a86aaed8dd3c70663518b7144b` (30 commits). **Naturaleza:** plan documental; no hay desarrollo ni QA R4 ejecutados.

## Autoridad y separación de responsabilidades

1. **Funcional:** 9 RF, 39 CA literales, especificación técnica, decisiones A01–A07, migraciones y RLS. Prototipos/capturas nunca agregan funciones.
2. **Visual:** `PRODUCT.md` (contexto), **`DESIGN.md`** (tokens normativos), `docs/design/DESIGN_SYSTEM.md`, `docs/design/proposals/amanecer-direction.md`, componentes actuales y `docs/design/UI_WORKFLOW.md`.
3. **Referencias secundarias:** `design-lab` dirección `/b` para estados/composición con datos ficticios; `docs/design/mockups/release-4.png` y `SCREENS.md` como inventario histórico, sin fidelidad de apariencia.
4. **Instrucciones:** `AGENTS.md`, `src/AGENTS.md`, `docs/design/AGENTS.md`, `supabase/AGENTS.md`. No cambiar `DESIGN.md`, `.impeccable/design.json` o fundación existente por iniciativa del bloque.

## Cambio confirmado

La dirección **B · Amanecer v3.0** reemplaza visual marino oscuro v2.0. Modo claro `--pi-color-bg #f6f5fd`; tinta `--pi-color-ink #060b27` para acción/dock, azul `--pi-color-primary #0753ff` para filtros seleccionados/progreso, violeta/lavanda como wash y foco. Fuente Bricolage Grotesque autoalojada; tarjetas blancas/cristal con fallback opaco; una mancha superior aria-hidden; píldoras/tarjetas 26–36 px; sin gradientes en controles, tarjetas o chips; sin superficies anidadas, sin tema oscuro. Targets >=44px, foco violeta 3px, datos operativos >=13,5px y estados no identificados solo por color.

## Código actual como punto de integración

| Superficie R4 | Componentes presentes en main | Directiva R4 v1.2 |
| --- | --- | --- |
| Búsqueda, categorías, fechas | `src/pages/HomePage.tsx`, `src/components/EventCard.tsx`, `src/pages/discovery.css`, `src/pages/home.css` | Añadir buscador/chips/panel accesibles sin perder agrupación/cursor/estados; no crear `/search` |
| Radio y selección mapa | `src/pages/MapPage.tsx`, `src/components/maps/EventMap.tsx`, `src/features/location/geolocation.ts` | Preservar Mapbox Standard preset day, bounds, debounce, lista+preview único, foco, atribución y mapa caído; radio server-side + centro de mapa rotulado |
| Intereses | `src/pages/ProfilePage.tsx`, `/me` | Ruta opcional `/me/interests` y retorno; conservar perfil Amanecer. Activar scope explícito en `AppLayout` |
| Sugerencias | `src/pages/HomePage.tsx`, `src/components/EventCard.tsx` | Sección «Para vos» sin inventar métricas, sin contaminar descubrimiento público ni ranking de búsqueda |
| Visibilidad | `src/pages/CreateEventPage.tsx`, `src/pages/EditEventPage.tsx`, `src/pages/event-forms.css` | Preservar formulario Amanecer, fechas de inicio/fin, archivos, resultado incierto; escritura oculta atómica |
| Enlaces y grants | `src/pages/EventDetailPage.tsx`, `src/components/EventManagement.tsx`, `src/components/EventActionDialog.tsx`, `src/pages/EventAttendeesPage.tsx` | Reutilizar confirmaciones/gestión; nueva ruta `/events/:id/access` con scope/foco/volver explícitos |
| Canje | React Router, `AppLayout`, `StatusMessage`, Auth | `/invite` con diseño Amanecer, estados válidos/denegados, no exhibir secretos, no agregar pestaña |
| QA | `docs/design/UI_WORKFLOW.md`, `scripts/check-*-ui.mjs`, `package.json` | Reusar runners reproducibles, no sobrescribir evidencias previas; agregar contratos R4 sin forzar pixel-perfect del lab |

## Routing y componentes: condiciones previas

`AppLayout.tsx` aplica `.amanecer-shell` por condiciones `isAuth`, `isDiscovery`, `isEventForm`, `isEventManagement`, `isSocial` y `/my-events`. Las rutas propuestas `/me/interests`, `/events/:id/access`, `/invite` **no heredan todos esos scopes**: extender clasificación/estilos solo tras auditar la pantalla de origen, header, dock (cuatro destinos), safe area, back link, overlay y foco. Detalle de invitación con token en hash: fragmento efímero y exclusión de logs/caches, según confirmación técnica D10.

No replicar `CompactEventCard` de gestión como tarjeta pública: `EventCard` es el patrón de descubrimiento actual. Evitar refactor de las páginas renovadas con el único propósito de adoptar R4. El refresh ya cubre Inicio/Mapa/Detalle, Crear/Editar, Galería/Asistentes, Perfil/Chat/Notificaciones y Acciones/Reingresos (PR #27–#34). Consultar `docs/implementation/ui-refresh-blocks/BLOCK_3.md` a `BLOCK_7.md` y las evidencias por bloque. No inferir estado por la tabla histórica parcialmente desactualizada `UI_REFRESH_R1_R3_STATUS.md`.

## Estados específicos a contemplar

- **Inicio/Mapa:** tecleo y búsqueda vacía, filtros seleccionados, categorías inexistentes, rango inválido, radio GPS permitido/denegado, centro de mapa rotulado, resultados vacíos, errores de RPC, Mapbox sin carga; cambio de filtros no deja selección/preview obsoletos ni foco perdido.
- **Intereses:** ninguna categoría, selección múltiple, guardar atómico, estado inicial y error de red, cuenta modificada/logout. No agregar contadores no contractuales.
- **Visibilidad:** pública/oculta al publicar/editar, confirmed con grants automáticos, bloqueo de confirmed+revoked en transición a oculto, link regenerado y copia sólo una vez, confirmaciones sin acciones silenciosas.
- **Canje:** token válido/revocado/rotado, sesión ausente, login y retorno, acceso persistente sin inscripción; grant revoked impide recanje.
- **Gestión:** listado active/revoked, revocación/remoción y restitución sin autoinscripción; diálogos con foco Escape/restitución, fallo de permiso y doble clic.

## QA visual y accesibilidad

1. Baseline sobre checkout independiente de SHA, captura actual con Playwright/Edge externo y mismos fixtures. Tamaños 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900; añadir baja altura/teclado simulado. Comparación de geometría/foco y estados, no exigir pixeles idénticos al diseño histórico.
2. `npm run build`, `npm run lint`, `npm run check:amanecer` y las suites por superficie. Consultar `package.json` al ejecutar, sin suponer suites R4 existentes; documentar nuevas.
3. Revisar fuente local, ausencia de gradientes de acción, foco violeta, semántica input/button/dialog, `aria-current` del dock, retorno de foco, safe area, targets, contraste de estados, reduced motion/transparency y fallback sin blur.
4. Separar SQL local/fixtures interceptados de Auth/JWT A/B reales, medios firmados, PWA real y aceptación humana. Sin prueba real, estado **pendiente/no ejecutado**, nunca PASS.
5. No sobrescribir capturas históricas bajo `docs/design/verification/ui-refresh/`; crear `docs/design/verification/r4-block-N/` en implementaciones futuras.

## Fuentes verificadas

- `AGENTS.md`, `src/AGENTS.md`, `docs/design/AGENTS.md`, `DESIGN.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/UI_WORKFLOW.md`, `design-lab/README.md`.
- `docs/implementation/ui-refresh-blocks/BLOCK_3.md` a `BLOCK_7.md`; `docs/implementation/RELEASE_3_STATUS.md`; `docs/qa/RELEASE_3_TEST_REPORT.md`.
- Componentes citados en la tabla de este documento sobre `a378259a60106ddd07b111080a24677ad509bc49`.

**Límite de evidencia:** el usuario confirmó R3 validada, pero el informe R3 del repositorio sigue informando `NO-GO` por ausencia de E2E JWT reales/aceptación humana; no declararlos realizados sin prueba. Las verificaciones del refresh incluyen fixtures/DB efímera, no demuestran por sí solas seguridad R4.
