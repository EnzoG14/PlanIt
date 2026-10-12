# PlanIt — Release 3: seguimiento de implementación

**Plan:** [RELEASE_3_PLAN.md](RELEASE_3_PLAN.md). **Contrato:** [RELEASE_3_REQUIREMENTS.md](../requirements/RELEASE_3_REQUIREMENTS.md) (9 RF, 37 CA). **Diseño:** [R3 original](../design/mockups/release-3.png) y [mockups individuales R3](../design/mockups/r3/README.md).

**Corte:** 11/10/2026 (Argentina). **Bloques 0–2 implementados; QA y aceptación pendientes**. Bloques 3–6 y QA integral pendientes. [Auditoría y decisiones](RELEASE_3_BLOCK_0_DECISIONS.md).

**Estados posibles:** Pendiente · En curso · Implementado; QA pendiente · Bloqueado · Validado. «Validado» requiere aceptación humana respaldada por evidencia; no equivale a PR abierta.

| Bloque | Alcance | RF | Estado | PR/evidencia | Pendientes |
| --- | --- | --- | --- | --- | --- |
| 0 | Preparación, rutas y diseño | Transversal | Implementado; QA pendiente | [PR #18](https://github.com/EnzoG14/PlanIt/pull/18); rama `codex/r3-block-0`; [decisiones/evidencia](RELEASE_3_BLOCK_0_DECISIONS.md) | Revisión y aceptación humana del contrato |
| 1 | Mis eventos organizados | R3-04 | Implementado; QA pendiente | [PR #19](https://github.com/EnzoG14/PlanIt/pull/19); rama `codex/r3-block-1`; [CA/pruebas/capturas](../design/verification/r3-block-1/README.md) | Migración aplicada; pendientes HTTP/JWT A/B reales, acciones de bloques posteriores y aceptación humana |
| 2 | Editar evento | R3-01 | Implementado; QA pendiente | Rama `codex/r3-block-2`; [CA/pruebas/capturas](../design/verification/r3-block-2/README.md) | Migración sólo local; HTTP/JWT A/B, dispositivo físico y aceptación humana pendientes |
| 3 | Galería | R3-03 | Pendiente | — | Media básica existe; faltan operaciones administrativas de orden/baja/limpieza |
| 4 | Asistentes y remoción | R3-05/06 | Pendiente | — | SELECT propio no da nómina; faltan proyección mínima/remoción y pruebas historial/chat |
| 5 | Cancelar/archivar/duplicar | R3-02/07 | Pendiente | — | RPC de cierre ausentes; duplicar sólo formulario local sin fotos/relaciones |
| 6 | Reincorporaciones | R3-08/09 | Pendiente | — | Tabla/RPC ausentes; depende de remoción, autorización administrativa y locks/cooldown |
| 7 | QA integral | R3-01..09 | Pendiente | — | Matriz 37 CA y regresiones |

## Estado de partida

- Revisados mediante CodeGraph router/layout, `MyEventsPage`, `CreateEventPage`, `EventDetailPage`, servicios de eventos, media, participación y chat, tarjetas y componentes compartidos. Bloque 0 documenta lo existente y lo propuesto; no añade funcionalidad R3.
- La planificación funcional vigente separa R3 (operaciones) de R6 (analítica). La versión histórica de Planificación tiene otro alcance y otra numeración: no mezclar.
- Los siete PNG originales se incorporan en la entrega del Bloque 0 y fueron abiertos visualmente junto con el collage original. Son referencias ilustrativas, **no capturas de UI implementada**; excepciones por privacidad/alcance en [la matriz visual](RELEASE_3_BLOCK_0_DECISIONS.md#5-correspondencia-visual-y-excepciones).
- **Supabase remoto auditado por metadatos en Bloque 0:** 11 versiones/nombres coincidentes con Git, 10 tablas públicas con RLS, firmas/cuerpos relevantes, políticas, grants por tabla/columna, restricciones/triggers y bucket privado event_media. No hay event_rejoin_requests ni RPC de gestión R3. Consultas SELECT exclusivamente en planit-v2; no acredita pruebas de negocio HTTP/JWT con cuentas reales.
- **CI/build/lint:** no ejecutados por entrega exclusivamente documental y PNG. Verificación editorial, enlaces, hashes/alcance y `git diff --check`; sin pruebas funcionales, fixtures, SQL local ni responsive. R1/R2 no cambian en el diff; esto no acredita una nueva ejecución de regresiones.

## Procedimiento de actualización por bloque

1. Inspeccionar `main`, esquema/versiones y contratos; abrir una rama nueva.
2. Anotar decisiones, migraciones creadas **vs. aplicadas** y el entorno utilizado.
3. Registrar CA cubiertos, pruebas reproducibles, capturas responsive, problemas detectados y evidencia. Diferenciar SQL local, fixture UI, remoto HTTP/REST con JWT y revisión manual.
4. Cambiar a «Implementado; QA pendiente» cuando el código/probanzas lo justifiquen; no marcar «Validado» sin revisión del usuario.
5. PR exclusiva de cada bloque; detenerse hasta autorización de merge y cualquier migración remota.

## Actas de ejecución

### Bloque 0 — Preparación entregada; QA pendiente

- **Base/rama:** origin/main actualizado (`42d0ce1`) → `codex/r3-block-0`; [PR #18](https://github.com/EnzoG14/PlanIt/pull/18), exclusiva documental. Revisión humana pendiente; no «Validado».
- **Entrega:** [RELEASE_3_BLOCK_0_DECISIONS.md](RELEASE_3_BLOCK_0_DECISIONS.md), este seguimiento, índice de mockups y siete PNG originales sin transformar. El documento distingue rutas actuales/futuras, origen/regreso, acceso de organizador/participante/removido, componentes y contratos mínimos, brechas y dependencias de bloques 1–6.
- **Fuentes:** prompt/plan/contrato R3, guías y mockups originales, arquitectura/modelo/migraciones, contexto R2 y [Planificacion](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), reorganización vigente y especificación técnica de los nueve RF. No se utiliza R3 histórico de analítica/push.
- **Auditoría:** CodeGraph y lectura de migraciones; SELECT remoto de catálogos, definiciones, políticas, grants, restricciones/triggers, bucket e historial en iepeqmvzjguwlhnecsdq. Lectura administrativa de metadatos, sin invocar operaciones de negocio, sin leer perfiles privados ni tocar el proyecto histórico.
- **Hallazgos:** Organizo ya incluye históricos pero carece de filtros/menú; header de detalle no vuelve aún a la sección de Mis eventos. Formulario sólo crea; faltan mutaciones R3. Nómina no disponible mediante SELECT propio; chat distingue estado de participación y de evento. Galería necesita IDs/orden y limpieza segura además de URLs temporales.
- **Decisiones:** conservar Inicio/Mapa/Mis eventos/Perfil y contratos de origen; documentar editar/galería/asistentes/solicitudes/duplicar sin registrarlos. Duplicar vacía inicio/fin y no copia fotos/relaciones; sin fila hasta publicar. Pendiente sólo solicitud, identidad social mínima, archivo sin DELETE.
- **CA:** transversal sin CA propios; no se aprueba ninguno de los 37 CA por inspección. [Brechas y escenarios posteriores](RELEASE_3_BLOCK_0_DECISIONS.md#6-brechas-dependencias-y-verificación-posterior).
- **Verificación:** revisión editorial/enlaces, siete referencias visuales, `git diff --check`, alcance documental y hashes de originales/cambio previo. Sin capturas nuevas, pruebas de UI/SQL local/fixtures/HTTP-JWT/responsive/build/lint. Esos controles siguen para los bloques funcionales y QA.
- **Migraciones/configuración:** ninguna creada, modificada o aplicada; sin despliegue ni cambios remotos. R1/R2 permanecen intactos. Cambio previo de vite.config.ts preservado y excluido de la PR.
- **Pendientes:** aceptar contrato; resolver política de edición histórica en bloque 2 y conciliar referencias de la especificación a perfiles/notificaciones antes de añadirlas; implementar y verificar bloques 1–6, QA integral y permisos con usuarios reales. No continuar, fusionar o aplicar migraciones con esta entrega.

### Bloque 1 — Implementado; QA pendiente

- **Base/rama:** `origin/main` actualizado (`6275242`, Bloque 0 fusionado) → `codex/r3-block-1`; [PR #19](https://github.com/EnzoG14/PlanIt/pull/19) exclusiva del bloque. Cambio previo de vite.config.ts preservado y excluido.
- **Entrega:** filtros Todos/Próximos/Pasados/Cancelados/Archivados en Organizo antes de paginar; Próximos incluye en curso por decisión del usuario, Todos excluye archivados. Precedencia archived/cancelled/ended/open. URL/regreso conserva filtro; menú accesible sólo Ver detalle; Actualizar, vacíos por filtro, protección de respuestas tardías y reintento de carga adicional sin perder resultados. Participo conserva RPC, contenido, navegación e historial.
- **Código/contratos:** MyEventsPage, my-events, CompactEventCard/Icon, estilos de Mis eventos y regreso de EventDetailPage. Nueva RPC get_my_organized_events(text, integer) invoker y con identidad desde auth.uid(); get_my_events existente intacta, sin ampliar RLS ni permisos de tablas.
- **Migración:** `20261011232326_my_organized_events_read.sql` creada con CLI y probada en PostgreSQL local; **aplicada en planit-v2 el 11/10/2026 con autorización expresa posterior del usuario**. Historial CLI sincronizado y dry-run posterior sin pendientes; sin cambios de Vault. RPC ausente en otros entornos produce error reintentable y no resultados parciales.
- **Verificación:** build/lint PASS (aviso existente de chunk Mapbox); check:my-events PASS, seis grupos con replay completo en PostgreSQL 17.5 y scaffolding Auth/Storage. check:my-events:ui PASS, diecinueve grupos por viewport en Edge 375×812 y 1280×900, Auth/REST/Storage fixtures y zona Tokyo; git diff --check PASS. [Matriz CA → caso → evidencia, reproducción y límites](../design/verification/r3-block-1/README.md), [SQL](../design/verification/r3-block-1/postgres-results.json), [UI](../design/verification/r3-block-1/ui-results.json).
- **Seguridad/regresión:** A/B/tercero, anon/JWT ausente, parámetros inválidos, no organizer_id cliente, grants mínimos, propiedad/histórico/media y ausencia de UPDATE/DELETE en SQL local. Fixture UI cubre estados/filtros, páginas, creación, Participo, inscripción/retiro/reinscripción, errores/fotos, menú/foco, orígenes Inicio/Mapa/Participo y URLs externas rechazadas. Lecturas remotas sólo de metadatos; no equivalen a HTTP/JWT real.
- **Visual:** originales individual/collage abiertos; inspeccionadas capturas móvil/escritorio y menú/histórico. Identidad marino/azul/violeta conservada; shell vigente, categoría/fechas completas, chips con targets de 44 px y aclaración/Actualizar son adaptaciones documentadas. Fotos de fixtures/placeholder, no extraídas del mockup; sin overflow.
- **Verificación remota posterior:** doce versiones coincidentes local/remoto, sin migraciones pendientes, invoker/search_path/grants correctos y get_my_events intacta. Transacción READ ONLY/ROLLBACK con dos identidades existentes simuladas: cinco filtros/offsets, propiedad/estados, compatibilidad de Participo, parámetros inválidos, identidad ausente y anon denegados PASS. [Registro](../design/verification/r3-block-1/remote-results.json). Asesores antes/después sin avisos nuevos (siete definer existentes y protección de contraseñas filtradas deshabilitada); enlaces y límites en evidencia.
- **Pendientes:** HTTP/Auth/REST/Storage A/B reales, dispositivo físico/safe-area, aceptación humana. CA-02 verifica detalle y menú integrado; edición/cancelación/asistentes se conectan en bloques 2/4/5, sin declararlos aprobados aquí. Sin merge, despliegue frontend ni cambios en el Supabase antiguo; no «Validado».

### Bloque 2 — Implementado; QA pendiente

- **Base/rama:** `origin/main` actualizado (`66b6ee9`, Bloque 1 fusionado) → `codex/r3-block-2`. Cambio previo de vite.config.ts preservado y excluido.
- **Decisión confirmada por el usuario:** editar sólo eventos propios antes de su inicio original y sin cancelar/archivar. En curso, finalizados, cancelados y archivados denegados en UI y RPC; no se reabren históricos.
- **Entrega:** ruta autenticada `/events/:id/edit`, entradas en detalle y menú Organizo; formulario precargado compartido con creación, portada en lectura, mínimos fecha/hora Argentina, cupo operativo, loading/error/no autorizado/no encontrado/no editable. Regreso conserva orígenes/filtros; cambios locales sobreviven fallos/token refresh; cuenta/evento nuevos descartan respuestas anteriores. Doble envío bloqueado y respuesta incierta reconciliada por lectura sin reenvío automático.
- **BD:** `update_event` actualiza mismo ID y sólo contenido; identidad auth.uid(), definer justificado para lock/conteo, search_path vacío y EXECUTE authenticated. READ COMMITTED y lock de evento compartido con inscripción/retiro; conteo confirmed después del lock. Sin UPDATE/DELETE genéricos, nuevas tablas, cambios de media/historial/chat ni dependencias de producción.
- **Migración:** `20261012001058_edit_own_event.sql` creada con CLI y probada en PostgreSQL local; **no aplicada en planit-v2**. Metadatos remotos de sólo lectura contrastaron doce versiones, ausencia de update_event, columnas/checks/FK/RLS/políticas/grants y contratos de inscripción/Organizo. No son pruebas HTTP/JWT reales.
- **Verificación:** build/lint PASS (aviso existente Mapbox); SQL local con replay, A/B/anon/identidad ausente, rollback/categoría/fechas/cupo, estados y ambas carreras inscripción/reducción PASS. UI fixtures en cinco viewports, Tokyo, precarga/errores/retry/doble envío/respuesta perdida/orígenes y reconsulta de detalle/lista/Inicio/mapa. Regresión creación SQL/UI, Mis eventos SQL/UI y participación SQL (diez carreras de última plaza) PASS. [Matriz CA y límites](../design/verification/r3-block-2/README.md).
- **Visual:** originales individual/collage abiertos y capturas móviles/escritorio contrastadas; identidad conservada. Shell vigente, campos adicionales de ubicación, portada de lectura y conteo operacional son adaptaciones documentadas. Sin overflow; dispositivo físico pendiente.
- **Pendientes:** aplicar migración sólo con autorización, HTTP/JWT A/B real, revisión humana y dispositivo físico. Sin merge/despliegue/SQL remoto de escritura ni «Validado».

### Bloque 3 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 4 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 5 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 6 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 7 — Pendiente
Sin código, pruebas ni migraciones.
