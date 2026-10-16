# R7 — Bloque 0 · Acta de auditoría y decisiones

**Fecha:** PENDIENTE (decisiones de producto confirmadas en conversación 15/10/2026)  **HEAD validado:** PENDIENTE  **Rama:** PENDIENTE  **Autor/revisor:** PENDIENTE.

## A. Fuentes y baseline
- [ ] 7 RF/29 CA comparados literalmente con pestañas oficiales.
- [ ] SHA y main/PRs/branches/migration list verificados sin alterar remoto.
- [ ] R6 asumida estable para secuenciar; riesgos arrastrados anotados sin incluir corrección de R6.
- [ ] Reporte de catálogo real: tablas, tipos, vistas, RPC, RLS, grants, trigger, Storage, eventos Realtime, PWA/SW, Edge Functions.

## B. Inventario y compatibilidad
| Área | Código/SQL actual | Cambio mínimo R7 | Prueba previa | Riesgo |
|---|---|---|---|---|
| Chat y DM | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| Archivos/Storage | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| Historias/TTL | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| Notifications/Realtime | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| SW/PWA | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |

## C. Registro de resolución técnica en B0
| ID | Estado | Resolución exacta | Persona/fecha | Impacto en bloques |
|---|---|---|---|---|
| D01/D02/D03/D05/D06/D07/D08/D09/D15/P01 | CONFIRMADAS por usuario | Ver sección de decisiones confirmadas, sin reabrirlas | 15/10/2026, conversación | B1–B11 según DAG |
| D06 | CONFIRMADA (15/10/2026) | `.ics` y enlace Google Calendar sin OAuth, ambas acciones | Usuario, 15/10/2026 | B7 |
| D04/D10–D14/D16/D17 | PENDIENTE TÉCNICO B0 | Ver registro de decisiones | PENDIENTE | B0 y owners relevantes |

## D. Contratos antes de programar
- [ ] SQL propuesto de `message_attachments`, `stories`, `push_subscriptions` e infraestructura privada.
- [ ] Propiedad exclusiva de archivo de historia, path inmutable, idempotencia y retención.
- [ ] Reescritura segura de Storage RLS sin ampliación por OR de policies permisivas.
- [ ] Seguridad DM texto-only y mantenimiento de firma de RPC existentes, o migración explícita.
- [ ] Integración SW elegida, compatibilidad de precache y autenticación Push.
- [ ] Matriz de roles (anon, auth ajeno, link-only, pending, confirmed, removed, organizador) y tiempos.
- [ ] Definición de series de casos para 29 CA y pruebas adversariales.

## E. Gate humano
**Dictamen:** NO-GO / GO para B1. **Causas/pendientes:** PENDIENTE. **Autorización explícita:** PENDIENTE. No inferir GO por crear esta acta.

## Respuestas de producto ya confirmadas (NO volver a preguntar)

- [x] D01: sólo JPEG/PNG/WebP ≤ 5 MiB, una imagen; sin videos.
- [x] D02: mensaje imagen sin texto permitido; DM sin imagen.
- [x] D03: historia visible 24h desde publicación aunque evento termine, condicionado al acceso.
- [x] D05: visor tipo Instagram, secuencial y avance automático.
- [x] D07: sólo organizador comparte invitación de evento oculto.
- [x] D08: Push con vista previa real, incluido texto de DM, y privacidad configurable.
- [x] D09: Edge Functions + cron + cola interna.
- [x] D15: sin máximo de historias por usuario/evento inicialmente.
- [x] P01: al menos dos personas en paralelo.
- [x] D06: `.ics` + enlace de Google Calendar precargado sin OAuth confirmados por el responsable (15/10/2026).

## Aprobación de contratos de paralelización (necesaria antes de escribir features)

- [ ] DTO EventCalendar/Share/Stories, firmas RPC, estados y MIME/acceso/TTL congelados y versionados.
- [ ] Tabla de ownership y rutas exclusivas tomada de `RELEASE_7_PARALLEL_WORK.md`, incluido integrador único de `EventDetailPage.tsx`, `src/App.tsx` y QA final.
- [ ] Lista de migraciones nuevas con responsables, relaciones FK, orden de integración y entornos locales aislados.
- [ ] Ramas independientes/worktrees y gates de PR/cross-review; autorización remota de Supabase sigue separada.
- [ ] Confirmado: B1/B7/B8/B9 pueden ejecutarse a la vez; B2/B4 tras B1; B5/B6 tras B4; B10 tras B9.