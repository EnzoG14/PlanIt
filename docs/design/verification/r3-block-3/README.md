# R3 BLOQUE 3 — Galería administrable

Estado: **Implementado; QA pendiente**. Aceptación humana, dispositivo físico y HTTP/Auth/REST/Storage con cuentas reales pendientes. No «Validado».

## Fuentes y decisiones

- Prompt `RELEASE_3_BLOCK_3.md`, plan/estado R3, RF-R3-03 y sus cuatro CA; guías de arquitectura, BD, frontend y diseño leídas antes del cambio.
- Consultada la reorganización vigente de [Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), sección RF-R3-03 de «Especificación técnica — R1 a R7»: flujo, datos, reglas y verificación. No se utiliza R3 histórico de estadísticas.
- Abiertos visualmente [03-galeria.png](../../mockups/r3/03-galeria.png) y [collage original](../../mockups/release-3.png). No se alteraron ni se usaron como contenido de eventos.
- Auditoría remota mediante SELECT exclusivo en `planit-v2`: trece migraciones aplicadas, bucket privado, JPEG/PNG/WebP y 5.242.880 bytes; las nuevas RPC no existen todavía. Políticas media existentes contrastadas con Git. [Evidencia acotada](remote-metadata-results.json). No es prueba HTTP/JWT ni aplicación de migraciones.
- Sólo organizador, incluso históricos: el contrato R3-03 no impone el límite temporal de edición de campos R3-01. No reabre eventos ni cambia sus datos/estado.

## Entrega

Ruta autenticada `/events/:id/gallery`, accesible desde detalle y menú Organizo. Selector móvil y drop de archivos, previews locales, contador hasta diez, carga individual con etapas reales (comprobar/subir/registrar) e indicador indeterminado mientras hay petición, errores/reintento por archivo. No se inventa porcentaje de bytes transferidos. Archivos corruptos se rechazan por decodificación del navegador antes de subir; MIME/tamaño se validan también contra metadata de Storage y CHECKs existentes.

Controles Antes/Después utilizables con teclado guardan el orden; portada = primera por `sort_order`. No hay drag para reordenar: los controles táctiles son la alternativa principal. Quitar pide confirmación nativa modal, permite cancelar/Escape y sólo elimina la asociación del evento. Detalle y tarjetas consultan de nuevo el orden existente; un fallo al firmar no convierte la segunda imagen en portada. Firma dura cinco minutos; botón Actualizar renueva URLs y recupera errores de imágenes.

Las selecciones viven sólo en React. UUID de path permanece en los reintentos, carga sin upsert, reconciliación antes de reenviar. Un commit perdido se confirma por lectura del path asociado; no se añade dos veces. Errores SQL conocidos permiten limpiar objetos no registrados; errores inciertos conservan el path para reintentar o descartar. Si también falla la limpieza, queda visible como pendiente. Revisar cargas interrumpidas consulta hasta cien paths no registrados del propio evento, también después de recargar; limpieza explícita por Storage API. No hay borradores ni estado privado de subida en el repositorio.

**Retención deliberada:** los objetos con fila `files` se conservan aunque pierdan su última asociación. No son huérfanos sin identificar; mantienen metadatos y RLS. Esto protege reutilizaciones por otros eventos y una futura duplicación. No hay borrado físico ni garbage collector de media registrada en este bloque; puede aumentar Storage retenido. La limpieza únicamente elimina subidas sin registro. No se borra SQL de `storage.objects` en producción: las pruebas SQL simulan las políticas; la app usa Storage API.

## Migración y seguridad

`20261012013634_manage_event_gallery.sql`: creada en Git y probada localmente; **aplicada en planit-v2 el 11/10/2026 con autorización expresa posterior del usuario**.

