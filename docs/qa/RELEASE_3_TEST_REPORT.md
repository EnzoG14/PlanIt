# PlanIt — Informe QA Release 3

12/10/2026, Argentina. Rama `codex/r3-block-7`, base `origin/main` `d9c0a69` (bloques 0–6 integrados). Alcance exclusivo: BLOQUE 7, nueve RF y [37 criterios literales](RELEASE_3_ACCEPTANCE.md). **NO-GO para declarar Release 3 validada o desplegable**: faltan E2E reales A/B y aceptación humana. La entrega de QA permite revisar código y evidencia local; no acepta esos pendientes en nombre del usuario.

## Resultado y entornos

| Verificación | Resultado | Evidencia / alcance |
| --- | --- | --- |
| `npm ci` | PASS; 372 paquetes, cero vulnerabilidades reportadas | Lockfile sin cambios; primer intento bloqueado por DNS del sandbox, repetido con acceso autorizado |
| `npm run build` | PASS | TypeScript, Vite y PWA: manifest/SW; aviso preexistente de chunk Mapbox mayor a 500 kB |
| `npm run lint` | PASS, sin avisos finales | Import sin uso en el nuevo ejecutor corregido antes de la última pasada |
| 28 suites locales y fixtures consolidadas | 28/28 PASS local/fixture | [results.json](../design/verification/r3-block-7/results.json), salida y tiempos por suite; no JWT firmados |
| Replay e invariantes SQL | PASS | PostgreSQL 18.4 aislado en loopback; Auth/Storage scaffolding. PGlite para descubrimiento; scripts de validación para Auth/creación/configuración |
| Historia y definiciones local/remota | PASS | [Comparación](../design/verification/r3-block-7/metadata-comparison.json): 17 versiones coincidentes, 31 funciones públicas idénticas tras normalizar sólo CRLF/LF; excluye el scaffold local de `rls_auto_enable` |
| RLS/grants/bucket remotos | Revisados, sin cambios | [Resumen agregado](../design/verification/r3-block-7/remote-summary.json), [consulta reproducible](r3-metadata.sql): RLS en 11 tablas públicas, RPC sin EXECUTE anon, search_path fijo y sin mutaciones genéricas de tablas; catálogos completos/permisos de columna permanecen en archivos locales ignorados |
| Asesores de seguridad | Avisos preexistentes | [Resumen](../design/verification/r3-block-7/remote-summary.json): 21 definers autenticados previstos y protección de contraseñas filtradas deshabilitada; sin avisos adicionales respecto del bloque 6; salida completa sólo local |
| Responsive y diálogos | PASS fixture; comparación visual con límites | [Índice visual](../design/verification/r3-block-7/README.md), cinco tamaños para las pantallas R3; Edge y zona Asia/Tokyo |
| Contraste de confirmaciones | Corregido | [Medición](../design/verification/r3-block-7/contrast-results.json): blanco/rojo 3,74:1 → 4,94:1; otro extremo 5,58:1. No es una auditoría completa de todos los píxeles |
| HTTP/Auth/REST/Storage/Realtime reales A/B | PENDIENTE | No hay `.auth-test.local` con dos cuentas en los checkouts revisados. No se crean cuentas, eventos ni mutaciones remotas sin permiso expreso |
| Móvil físico, teclado virtual, notch/safe-area | PENDIENTE | Emulación de viewport y revisión CSS no sustituyen hardware; aceptación humana pendiente |

## Seguridad, transacciones e históricos

Las suites SQL usan conexiones separadas para organizador A, participante B, tercero/no miembro, anon e identidad ausente. Verifican autorización de RPC y RLS/grants subyacentes, sin basarse en la ruta frontend: edición, galería, nómina, remoción, cierre, fuente de duplicación y solicitudes ajenas denegadas. No hay UPDATE/DELETE genéricos de eventos/participaciones/solicitudes; el perfil y notificaciones conservan permisos limitados por columna. La nómina expone nombre/username, sin correo, fecha de nacimiento ni sexo.

Se ejecutaron carreras inscripción vs edición del cupo, inscripción/aprobación por última plaza, aprobaciones concurrentes, remoción/envío de chat y cierre/inscripción/aprobación; locks y rollback protegen cupo y cambios de varios pasos. Archivar vigente cancela en la misma operación, conserva eventos/media/participaciones/mensajes/historial y desaparece de activos. Remover conserva la fila, registra movimiento y revoca lectura/escritura de chat; aprobar restaura reglas del confirmado. La galería cubre primera/décima/undécima foto, formato/tamaño, carga interrumpida, respuesta perdida, asociación/orden y retención de archivos compartidos. La coherencia Storage probada localmente es SQL/scaffolding; subida HTTP real sigue pendiente.

