# PlanIt · Proyecto Final

Presentación independiente de **54 diapositivas Slidev**, 16:9. Incluye situación problemática, solución, oportunidades por usuario, alcance, roadmap, siete releases con sus 53 historias completas en post-its PlanIt y cuatro páginas finales: demo, evolución, conclusiones y agradecimiento. Sigue la documentación oficial de PlanIt y el esquema editorial de los modelos Equipo 6, SysAssign y Tatool. La reorganización inicial autorizada el 29/10/2026 se documenta en [NARRATIVE_ADJUSTMENTS.md](references/NARRATIVE_ADJUSTMENTS.md). Identidad B Amanecer, Bricolage local y fondos PNG opacos sin franja izquierda. No modifica la PWA, SQL, dependencias ni despliegue.

## Requisitos e instalación

Node.js **22.12.0 o superior** y npm. Entorno verificado: Node 24.19.0, npm 11.17.0. Desde esta carpeta:

```powershell
cd D:\planit\presentation
npm ci
npx playwright install chromium
```

`playwright-chromium` permite exportar y verificar visualmente. Si npm informa scripts pendientes, revisarlos con `npm approve-scripts playwright-chromium` según la política del equipo. La descarga explícita oficial anterior instala el navegador sin necesitar habilitar automáticamente scripts de terceros. No desactivar las verificaciones de npm.

## Visualizar, compilar y exportar

```powershell
npm run dev
# http://localhost:3030
# Notas: http://localhost:3030/presenter/
npm run check
npm run check:visual  # requiere npm run dev activo
npm run build
npm run export
# Si el exportador captura antes de completar la carga: npm run export -- --wait 700
```

Flechas para navegar. En arquitectura, dos avances revelan Realtime y servicios complementarios; todas las historias están visibles sin clics. Exportación vigente: `exports/planit-completa.pdf` (54 páginas). Se conservan planit-con-releases.pdf y su copia planit-con-releases-47.pdf (47 páginas), planit-hasta-roadmap.pdf (18) y planit-prototipo.pdf (tres). Build: `dist/`. QA: `.validation/`. Son salidas locales ignoradas por Git. La exportación de 53 páginas anterior se conserva como `planit-completa-53.pdf`.

No configurar variables de Supabase en este proyecto. La presentación funciona con recursos locales.

## Organización

```text
slides.md                    Contenido, configuración y notas
layouts/planit.vue            Canvas común
components/                  PhoneCapture y ArchitectureDiagram
styles/index.css             Tokens y composición
styles/extended.css          Composiciones de la narrativa académica
styles/releases.css         Portadas, post-its y cierres de releases
styles/closing.css          Demo, evolución, conclusiones y agradecimiento
data/deck.mjs                Orden, identidades, equipo y calendario oficial
data/release-stories.mjs     Los 53 enunciados oficiales completos
data/release-content.mjs     Asignación a sprint, objetivos y cierres
public/assets/fonts/         Fuente original y licencia OFL
public/assets/logos/          Logo original
public/assets/screenshots/    Capturas utilizadas por el deck
assets/                      Reserva documental de diagramas/ilustraciones
references/                  Fuentes, procedencia, dirección y revisión
scripts/                     Comprobaciones y captura de la app
DESIGN.md                    Adaptación del sistema a proyección
PLAN.md                      Narrativa, alcance y verificación
AGENTS.md                    Reglas para próximas sesiones
```

Los recursos renderizados viven en `public/assets/`, según la convención de Slidev. El diagrama es código Vue editable, no una imagen raster.

`TeamRoster`, `FunctionalGroups` y `ReleaseRoadmap` consumen los datos oficiales compartidos. `SlideFooter` conserva el pie común. Las cifras distinguen 13 sprints funcionales de R1–R7 y un sprint técnico adicional de R0.

La revisión PDF se ejecuta con `python scripts/check-pdf.py` después de `check:visual` y `export`. Requiere pypdf, pypdfium2 y Pillow, disponibles en el runtime de Codex. Renderiza las 54 páginas y comprueba las 53 historias como texto completo seleccionable, fechas, 16:9 y color frente al navegador. No se agregan estos paquetes a la PWA ni al proyecto Node.

## Agregar una diapositiva

Para una ampliación posterior autorizada, separar con `---`, asignar `layout: planit`, `name` estable, título y contenido Markdown. Añadir notas con fuente y sección. Registrar identidad, orden y pasos en el manifiesto. Las 29 páginas de releases se describen en `release-content.mjs`; `StoryBoard` reutiliza composiciones de tres, cuatro o cinco historias. La entrega de 54 páginas finaliza en agradecimientos. Las fuentes del cierre están en `references/CLOSING_SOURCES.md`. Demo es un separador para exposición en vivo; las posibilidades de evolución se identifican como futuras y no comprometidas.

