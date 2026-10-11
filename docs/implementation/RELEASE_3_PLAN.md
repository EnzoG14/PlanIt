# PlanIt — Plan técnico de implementación Release 3 (para Codex)

**Versión:** 1.0 — 11/10/2026 (Argentina). **Estado:** propuesto, sólo documentación; ninguna funcionalidad R3 se declara implementada ni validada.
**Contrato funcional local:** [RELEASE_3_REQUIREMENTS.md](../requirements/RELEASE_3_REQUIREMENTS.md) — 9 RF y 37 CA, copiados de las pestañas «Nueva planificación», «Criterios de aceptación» y «Especificación técnica» del documento Planificación. Se usa la **reorganización de octubre de 2026**, no las releases históricas.
**Diseño:** [mockup R3 original](../design/mockups/release-3.png), [referencias visuales individuales](../design/r3-proposal/README.md), DESIGN_SYSTEM.md, SCREENS.md y DESIGN_GAPS.md.
**Seguimiento:** [RELEASE_3_STATUS.md](RELEASE_3_STATUS.md). **Referencia técnica de formato:** RELEASE_2_PLAN.md / RELEASE_2_STATUS.md / docs/implementation/prompts/RELEASE_2_BLOCK_*.md.

## A. Alcance, entregables y trazabilidad

R3 entrega herramientas operativas para el **organizador**, más el flujo excepcional de reincorporación del usuario removido. No añade estadísticas, exportación CSV, notificaciones automáticas ni funciones sociales de R4–R7. **Sprint 1: RF-R3-01..04; sprint 2: RF-R3-05..09**.

| Bloque | Alcance | RF | CA |
| --- | --- | --- | ---: |
| 0 | Preparación: rutas, diseño y contratos | transversal | — |
| 1 | Mis eventos organizados | R3-04 | 4 |
| 2 | Edición de eventos propios | R3-01 | 4 |
| 3 | Galería administrable | R3-03 | 4 |
| 4 | Lista de asistentes y remoción | R3-05/06 | 8 |
| 5 | Acciones: cancelar, archivar y duplicar | R3-02/07 | 8 |
| 6 | Solicitar y resolver reincorporación | R3-08/09 | 9 |
| 7 | QA integral R3 + regresiones R1/R2 | todos | 37 |

**Orden:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Los bloques 4/5 se pueden intercambiar luego de integrar sus dependencias; evitar trabajo simultáneo sobre el mismo componente o migración. Una PR por bloque; no hacer merge ni aplicar SQL remoto sin aprobación.

## B. Contrato de trabajo

