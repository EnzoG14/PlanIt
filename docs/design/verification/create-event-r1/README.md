# Crear evento R1 — implementación y evidencia local

Fecha: 10/10/2026 (Argentina). Rama: `codex/block-0-foundation`.

Fuente: pestañas «Especificación técnica — R1 a R7», «Plan técnico Release 1 — Codex (Markdown)», «Nueva planificación — RF R1 a R7» y «Criterios de aceptación» del [documento Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit). Contrato de datos: pestaña «Diseño de base de datos — PlanIt v1.0».

## Alcance

- `/events/new` protegido por Auth; estado React hasta Publicar, sin drafts ni autosave.
- Título 1–120, descripción 1–3000, inicio futuro y fin posterior, horarios Argentina, categoría activa única, capacidad entera positiva, dirección y coordenadas en rango; nombre del lugar opcional.
- Ubicación manual y botón para tomar la posición actual: alternativa expresamente admitida por el BLOQUE 2. No agrega geocodificación comercial ni selector de mapa. La integración del mapa de descubrimiento sigue en el BLOQUE 3.
- Fotos opcionales incluidas por elección explícita del usuario: hasta 10 JPG/PNG/WebP, máximo 5 MiB cada una. Previews locales y quitar selecciones antes de publicar. Sin administración de galería publicada (R3).
- Detalle mínimo con consulta real del registro, horarios, dirección, descripción, cupo y fotos privadas mediante URLs firmadas de 5 minutos. Categoría y organizador se conservan en el registro, sin consultar datos privados de perfiles ajenos.
- Enlaces al mapa y Mis eventos existentes. Esas vistas mantienen el alcance de sus bloques siguientes; no se presentan como descubrimiento/participación ya implementados.

## Persistencia y permisos

Migraciones `20261010042701_create_events_and_event_media.sql` y `20261010023448_restrict_rls_auto_enable_execute.sql`: **aplicadas en planit-v2 el 10/10/2026 (Argentina)** después de la autorización explícita del usuario. El comentario inicial de preparación en el archivo SQL aplicado describe su estado original; no se modifica una migración ya aplicada.

La nueva migración crea `events`, `files`, `event_images` y bucket privado `event_media`, con RLS y grants mínimos. FK restrictivas, timestamps sin zona y seed versionado acotado (Música, Arte, Deportes, Social, Al aire libre). Agrega la FK de avatar pendiente; en este bloque `files` sólo admite media de eventos, por lo que avatars/adjuntos requerirán ampliar sus restricciones en su futura migración.

`create_event` es SECURITY INVOKER: defaults `auth.uid()` y grants por columna impiden elegir otro organizador, cambiar identidad, estado o fechas de auditoría. Las lecturas autorizadas son eventos públicos no cancelados/archivados y propios. No hay UPDATE/DELETE de eventos para usuarios; la gestión se habilitará en R3 mediante operaciones revisadas. Anonymous no tiene acceso. Los metadatos de imágenes se verifican contra Storage, no se aceptan tamaño/MIME enviados por el formulario.

Evento, metadatos y relaciones se insertan en una sola transacción. Los diez slots únicos 0–9 imponen el límite de imágenes incluso con escrituras simultáneas. Un UUID por intento y bloqueo transaccional permiten reintentos idempotentes.

Storage no participa de la transacción SQL: se sube después de Publicar y antes de la RPC; ante fallo conocido se solicita limpieza de objetos sin referencia. Ante respuesta incierta o limpieza fallida se conserva el intento en memoria y se bloquea la edición hasta comprobar/reintentar, sin anunciar éxito. No se borra un objeto ya referenciado y no se permiten reemplazos/upserts. Cerrar pestaña, interrumpir el proceso o perder definitivamente la conexión durante la carga puede dejar objetos sin referencia: la futura limpieza operativa deberá hacerse por Storage API, nunca borrando directamente `storage.objects`. No hay eventos parciales por esos objetos sueltos.

## Verificación ejecutada

| Criterio | Evidencia | Estado |
| --- | --- | --- |
| RF-R1-03.CA-01 | Formulario, publicación/lectura en navegador con API simulada; RPC en PostgreSQL embebido con datos y 10 fotos | Verificado localmente; pendiente Supabase real |
| RF-R1-03.CA-02 | Obligatorios, inicio pasado/igual a ahora, fin inválido, cupo, coordenadas y categoría inactiva; rechazo sin fila | Verificado localmente |
| RF-R1-03.CA-03 | Organizador derivado de sesión, recuperación del detalle, doble envío, reintento tras respuesta perdida; permisos entre dos roles | Verificado localmente; pendiente Auth/REST real |
| RF-R1-03.CA-04 | Consulta geográfica pública con otro usuario autenticado en PostgreSQL; ocultos/media ajena restringidos | Consulta verificada localmente; mapa real pendiente BLOQUE 3 |
| Fotos | Límite 10/11, tipos/tamaño, preview, subida fallida, limpieza fallida/reintento, segunda foto inválida revierte evento y primera relación | Verificado localmente; pendiente Storage real |

