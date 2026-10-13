# Bloque 5 — Galería y asistentes · Amanecer v3.0

12/10/2026. Rama `design/amanecer-block-5-management`, creada después de `git fetch origin` desde `origin/main` **da90d985865d9c9f681bbda0e011fa484d39040e**. Implementación independiente; detenerse en PR draft, sin fusionar.

## Implementación

Las rutas `/events/:id/gallery` y `/events/:id/attendees` activan Amanecer. AppLayout sólo añade esa condición y clase; no cambia el shell ni el dock global. Se conservan los tokens aprobados y Bricolage Grotesque autoalojada. Un CSS de composición compartida por ambas páginas reúne encabezado, regreso, mancha decorativa `aria-hidden`, feedback y hoja de confirmación; cada página conserva sus variantes locales.

Galería: fotos guardadas primero, número de posición, portada blanca, controles de orden legibles, eliminación con icono existente y confirmación roja sólida. Una columna móvil, dos desde 480 px y tres desde 900 px. El enlace «Agregar fotos» lleva al selector existente, disponible también por teclado; las previsualizaciones y sus reintentos siguen en React. Feedback de operaciones visible al desplazarse y herramientas de recuperación al final. Se mejora el retorno del foco al cancelar o eliminar una foto. El encuadre usa imágenes posicionadas dentro de su proporción, evitando crecimiento intrínseco durante las capturas.

Asistentes: contexto del evento/cupo, filtros azules, búsqueda existente con nombre visible, filas blancas con iniciales y sólo nombre/username autorizados, estados semánticos y menú vigente. Confirmación blanca con consecuencias explícitas sobre cupo, chat e historial; controles alcanzables con poca altura. El enlace preexistente a Solicitudes permanece; su pantalla y gestión no se implementan en este bloque.

No se modificaron funciones de galería/asistentes, operaciones de Storage, RPC, esquema, migraciones, RLS, permisos o contratos. No se modificaron EventDetailPage, EventParticipation, EventManagement, EventActionDialog, solicitudes de reincorporación, tokens, patrones centrales, documentos normativos o UI_REFRESH_R1_R3_STATUS.md. El cambio local original en `D:/planit/vite.config.ts`, rama `design/ui-refresh-auth`, se preservó mediante worktree independiente bajo el home.

## Verificación ejecutada

| Comando | Resultado | Entorno / evidencia |
| --- | --- | --- |
| `npm run build` | PASS | Build final, PWA y fuente; advertencia existente de tamaño del módulo Mapbox |
| `npm run lint` | PASS | Oxlint |
| `npm run check:amanecer` | PASS | 83 valores normativos y referencias |
| `npm run check:gallery` | PASS, 10 checks | PostgreSQL efímero local, replay de migraciones, RLS/Storage SQL simulado |
| `npm run check:gallery:ui` | PASS, 84 checks | Edge headless, seis tamaños, Auth/REST/Storage interceptados |
| `npm run check:attendees` | PASS, 7 checks | PostgreSQL efímero local: privacidad, historial, cupos, carreras y chat |
| `npm run check:attendees:ui` | PASS, 72 checks | Edge headless, seis tamaños, navegación, sesión y chat interceptados |
| `npm run check:my-events:ui` | PASS | Matrices a 375 y 1280 px; filtros, regreso, participación y separación de cuentas |
| `git diff --check` | PASS | Sin errores de formato |

Los checks SQL existentes cubren remoción/historial/liberación de cupo y denegación de lectura/envío de chat. Los runners UI existentes cubren navegación de Mis eventos/detalle, regreso filtrado, join/leave/rejoin y chat abierto que invalida datos a los 30 s. Esta cobertura evita escrituras remotas de prueba.

Capturas antes/después a **320×800, 360×800, 375×812, 390×844, 768×1024 y 1280×900**. La base se recapturó desde un checkout separado fijado al SHA base, esperando fuente, animaciones e imágenes; no se intercambiaron archivos de la app en ejecución. Los primeros intentos tuvieron timeout por el proxy de Edge y capturas durante la entrada; la evidencia final los reemplaza. `PLANIT_UI_NO_PROXY` es una opción de los runners, sin cambiar Vite ni el producto. Los selectores antiguos de login/logout se actualizaron al Auth y Cuenta ya presentes en la base.

Galería: 0/1/10 imágenes, portada, orden persistente y reapertura, eliminación/cancelación/Escape, archivo inválido y corrupto, preview local, fallo/reintento de subida, resultado incierto reconciliado sin duplicar, limpieza fallida/interrumpida, límite 11 rechazado, URL firmada vencida y renovación, acceso ajeno y recuperación de carga. Las ilustraciones «Imagen de prueba» son fixtures, no fotografías reales.

Asistentes: confirmados/removidos, vacío, búsqueda sin resultados y respuesta tardía, paginación con fallo/reintento, remoción/cancelación/Escape/doble envío, operación rechazada/resultado incierto, eventos cerrados de sólo lectura, usuarios ajenos/anónimos, cambio de sesión, identidad extensa y regreso filtrado.