La transcripción oficial y su revisión consultada se conservan en `references/release-stories.source.json`. La comprobación permite normalizar espacios y saltos de línea, pero no abreviar los enunciados. R1 ocupa dos páginas del mismo sprint; el total sigue siendo 13 sprints funcionales. No derivar fechas de sprint dividiendo las fechas de una release.

## Capturas y recursos

Se capturó la aplicación React real desde su build local usando datos de prueba, sin enviar formularios ni leer contenido productivo. Las peticiones HTTP externas se interceptan y los Service Workers se bloquean; el script también bloquea WebSockets para futuras capturas. La aclaración es visible en el deck. No son interfaces generadas ni capturas de aceptación remota.

Para reproducirlas, ejecutar la PWA desde la raíz (`npm run build` y `npm run preview -- --host 127.0.0.1 --port 4182`) y, en otra terminal:

```powershell
$env:PLANIT_CAPTURE_ORIGIN = 'http://127.0.0.1:4182'
npm run capture:app
```

También admite un servidor de desarrollo en 4180 por defecto. `capture-provenance.json` registra la procedencia. Después de reemplazar capturas, inspeccionarlas, conservar la aclaración de fixtures y actualizar procedencia/metadatos con Impeccable `embed-prompt <imagen> --prompt '<origen>'`. No copiar `.env`, credenciales ni fotos privadas.

## Skills

Slidev se instaló localmente con `npx skills add slidevjs/slidev --skill slidev --agent codex --yes`. Impeccable se instaló/verificó con `npx impeccable install --providers=codex --scope=project` (la instalación existente se reutilizó). Están en `.agents/skills/` de la raíz, disponible para Codex en siguientes turnos. Esa carpeta y `.codex/` ya están ignoradas por el repo; `skills-lock.json` registra Slidev.

Para reinstalar en otro checkout, ejecutar ambos comandos desde la raíz. No requiere instalación global. Los hooks locales Impeccable figuran en `.codex/hooks.json`; el hook de diseño se ejecutó durante esta sesión. Si otra instalación solicita autorización de hooks, revisar y habilitarla en el flujo de aprobación de Codex, sin saltar controles.

## Decisiones y límites

Fondos: no llevan franja vertical izquierda. Se publican como PNG opacos sRGB para evitar cambios a rosado en algunos visores PDF. Su fuente editable está en `styles/background-source.css`; después de modificarla ejecutar `npm run backgrounds`, verificar y volver a exportar. El mismo archivo PNG se usa en navegador y PDF, con texto y diagramas separados.

Se utilizó `npm init slidev@latest presentation -- --template default`; el generador creó directamente esta carpeta. Se retiraron tema y componentes de demostración, configuraciones de hosting de ejemplo y archivos pnpm, manteniendo npm y un lockfile propio.

Versiones fijadas y overrides transitivos de DOMPurify/image-size aplicados a correcciones compatibles. Vue se actualizó a 3.5.44 dentro de este proyecto para eliminar alertas. `npm audit` terminó en cero vulnerabilidades.

El exportador de Slidev 53 emite un diagnóstico capturado de Twoslash/FloatingVue al inicializar su plugin de código, aunque el PDF se genera. No se parchearon dependencias. El contenido de este prototipo no utiliza Twoslash. La prueba headless desactiva Wake Lock mediante la preferencia de usuario de Slidev, porque no existe una pantalla física que mantener activa.

Fuentes, contenido implementado y límites de releases: [references/SOURCES.md](references/SOURCES.md). Continuación: [PLAN.md](PLAN.md). Validaciones y revisión: [references/VALIDATION.md](references/VALIDATION.md).

## Esfuerzo relativo propuesto

Las 53 historias muestran un círculo de 36 px con un número de 22 px. `data/story-effort.mjs` centraliza puntos, tallas y colores; los enunciados oficiales no cambian. La leyenda de estimación muestra sólo los puntos y colores; se retiraron las tallas por pedido del usuario. Los tableros no llevan aclaraciones de esfuerzo en sus pies. Los valores se asignaron por autorización del usuario para esta presentación, no son estimaciones históricas ni horas. Ver [EFFORT_ESTIMATES.md](references/EFFORT_ESTIMATES.md). Alcance y Limitaciones ocupan ahora dos páginas independientes, siguiendo la referencia editorial Tatool.

## Imágenes aportadas por el usuario

Los doce recursos publicados en `public/assets/tools/` se distribuyen entre Stack tecnológico (TypeScript, PWA, Supabase y Mapbox), Priorización y estimación (MoSCoW y Planning Poker) y Herramientas de colaboración (Jira, GitHub, Google Docs, WhatsApp y Discord). `provenance.json` registra origen y SHA-256; `npm run check` comprueba integridad y uso. Once archivos se conservan originales; Scrum se publica con fondo transparente retirado con ImageGen y su original se guarda por separado. Scrum indica sprints de 2 semanas según confirmación del usuario e incorpora el diagrama transparente. Véase [PROVIDED_IMAGES.md](references/PROVIDED_IMAGES.md).