Reincorporación: primera inmediata, una pending, rechazo inicia siete días desde resolución, fronteras/cierre, sin reserva ni autoaprobación y rollback. Se mantiene la decisión humana del bloque 6: **rechazar tras cierre está permitido; pedir/aprobar permanece bloqueado**. No se añaden motivos ni notificaciones automáticas. Duplicar usa formulario React, fechas vacías, nuevo ID al confirmar y ningún registro antes de publicar; conserva el original y no copia participantes/media/chat histórico.

## Regresión R1/R2

| Flujo | Evidencia nueva | Límite |
| --- | --- | --- |
| Auth/configuración/retorno seguro | `auth`, `foundation` | Validación local; alta/login real y expiración de JWT pendientes |
| Crear, detalle y Mis eventos | `events`, `my-events-ui`, `edit-event-ui`, `event-actions-ui` | UI fixtures; publicación HTTP real pendiente |
| Mapa/descubrimiento | `discovery`, `mapbox`, `discovery-ui`; reconsulta desde edición | Motor Mapbox/estilo y Supabase interceptados; proveedor/token real no acreditado |
| Inscripción/retiro/reinscripción y cupo | `participations`, `participations-ui`, `my-events-ui` | PostgreSQL local y fixtures; no transacción remota con JWT |
| Inicio/detalle/social mínimo | `home-events`, `home-ui` | Fixtures sin perfiles privados; lectura REST real pendiente |
| Chat/envío/histórico/remoción/cierre | `chat`, `chat-ui`, `attendees`, `event-actions-ui`, `rejoin` | SQL local + navegador; revocación Realtime real pendiente |
| Perfil/notificaciones/Realtime | `profile`, `notifications`, `realtime`, `realtime-ui` | SQL y eventos de transporte simulados; dispositivo/Realtime remoto pendientes |

No se identificaron fallos funcionales nuevos en las suites finalizadas. Incidencia preexistente corregida: contraste del extremo rojo en confirmaciones de cancelar/remover. Los fallos iniciales de ejecución fueron de entorno (DNS, conexión loopback entre sandboxes, manifest antes de build) y del nuevo comparador (hash con CRLF), no fallos de la aplicación; se resolvieron y repitieron las comprobaciones afectadas. Las capturas full-page pueden situar la navegación fija en medio de la imagen larga; se verifican también viewport/scroll, sin interpretar ese artefacto como solapamiento permanente.

Una consulta adicional de configuración del bucket tuvo timeout al inicializar el acceso de la CLI; su repetición terminó correctamente. El snapshot local confirmó el contrato versionado del bucket y el comparador verificó esos valores. [Verificación documental](../design/verification/r3-block-7/documentation-results.json): 37 textos literales, enlaces locales comprobados, 28 suites PASS y los ocho PNG originales idénticos byte a byte a Git. La revisión automática bloqueó inicialmente la exportación de catálogos remotos; se retiraron de la PR y se conservaron sólo agregados sin políticas/grants/configuración ni definiciones remotas.

## Reproducción y salida

Seguir el [README de evidencia](../design/verification/r3-block-7/README.md) para herramientas locales ignoradas, variables fixture, servidor y comandos. El ejecutor mantiene evidencia de bloques anteriores intacta y redirige cada suite al bloque 7. No instala nuevas dependencias de producción.

No se creó, editó ni aplicó ninguna migración; no se cambió configuración del proyecto ni datos de negocio. La CLI informa inicialización de su rol de login para acceder a los catálogos; las consultas entregadas se ejecutan dentro de READ ONLY/ROLLBACK. No se ejecutó `db push`, merge, despliegue ni acceso al Supabase antiguo.

Pendientes para GO: autorización y dos cuentas de prueba para E2E real A/B/anon (incluidas mutaciones y Storage/Realtime), revisión móvil físico/teclado/safe-area y aceptación humana de los 37 CA con sus evidencias. La PR se entrega en borrador y el seguimiento queda **Implementado; QA pendiente**, sin marcar Validado. Detenerse al terminar este bloque.
