# PlanIt — Estado visual UI Refresh R1–R3

**Adición R5/B6 · 14/10/2026:** acciones de seguimiento y listas mantienen Amanecer, componentes sociales y los cuatro destinos primarios. [Evidencia antes/después](../qa/r5-block-6/README.md) de build real con fixtures en320/360/375/390/768/1280, estados, texto200%, foco3px, navegación y timeout. Mockups, DESIGN y tokens intactos; sin nueva aceptación R1–R3. Dispositivos, teclado móvil y lector reales NOT RUN; QA humana pendiente.

**Adición R5/B5 · 14/10/2026:** perfil mínimo/accepted y bloqueo conservan Amanecer; corrección de revalidación entre RPC sin cambio CSS/tokens/mockups. [79 grupos UI/capturas](../qa/r5-block-5/README.md) en320/360/375/390/768/1280, foco3px, targets44, texto200%, estados y navegación. Fixtures de app ejecutada; dispositivos/lector/Storage reales y aceptación pendientes. Sin nueva aceptación R1–R3.

**Adición R5/B4 · 14/10/2026:** edición propia y privacidad en Amanecer, conservando perfil R2 y dock; foto independiente. [Capturas antes/después y evidencia](../qa/r5-block-4/README.md):56 grupos UI en320/360/375/390/768/1280, texto200%, foco y estados. DESIGN/tokens/mockups intactos; sin nueva aceptación funcional R1–R3. Dispositivos/lector/Storage real y aceptación visual pendientes.

**Adición R5/B3 · 14/10/2026:** perfil/bio autorizada y eventos públicos implementados con tokens Amanecer y navegación existente. [Capturas antes/después y evidencia](../qa/r5-block-3/README.md):54 grupos UI en320/360/375/390/768/1280, texto200%, foco/targets y estados; build real con fixtures. DESIGN/tokens/mockups intactos. No nueva aceptación R1–R3; dispositivos/lector/avatar real/aceptación visual pendientes.

**Adición R5/B2 · 14/10/2026:** lista de participantes sociales y destino de identidad mínima implementados en Amanecer, conservando administración R3. [Evidencia antes/después](../qa/r5-block-2/README.md), fixtures de app ejecutada en320/360/375/390/768/1280, texto200%, estados y navegación/foco. Mockup original R5 y tokens intactos. Sin nueva aceptación R1–R3; teclado móvil/lector/dispositivos reales y aceptación visual pendientes. El registro siguiente es histórico del refresh.

Fecha: 12/10/2026. Registro independiente; no modifica estados funcionales R1/R2/R3. [Plan](UI_REFRESH_R1_R3_PLAN.md), [sistema aprobado](../../DESIGN.md), [decisión de dirección](../design/proposals/amanecer-direction.md) y [auditoría consolidada](../design/audits/UI_REFRESH_R1_R3.md).

> **Dirección vigente — 12/10/2026: B · Amanecer.** Los bloques 0 y 1 se completaron con la dirección marina oscura v2.0, que fue reemplazada. Su evidencia sigue siendo válida como registro histórico y funcional, no como aceptación visual de Amanecer.

