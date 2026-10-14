# R5 · Bloque 4 — Editar perfil y privacidad

14/10/2026, Argentina. Base `286d38ecf7e461ebd9218a6f71e8ff10a41e0bae` (`main`, merge de PR #53/B3), rama `codex/r5-block-4`, worktree propio en el directorio del usuario. **Implementado; QA pendiente.** Sólo RF-R5-03.CA-01..04 y verificación adicional D04. [PR #54 en borrador](https://github.com/EnzoG14/PlanIt/pull/54) hacia main; sin merge, migración nueva ni deploy.

Código y evidencias verificados en `4e112157c15b3fead38f82954152cd77f919d023`; el commit posterior sólo vincula PR y seguimiento.

## Entrega y contrato

`/me` incorpora Editar perfil y privacidad → `/me/edit`, dentro de RequireAuth y del shell Amanecer existente. Formulario en memoria: nombre visible, username, bio, visibilidad y datos opcionales first_name/last_name/birth_date/sex. Nombre visible 2–60, username lowercase `[a-z0-9_]{3,24}`, bio ≤500; unicidad y autorización en PostgreSQL. Correo y credenciales no se editan. Regreso con foco a la acción del perfil; confirmación ante navegación con edición/carga pendiente.

Una llamada a `update_my_social_profile` conserva su firma de ocho parámetros, sin ID de propietario: guarda datos/privacidad y D04 atómicamente. Se relee visibilidad antes de enviar para exigir confirmación también si otra sesión hizo privado el perfil. El diálogo explica que todas las solicitudes pendientes sin bloqueo quedarán aceptadas. Cancelar no escribe. Volver a privado conserva accepted. Después se releen perfil, contadores y solicitudes mediante las RPC existentes, sin añadir UI de B6/B7 ni guardar sus payloads.

La foto tiene guardado independiente, según decisión del responsable. JPEG/PNG/WebP, 1 byte–5 MiB, decodificación local antes de subir, ruta inmutable `<auth.uid()>/<uuid>.<ext>`, bucket privado `avatars`, `upsert:false`, `cacheControl:'0'`. `set_my_avatar(path|null)` valida y vincula/retira la referencia transaccionalmente. La lectura propia R2 abandona event_media: metadata propia filtrada, firma60 y fallback; la proyección social sigue usando su gateway sin modificaciones.

Errores SQL conocidos no anuncian éxito. Ante respuesta de guardado perdida o deadline10s se conserva la intención, se relee y sólo se confirma si coinciden todos los campos. Si sigue incierto, el botón comprueba sin repetir la mutación. Las operaciones se vinculan a identidad/token; un cambio remonta el editor y las respuestas anteriores no escriben estado. Los errores mostrados son mensajes seguros, sin SQL, tokens ni payloads privados.

Avatar conserva la ruta durante reintentos. Comprobar consulta perfil y registro files; se detecta foto cambiada en otra sesión antes de cargar. Un fallo de vinculación conserva la referencia anterior. La limpieza espera el upload pendiente de esta pestaña, comprueba files y usa RLS de staging; nunca borra archivos registrados, incluso reemplazados o retirados. Tras recargar, Revisar cargas interrumpidas consulta las últimas100 propias, excluye registros files y la selección actual. La UI pide cerrar otras sesiones antes de limpiar; no pretende una recolección global entre dispositivos.

## Amenazas y autorización

| Superficie / columnas | Dueño | Confirmado / tercero / grant-only | Bloqueado | Anónimo |
| --- | --- | --- | --- | --- |
| SELECT profiles: ocho campos editables + avatar_file_id | Sólo su fila por RLS; allowlist cliente | Ninguna fila ajena | Ninguna fila ajena | Denegado |
| update_my_social_profile / set_my_avatar | Sólo auth.uid(); sin parámetro de actor | Sólo su propia cuenta; no pueden elegir ID ajeno | Bloqueo no impide editar la cuenta propia | EXECUTE denegado |
| Perfil social | Contrato propio | Public o accepted: identidad/bio; privado no accepted: nombre/username/avatar | unavailable bilateral, sin proyección | Denegado |
| Eventos sociales | Sólo públicos vigentes según RPC B1 | Unlisted/grant no amplía la audiencia social | Denegado; C02 conserva permisos independientes de evento | Denegado |
| Storage/files avatar | Metadata, firma y carga propias; DELETE sólo staging | Sin lectura/firma directa de foto ajena; gateway autorizado TTL60 | Sin nuevas firmas sociales | Denegado |

No se publica profiles/follows/blocks en Realtime ni se añade caché privada. Historial DM y chat grupal conservan contratos B1/R4. Datos demográficos sólo se cargan en el contexto propio; no entran en las proyecciones sociales. Firmas y bytes ya recibidos conservan las limitaciones C03 aprobadas; no se promete revocación de bytes descargados.

## Evidencia y resultados

| Verificación | Resultado y límite |
| --- | --- |
| `npm ci` | PASS,372 paquetes;0 vulnerabilidades. Herramientas PostgreSQL existentes reutilizadas fuera de dependencias del producto |
| `npm run build`, `npm run lint` | PASS; avisos previos de chunk Mapbox y lint ajenos. [Logs](checks.json) |
| `npm run check:r5:edit-profile` | PASS, replay28 en PostgreSQL17.5,72 combinaciones de audiencia,13 carreras con locks observados y casos B4 de campos, unicidad, otra sesión, avatar/reemplazo/limpieza. Auth/Storage scaffold SQL y SET ROLE, no JWT. [SQL](sql/sql-results.json), [harness](sql/harness.json) |
| Catálogo remoto READ ONLY | PASS,28 versiones,16 tablas públicas RLS y79 cuerpos/ACL/config coincidentes con replay local. Stub rls_auto_enable excluido. [Catálogo](remote/catalog.json), [comparación](sql/remote-comparison.json) |
| `npm run check:r5:edit-profile:ui` | PASS,56 grupos en320/360/375/390/768/1280, timeout10s, respuesta perdida, otra sesión/token, privacidad, foto, recuperación, foco, texto200% y poca altura. Build real con Auth/REST/Storage interceptados; no prueba RLS ni transporte remoto. [Resultados](ui/results.json) |
| Perfil propio R2 UI | PASS,8 grupos mobile/desktop; firma avatars60, fallback, errores, reintento, cambio de cuenta y logout. Fixtures actualizadas al contrato B4 sin cambiar los CA. [Resultados](own-profile-ui/ui-results.json) |
| Perfil social B3 UI | PASS,54 grupos en seis tamaños, permisos/revocación/bloqueo/retorno; [evidencia](social-regression-ui/ui-results.json). Fixtures, sin JWT |
| `check:r5:regressions` | PASS,13 suites existentes R1–R4 con todas las migraciones. Cinco fallaron primero por ruta local de herramientas ausente y pasaron tras configurar node_modules ignorado; [primer corte](regressions/initial-results.json), [final](regressions/regressions.json) |
| Gateway avatar unitario | PASS,5 grupos; handler real con fetch simulado, sin Deno ni transporte. [Resultados](avatar-unit.json) |
| `npm run check:r5:edit-profile:http` | PASS,2 GET HTTPS anónimos de profiles/files rechazados. Sin JWT ni escritura. [Estados](remote/http-anon.json) |
| POST remoto a RPC de escritura | BLOCKED: revisión automática rechazó la prueba anónima porque una ACL mal configurada podría permitir cambios remotos sin autorización. No se ejecutó ningún POST de escritura. SQL local cubre los rechazos |
| JWT autenticado / upload, metadata efectiva, CDN y expiración Storage reales / Realtime real | NOT RUN; requieren fixtures y autorización independiente para escrituras remotas |
| Teclado móvil, iOS/Android físicos, lector de pantalla, aceptación humana | NOT RUN; emulación/inspección no sustituyen esas pruebas |

CA-01: PASS parcial SQL/UI, edición/foto y otra sesión owner; transporte real pendiente. CA-02: PASS parcial SQL/UI, privacidad persistida, D04 y accepted conservado. CA-03: PASS parcial SQL/UI/proyección social B1+B3; vistas reales JWT pendientes. CA-04: PASS parcial SQL/RLS/UI y GET anónimo; pruebas remotas de escritura BLOCKED. Los cuatro CA continúan **NOT RUN integral** hasta QA real y aceptación humana; no se autovalidan por estos resultados.

## Diseño, integridad y revisión

Se reutiliza Amanecer: Bricolage autoalojada, tinta marina, una mancha superior aria-hidden, controles y tokens existentes, dock de cuatro destinos. FormField/GradientButton se conservan; nuevos estilos scoped a la edición. Capturas reales con fixtures sintéticos: [antes móvil](ui/baseline/before-own-profile-390.png), [antes desktop](ui/baseline/before-own-profile-1280.png), [edición móvil](ui/editor-390.png), [desktop](ui/editor-1280.png), [confirmación](ui/privacy-confirm-390.png), [preview](ui/avatar-preview-390.png), [texto ampliado](ui/expanded-text-390.png), [timeout](ui/timeout-390.png). El baseline se ejecutó desde el build B3 conservado en el checkout inicial; no es un collage ni un mockup de imagen.

Foco visible3px, labels/fieldset/legend, radios nativos, diálogos nativos con Escape/cancel y restauración de foco, mensajes status/alert, controles táctiles heredados≥44px, sin overflow de página en seis tamaños y texto ampliado. Reduced motion heredado. Primera pasada detectó restauración de foco anterior al cierre del diálogo: corregida y verificada. La regresión B3 se repitió sobre build estable porque recompilar en paralelo retiró temporalmente sw.js; ese fallo de infraestructura no se atribuye a producto.

[Integridad y lista exacta de archivos](editorial.json): migraciones históricas, tokens, DESIGN y mockups sin cambios. No se agregan dependencias del producto. `.env.local` se copió byte a byte de la configuración local del checkout inicial, cuya procedencia de main está documentada en B3; es un archivo ignorado que Git no asocia a ramas. Se comprobó igualdad y exclusión, sin imprimir claves ni incluirlo en commits. Cada worktree conserva su propio índice CodeGraph.

Migraciones nuevas: **creadas0 / probadas nuevas0 / aplicadas remotas0 / verificadas nuevas0**. Replay de las28 existentes y catálogo remoto de sólo lectura son verificaciones distintas; no implican aplicación SQL. Gateway existente sin deploy. Proyecto histórico no accedido. Google Docs leído mediante Drive, sin editar; [CA literales/especificación](source.json). D04 sigue siendo decisión posterior pendiente de incorporación documental con autorización separada.

Revisar confirmación D04, allowlists/identidad, estado incierto, foto concurrente, retención y limpieza antes de aceptar. Concurrencia extrema entre pestañas no tiene compare-and-swap de avatar en el contrato SQL actual; la UI detecta cambios en su preflight, y las operaciones autorizadas del mismo dueño siguen el orden de locks B1. La limpieza de recuperación está acotada a100 objetos y no es un proceso automático de borrado. No avanzar B5 ni fusionar esta PR sin revisión humana.
