# Fuentes y verificación del contenido

Corte inicial: 26/10/2026; ampliación a 47 diapositivas: 27/10/2026. Rama: `codex/presentation-prototype`, creada desde `codex/release-7-documentation`. La presencia de código no acredita despliegue ni aceptación humana.

La entrega vigente contiene 51 diapositivas. Desarrolla R1–R7 después del roadmap y termina con demo, evolución, conclusiones y agradecimiento. Las 53 historias literales, su asignación a 13 sprints, portadas y cierres proceden de Planificación Oficial: ver [RELEASE_SOURCES.md](RELEASE_SOURCES.md). La trazabilidad del cierre está en [CLOSING_SOURCES.md](CLOSING_SOURCES.md). Las entregas históricas de 18 y 47 páginas se conservan.

## Documento oficial

[Planificación y especificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), leído mediante Google Drive conectado. Accesible. Se consultaron propósito, requisitos por release, stack, decisiones y portada institucional. No se copió el documento completo al proyecto.

Confirma UTN, Facultad Regional Resistencia, Ingeniería en Sistemas de Información, Grupo N.º 1, ciclo lectivo 2026. La ampliación a 18 diapositivas utiliza las grafías y responsabilidades de la tabla §2.2 de Planificación Oficial: Almirón, Carlos Federico; Córdoba, Rodrigo; González Urbieta, Enzo Joaquin; Lezcano, Rafael; González Zago, Joaquín. No se agregó logo institucional no disponible. El detalle de fuente y sección por diapositiva está en [SLIDE_SOURCES.md](SLIDE_SOURCES.md).

## Fuentes locales primarias

| Afirmación | Evidencia |
| --- | --- |
| PWA de descubrimiento, organización y participación | PRODUCT.md y requisitos oficiales |
| React 19, TypeScript, React Router, Vite 8 | package.json, src/App.tsx, vite.config.ts |
| Manifest y Service Worker | vite.config.ts, src/sw.ts |
| Identidad Amanecer y Bricolage Grotesque | DESIGN.md, docs/design/AGENTS.md, src/styles/tokens.css |
| Logo real | public/favicon.svg, utilizado en AppLayout |
| Descubrimiento implementado | HomePage.tsx, features/events/home.ts y search.ts, RPC search_public_events |
| Creación implementada | CreateEventPage.tsx, features/events/api.ts, publishEvent y RPC create_event |
| Participación implementada | EventParticipation.tsx, features/events/participation.ts, register_for_event y leave_event |
| Cliente Supabase directo | src/lib/supabase.ts |
| RLS y transacciones | supabase/migrations, docs/database.md y docs/architecture.md |
| Señales Realtime y reconsulta | features/chat, features/notifications y sección Realtime de docs/architecture.md |
| Mapbox y geocodificación | package.json y features/location |
| Operaciones Edge para medios y servidor | supabase/functions y contratos R7 |

El análisis comenzó con CodeGraph sobre la raíz D:/planit, cuyo índice ya existía. Las fuentes no indexadas (documentación y configuración) se leyeron directamente.

## Implementado, planificado y pendiente

Las tres capacidades de la diapositiva de producto tienen rutas y servicios implementados. El código también incluye perfiles/relaciones, chat, notificaciones, analítica, historias, calendario y compartir. Las primeras 18 diapositivas presentan el contexto y el roadmap general. Las páginas 19–47 desarrollan las releases según la documentación oficial, sin utilizar la presencia de código como prueba de aceptación.

No afirmar «R1–R7 totalmente terminadas»: los estados de `docs/implementation/RELEASE_*_STATUS.md` distinguen QA local, transporte real y aceptación. En particular R7 conserva NO-GO integral recomendado y firma humana pendiente; la limpieza Edge/cron tiene pendientes de despliegue. El diagrama representa responsabilidades del código, no un inventario de infraestructura certificada en producción. No se aplicó SQL ni se modificó backend para esta tarea.

## Capturas y recursos

- `public/assets/logos/planit.svg`: copia sin modificación de public/favicon.svg.
- `public/assets/fonts/`: copia de la fuente ya aprobada en src/assets/fonts, junto a su licencia OFL. Sin peticiones a Google Fonts.
- `public/assets/screenshots/*.png`: app React real desde build local, viewport 390 × 780, con fixtures sintéticos interceptados. Todas las peticiones HTTP externas se interceptaron y los Service Workers se bloquearon. Ningún formulario se envió a producción.
- `scripts/capture-app.mjs` reproduce la captura; `capture-provenance.json` registra rutas y métodos interceptados. La fecha 2099 sólo mantiene vigente el evento de prueba.
- La diapositiva de solución (identidad product, posición 6 en la secuencia vigente) aclara visiblemente «Capturas de la app local con datos de prueba». Las imágenes no acreditan funcionalidades en producción ni aceptación de usuario.

## Referencias de composición consultadas

- [Mobile App Pitch Deck](https://slidesgo.com/theme/mobile-app-pitch-deck): capturas en mockups como evidencia central, pocos conceptos por página. No se descargó ni reutilizó la plantilla.
- [Software Development App Pitch Deck](https://slidesgo.com/theme/software-development-app-pitch-deck): equilibrio de títulos y visuales, formato panorámico. Se descartó su paleta azul/verde por no pertenecer a PlanIt.
- Actualización de fondos a pedido del usuario (26/10/2026): se inspeccionó la vista previa de portada, con franja lateral azul y acentos gráficos sobre fondo claro. Se reinterpretaron los bordes coloreados y el campo de fondo usando los tonos PlanIt. Ningún gráfico ni recurso de la plantilla se incorporó al deck.
- [Software Architecture Project Proposal](https://slidesgo.com/theme/software-architecture-project-proposal): agrupar responsabilidades y relaciones. Se descartó su tratamiento oscuro/futurista.
- [Galería Slidev](https://sli.dev/resources/theme-gallery): usar una base mínima y layouts propios, evitando heredar una estética de tema ajena.
- [Impeccable](https://impeccable.style/): jerarquía, contraste, respiración, consistencia y crítica del resultado.
- [Slidev: inicio](https://sli.dev/guide/), [exportación](https://sli.dev/guide/exporting): generador oficial, componentes Vue, notas, v-click y PDF. Implementación según skill oficial instalada desde slidevjs/slidev.

Las páginas externas fueron accesibles. Se tomaron principios de composición, sin copiar recursos de las plantillas. La identidad y las afirmaciones funcionales se apoyan en fuentes propias de PlanIt.
