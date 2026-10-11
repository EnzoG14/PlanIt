# PlanIt — Release 3: seguimiento de implementación

**Plan:** [RELEASE_3_PLAN.md](RELEASE_3_PLAN.md). **Contrato:** [RELEASE_3_REQUIREMENTS.md](../requirements/RELEASE_3_REQUIREMENTS.md) (9 RF, 37 CA). **Diseño:** [R3 original](../design/mockups/release-3.png) y [mockups individuales R3](../design/mockups/r3/README.md).

**Corte documental:** 11/10/2026 (Argentina). **Bloque 0 entregado como preparación documental**; las funcionalidades de bloques 1–6 y la QA integral no se declaran implementadas. [Auditoría y decisiones](RELEASE_3_BLOCK_0_DECISIONS.md).

**Estados posibles:** Pendiente · En curso · Implementado; QA pendiente · Bloqueado · Validado. «Validado» requiere aceptación humana respaldada por evidencia; no equivale a PR abierta.

| Bloque | Alcance | RF | Estado | PR/evidencia | Pendientes |
| --- | --- | --- | --- | --- | --- |
| 0 | Preparación, rutas y diseño | Transversal | Implementado; QA pendiente | rama `codex/r3-block-0`; [decisiones/evidencia](RELEASE_3_BLOCK_0_DECISIONS.md) | Revisión y aceptación humana del contrato |
| 1 | Mis eventos organizados | R3-04 | Pendiente | — | get_my_events existe; faltan filtros completos/históricos, menú y regreso coherente |
| 2 | Editar evento | R3-01 | Pendiente | — | Reutilizar formulario; update_event ausente, cupo concurrente y política de históricos por resolver |
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

- **Base/rama:** origin/main actualizado (`42d0ce1`) → `codex/r3-block-0`; PR exclusiva documental. Revisión humana pendiente; no «Validado».
- **Entrega:** [RELEASE_3_BLOCK_0_DECISIONS.md](RELEASE_3_BLOCK_0_DECISIONS.md), este seguimiento, índice de mockups y siete PNG originales sin transformar. El documento distingue rutas actuales/futuras, origen/regreso, acceso de organizador/participante/removido, componentes y contratos mínimos, brechas y dependencias de bloques 1–6.
- **Fuentes:** prompt/plan/contrato R3, guías y mockups originales, arquitectura/modelo/migraciones, contexto R2 y [Planificacion](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), reorganización vigente y especificación técnica de los nueve RF. No se utiliza R3 histórico de analítica/push.
- **Auditoría:** CodeGraph y lectura de migraciones; SELECT remoto de catálogos, definiciones, políticas, grants, restricciones/triggers, bucket e historial en iepeqmvzjguwlhnecsdq. Lectura administrativa de metadatos, sin invocar operaciones de negocio, sin leer perfiles privados ni tocar el proyecto histórico.
- **Hallazgos:** Organizo ya incluye históricos pero carece de filtros/menú; header de detalle no vuelve aún a la sección de Mis eventos. Formulario sólo crea; faltan mutaciones R3. Nómina no disponible mediante SELECT propio; chat distingue estado de participación y de evento. Galería necesita IDs/orden y limpieza segura además de URLs temporales.
- **Decisiones:** conservar Inicio/Mapa/Mis eventos/Perfil y contratos de origen; documentar editar/galería/asistentes/solicitudes/duplicar sin registrarlos. Duplicar vacía inicio/fin y no copia fotos/relaciones; sin fila hasta publicar. Pendiente sólo solicitud, identidad social mínima, archivo sin DELETE.
- **CA:** transversal sin CA propios; no se aprueba ninguno de los 37 CA por inspección. [Brechas y escenarios posteriores](RELEASE_3_BLOCK_0_DECISIONS.md#6-brechas-dependencias-y-verificación-posterior).
- **Verificación:** revisión editorial/enlaces, siete referencias visuales, `git diff --check`, alcance documental y hashes de originales/cambio previo. Sin capturas nuevas, pruebas de UI/SQL local/fixtures/HTTP-JWT/responsive/build/lint. Esos controles siguen para los bloques funcionales y QA.
- **Migraciones/configuración:** ninguna creada, modificada o aplicada; sin despliegue ni cambios remotos. R1/R2 permanecen intactos. Cambio previo de vite.config.ts preservado y excluido de la PR.
- **Pendientes:** aceptar contrato; resolver política de edición histórica en bloque 2 y conciliar referencias de la especificación a perfiles/notificaciones antes de añadirlas; implementar y verificar bloques 1–6, QA integral y permisos con usuarios reales. No continuar, fusionar o aplicar migraciones con esta entrega.

### Bloque 1 — Pendiente
Sin código, pruebas ni migraciones.

### Bloque 2 — Pendiente
Sin código, pruebas ni migraciones.

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