| Bloque | Etapa | Estado | Evidencia / pendiente |
| --- | --- | --- | --- |
| 0 | Foundation y consolidación del sistema visual | Completa e integrada | Documentos e instrucciones; PR #26 ya integrada antes del piloto. El registro de su entrega draft se conserva debajo |
| 0.5 | Fundación Amanecer | Completa e integrada (PR #28) | Tokens `--pi-*`, patrones opt-in, misma fuente y compatibilidad; [workflow](../design/UI_WORKFLOW.md), [auditoría/regresión](../design/verification/ui-refresh/amanecer-foundation/README.md). No migró otras rutas automáticamente |
| 1 | Pantalla piloto: Mis eventos | Amanecer implementada e integrada en main (cb5a249); aceptación humana no inferida | [Capturas, pruebas y límites](../design/verification/ui-refresh/my-events/README.md); [PR #27 fusionada](https://github.com/EnzoG14/PlanIt/pull/27) |
| 2 | Login y registro | Amanecer implementada; entrega draft | [Capturas, critique/audit y pruebas](../design/verification/ui-refresh/auth/README.md); aceptación humana y dispositivos reales pendientes |
| 3 | Crear y editar eventos | Pendiente | Sin implementación del refresh |
| 4 | Inicio, mapa y detalle del evento | Pendiente | Sin implementación del refresh |
| 5 | Galería y asistentes | Pendiente | Sin implementación del refresh |
| 6 | Chat, perfil y notificaciones | Pendiente | Sin implementación del refresh |
| 7 | Acciones y reincorporaciones | Pendiente | Sin implementación del refresh |
| 8 | Auditoría integral y regresión | Pendiente | Evaluación futura; reportes anteriores preservados |

## Bloque 0.5 — Fundación Amanecer (actualización tras PR #27)

- Rama `design/ui-refresh-amanecer-foundation` desde `origin/main` cb5a249, referencias sincronizadas sin descartar cambios. `vite.config.ts` local (host de desarrollo) preservado fuera del commit.
- Tokens centrales `src/styles/tokens.css`: colores, estados, tipografía, espacios, radios, elevación, foco y movimiento aprobados. Mis eventos usa `--pi-*`; no queda paleta `--am-*`. Fuente existente normal variable 200–800 y OFL, misma URL y precache.
- Patrones compartidos `src/styles/amanecer.css`, opt-in `.amanecer-shell`: botones, Cuenta, dock, feedback y diálogo extraídos; campo/ScreenHeader preparados para próximos bloques. AppLayout sólo activa el scope en `/my-events`. Timeline, heading, tabs, filtros, filas, menú de evento y responsive siguen locales.
- Compatibilidad: variables globales heredadas intactas; adaptadores `--color-*`, `--gradient-primary` y radios dentro del scope derivan de `--pi-*`. Se retiran cuando se migren todos sus consumidores. No se migró Auth, Inicio, Mapa, Detalle ni Chat.
- Documentación: estado real del piloto corregido en DESIGN, DESIGN_SYSTEM, README, decisión, plan y AGENTS; registros históricos preservados. [UI_WORKFLOW.md](../design/UI_WORKFLOW.md) explica clon limpio, instalación/versión Impeccable, fixtures, adopción y retirada de compatibilidad.
- Verificación y límites: [registro nuevo](../design/verification/ui-refresh/amanecer-foundation/README.md). Se preservan las capturas históricas. Critique dual independiente, detector, polish/harden y audit de fundación separados de checks del proyecto. La integración no acredita aceptación humana, lector de pantalla ni dispositivos físicos.
- PASS final: build, lint, check:amanecer, check:my-events, check:my-events:ui, check:event-actions:ui, runner de refresh, check:amanecer:auth:ui, check:home:ui, check:discovery:ui, check:chat:layout, check:auth, check:foundation, check:home-events y check:discovery. Seis Organizo idénticos a capturas aprobadas; 48 estados con mismos estilos/geometría y 83/96 PNG idénticos; diferencias dinámicas y deuda previa de texto aumentado documentadas.
- Entrega mediante commit y PR draft hacia main; no fusionar ni comenzar el bloque 2.

## Bloque 2 — Login y Registro (12/10/2026)

- Rama `design/ui-refresh-auth` desde origin/main `3552d4e` (PR #28 integrada). Sólo UI de `/login` y `/register`; `vite.config.ts` local preservado fuera de la PR. Sin cambios de Auth, Supabase, SQL, configuración, estados funcionales ni bloque 3.
- AppLayout activa el shell Amanecer en ambas rutas; AuthPage reutiliza ScreenHeader, FormField, GradientButton y StatusMessage. `auth.css` local compone topbar, título, formulario directo, mancha superior aria-hidden, ayuda permanente y frases de confirmación separadas. Tokens/patrones y APIs compartidos sin cambios.
- Critique dual independiente A/B, detector sin hallazgos, polish/harden y audit final: [registro](../design/verification/ui-refresh/auth/README.md). 12 capturas iniciales antes y 156 finales, seis tamaños, estados con fixtures, texto 200%, altura 240, fallback de fuente y transparencia reducida.
- PASS build/lint/check:amanecer/check:auth/check:foundation/check:amanecer:auth:ui/check:my-events:ui, regresiones Inicio/Descubrimiento/Chat y comparación Python. Piloto: 36 registros comunes idénticos en estilos/geometría; seis Organizo PNG idénticos, 34/42 PNG comunes idénticos; diferencias dinámicas documentadas. Sin pruebas remotas ni SQL local.
- Pendientes: aceptación humana, lector de pantalla, zoom nativo, teclado móvil y safe areas físicas, rendimiento real. Capturas emuladas no acreditan estos casos. Sidecar Impeccable anterior a DESIGN.md preservado por el alcance; no init/document/shape.

## Foundation — registro histórico anterior a la integración

- Rama: design/ui-refresh-r1-r3, creada desde origin/main (51509d5), después de informar que la rama inicial era codex/r3-block-6. Sin merge/rebase ni descarte del trabajo local.
- Entrega: [PR draft #26](https://github.com/EnzoG14/PlanIt/pull/26) hacia main. Foundation completa; revisión/merge de la PR y todo trabajo de pantallas permanecen fuera de esta tarea.
- DESIGN.md, PRODUCT.md, DESIGN_SYSTEM.md y resultados de Impeccable se incorporan tal como fueron recibidos. docs/DESIGN.md es una referencia de compatibilidad para enlaces existentes, sin duplicar tokens.
- Se conservan sin incluir en Foundation el cambio previo de vite.config.ts y la instalación/configuración local de la skill, hooks y live. Se versionan las referencias documentales portables .impeccable/design.json y .impeccable/config.json; no los binarios, consentimiento local ni sesión live.
- No hay pantallas del refresh implementadas ni aceptación visual por esta tarea. El contraste rojo de QA R3 bloque 7 pertenece a la base, no a esta Foundation.
- Validación: 133 enlaces locales en 14 documentos resuelven; nueve referencias absolutas históricas del critique se conservan y sólo son portables en este checkout. La consolidación usa enlaces relativos. Revisión de coherencia entre los AGENTS raíz/frontend/diseño y las restricciones de Supabase realizada.
- Preservación SHA-256: 188 archivos protegidos sin cambios respecto de la base recibida tras crear la rama (documentos aprobados, reportes/configuración local, UI, Supabase y estados funcionales; src/AGENTS.md se excluye por ser parte del alcance). Selección de 26 archivos Foundation sin código de aplicación ni estados funcionales; revisión de patrones de credenciales sin coincidencias.
- git diff --check del working tree y comprobación acotada de documentos nuevos/instrucciones: sin errores. git diff --cached --check completo informa dos incidencias heredadas de los reportes preservados: espacio final en critique línea 5 y línea vacía al final de audit técnico. No se alteran esos bytes por el mandato de preservación.
- Build/lint no ejecutados: entrega documental sin cambios de frontend. No se realizaron nuevas pruebas visuales, escrituras remotas ni migraciones.

## Bloque 1 — Mis eventos (registro histórico de la entrega)

- Rama `design/ui-refresh-my-events` desde `origin/main` 796aadc, con Foundation #26 ya integrada. [PR draft #27](https://github.com/EnzoG14/PlanIt/pull/27) para revisión, sin fusionar. Implementación visual exclusiva del piloto; releases funcionales y backend intactos.
- C3 corregido: primera fila móvil 478 → 379 px; escritorio 429 → 343 px. Pestañas planas, selección/creación sólidas, filas continuas con miniatura y acciones separadas, metadatos/estados legibles y ayuda contextual. Sin dependencias nuevas.
- Reutilizados AppLayout, CompactEventCard, StatusMessage y EventActionDialog. Shell y selectores acotados a Mis eventos; otras pantallas no reciben el refresh. Texto largo conserva contenido íntegro accesible/en detalle y resumen visual; faltante/fallo de foto tiene alternativa compacta.
- Archivos: `src/pages/MyEventsPage.tsx`, `src/pages/my-events.css`, `src/components/EventCard.tsx`, `src/components/AppLayout.tsx`; runner `scripts/check-my-events-refresh-ui.mjs`; tres runners existentes admiten salida configurable para preservar evidencia anterior. Documentación/capturas bajo `docs/design/verification/ui-refresh/my-events/`.
- Impeccable: contexto, critique con dos assessments independientes autorizados, detector, polish/harden y audit final; [reporte](../design/verification/ui-refresh/my-events/critique.md), [audit](../design/verification/ui-refresh/my-events/audit.md). Helper Live disponible, sin sesión/variantes aceptadas ni overlay; se usaron capturas automatizadas y revisión AX.
- PASS: build, lint (exit 0, 204 warnings en JS de instalación local Impeccable, ajeno a la entrega), lint acotado src/scripts sin diagnósticos, check:my-events (PostgreSQL efímero), check:my-events:ui y check:event-actions:ui. 36 capturas antes y 48 después a 320/360/375/390/768/1280 px, más regresiones de filtros/acciones. Sin escrituras remotas ni migraciones aplicadas a Supabase.
- Pendientes (versión marino v2.0): revisión/aceptación humana, teclado móvil/safe areas en dispositivos físicos, lector de pantalla, zoom nativo y fotos reales/E2E remoto. A1, A3 global y A8 mantienen su seguimiento original. No hay nueva dirección o decisión visual que aprobar.
- Revisión posterior autorizada: menú **Cuenta** en el header del piloto, con Mi perfil/Cerrar sesión, iconos, separación y cierre con Escape/clic afuera. Se preservan campana, logout local y header de otras rutas. AccountMenu/CSS propio e iconos agregados sin dependencias. Evidencia de seis tamaños, foco, navegación y logout interceptado con respuesta rechazada/exitosa; el SDK elimina la sesión local en ambos casos. Nueva ejecución de build/lint/check:my-events:ui en el [registro](../design/verification/ui-refresh/my-events/README.md).

### Realineación a Amanecer — 12/10/2026

- La pantalla se rediseñó con la dirección B · Amanecer, acotada a `/my-events` (tokens `--color-*` remapeados sólo bajo `.my-events-shell`); el resto de pantallas conserva marino v2.0. Modo claro, tinta marina, mancha superior, vidrio con respaldo opaco, Bricolage Grotesque autoalojada (`src/assets/fonts/`, OFL; sin paquete npm; `woff2` en el precache de la PWA), línea de tiempo por día con hora a la izquierda y barra de estado, dock flotante de tinta, menús y diálogo claros.
- Archivos: `MyEventsPage.tsx`, `my-events.css`, `EventCard.tsx` (`CompactEventCard`), `my-events.ts` (sólo formato por día), `vite.config.ts` (precache), `scripts/check-my-events-refresh-ui.mjs`. Sin cambios de SQL, RPC, RLS, rutas, filtros, paginación ni permisos.
- Capturas: `before/` (original), `v2-marino/` (piloto anterior) y `after/` (Amanecer, 48) en 320/360/375/390/768/1280 px. Primera fila: 478 → 379 (v2.0) → ~430 px (Amanecer).
- PASS: build, lint (exit 0; warnings de binarios locales de Impeccable), `oxlint src scripts`, check:my-events (PostgreSQL efímero), check:my-events:ui, check:event-actions:ui y el runner de refresh.
- No se ejecutaron critique/polish/harden/audit de Impeccable ni Live Mode sobre esta versión; revisión manual sobre capturas. Sin lector de pantalla, zoom nativo, teclado móvil ni safe areas físicas. Decisiones para aprobar: dock/header Amanecer sólo en esta ruta hasta el bloque 0.5, `theme-color` global sin cambiar, borde de control en filtros y Crear redondo bajo 400 px. Detalle en el [registro](../design/verification/ui-refresh/my-events/README.md).

## Cambio de dirección a Amanecer (documental)

- Aprobada la dirección **B · Amanecer** del [design-lab](../../design-lab/README.md). Actualizados [DESIGN.md](../../DESIGN.md), [.impeccable/design.json](../../.impeccable/design.json), [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) (v3.0), [docs/design/AGENTS.md](../design/AGENTS.md), [src/AGENTS.md](../../src/AGENTS.md), el [AGENTS raíz](../../AGENTS.md), el README de diseño, el banner del shape y de SCREENS, DESIGN_GAPS y el README del lab; nueva [decisión de dirección](../design/proposals/amanecer-direction.md).
- No se tocó código de la PWA, Supabase, auditorías ni capturas de verificación (evidencia histórica). `src/index.css` y `GradientButton` siguen en marino v2.0; el piloto Mis eventos ya está realineado (ver arriba).
- Desviaciones deliberadas del lab por accesibilidad: `control-border` `#7a82a8`, violeta sólo con texto tinta, cristal con fallback opaco, fuente autoalojada.
- Pendientes de decisión: elementos del lab con carga funcional (tira de días, tarjetas rápidas, contadores de perfil, buscador/chips) antes del bloque 4; confirmar el alta de la fuente (archivo o paquete) en el bloque 0.5.
- Sin build/lint ni pruebas visuales: entrega documental.

## Pendientes

Migrar las restantes pantallas sólo en sus bloques autorizados. El piloto ya está integrado y el bloque 0.5 preserva su apariencia. Los hallazgos históricos sin cierre necesitan comprobación futura; gestos de mapa, teclado real, safe areas, lector de pantalla y perfilado móvil siguen pendientes. La dirección visual está aprobada; las decisiones funcionales del lab siguen abiertas.

Para actualizar: registrar por bloque cambios, evidencia, validaciones, límites y aceptación humana por separado; no convertir una mejora de un componente compartido en cierre automático de otras pantallas.

**Ajuste R5/B4 — selector de galería:** filtro de fotos ampliado para Android/Chrome; composición/tokens sin cambios. [Capturas y18 grupos de apertura del selector](../qa/r5-block-4/gallery-picker/README.md). No equivale a validación de galería nativa Android ni modifica aceptación R1–R3.
