# Assessment B — evidencia técnica independiente

Target: `C:/Users/enzog/planit-worktrees/amanecer-block-8-audit/src`, SHA `a378259a60106ddd07b111080a24677ad509bc49`. Fecha: 13/10/2026. Sin cambios de implementación, suites ni mutaciones remotas.

## Método y límites

Assessment B no recibió hallazgos de Assessment A. CodeGraph confirmó el índice del checkout y se utilizó antes de explorar código, incluidos AppLayout, MapPage, EventMap, EventActionDialog, AccountMenu, EventManagement, EventParticipation, EventDetailPage y EventGalleryPage. CSS y documentos se leyeron directamente porque su semántica de cascada no aparece completa en el índice.

Detector ejecutado exactamente una vez: `D:/planit/.agents/skills/impeccable/scripts/impeccable.cmd detect --json src`. JSON íntegro: `assessment-b-detector.json`. La tubería PowerShell terminó con 0; no se capturó por separado el exit code interno del detector. El JSON contiene findings válidos, sin error de carga. No inferir resultado clean del exit code de la tubería.

Browser: tab nuevo propio en IAB, URL local del checkout auditado `http://127.0.0.1:4198/login`; luego link visible a `/register`. Supabase usa configuración ficticia provista por padre. Inspección visual a viewport normal 1280×720 y a 320×568; sin enviar formularios ni entrar credenciales. Capturas browser vistas en tool output, no guardadas como PNG por B. El viewport se restauró. La documentación de API expone `playwright.evaluate` sólo read-only: no hay mutación documentada para el preflight de título/script. Overlay y live-server de Impeccable omitidos por esta limitación concreta. No se afirma overlay visible. No se arrancó servidor ni proceso adicional.

## Resultado del detector

70 advisories: 39 `design-system-color`, 19 `design-system-font-size`, 12 `design-system-radius`; todos categoría quality/advisory, ningún hallazgo blocking en JSON.

| Archivo | Cantidad |
|---|---:|
| src/App.css | 26 |
| src/components/account-menu.css | 3 |
| src/components/event-actions.css | 10 |
| src/components/maps/map.css | 3 |
| src/index.css | 2 |
| src/pages/chat.css | 1 |
| src/pages/discovery.css | 13 |
| src/pages/event-forms.css | 1 |
| src/pages/home.css | 1 |
| src/pages/my-events.css | 7 |
| src/styles/amanecer.css | 2 |
| src/styles/social.css | 1 |

La mayoría corresponde a declaraciones legacy, máscaras y sombras, sustituidas por reglas `.amanecer-shell`, `.discovery-shell` o componentes autónomos. El detector analiza literales, no la cascada efectiva. Son señales para verificar, no 70 defectos visibles ni criterio para retirar adaptadores de golpe. Ejemplos descartados: fondo oscuro del mapa sustituido por surface-soft; gradientes/fotos en discovery sustituidos por reglas posteriores; `#000` de mask-image no es texto ni superficie; radios del menú Cuenta sustituidos por reglas del header. Hay drift activo en tamaños 22px, recogido abajo, y una señal de color realmente defectuosa en el aviso de detalle.

## Audit Health

| Dimensión | Score | Evidencia principal |
|---|---:|---|
| Accesibilidad | 2/4 | Aviso de éxito en Detalle con contraste 1,24:1; otros patrones conservan etiquetas/foco |
| Performance | 3/4 | Mapa lazy, cleanup de ResizeObserver/mapa; blur real no medido |
| Theming | 3/4 | Tokens claros y adaptadores consistentes; tamaños activos fuera de rampa |
| Responsive | 3/4 | Auth targets ≥44px; overflow 15px a viewport 320 con scrollbar clásica |
| Integrity | 3/4 | Sistema coherente, con aviso legacy sin remap |
| Total | 14/20 | Good, sujeto a cerrar defecto P1 y completar evidencia real |

## Hallazgos verificados

### B1 — [P1] Aviso de éxito del detalle conserva verde claro del tema oscuro

Ubicación: `src/components/event-actions.css:31`, `src/pages/EventDetailPage.tsx:100`, `src/pages/discovery.css:133`.

`event-action-notice` hereda `color:#83f3c9`, mientras Detalle vive sobre bg `#f6f5fd`. Sólo Mis eventos tiene un remap propio (`.my-events-notice:not(:empty)` con success-bg/success-on-bg); discovery únicamente esconde el aviso vacío. La confirmación de cancelación/archivo se muestra en el párrafo role=status después de `onChanged`.

Contraste calculado por luminancia sRGB WCAG: **1,241:1** entre `#83f3c9` y `#f6f5fd`, inferior a 4,5:1 (WCAG 1.4.3). No depende de interpretación estética. El detector señaló este color en línea 31. La existencia de la regla y flujo se verificó por CodeGraph/cascada, pero el estado exitoso no se ejercitó en browser por B. Corroborar con fixture nuevo antes de cerrar como visualmente observado.

Recomendación: aplicar el patrón success-bg/success-on-bg a `.discovery-shell .event-action-notice:not(:empty)` con texto meta ≥13,5px y separación; preservar role=status y no alterar operación. Comando sugerido: `$impeccable harden`, luego `$impeccable polish`.

