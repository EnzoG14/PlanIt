# PlanIt — workflow reproducible de UI

12/10/2026. Dirección **B · Amanecer v3.0**. Mis eventos es el piloto integrado mediante [PR #27](https://github.com/EnzoG14/PlanIt/pull/27), base `main` cb5a249. La fundación comparte infraestructura; las restantes pantallas no se migran automáticamente.

## Entorno desde un clon limpio

Git, Node.js compatible con Vite 8 (esta verificación usó Node 24.19.0), npm y un navegador Chromium. Desde la raíz:

```powershell
git fetch origin
git switch -c design/nombre-del-bloque origin/main
npm ci
Copy-Item .env.example .env.local
npm run dev -- --host 127.0.0.1 --port 4186 --strictPort
```

Completar únicamente configuración pública autorizada en el archivo ignorado; no versionar credenciales. Revisar `git status` antes de cambiar de rama; preservar trabajo ajeno. Leer AGENTS raíz y los más cercanos. Para explorar estructura, resolver raíz/índice y consultar CodeGraph primero; cada worktree requiere su propio índice.

## Impeccable por proyecto

La entrega utilizó skill **4.5.2**, engine **0.1.14** (`SKILL.md` y `scripts/VERSION` de la instalación local). No son dependencias npm de PlanIt. El [instalador oficial](https://github.com/pbakaus/impeccable#installation) permite scope por proyecto:

```powershell
npx impeccable install --providers=codex --scope=project
```

Este comando instala la versión publicada disponible: para reproducir exactamente esta evaluación, usar el bundle oficial archivado de skill 4.5.2/engine 0.1.14 y verificar esos dos archivos antes de correr. No asumir que un instalador sin versión fija conserva la misma evaluación; si cambia, registrar la versión nueva en la evidencia. No instalar ni actualizar herramientas como efecto secundario de un cambio de UI.

Recargar el agente para descubrir `.agents/skills/impeccable/SKILL.md`. Configuración portable existente: `.impeccable/config.json`, `buildPath: code`; contexto aprobado en PRODUCT.md, DESIGN.md y sidecar. No ejecutar `init`/`document` para regenerarlos. El launcher Windows es:

```powershell
.agents/skills/impeccable/scripts/impeccable.cmd context
.agents/skills/impeccable/scripts/impeccable.cmd detect --json src/components/AppLayout.tsx
```

`critique`, `polish`, `harden`, `audit` son flujos del agente definidos en `reference/*.md`, no garantías obtenidas por llamar un binario con esos nombres. Critique requiere dos assessments independientes cuando el entorno/autoridad lo permite; declarar cualquier degradación. El detector es evidencia determinista, no aceptación visual. Hook y su consentimiento se habilitan localmente según la herramienta; nunca versionar permisos, binarios, cachés, sesiones, `.codex`/`.claude`, `config.local.json`, `live` ni snapshots locales de critique.

## Consultar fuentes y ejecutar el lab

PRODUCT.md aporta propósito; **DESIGN.md es la fuente normativa**. DESIGN_SYSTEM explica aplicación; `.impeccable/design.json` está asociado al mismo sistema, no define otra paleta. Consultar [decisión](proposals/amanecer-direction.md), [plan](../implementation/UI_REFRESH_R1_R3_PLAN.md), [estado](../implementation/UI_REFRESH_R1_R3_STATUS.md) y requisitos funcionales antes de implementar.

```powershell
npx vite --config design-lab/vite.config.ts
npx tsc -p design-lab/tsconfig.json
```

Lab en `http://localhost:5180/b` y `/b/<pantalla>`. Referencia de composición/estados/movimiento; no backend. Eventos, usuarios, números e imágenes SVG son fixtures; mapa es dibujo. Buscador, chips de categoría, tira de días y contadores no autorizan nuevas funciones. No copiar ilustraciones como fotos ni copiar tokens del lab si difieren de DESIGN.md. Ver [README](../../design-lab/README.md).

## Crear una pantalla con la fundación

`src/index.css` importa `styles/tokens.css`: sólo propiedades `--pi-*` y el mismo `@font-face` autoalojado. `App.css` importa `styles/amanecer.css`: patrones acotados. Cada bloque autorizado debe activar `.amanecer-shell` en el shell de su ruta, revisar el layout y tomar capturas. Hoy AppLayout sólo la activa en `/my-events`, junto a `.my-events-shell` que retiene la composición del piloto.

```css
/* Composición de la pantalla: no una paleta paralela. */
.next-page { gap: var(--pi-space-base); }
.next-page h2 { color: var(--pi-color-text); }
```

| Necesidad | Reutilización / alcance |
| --- | --- |
| Layout y navegación | AppLayout + dock opt-in; revisar ancho, reserva inferior y header por ruta |
| Encabezado de formulario | ScreenHeader + estilo Amanecer opt-in; composición propia de la pantalla |
| Principal / secundaria | GradientButton (`gradient-link` para enlace), `secondary-button` / `secondary-link`; sólidos bajo el scope |
| Campo y error | FormField + `.field-control`; blanco, borde control, foco, aria-invalid/describedby existentes |
| Carga / vacío / error | StatusMessage y reintento real; error pastel, estado informativo de cristal preservado del piloto |
| Menú y confirmación | AccountMenu y EventActionDialog; conservar foco/Escape/retorno y protección de doble envío |
| Evento | CompactEventCard para gestión; EventCard de descubrimiento permanece heredado hasta bloque 4 |
| Chips / tabs / filtros | Colores/radios/foco centrales; roles y layout locales del piloto no son un componente genérico nuevo |
| Éxito / aviso / info | Pares semánticos `--pi-color-*-bg` / `*-on-bg`; texto/icono siempre presentes |

No normalizar tamaños particulares de Mis eventos a medidas nominales ni reconstruir su timeline. No cambiar interfaces públicas sin revisar consumidores. Las variantes nuevas de campo/ScreenHeader están preparadas para el bloque 2/3, no acreditan esas pantallas migradas.

## Compatibilidad y retirada

`--color-*`, `--gradient-primary`, `--radius-control/card`, definidos globalmente en `index.css`, identifican el sistema heredado. El scope Amanecer adapta los mismos nombres a `--pi-*` para componentes aún compartidos. `--gradient-primary` es tinta sólida sólo allí. `--color-field` sigue siendo superficie suave por compatibilidad de hover; los campos nuevos usan blanco explícito. No quedan `--am-*` ni otra paleta local.

Retirar adaptadores por componente cuando todos sus consumidores usen tokens/patrones centrales. Retirar base oscura y reglas antiguas sólo al cerrar todas las rutas consumidoras con regresión. No ampliar scope de dock/menú/header sin revisar la composición correspondiente; no cambiar Auth, chat, mapa ni rutas por esta infraestructura. Reducción de movimiento conserva la regla heredada del piloto de `.01ms`; la entrada está desactivada. Fallback opaco se comparte para transparencia reducida o ausencia de backdrop-filter. Las particularidades visuales de filas, tabs y filtros siguen locales hasta una extracción con equivalencia demostrada.

## Capturas y checks

Edge y Playwright externos a package.json: configurar `PLANIT_PLAYWRIGHT_PATH` con la ruta absoluta a `playwright/index.mjs`; los runners actuales usan `channel: msedge`, por lo que Edge debe estar instalado. Instalar Playwright en herramientas locales ignoradas, no como dependencia de producto. Para PostgreSQL efímero, `check:my-events` importa `pg` y `@embedded-postgres/windows-x64` desde `.participation-test-tools.local/node_modules`; preparar allí esas herramientas (Windows x64) antes del check. No aplicar migraciones a Supabase para correrlo.

```powershell
npm install --prefix .participation-test-tools.local --no-save pg @embedded-postgres/windows-x64
```

Con Vite en 4186, registrar salida nueva por bloque y esperar fuente/layout antes de medir. Nunca apuntar salida a las carpetas históricas aprobadas:

```powershell
$env:PLANIT_UI_ORIGIN = 'http://127.0.0.1:4186'
$env:PLANIT_UI_OUTPUT = 'docs/design/verification/ui-refresh/nuevo-bloque/pilot'
node scripts/check-my-events-refresh-ui.mjs after
npm run build
npm run lint
npm run check:amanecer
npm run check:my-events
npm run check:my-events:ui
npm run check:event-actions:ui
```

Cambiar `PLANIT_UI_OUTPUT` antes de cada runner para no mezclar resultados. `check:my-events` reejecuta SQL sólo en PostgreSQL local efímero; UI intercepta Auth/REST/Storage y las escrituras. Añadir `check:home:ui`, `check:discovery:ui`, `check:chat:layout`, `check:auth`, `check:amanecer:auth:ui` y los checks del bloque afectado. Consultar `package.json`; no usar flags live/signup del refresh. Auth visual se captura sin sesión; el test de variantes añade scope sólo al DOM temporal y lo retira, sin modificar rutas. Un check que no pudo correr se registra como tal.

Comparar piloto con `my-events/after/` y con base de main bajo idéntico navegador/fixtures. Viewports: 320×800, 360×800, 375×812, 390×844, 768×1024 y 1280×900. Revisar geometría, familia, espaciados, filtros, tarjetas, dock, menús, dialog/foco, estados, texto aumentado, poca altura, reduced-motion/transparency y carga/fallback de fuente. La comparación de píxeles puede variar por foco, scroll y carga: documentar diferencias y contrastar mediciones; overflow del documento no detecta solapamientos internos.

Para esta fundación, `python scripts/compare-amanecer-captures.py` (Pillow instalado en herramientas externas) compara las carpetas baseline/after versionadas y afirma geometría/estilos y los seis Organizo idénticos. No exige igualdad píxel a píxel de estados dinámicos; sus diferencias quedan listadas en JSON. Para regenerar una base, usar un checkout de main aparte bajo el home con servidor en otro puerto y ejecutar el runner actual contra ese origen, con salida baseline nueva. No copiar `.codegraph` ni usar un índice ajeno; no ejecutar checks sobre fuentes que se estén intercambiando durante la captura base.

## Cierre de bloque

Registrar critique/audit de Impeccable, detector, checks propios y revisión de capturas por separado. Añadir resultados y límites a una carpeta nueva y actualizar el estado visual, sin alterar resultados históricos ni releases funcionales. No acreditar teclado móvil, safe areas, lector de pantalla, zoom nativo, rendimiento físico o E2E remoto mediante fixtures.

Revisar diff/enlaces, seleccionar sólo archivos del bloque, commit y PR draft a main con validaciones y pendientes concretos. No incluir cambios locales ajenos, no fusionar ni empezar el próximo bloque. La PR de fundación es el punto de detención.