Comandos ejecutados: `npm run build`, `npm run lint`, `npm run check:auth`, `npm run check:foundation`, `npm run check:events -- --postgres`, `node scripts/check-events-ui.mjs`.

`check:events --postgres` usa PGlite (PostgreSQL real embebido), con esquemas mínimos de Auth/Storage y dos identidades simuladas. No es una instancia completa de Supabase, ni verifica HTTP Storage, sus metadatos reales, PostgREST, JWT o concurrencia entre conexiones. La dependencia está aislada en `.event-test-tools.local` ignorada, sin modificar dependencias ni lockfile de la aplicación. Para reproducir: `npm install --prefix .event-test-tools.local --no-save --package-lock=false @electric-sql/pglite@0.3.14`.

`check-events-ui.mjs` usa Playwright del runtime del escritorio y Edge headless. `PLANIT_PLAYWRIGHT_PATH`, `PLANIT_BROWSER_CHANNEL` y `PLANIT_UI_ORIGIN` permiten configurar otra instalación. Ejecutar con servidor local en `http://127.0.0.1:4181` o configurar el origen. **Todas** las solicitudes a Supabase se interceptan; credenciales y fotografías son fixtures explícitas. No hubo escrituras ni SQL remoto. Las capturas muestran estos fixtures, no publicaciones reales.

## Comparación visual

Referencia: tercer teléfono de `docs/design/mockups/release-1.png`. Se preservan fondo marino, icono calendario circular, título/subtítulo centrados, campos verticales oscuros con iconos lineales, select y CTA azul/violeta de ancho completo. Labels visibles, fecha/hora de fin, ubicación manual y fotos amplían la altura por requisitos y accesibilidad. No se copia el progreso ficticio del póster ni el marco de teléfono. Se conserva la navegación de la app actual.

Capturas `form-360x800.png`, `form-375x812.png`, `form-390x844.png`, `form-768x1024.png`, `form-1280x800.png`: sin desbordes horizontales y controles de al menos 44 px (mediciones en `measurements.json`). `validation-390x844.png`, `filled-390x844.png`, `publish-viewport-390x844.png`, `backend-error-390x844.png` y `success-390x844.png` cubren validación, publicación y respuesta. Comparación visual realizada en móvil y escritorio. Las capturas de página completa dibujan la navegación fija a la altura del viewport inicial; la captura de viewport muestra el CTA tras desplazar.

## Aplicación y verificación remota — 10/10/2026

- Autorización explícita del usuario: «Necesito que hagas la migracion la bd remota».
- Proyecto único: `planit-v2`, ref `iepeqmvzjguwlhnecsdq`. No se operó sobre el proyecto histórico.
- Historial y dry-run previos confirmaron exactamente dos pendientes, sin tablas/bucket en conflicto ni referencias de avatar existentes.
- Ejecutado: `npx supabase db push --project-ref iepeqmvzjguwlhnecsdq --skip-vault --yes`. Ambas migraciones aplicadas con sus versiones locales originales; no se cambiaron secretos Vault ni se incluyeron seeds/roles externos.
- Historial posterior: las cuatro versiones locales coinciden con remoto. Dry-run posterior: `upToDate: true`, lista de migraciones vacía.
- Verificación de catálogo: events/files/event_images con RLS; cinco categorías activas; bucket privado con límite 5 MiB y MIME JPG/PNG/WebP; starts_at timestamp without time zone; RPC SECURITY INVOKER, EXECUTE autenticado y negado a anon; organizer_id no escribible por cliente; UPDATE/DELETE de events negados; rls_auto_enable no ejecutable por anon.
- [Prueba SQL remota](migration-smoke.sql) ejecutada sobre dos identidades existentes mediante `SET LOCAL ROLE` y claims transaccionales. Pasó creación/recuperación, organizador, reintento idempotente, fecha pasada/cupo cero, rechazo de organizer_id ajeno, imagen inexistente con rollback del evento, consulta geográfica pública desde la segunda identidad, UPDATE ajeno negado y RPC anónima negada. Todos los cambios de prueba se revirtieron mediante ROLLBACK; no se dejaron eventos ni fotos de prueba.
- Advisors de seguridad: los dos avisos previos de rls_auto_enable desaparecieron. Sólo queda el aviso previo [protección contra contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); no se cambió la configuración de Auth como parte de la migración.
- Advisors de rendimiento: seis avisos INFO de [índices aún no utilizados](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), esperables en tablas recién creadas y sin tráfico; se conservan los índices previstos para FK/consultas.

La matriz anterior registra las pruebas originales locales; esta sección agrega verificación remota de la RPC y los permisos. No equivale a una prueba end-to-end con JWT/HTTP de Auth, PostgREST y Storage. Pendiente: teléfono físico/teclado/safe-area, flujo completo en navegador con dos cuentas, carga de fotos por Storage HTTP y concurrencia entre conexiones. **No se declara RF-R1-03 ni R1 completamente terminado en producción.**