1. Leer `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `docs/architecture.md`, `docs/database.md`, los documentos de R2 y la copia local de requisitos R3. Revisar las cuatro guías `docs/design/{AGENTS,DESIGN_SYSTEM,SCREENS,DESIGN_GAPS}.md` y abrir los mockups.
2. Inspeccionar `main` real, estado de migraciones, tablas, RPC, RLS, Storage y rutas antes de implementar; no presuponer que una función mencionada en especificación ya existe.
3. **Único Supabase escribible, previa autorización:** `planit-v2` (`iepeqmvzjguwlhnecsdq`). Proyecto antiguo `fmqzokxvpqxfzvcnzvjm`: estrictamente sólo lectura. No tocar configuración, secretos ni remoto sin permiso.
4. Cada cambio de BD en migración incremental (nunca editar migración aplicada), ejecutar primero en entorno local. RLS, grants mínimos y autorización transaccional derivada de `auth.uid()`; UI no sustituye seguridad.
5. Reutilizar React 19/TS/Vite/React Router, formulario de creación, `loadEvent`, tarjetas/lista de Mis eventos, `EventParticipation`, Storage `event_media`, `files`/`event_images`, `event_participations`/`participation_history` y componentes actuales.
6. Respetar `timestamp without time zone` y horario Argentina; no agregar `timezone` a eventos ni crear borradores persistentes. No exponer `profiles.birth_date`, `sex`, emails privados ni información no autorizada.
7. Diseño mobile-first dark-first azul/violeta; pantallas ilustrativas no son fuentes de datos ni autorización de funcionalidades. Usar controles táctiles y foco, safe-area y accesibilidad.
8. Prohibidos `DELETE` físico de evento/historial, drafts, tickets, categorías múltiples, favoritos, exportación CSV (R6), seguimiento (R5) o Web Push (R7) por apariencia del mockup.
9. Cada bloque debe ejecutar `npm run build`, `npm run lint`, checks relevantes, evidencia visual y de seguridad, regresión selectiva R1/R2 y actualización de STATUS. Diferenciar fixture de prueba HTTP/JWT real. Sólo el usuario marca «Validado».
10. Si surge discrepancia entre RF, CA y esquema, documentar decisión propuesta y **detenerse antes de cambiar requisitos o modelo remoto**.

## C. Estado técnico inicial (corte documental)

En `main` al preparar este plan existen las páginas `MyEventsPage.tsx` (pestañas Organizo/Participo), `CreateEventPage.tsx`, `EventDetailPage.tsx` y `EventChatPage.tsx`. Se consultan eventos, fotos firmadas, cupos y participaciones; R2 incluye Inicio, perfil, notificaciones y chat. **No se verificó aquí el esquema remoto vigente ni permisos HTTP reales.** Revalidar al comenzar cada bloque; el estado histórico documentado en R2 puede estar desactualizado.

## D. Bloques de implementación

### BLOQUE 0 — Preparación R3
- Auditar archivos/rutas, contratos de `events`, media, participaciones/historial y superficies R2 de chat; analizar las siete referencias visuales más el mockup original.
- Definir navegación desde `/my-events?section=organizing` y `/events/:id`: edición, galería, asistentes, solicitudes y acción de duplicar. Mantener accesibles histórico y regreso coherente.
- Definir componentes compartidos, formularios, confirmaciones y estados sin implementar botones inertes. No abrir rutas vacías de funcionalidad futura.
- Registrar decisiones de diseño: `Organizo/Participo`, sin «Borradores», sin emails privados, `Pendiente` sólo en solicitudes, «Archivar» en lugar de «Eliminar».
- **Salida:** mapa de rutas/contratos y estado actualizado; sin SQL ni cambios remotos. Build/lint si cambia frontend.

### BLOQUE 1 — Mis eventos organizados
**RF:** R3-04 (4 CA).
- Extender la sección Organizo real sin reescribir Participo. Incluir propios activos e históricos con filtros operativos Todos/Próximos/Pasados/Cancelados/Archivados y badges coherentes con `event_state`.
- Menú contextual sólo para acciones autorizadas y disponibles según estado; no mostrar acciones aún no implementadas como operativas.
- La consulta de propios debe ser de `auth.uid()` (RPC con permiso verificado); no revelar eventos ajenos. Los archivados sólo en contexto histórico de dueño.
- Loading/empty/error/reintentar, paginación, navegación accesible, refresco después de operaciones.
- **DoD:** RF-R3-04.CA-01..04, A/B y estados históricos, regression Mis eventos R1 y mobile/desktop.

### BLOQUE 2 — Editar evento
**RF:** R3-01 (4 CA).
- Reusar estructura, tipos y validaciones de `CreateEventPage`; precargar título, descripción, `starts_at`, `ends_at`, lugar/dirección, coordenadas, categoría, capacidad y campos existentes editables.
- Validar fechas/horas coherentes y cupo `>= confirmed` **en BD**, incluso ante concurrencia. Sólo dueño y según estado real; no crear un evento nuevo por accidente.
- Proponer `update_event` transaccional u operación equivalente después de inspeccionar esquema; no habilitar UPDATE genérico sin autorización.
- Tras éxito, actualizar detalle, listados y mapa. Conservar cambios del formulario al fallar; comunicar errores, deshabilitar doble envío.
- **DoD:** RF-R3-01.CA-01..04, acceso directo de tercero denegado, concurrencia y responsive.

### BLOQUE 3 — Administrar galería
**RF:** R3-03 (4 CA).
- Reutilizar `event_media`, `files` y `event_images` y convenciones de R1. Selector móvil + drag-and-drop desktop, previews, carga con estado/error, máximo 10, formatos/tamaños según contrato real.
- Reordenar imágenes y portada = primera por `sort_order`. Brindar alternativa accesible al drag-and-drop (controles mover).
- Eliminar **asociación** a evento, no destruir un archivo compartido por otros eventos; limpieza segura y operaciones idempotentes ante fallos de Storage/BD.
- Sólo dueño administra; detalle refleja orden sin URLs firmadas obsoletas.
- **DoD:** RF-R3-03.CA-01..04; primera/décima/undécima foto, fallo parcial, permisos A/B, móvil.

### BLOQUE 4 — Asistentes y remoción
**RF:** R3-05/06 (8 CA).
- Vista administrativa de asistentes confirmados del evento propio, con búsqueda por nombre y estados confirmados/removidos diferenciados; ninguna columna de email/sexo/DOB privado.
- Consulta mínima a `event_participations` + proyección social autorizada. Otros usuarios no acceden a la ruta ni a la RPC/REST subyacente. La lista pública/social de R5 es un caso distinto.
- Acción Remover con diálogo de confirmación. Implementación transaccional fija `status=removed`, registra `participation_history`, actualiza cupo y revoca acceso a chat vigente.
- No hacer DELETE ni permitir que un removido se reinscriba como cancelled sin flujo formal.
- **DoD:** RF-R3-05.CA-01..04 + R3-06.CA-01..04, historial, denegación cruzada, regresión chat R2.

### BLOQUE 5 — Acciones y duplicación
**RF:** R3-02/07 (8 CA).
- Presentar acciones del dueño en detalle y/o menú propio de lista; acciones deshabilitadas/omitidas según vigencia. Confirmaciones claras con opción cancelar y errores sin éxito ficticio.
- Cancelar marca estado, bloquea nuevas inscripciones/escritura de chat, conserva mensajes, media, participaciones e historial.
- Archivar retira de listados activos y **cancela previamente en la misma transacción si el evento sigue vigente**; nunca DELETE físico. Permanece accesible desde históricos del organizador.
- Duplicar abre el **formulario local** de creación con valores precargados; exigir nueva fecha futura (inicio y fin), validaciones, nuevo ID/dueño, sin participantes, chat histórico ni estadísticas. Para fotos, definir explícitamente si se reutilizan referencias sólo cuando hay autorización y limpieza segura; no asumirlo.
- **DoD:** RF-R3-02.CA-01..04 + R3-07.CA-01..04; fallo/rollback, duplicado no persistido antes de guardar, datos originales íntegros.

### BLOQUE 6 — Reincorporaciones
**RF:** R3-08/09 (9 CA).
- Para `removed` con acceso vigente, opción `Solicitar reincorporación` en detalle: primera inmediata, sólo una pendiente, sin solicitud para otros estados, luego de rechazo cooldown de 7 días desde `resolved_at`.
- Para organizador, bandeja pendientes accesible desde asistentes; aprobar/rechazar con confirmación, estado actualizado e historial. **No convertir `pending` en estado de participación:** es estado de `event_rejoin_requests`.
- Aprobar sólo evento vigente y cupo disponible: lock de evento/transacción y verificación de concurrencia. Sin cupo dejar solicitud pending, sin reserva ni aprobación automática posterior.
- Rechazar actualiza resolución y habilitación futura; cerrar/cancelar/archivar impide nuevas aprobaciones. En el estado al usuario mostrar próximo momento elegible si procede.
- Revisar/crear `event_rejoin_requests` y `request_rejoin`/`resolve_rejoin` sólo después de inspeccionar la BD; no ejecutar remotamente.
- **DoD:** RF-R3-08.CA-01..04 + R3-09.CA-01..05, pruebas A/B, duplicación/cooldown, última plaza y evento cerrado.

### BLOQUE 7 — QA y cierre
- Crear `docs/qa/RELEASE_3_ACCEPTANCE.md` y `docs/qa/RELEASE_3_TEST_REPORT.md` cuando existan resultados; matriz **37 CA** con estado y evidencias verificables.
- Ejecutar `npm ci`, build/lint, checks, pruebas de SQL local y HTTP/Auth/REST/Storage reales **sólo con autorización/credenciales**. Revisar RLS, grants, RPC, concurrency, histórico e inconsistencias Storage.
- Dos usuarios y no miembro, ruta directa, error de red, estados activos/pasados/cancelados/archivados, galería/cupo, remoción/chat y reincorporación; QA responsive 360×800, 375×812, 390×844, 768×1024 y desktop.
- Smoke R1/R2: crear/inscribir/retirar, mapa, lista, detalle, chat y notificaciones. Documentar incidencias, excepciones, GO/NO-GO y aceptación humana.
- No declarar 37/37 aprobados ni «Validado» si no se ejecutaron pruebas reales.

## E. Decisiones y riesgos transversales

- **Transacciones:** cupo al editar y al aprobar reingreso; carrera remoción/chat; cancelación + archivado; consistencia de galería/Storage.
- **Privacidad:** el mockup incluye emails y perfiles; sólo proyección social permitida. Mostrar nombres/username/avatar donde RLS lo autorice.
- **UI ilustrativa:** algunas imágenes incluyen un corazón/favorito, chips sociales múltiples, porcentaje de ocupación y prompts con campo de motivo; son elementos de representación, **no requisitos** de R3. No agregar funcionalidades ni nuevas columnas sin aprobación.
- **Duplicación:** ningún registro en BD hasta confirmar. No copiar relación a chat del original; la creación normal genera recursos nuevos de acuerdo con R2.
- **Analítica:** contador operacional de confirmados para cupo y validación no constituye un dashboard R6; no crear gráficos, exportadores o estadísticas de asistencia.
- **Fechas:** pruebas con huso Argentina, intervalo inicio/fin cruzando medianoche y sesiones con navegador en zona distinta.

## F. Protocolo de entrega

Cada bloque: rama desde `main` actualizado, PR separada, STATUS actualizado (archivos, pruebas locales/fixture/remotas distinguidas, capturas, migración propuesta y aplicada separadas, riesgos/pendientes) y detenerse. No fusionar, desplegar, ejecutar SQL remoto ni marcar Validado sin aprobación.