- `add_event_image(uuid,text)`, `remove_event_image(uuid,uuid)`, `reorder_event_images(uuid,uuid[],uuid[])`, `get_event_unregistered_uploads(uuid)`: EXECUTE sólo authenticated, `auth.uid()`, search_path vacío y autorización explícita del organizador.
- SECURITY DEFINER para lock del evento y mutaciones sin conceder UPDATE/DELETE de tablas; función privada de bloqueo no ejecutable por clientes. RPC de consulta de cargas devuelve sólo paths propios sin registro.
- Operaciones requieren READ COMMITTED y lock de evento antes de leer slots/orden. Diez posiciones y UNIQUE/FK/CHECK siguen imponiendo las invariantes. UNIQUE de posición diferible permite permutar sin borrar/recrear IDs. Reordenamiento exige la secuencia anterior exacta para rechazar una sesión desactualizada.
- INSERT directo de asociaciones también pasa por lock/validación del organizador y propietario del archivo. Se conserva contrato invoker de creación R1.
- Path lock transaccional compartido entre registro y política DELETE de Storage: consulta nueva después de esperar evita borrar un objeto que acaba de registrarse. READ COMMITTED obligatorio también en validación de archivos/borrado para evitar snapshots congelados. SQL prueba los dos órdenes de esta carrera.
- Storage mantiene objetos inmutables, sin UPDATE/upsert. INSERT exige prefijo del usuario y UUID de evento; las rutas de publicación R1 previas al evento siguen permitidas. DELETE sólo propio y sin `files`, verificado por función privada que ve todas las referencias.
- No nuevas tablas, ni cambios de Auth, participantes, chat, timestamps o RLS social. Sin `service_role` en frontend.

## CA → pruebas → evidencia

| CA oficial | Evidencia ejecutada | Límite pendiente |
| --- | --- | --- |
| R3-03.CA-01 | SQL: décima aceptada/undécima rechazada y carrera última posición. UI: preview/subida/lectura, décima, rechazo de drop adicional, reapertura y detalle con diez imágenes. | HTTP/Auth/Storage real A/B |
| R3-03.CA-02 | SQL: baja idempotente, orden compacto, archivo compartido intacto. UI: modal/cancelación/Escape/confirmación, refresco de galería/detalle. | Sesión real y aceptación humana |
| R3-03.CA-03 | SQL: MIME/tamaño/cero/objeto ausente sin registros falsos. UI: MIME inválido e imagen corrupta, interrupción, commit perdido, RPC ausente y limpieza fallida recuperables. | Fallos de red/Storage reales |
| R3-03.CA-04 | SQL: A/B/anon/identidad ausente, REST-equivalente, Storage directo, grants/RLS, compartidos y carreras borrar/registrar. UI: ruta ajena denegada, recuperación de abandonadas/firma vencida. | JWT/REST/Storage reales; advisors después de aplicación autorizada |

Resultados: [PostgreSQL](postgres-results.json), [UI](ui-results.json), [metadatos remotos de lectura](remote-metadata-results.json). SQL local usa PostgreSQL 18.4 real con scaffolding Auth/Storage, replay completo; no acredita la infraestructura Storage HTTP ni JWT firmados. UI usa Edge headless y fixtures interceptados de Auth/REST/Storage en zona Tokyo; no datos de negocio reales.

Build/lint PASS, lint sin warnings; aviso de tamaño de chunk Mapbox preexistente. Galería: diez grupos SQL y 65 grupos UI PASS. `check:events`, `check:edit-event`, `check:my-events` PASS; edición/Mis eventos ejecutan replay SQL completo y sus pruebas de concurrencia/lectura. Regresión `check-events-ui.mjs` y `check:edit-event:ui` PASS con fixtures, incluyendo creación, errores/cargas, edición y menú integrado. Sus archivos históricos de resultados se preservan; esta ejecución SQL usó PostgreSQL 18.4. `git diff --check` PASS. No se declara una nueva QA integral R1/R2 ni R3.

## Comparación visual

Capturas reales de la UI con fixtures en 360×800, 375×812, 390×844, 768×1024 y 1280×900; sin overflow horizontal. Abiertas/contrastadas móvil 360, tablet 768 y desktop 1280 con PNG original y collage.