Las 12 mediciones de geometría normales y de texto ampliado no tienen overflow horizontal. Controles medidos ≥44×44 px; foco violeta de 3 px; títulos 32 px y 64 px con texto duplicado. Se verifica por hit-test que cada control habilitado puede desplazarse a una posición libre del dock flotante. Las capturas completas pueden mostrar el dock por encima de una fila intermedia: la prueba de alcanzabilidad cubre desplazamiento, no supone que una captura sin overflow pruebe ausencia de solapamientos.

Diálogos a 320 px de altura: cada botón se enfoca y desplaza dentro del viewport. La captura corta muestra la parte final desplazada; la captura normal conserva contexto completo. Movimiento reducido desactiva animaciones de los descendientes; transparencia reducida se emula mediante CDP y verifica `--pi-glass-blur: none`.

## Impeccable

Método: dos evaluadores aislados autorizados por el usuario, A `/root/design_critique`, B `/root/evidence_critique`. A terminó antes de incorporar el detector de B. Contexto leído directamente porque el launcher no estaba instalado en el worktree; el detector posterior utilizó el launcher absoluto de la instalación existente, sin instalar ni actualizar herramientas. Skill 4.5.2. No se regeneraron documentos; el aviso local de sidecar obsoleto se registró sin reparación.

Critique: **26/40 base → 31/40 final**. Heurísticas finales: estado 4, mundo real 3, control 3, consistencia 4, prevención 3, reconocimiento 3, eficiencia 2, minimalismo 3, recuperación 3, ayuda 3. Composición coherente con PlanIt; fotos/portada y asistentes/cupo aportan contexto específico. Máximo tres acciones por foto y tres elecciones de filtro. Se resolvieron el acceso a subida enterrado y el feedback fuera de vista con ancla y aviso persistente. Detector: **0 hallazgos en cada TSX**; no acredita accesibilidad visual completa.

Polish/harden: iconos existentes, contraste mediante pares aprobados, nombres accesibles, foco, error/previsualización conservados, identidad y archivo largos, vacío/denegación, texto ampliado, poca altura y recuperación. Audit local: **17/20** (accesibilidad 3, rendimiento 3, tokens 4, responsive 3, integridad 4); valoración de evidencia local, no certificación WCAG ni rendimiento real. No P0/P1 demostrado en la revisión final.

Observaciones pendientes: P2 vocabulario de recuperación («renovar fotos», «cargas sin registrar») puede requerir aclaración futura; P3 identidades extremas generan filas altas; las cargas y movimientos secuenciales conservan el contrato vigente. Personas revisadas: organizador nuevo, usuario de teclado y organizador móvil distraído. No se agregan acciones por esas observaciones.

Run notes: targets concretos = ambos TSX; evaluación independiente; detector CLI disponible con ruta absoluta; revisión visual de capturas locales y geometría. No se ejecutaron overlay, inyección ni detector en un tab humano. La evidencia consolidada se archiva exclusivamente en este bloque; no hay tendencia histórica comparable por pantalla. Questions skipped: alcance, dirección y punto de detención ya definidos por el usuario.

## Límites y entrega

Fixtures de Auth/REST/Storage y Realtime bloqueado; PostgreSQL real efímero con scaffolding SQL de Auth/Storage. **No es E2E contra Supabase remoto, no usa JWT real y no prueba su gateway HTTP ni Storage real.** No se aplicaron migraciones remotas. Emulación de viewport y texto duplicado en DOM no equivalen a zoom nativo, teclado iOS/Android, safe areas físicas, lector de pantalla, gestos reales, rendimiento del blur o fotografías reales. La carga de la fuente se espera; no se ensayó su descarga fallida. El fallback sin soporte de backdrop-filter se conserva en los patrones centrales y no se ejercitó en un motor antiguo.

Evidencia exclusiva: [block-5-management](../../design/verification/ui-refresh/block-5-management/README.md), con `before/`, `after/`, resultados, geometría, detector y logs técnicos. PR draft requerida: `design: migrate gallery and attendees to Amanecer`. No fusionar ni comenzar otros bloques.

## Integración con main — 13/10/2026

Se integra `origin/main` en `0b8a1b3c34cc04ed926952bc6c5cec09aa384e27` (Bloque 6 social). Único conflicto: la condición de clases en AppLayout. La resolución conserva el import de social.css, isSocial y social-wash de main junto a isEventManagement de esta PR. Chat/perfil/notificaciones y galería/asistentes mantienen sus scopes Amanecer separados.

Validación posterior: build, lint y check:amanecer PASS; galería 84/84 y asistentes 72/72 con audit en seis tamaños; runner social de main: 33 capturas PASS. Se usó el build de producción local tras un timeout del optimizador de Vite dev. Fixtures interceptados, sin escrituras remotas. El runner de galería ahora espera a que termine la operación anterior antes de seleccionar otro archivo; esta espera elimina una carrera de prueba visible con el build rápido, sin cambiar lógica de la aplicación. Se retiró espacio sobrante de dos logs propios. Las capturas históricas se conservan y la regresión adicional se registra como JSON en `block-5-management/merge-main/`.

Este commit integra main en la rama de la PR; no fusiona la PR hacia main.
