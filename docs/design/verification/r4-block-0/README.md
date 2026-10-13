# R4 BLOQUE 0 — evidencia documental

**Fecha:** 13/10/2026, Argentina. **Entrega:** [PR #38](https://github.com/EnzoG14/PlanIt/pull/38) en borrador. **Base inmutable:** `42af4e42d032637b1363e207714e86c297d8c3b1`. [Auditoría y contratos](../../../implementation/RELEASE_4_BLOCK_0_DECISIONS.md), [seguimiento](../../../implementation/RELEASE_4_STATUS.md).

La carpeta contiene evidencia **nueva de inspección**, no implementación ni aceptación funcional R4. Ninguna captura/regresión histórica se sobrescribió. El código servido fue el de ese SHA; sólo se editaron documentos y herramientas de evidencia bajo docs.

## Artefactos y naturaleza

| Archivo | Qué acredita | Qué no acredita |
| --- | --- | --- |
| [source-manifest.json](source-manifest.json) | 76 fuentes de la base, blob Git/hash SHA-256 de bytes Git | Actualidad del esquema remoto o ejecución de sus contratos |
| [original-source-comparison.json](original-source-comparison.json) | Lectura Google Drive de pestañas vigentes; 39/39 textos oficiales coinciden al normalizar Unicode/espacios | CA funcionales probados o nueva aprobación de requisitos |
| [sql-inventory.json](sql-inventory.json) | Últimas definiciones, firmas/defaults/retornos, invoker/definer, search_path, dependencias, EXECUTE y políticas declaradas en 17 migraciones | Replay, catálogos efectivos, advisor, privilegios de plataforma/service_role o pruebas SQL/JWT |
| [traceability.csv](traceability.csv) | 39 CA → rutas/servicios existentes o propuestos → componentes → scopes → políticas → pruebas futuras | PASS: los 39 estados son Pendiente |
| [authorization-matrix.csv](authorization-matrix.csv) | 288 combinaciones de actor/visibilidad/grant/participación/superficie, actual deducido vs objetivo | Resultados SQL, filas reales o un control de seguridad ya reparado |
| [capture-results.json](capture-results.json) | Navegador/viewport/scopes, fuente/fondo/dock/overflow, rutas y tráfico de fixtures | E2E Supabase, Mapbox real, auditoría WCAG completa o teclado físico |
| [capture-baseline.mjs](capture-baseline.mjs) / [inspect-contracts.mjs](inspect-contracts.mjs) / [verify-documentation.mjs](verify-documentation.mjs) | Herramientas read-only de reproducción documental | Código de producto, nuevos endpoints, migraciones o tests funcionales R4 |
| [documentation-results.json](documentation-results.json) | Enlaces, IDs/estados/textos de CA, firmas/hash y alcance protegido, sintaxis y formato | Build/lint, SQL replay ni pruebas remotas |

## Capturas abiertas y observaciones

**App, fixtures ficticios de Auth/REST/Storage y WebSocket bloqueado:** Inicio, Mapa, Perfil y Detalle a 375×812 y 1280×900; error de Inicio y Detalle sin foto a 375×812. Diez PNG. Sesión ficticia del organizador, reloj de eventos 2099 y navegador Asia/Tokyo. Imágenes SVG con texto «Imagen de prueba», no fotos extraídas del collage ni Storage real. Fuente Bricolage local cargada; fondo rgb(246,245,253); dock de cuatro destinos; sin overflow horizontal en estos tamaños. Foco inicial medido; no se ensayó navegación completa por teclado, diálogos, zoom/texto ampliado ni preferencias de transparencia.

**Lab:** /b/home, /b/map, /b/profile, /b/event, cuatro PNG a 375×812. Datos/SVG/mapa dibujado ficticios; recursos externos bloqueados y fuente externa en fallback. Sirve para composición, no tokens o API de producción. Algunos controles del lab quedan bajo su dock; no se declara una auditoría de accesibilidad de ese prototipo.

**Mockup:** release-4.png original abierto visualmente, 1491×1055; hash de bytes Git en source-manifest. Cinco experiencias: Buscar/Filtros/Explorar/Intereses/Sugerencias. No incluye enlaces/grants/canje. Excepciones explícitas: sólo buscar título/descripción; no gratuidad/tickets/favoritos/tags múltiples; R4 usa Amanecer, no fondos marinos/CTA degradados del collage.

**Mapa:** sin token Mapbox para estas capturas; fallback con aviso y tarjetas. Standard lightPreset day fue inspeccionado en código, no conectado al proveedor. Una captura full-page coloca el dock fijo en medio del contenido largo; esto no prueba por sí solo solapamiento permanente ni alcanzabilidad de todos los controles. No certificar Safe Area, rendimiento de blur, gestos, lector de pantalla o teléfono/PWA real a partir de estas imágenes.

| Superficie | Captura móvil | Captura escritorio | Integración propuesta |
| --- | --- | --- | --- |
| Inicio | [home-375x812](baseline/home-375x812.png) | [home-1280x900](baseline/home-1280x900.png) | Búsqueda/panel antes de categorías/resultados; Para vos separado |
| Mapa | [map-375x812](baseline/map-375x812.png) | [map-1280x900](baseline/map-1280x900.png) | Filtros compartidos sin perder preview/foco ni fallback |
| Perfil | [profile-375x812](baseline/profile-375x812.png) | [profile-1280x900](baseline/profile-1280x900.png) | Entrada Mis intereses; identidad y correo propio conservados |
| Detalle | [detail-375x812](baseline/detail-375x812.png) | [detail-1280x900](baseline/detail-1280x900.png) | Gestión enlace/accesos sólo dueño; grants no implican inscripción |
| Estados | [sin foto](baseline/detail-no-photo-375x812.png) | [error Inicio](baseline/home-error-375x812.png) | Foto ausente/error mantienen contenido/recuperación |
| Lab | [home](lab/home-375x812.png), [map](lab/map-375x812.png) | [profile](lab/profile-375x812.png), [event](lab/event-375x812.png) | Referencias ficticias de composición/estados |

## Reproducción aislada

Crear un checkout del SHA bajo home con CodeGraph propio. Dependencias del package-lock; no cambiar fuentes/configuración para capturar. Esta ejecución reutilizó node_modules de D:/planit mediante junction: ambos lockfiles tienen SHA-256 `7770689624d654f6568e545c7ef2c7312158655f8007c7379446e379d8d55db0`. No se instaló una dependencia ni se regeneró lockfile. Node 24, Edge headless (versión en capture-results), Playwright del runtime externo.

Desde ese checkout, iniciar Vite oculto o en terminal con configuración pública ficticia y Mapbox vacío; todo tráfico de servicio de navegador será interceptado:

```powershell
$env:VITE_SUPABASE_URL = 'https://iepeqmvzjguwlhnecsdq.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fixture'
$env:VITE_MAPBOX_ACCESS_TOKEN = ''
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4198 --strictPort
# Otro terminal, mismo checkout:
node node_modules/vite/bin/vite.js --config design-lab/vite.config.ts --host 127.0.0.1 --port 4199 --strictPort
# Tercer terminal, cwd en el checkout base; runners desde el checkout de esta PR:
$piEvidenceTools = '<checkout de esta PR>/docs/design/verification/r4-block-0'
$env:PLANIT_PLAYWRIGHT_PATH = '<runtime instalado>/playwright/index.mjs'
$env:PLANIT_UI_ORIGIN = 'http://127.0.0.1:4198'
$env:PLANIT_LAB_ORIGIN = 'http://127.0.0.1:4199'
$env:PLANIT_UI_OUTPUT = 'docs/design/verification/r4-block-0/recheck-<fecha>'
node "$piEvidenceTools/capture-baseline.mjs"
$env:PLANIT_AUDIT_OUTPUT = 'docs/design/verification/r4-block-0/recheck-<fecha>'
node "$piEvidenceTools/inspect-contracts.mjs"
```

El SHA base no contiene estos runners nuevos: se invocan por ruta absoluta desde la entrega, manteniendo cwd en la base. Los runners exigen salida nueva para no sobrescribir la evidencia publicada y la base exacta; no son suites funcionales R4. Los servidores de esta ejecución se detienen al cerrar el bloque.

La verificación documental se puede repetir desde el checkout de la entrega, conservando el reporte publicado:

```powershell
$env:PLANIT_DOC_REPORT = 'docs/design/verification/r4-block-0/recheck-<fecha>/documentation-results.json'
node docs/design/verification/r4-block-0/verify-documentation.mjs
```

Incidencias del armado de evidencia: el primer verificador comprobó su propio reporte antes de crearlo; se ajustó el orden de generación/chequeo. Un intento de editar ese helper temporal perdió backticks de JavaScript en PowerShell; se corrigió con escritura literal. La revisión final pasó; no fueron fallos de la app ni pruebas funcionales. El Git del sandbox de lectura no pudo resolver algunas operaciones del worktree; se usó ejecución autorizada con acceso a su directorio Git.

## Evaluación Impeccable acotada y límites

Se aplicaron contexto y referencia audit de skill 4.5.2, preservando Amanecer y la autoridad de RF/CA. Hallazgo de sidecar posiblemente anterior a DESIGN registrado, sin regeneración. No se hizo rediseño, crítica global, polish, detector sobre código nuevo ni una puntuación WCAG/20 ficticia. La revisión técnica se limitó a integración/scopes, roles de color/fuente, foco existente, composición y responsabilidades; problemas de autorización se derivan de SQL versionado.

**Resultados del bloque:** comparación fuente 39/39; inventario estático 17 migraciones/11 tablas/31 funciones públicas/12 privadas/20 políticas declaradas; 39 contratos y 288 escenarios objetivo; 14 capturas, cero solicitudes no previstas/cero mutaciones de negocio/cero errores de página del fixture. Enlaces/hashes/alcance/sintaxis/diff revisados separadamente en documentation-results.

**NO EJECUTADO:** npm build/lint (diff documental), SQL local, Supabase metadata remoto, HTTP/JWT A/B real, Storage/Realtime reales, proveedor Mapbox real, 39 CA funcionales y aceptación humana. No se corrigieron permisos ni se crearon tablas/rutas. La entrega se detiene en PR documental sin merge/deploy.
