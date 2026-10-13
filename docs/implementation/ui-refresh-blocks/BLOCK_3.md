# UI Refresh — Bloque 3: crear, editar y duplicar

12/10/2026. Implementación B · Amanecer v3.0, preparada para PR draft a `main`. No fusionada. Alcance exclusivamente visual/UX, R1–R3 conservados.

## Base e independencia

- Rama: `design/amanecer-block-3-forms`.
- SHA base de `origin/main`: `123962f63cf7048495652031081f2d143d027685` (PR #29, Auth Amanecer).
- Worktree exclusivo: `C:/Users/USUARIO/Desktop/PlanIt/amanecer-block-3-worktree`.
- Se inspeccionaron rama, working tree, worktrees y referencias antes de crear la rama, y se ejecutó `git fetch origin`. La rama solicitada no existía; no había una PR de esa rama al consultar GitHub.
- El checkout original estaba en `codex/r2-block-3-own-profile`, con modificaciones de package/package-lock, `.env.example` eliminado y directorios locales. Se conservó íntegro. No se usó otra rama UI como base.
- Se volvió a hacer fetch antes de preparar la PR: `origin/main` permanecía en el SHA base. No hubo ajustes de integración ni merge requerido.

## Fuentes y alcance

AGENTS raíz/src/diseño, PRODUCT, DESIGN, DESIGN_SYSTEM, UI_WORKFLOW, SCREENS, DESIGN_GAPS, decisión Amanecer, RF-R1-03 y RF-R3-01/RF-R3-07. El design-lab `/b/create` se consultó en código y mediante captura de Edge (`states/lab-b-create.png`). Sus fixtures no se copiaron a producción.

Rutas migradas:

| Ruta | Resultado |
| --- | --- |
| `/events/new` | Encabezado compacto, luz superior, formulario por secciones, controles blancos, acción tinta |
| `/events/new?duplicateFrom=:id` | Mismo formulario con precarga existente y nuevos horarios obligatorios |
| `/events/:id/edit` | Encabezado compacto, portada existente, secciones y acciones Amanecer |

La inspección inicial confirmó que estas rutas no estaban migradas. Foundation y Mis eventos se conservaron; no se añadieron reglas duplicadas globales ni variantes nuevas de componentes.

## Archivos y decisiones

| Archivo | Cambio |
| --- | --- |
| `src/pages/CreateEventPage.tsx` | Import CSS, luz decorativa, sección de imágenes; handlers intactos |
| `src/pages/EditEventPage.tsx` | Import CSS y luz decorativa; permisos/guardado intactos |
| `src/pages/event-forms.css` | Composición local con tokens, estado de archivos/errores, responsive, campos nativos |
| `src/components/EventFields.tsx` | Sólo agrupación semántica y headings, sin cambio de props, valores ni lógica |
| `src/components/AppLayout.tsx` | Identificación exacta de creación/edición y opt-in `.amanecer-shell event-form-shell`; navegación intacta |
| `package.json` | Registra `check:events:ui`, cuyo script ya existía |
| `scripts/check-events-ui.mjs` | Output configurable, ancho 320 y expectativa de login actualizada a PR #29 |
| `scripts/check-edit-event-ui.mjs` / `scripts/check-edit-event.mjs` | Output configurable para no sobrescribir evidencia de otros bloques |
| `docs/design/verification/ui-refresh/block-3-forms/` | Capturas, métricas, resultados, logs, revisión Impeccable y runners reproducibles |

`EventFields` sólo tiene consumidores Crear y Editar. La API y los controles compartidos FormField/ScreenHeader/GradientButton no cambian. `edit-event.css` se inspeccionó y se conserva; su adaptación visual queda en el CSS acotado del bloque.

Diferencias justificadas del prototipo: se preserva el orden operativo existente de categoría/cupo, los dos pares inicio/fin, dirección/coordenadas, fotos opcionales y portada sólo de lectura en edición. No se copia el botón de fotos ficticio, las ilustraciones ni el descarte de intento incierto del lab. Se evita encerrar cada sección en tarjetas. Los controles de fecha/hora tienen columna completa bajo 480 px, con sus indicadores nativos y sin icono decorativo superpuesto. Todos los campos y mensajes existentes permanecen.

## Pruebas ejecutadas

| Comando | Resultado / evidencia |
| --- | --- |
| `npm run build` | PASS; `build.log`. Aviso del chunk Mapbox grande ya existente |
| `npm run lint` | PASS; `lint.log` |
| `npm run check:amanecer` | PASS, 83 valores normativos y referencias; `amanecer.log` |
| `npm run check:events` | PASS, obligatorios/fechas/coordenadas/cupos/imágenes; `events.log` |
| `npm run check:events:ui` | PASS; `npm-events-ui.log`, `npm-events-ui/` |
| `npm run check:edit-event` | PASS, PostgreSQL aislado y carreras de cupo; `edit-postgres.log`, `postgres-results.json` |
| `npm run check:edit-event:ui` | PASS; `npm-edit-ui.log`, `npm-edit-ui/` |
| `npm run check:auth` | PASS, validación y retornos; `auth.log` |
| `npm run check:my-events:ui` | PASS; `npm-my-events-ui.log`, `npm-my-events-ui/` |
| Runner del check de acciones existente | PASS a 320/360/375/390/768/1280, incluye duplicación completa; `after/check-event-actions-ui/ui-results.json` |
| Runner de estados extremos | PASS a los seis anchos, ubicación denegada/obtenida, catálogo vacío, imágenes/reintento y envío; `states.log`, `states/states-metrics.json` |
| Detector Impeccable Crear/Editar | Sin hallazgos; `detect-create.json`, `detect-edit.json` |
| `git diff --check` | PASS |

Los comandos UI usan Edge headless y fixtures interceptados, con timezone `Asia/Tokyo` para comprobar la independencia del horario del equipo. PostgreSQL es temporal/local, con scaffold Auth/Storage. No se aplicaron migraciones a Supabase ni se escribieron datos remotos. Se leyeron las skills Supabase/Postgres para la ejecución aislada de la regresión existente; no se cambió SQL.

Verificaciones funcionales: publicación de evento completo y fotos, obligatorios, inicio/fin y fechas argentinas, cupos y categorías, ubicación manual y geolocalización, límites/tipo/tamaño de imágenes, edición sólo de propietario, cupo frente a confirmados incluyendo carreras, duplicación sin fila previa, errores/reintentos/resultados inciertos/doble envío, regreso a detalle y origen/filtro.

Galería no se modifica ni comparte las reglas nuevas (selectores acotados a `.event-form-shell` y `.image-previews`), por lo que no se añadió su suite. Acciones sí se verificó por la duplicación.

## Evidencia y reproducción

Toda la evidencia nueva vive en [block-3-forms](../../design/verification/ui-refresh/block-3-forms/). `before/` contiene las capturas tomadas antes de editar; `confirm/` es la composición final en los seis anchos. `after/` conserva las regresiones y capturas de validación/datos largos. `states/` contiene estados de ubicación, categoría vacía, subida fallida y envío en curso. Portadas e imágenes de estas capturas son fixtures.

Desde el worktree, con dependencias del lockfile y herramientas de prueba existentes:

```powershell
$env:PLANIT_PLAYWRIGHT_PATH = '<ruta instalada>/playwright/index.mjs'
$env:PLANIT_UI_ORIGIN = 'http://127.0.0.1:4191'
$env:PLANIT_UI_OUTPUT = 'docs/design/verification/ui-refresh/block-3-forms/recheck'
npm run dev -- --host 127.0.0.1 --port 4191 --strictPort
# En otro terminal: comandos npm de la tabla.
node docs/design/verification/ui-refresh/block-3-forms/run-ui.mjs after
node docs/design/verification/ui-refresh/block-3-forms/run-ui.mjs confirm
# states.mjs requiere además el lab en 5191/b/create.
```

Impeccable: critique con dos assessments independientes, polish/harden y audit de cierre documentados en [REVIEW.md](../../design/verification/ui-refresh/block-3-forms/REVIEW.md). Live Mode no ejecutado: navegador integrado inaccesible al localhost; captura final por Edge. No se usó init, document ni shape.

## Límites e integración

No se verificaron dispositivos físicos, teclado móvil real, Safari/iOS, Android, lector de pantalla, alto contraste, zoom 200% ni E2E remoto Auth/Storage. Las pruebas locales no sustituyen aceptación humana. Inputs, errores, disabled y layout se verificaron en emulación de los seis tamaños; los estados de edición y duplicación están cubiertos por sus fixtures existentes.

`AppLayout.tsx` es el único punto de integración compartido: al fusionar futuras PR conservar las condiciones exactas de crear/editar junto a otras activaciones Amanecer. Repetir fetch/pruebas si main avanza después de esta entrega. No consolidar el status general desde esta PR.

No se modificaron `src/features/events/`, Supabase, SQL, RPC, RLS, contratos, `src/index.css`, tokens, DESIGN, estilos/componentes de Mis eventos ni `UI_REFRESH_R1_R3_STATUS.md`. No se inició otro bloque ni se fusionó main.