| Vista | Galería | Confirmación |
| --- | --- | --- |
| 360 | [captura](gallery-360.png) | [modal](confirm-360.png) |
| 375 | [captura](gallery-375.png) | [modal](confirm-375.png) |
| 390 | [captura](gallery-390.png) | [modal](confirm-390.png) |
| 768 | [captura](gallery-768.png) | [modal](confirm-768.png) |
| 1280 | [captura](gallery-1280.png) | [modal](confirm-1280.png) |

Conservados marino/azul/violeta, encabezado, zona de carga punteada, grilla de dos columnas, borde/etiqueta Portada y controles circulares para quitar. Adaptaciones: shell/navegación vigentes; título de evento; botón de selección explícito; WebP/5 MiB según backend real; controles de orden de 44 px y recuperación explícita. Imágenes geométricas etiquetadas son fixtures, no fotos del collage ni archivos remotos. La barra inferior fija aparece a la altura del viewport en capturas full-page; el padding final permite desplazar el contenido sobre ella. No se copia la barra decorativa/paginación de los teléfonos del póster.

## Reproducción y revisión pendiente

1. `npm run build` y `npm run lint`.
2. `npm run check:gallery`: requiere el mismo kit PostgreSQL/pg ignorado de las pruebas SQL anteriores en `.participation-test-tools.local/node_modules`. No instala paquetes de producción.
3. Levantar `npm run dev -- --host 127.0.0.1 --port 4187`; configurar `PLANIT_UI_ORIGIN=http://127.0.0.1:4187` y `PLANIT_PLAYWRIGHT_PATH` al Playwright del runtime; `npm run check:gallery:ui`.
4. Migración ya aplicada y verificada por catálogos en planit-v2. Pendiente ejecutar HTTP con sesiones A/B y anon: añadir/décima/undécima, reordenar/baja, intento REST directo/Storage ajeno, path compartido, fallos y expiración.
5. Dispositivo físico, safe-area, cancelación por cierre de pestaña, multi-sesión y aceptación visual humana pendientes. Cerrar otras sesiones de carga antes de limpiar subidas abandonadas; los objetos ya registrados permanecen protegidos incluso ante carrera.

## Aplicación remota autorizada — 11/10/2026

El usuario autorizó aplicar las migraciones después de la entrega de la PR. Historial/dry-run confirmaron una única pendiente: `20261012013634_manage_event_gallery.sql`. Push con `--skip-vault --yes` aplicó únicamente esa migración; sin roles, semillas, cambios Vault ni escrituras de datos de negocio. Un fallo temporal de autenticación en la primera lectura del historial se resolvió al reintentar; la aplicación terminó correctamente.

Catorce versiones local/remoto sincronizadas y dry-run posterior sin pendientes. Catálogos verificaron los ocho cuerpos de funciones idénticos a Git, search_path vacío, anon sin EXECUTE, grants autenticados mínimos, RLS intacta, sin UPDATE/DELETE genéricos, UNIQUE de posición diferible y política Storage de borrado protegido. La consulta de integridad no encontró archivos registrados sin objeto. service_role conserva acceso administrativo de los defaults del proyecto; no se utiliza en frontend.

Asesores antes/después: nueve → trece avisos; los cuatro nuevos son `authenticated_security_definer_function_executable` para add_event_image/remove_event_image/reorder_event_images/get_event_unregistered_uploads, intencionales para las operaciones controladas descritas arriba. Protección de contraseñas filtradas deshabilitada es preexistente. No hay avisos nuevos de ejecución anónima/RLS desactivada/search_path mutable.

Evidencias: [resumen](remote-migration-summary.json), [catálogos y cuerpos](remote-migration-results.json), [historial](migration-history-after.json), [asesores antes](advisors-before.json)/[después](advisors-after.json). [SELECT reproducible](verify-remote-migration.sql) y [comparación local](verify-remote-migration.mjs): ejecutar desde raíz del checkout con `node docs/design/verification/r3-block-3/verify-remote-migration.mjs`. Estos checks no son pruebas HTTP/Auth/JWT/Storage de negocio reales.

Sin merge, despliegue frontend ni avance al bloque 4. Aceptación humana pendiente.