### B2 — [P2] Ancho mínimo global genera desplazamiento lateral con scrollbar clásica a 320px

Ubicación: `src/index.css:29` (`body { min-width:320px }`). Browser IAB a 320×568 en login y register: documentElement.clientWidth=305, scrollWidth=320, body width=320. La captura muestra scrollbar horizontal. El contenido necesita 15px extra porque la barra vertical clásica ocupa ese espacio.

Impacto: usuarios con viewport angosto, escritorio con texto/zoom o scrollbar clásica deben desplazar horizontalmente. No equivale a una falla observada en móvil real ni en browser con scrollbar overlay. Es una señal reproducida en IAB Windows, no un supuesto sobre todos los motores.

Recomendación: quitar piso del body o permitir composición hasta el ancho disponible; repetir 320 con scrollbar clásica y texto ampliado. Comando sugerido: `$impeccable adapt`.

### B3 — [P3] Títulos activos 22px fuera de la rampa normativa

Ubicación: `src/styles/amanecer.css:83`, `src/components/event-actions.css:37`, `src/pages/event-forms.css:15`; brand estrecha también usa 22px en `amanecer.css:29`.

DESIGN.md documenta title 19px y title-lg 24px. Estos 22px siguen efectivos; no son todos legacy reemplazado. Impacto menor: tipografía no mantiene fuente de verdad única. No hay evidencia de bloqueo ni contraste pobre por estos tamaños.

Recomendación: decidir entre token title y title-lg según jerarquía; el logo podría justificar tamaño específico documentado si está autorizado, evitando cambiar DESIGN.md por iniciativa. Comando sugerido: `$impeccable typeset`, finalizar con `$impeccable polish`.

## Fortalezas y no-defectos

- Auth observado: labels visibles, Mostrar contraseña anunciado como checkbox, acciones/links ≥44px. A 320 login controles de entrada 280×52, CTA 280×52, eye 44×44, back 44×44, Crear cuenta 117×44.
- Foco: AccountMenu enfoca perfil al abrir, Escape retorna al trigger; EventActionDialog usa showModal, foco inicial seguro, ciclo Tab/Shift+Tab, retorno al trigger y bloqueo durante envío. MapPage conserva fuente lista/marker para devolver foco al cerrar preview. Son verificaciones de código, no lector de pantalla real.
- Dock conserva nombres accesibles al esconder texto visual y NavLink aporta aria-current. No exige mostrar todas las etiquetas contra decisión aprobada.
- Fuente autoalojada en woff2 con swap y fallback. MapPage y EventMap lazy; cleanup de listeners, markers, ResizeObserver y instancia. Fotos secundarias de detalle loading=lazy.
- Reducción de transparencia existe para superficies glass/card, y fallback cuando backdrop-filter no soportado. Entrada está gated por no-preference. El `transition-duration:.01ms` global merece limpieza futura según audit reference, pero no se verificó pérdida de feedback: no se promueve a defecto sólo por patrón.
- Captura histórica `block-7-actions/after/actions/cancel-dialog-390.png` inspeccionada: foco claramente visible y acciones alcanzables. Es histórico del bloque 7, no prueba nueva sobre SHA actual.

## Pendientes concretos

Contraste efectivo del cristal sobre cada mancha, teclado móvil, safe areas, NVDA/VoiceOver, zoom nativo, gestos y rendimiento/scroll de Mapbox y blur en dispositivo real permanecen sin prueba por B. La emulación y el código no certifican esos casos. La API actual no ofrece touch synthesis documentada. Las capturas protegidas nuevas y suites son responsabilidad del padre y se deben enlazar después sin sustituir este informe independiente.

Questions skipped: Assessment B es un subinforme técnico para síntesis; el cierre al usuario pertenece al informe combinado del padre.

## Corroboración posterior al cierre independiente de A

El padre avisó que A había cerrado antes de compartir señales técnicas. B inspeccionó las tres capturas nuevas `targeted/lazy-home-390x844.png`, `lazy-map-390x844.png`, `lazy-detail-390x844.png` y `targeted/results.json`, todas asociadas al SHA auditado. Muestran una superficie marina vacía; JSON confirma rootChildren=0, texto vacío, retryButtons=0, con import dinámico abortado en HomePage, MapPage y EventDetailPage. Corrobora **[P1] falta de recuperación de módulo lazy**: Suspense en App maneja espera pero no rejection de import. Recomendación: boundary recuperable con mensaje claro y recarga explícita, conservar destino al reintentar. La prueba aborta módulos locales de Vite en Edge con fixtures; no certifica fallo en build/PWA publicado.

El mismo JSON targeted registra `participation-periodic-focus`: antes y después BUTTON «Unirme». Por tanto, ese caso concreto NO reproduce pérdida de foco en el refresco periódico; no elevar el pendiente histórico a defecto confirmado sin otra reproducción.

Esta corroboración es posterior a los hallazgos y score independiente de B; no se presenta como juicio libre de A. La síntesis final debe ponderar conjuntamente A1 con B1.
