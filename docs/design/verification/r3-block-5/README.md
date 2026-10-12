# R3 Bloque 5 — Cancelar, archivar y duplicar

Implementado; QA y aceptación humana pendientes. [PR #23](https://github.com/EnzoG14/PlanIt/pull/23) en borrador. Rama `codex/r3-block-5`, base `origin/main` `a031c1b` (PR #22 integrada). Evidencia del 12/10/2026, Argentina. Migración creada y probada localmente; **no aplicada remotamente**. Sin merge ni despliegue; cambio previo de `vite.config.ts` preservado y excluido.

## Contratos y decisiones

- `cancel_event(uuid) → uuid`: dueño desde `auth.uid()`, READ COMMITTED, lock del evento y vigencia con reloj servidor de Argentina después de esperar. Permitida antes/durante, no en finalizados ni archivados. Cancelación ya realizada devuelve el ID sin cambiar su marca. Decisión de vigencia confirmada por el usuario.
- `archive_event(uuid) → uuid`: dueño y mismo protocolo de lock. Si no finalizó y no está cancelado, primero establece `cancelled_at`; después `archived_at` en la misma transacción. Fallo posterior revierte ambas escrituras. Finalizado se archiva sin inventar cancelación; marcas existentes se conservan y reintentar archivo es no-op.
- Ambas escrituras son SECURITY DEFINER deliberadas para operar sin UPDATE genérico. `search_path` vacío, nombres calificados, EXECUTE authenticated sin PUBLIC/anon; ningún permiso directo/RLS se amplía. No nuevas tablas, timezone ni DELETE. Participaciones, historial, media, objetos y conversaciones permanecen intactos.
- `get_event_duplicate_source(uuid)` es una lectura SECURITY INVOKER: sólo dueño, incluso si el evento ajeno es público. Proyecta título, descripción, categoría, lugar/dirección/coordenadas y cupo. No fechas, marcas de cierre, imágenes ni relaciones.
- `/events/new?duplicateFrom=:id` reutiliza creación, deja inicio/fin vacíos y exige fechas futuras/completitud en UI y BD. UUID/origen inválido, ajeno o consulta fallida bloquean publicar; categoría inactiva exige seleccionar otra. Sin filas ni uploads al abrir/editar/salir.
- **No copiar fotos:** decisión previa del Bloque 0 mantenida tras revisar ownership de files/event_images y retención de Storage. Se pueden seleccionar fotos nuevas por el flujo normal; el original y sus referencias no se modifican. Crear usa UUID nuevo e idempotencia existentes, propietario desde Auth y conversación nueva vacía del trigger, sin participantes/historial/mensajes/estadísticas heredados.
- Cuenta/origen nuevo descarta datos/respuestas anteriores; renovar token conserva cambios. Una publicación tardía de la cuenta anterior no navega ni anuncia éxito en la nueva. Volver/salir vuelve al original y conserva destinos internos/filtros autorizados; publicar abre el detalle nuevo.
- Detalle y Organizo usan el mismo diálogo. Cancelar/Escape no mutan; foco inicial/ciclo/retorno, envío único y cierre bloqueado durante operación. Respuesta perdida reconcilia marcas; si también falla la lectura, queda “Comprobar estado”, que sólo lee y conserva incertidumbre si vuelve a fallar. No se anuncia éxito sin confirmación. Después del cierre se reconsultan detalle/cupos/lista.
- Chat e inscripción reutilizan sus bloqueos y restricciones existentes. Lecturas históricas siguen según dueño/membresía/RLS; cierre detiene nuevas inscripciones y mensajes. Reintentar el mismo mensaje ya guardado conserva la idempotencia R2 y no inserta uno nuevo. Chat visible mantiene su revalidación cada 30 s, al volver o actualizar; no promete actualización instantánea entre dispositivos.

## Matriz de ocho CA

| CA | Evidencia ejecutada | Resultado y límite |
| --- | --- | --- |
| R3-02.CA-01 | SQL dueño/tercero/anon/identidad ausente; controles UI propios y ruta ajena | PASS local/fixtures; HTTP/JWT real pendiente |
| R3-02.CA-02 | Diálogo compartido detalle/Organizo; Cancelar/Escape, foco y cero escrituras | PASS UI fixtures |
| R3-02.CA-03 | Cancelación/archivo, histórico, conservación, inscripción/chat denegados y carreras | PASS PostgreSQL local y UI fixtures |
| R3-02.CA-04 | Rechazo/commit perdido, comprobación, rollback de segunda escritura y grants sin DELETE | PASS local/fixtures |
| R3-07.CA-01 | Proyección autorizada mínima; formulario precargado y salida sin filas/uploads | PASS local/fixtures |
| R3-07.CA-02 | Edición, obligatorios, fechas futuras/Argentina, categoría inactiva y errores | PASS local/fixtures |
| R3-07.CA-03 | Nuevo UUID/organizador, recuperación sin segundo INSERT, original intacto y detalle nuevo | PASS local/fixtures |
| R3-07.CA-04 | Original con participaciones/fotos/chat; duplicado vacío, conversación nueva y origen ajeno denegado | PASS PostgreSQL local y UI fixtures |

## Reproducción y resultados

- `npm run build` y `npm run lint`: PASS; aviso preexistente del chunk Mapbox, lint sin advertencias. `git diff --check`: PASS.
- `npm run check:event-actions`: siete grupos PASS en PostgreSQL 17.5 real aislado, replay de dieciséis migraciones incluyendo la nueva; Auth/Storage SQL scaffolding. Doce carreras con conexiones independientes y espera de lock comprobada: cancelación/archivo frente a inscripción, chat y cierres repetidos, más cancelación/archivo en ambos órdenes. Trigger de fallo local verifica rollback del segundo UPDATE. [Resultados SQL](postgres-results.json).
- `npm run check:event-actions:ui`: 52 grupos PASS en cinco viewports (360×800, 375×812, 390×844, 768×1024, 1280×900) en Edge headless y Asia/Tokyo. Auth/REST/Storage fixtures, sin JWT remoto; incluye respuesta perdida/comprobación, publicación idempotente, fuentes ajenas, categoría inactiva, menú móvil y chat histórico. En 360 px se amplían eventos Auth de renovación/cambio de cuenta, publicación tardía y logout. [Resultados UI](ui-results.json).
- `npm run check:r3-block-5:regressions`: veinte checks PASS de creación, edición, galería, participación, Mis eventos, asistentes, Inicio/mapa, chat y Realtime simulado. Ejecuta las verificaciones existentes usando copias temporales junto a los scripts para conservar sus imports. Redirige toda evidencia a subcarpetas de este bloque y elimina cada copia al terminar; no sobrescribe resultados históricos. [Resultados y stdout de cada check](regression-results.json). Argumentos opcionales permiten repetir checks concretos y reemplazar sólo sus resultados. Galería UI requirió indicar el runtime disponible de Playwright; la reejecución pasó.
- Requiere los runtimes locales existentes `.participation-test-tools.local/node_modules`, `.event-test-tools.local/node_modules` y Playwright/Edge. `PLANIT_PLAYWRIGHT_PATH` permite otro runtime; servir `npm run dev -- --host 127.0.0.1 --port 4187`, o usar `PLANIT_UI_ORIGIN`. La suite UI acepta un ancho como argumento para reejecutarlo preservando resultados de otros tamaños. Sin nuevas dependencias de producción.
- [Auditoría remota de sólo lectura](remote-metadata.json): quince versiones previas coincidentes, nuevas RPC ausentes, contratos actuales, timestamps sin zona, constraints/políticas y diez tablas públicas con RLS; authenticated sin UPDATE/DELETE sobre events. Ninguna operación remota de negocio, DDL, Vault o configuración; proyecto antiguo intacto.

## Comparación visual

Abiertos los originales `06-acciones-evento.png`, `07-estados-dialogos.png`, `02-editar-evento.png` y `release-3.png`. Comparadas capturas reales móviles/escritorio: filas oscuras con iconos/divisores, bloque rojo de cierre, diálogos marino/violeta, CTA peligro/degradado y formulario compartido. Adaptaciones: shell/navegación existentes, campos completos de ubicación/fin, texto que aclara duplicación sin guardar, placeholder sin foto, consecuencias de cierre y menú con posición/altura ajustadas al espacio visible para evitar la navegación fija. No se copian fotos del mockup ni aparecen acciones futuras.

| Ancho | Detalle y acciones | Confirmación cancelar | Confirmación duplicar | Formulario/validación |
| --- | --- | --- | --- | --- |
| 360 | [captura](actions-360.png) | [captura](cancel-dialog-360.png) | [captura](duplicate-dialog-360.png) | [captura](duplicate-form-360.png) |
| 375 | [captura](actions-375.png) | [captura](cancel-dialog-375.png) | [captura](duplicate-dialog-375.png) | [captura](duplicate-form-375.png) |
| 390 | [captura](actions-390.png) | [captura](cancel-dialog-390.png) | [captura](duplicate-dialog-390.png) | [captura](duplicate-form-390.png) |
| 768 | [captura](actions-768.png) | [captura](cancel-dialog-768.png) | [captura](duplicate-dialog-768.png) | [captura](duplicate-form-768.png) |
| 1280 | [captura](actions-1280.png) | [captura](cancel-dialog-1280.png) | [captura](duplicate-dialog-1280.png) | [captura](duplicate-form-1280.png) |

Datos y fechas de fixtures; algunas capturas muestran la validación de fechas previa al siguiente submit. Las capturas full-page contienen la navegación fija en la posición del viewport capturado. Sin overflow horizontal en los cinco tamaños; dispositivo físico y safe-area reales pendientes.

## Pendientes

Aplicación remota de `20261012044919_close_and_duplicate_events.sql` requiere autorización separada. Hasta aplicarla, las operaciones nuevas muestran error de disponibilidad; no se declara funcionamiento remoto. HTTP/Auth/JWT/REST/Storage/Realtime A/B reales, dispositivo físico y aceptación humana pendientes. Ningún CA se marca “Validado”.
