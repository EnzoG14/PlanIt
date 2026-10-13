# PlanIt — Release 4, Bloque 0: auditoría y contrato confirmado

**Actualización de planificación R4 v1.2 (13/10/2026):** esta edición documental parte del `main` `a378259a6010`, con Amanecer v3.0 integrado (PR #27–#34). La línea de base anterior del 12/10 y los pasos del bloque 0 son históricos/propuestos: **no** acreditan ejecución ni QA R4. Leer `RELEASE_4_VISUAL_INTEGRATION.md`, `DESIGN.md`, `docs/design/UI_WORKFLOW.md`. R3 confirmada validada por el responsable; informe QA versionado conserva NO-GO por falta de E2E/aceptación humana documentada; reportar esa brecha de evidencia sin reabrir A07.


**Estado:** PLANTILLA, PENDIENTE DE EJECUCIÓN. Este archivo no acredita haber inspeccionado el esquema remoto ni el mockup visualmente. Debe completarse durante Bloque 0 y distinguir *verificado*, *propuesto*, *bloqueado* y *no inspeccionado*.

## 1. Corte y fuentes verificadas

- SHA `main` auditado: PENDIENTE.
- Ramas/PR de R3 ya integradas: PENDIENTE.
- Migraciones locales vs remotas en `planit-v2`: PENDIENTE.
- R3 QA/aceptación: **R3 declarada integrada y validada por el responsable 12/10/2026**; comprobar sólo que dependencias técnicas se encuentran en `main`/migraciones.
- Fuentes Google Docs vigentes: requisitos, criterios, especificación y diseño DB R4.
- Mockup `release-4.png`: PENDIENTE DE APERTURA VISUAL.

## 2. Inventario de rutas y datos

| Ruta/experiencia | Componente actual | Contrato nuevo R4 | Acceso exigido | Estado auditoría |
| --- | --- | --- | --- | --- |
| Inicio/buscar | `HomePage` | texto/categorías/fecha/radio y «Para vos» | Sólo eventos públicos vigentes | PENDIENTE |
| Mapa | `MapPage` | mismo estado de filtros; centro/radio | Sólo públicos vigentes | PENDIENTE |
| Intereses | `ProfilePage` o ruta nueva | CRUD de propios | Sólo propietario | PENDIENTE |
| Crear/editar | `CreateEventPage` / `EditEventPage` | selector `public/unlisted` | Organizador | PENDIENTE |
| Link/Canje | Ruta nueva | Token → grant persistente | Autenticado; token válido | PENDIENTE |
| Detalle | `EventDetailPage` | oculto si dueño o grant activo | RLS y RPC | PENDIENTE |
| Accesos | Ruta nueva | grants activos/revocados | Sólo organizador | PENDIENTE |

## 3. Inventario de RLS/RPC/Storage (completar)

| Recurso | Método o política | Security invoker/definer | Lectura pública, active, revoked | Modificación necesaria | Evidencia |
| --- | --- | --- | --- | --- | --- |
| `events` | `events_select_participating` | RLS | Históricos pueden leer | Exigir grant para unlisted y negación revoked | PENDIENTE |
| `events` | `get_event_participation_summary` | Definer | Permite own histórico en R3 | Auditar | PENDIENTE |
| `event_images/files` | SELECT/Storage | RLS | Dependen evento + uploader | Auditar | PENDIENTE |
| `storage.objects` | SELECT signed media | RLS | URL firmada puede persistir TTL | Auditar | PENDIENTE |
| `event_participations` | `register_for_event` | Definer | Sólo públicos en código R3 | Exigir grant active unlisted | PENDIENTE |
| Otras RPC | Completar | — | — | — | PENDIENTE |

## 4. Diseño / mockup

- Pantallas vistas realmente con nombre y resolución: PENDIENTE.
- Filtros gratuidad/favoritos/ratings descartados por falta de RF: PROHIBIDOS.
- Paneles R4-07/09 no cubiertos por collage: definir visual compatible tras inspección.
- Discrepancias aprobadas contra requisitos: PENDIENTE.

## 5. Decisiones firmadas

Registrar A01–A07 como **aprobadas por responsable el 12/10/2026**: centro mapa; fecha por inicio; Buscar en Inicio/Mapa; grants a confirmed al ocultar; público visible a todos; hash de links; R3 integrada/validada. Registrar opciones técnicas pendientes D02/D05/D06/D07/D10-formato/D12/D13/D14 como propuestas con impacto y pruebas; no elevar de nuevo A01–A07.

## 6. Verificación de bloque y próximos pasos

- SQL remoto alterado: NO.
- Tests HTTP JWT A/B ejecutados: NO.
- Build/lint: NO EJECUTADOS en esta plantilla.
- Estado: PENDIENTE; requiere ejecución de Bloque 0, PR documental y aceptación humana.
