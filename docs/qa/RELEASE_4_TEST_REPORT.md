# PlanIt — Release 4: informe de QA y recomendación de liberación

**Estado:** PLANTILLA — QA NO EJECUTADO. **Resultado actual:** NO-GO (no existe evidencia de implementación y aceptación de R4). **Fecha de plantilla:** 12/10/2026.

## Resumen de cobertura

| RF | CA esperados | PASS | FAIL | BLOCKED | NOT RUN | Resultado |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| R4-01 | 4 | 4 | 0 | 0 | 0 | PASS local (fixture; sin JWT real) |
| R4-02 | 4 | 3 | 0 | 0 | 1 | PARCIAL (CA-02 sin fecha/radio) |
| R4-03 | 4 | 0 | 0 | 0 | 4 | NOT RUN |
| R4-04 | 4 | 0 | 0 | 0 | 4 | NOT RUN |
| R4-05 | 4 | 0 | 0 | 0 | 4 | NOT RUN |
| R4-06 | 4 | 0 | 0 | 0 | 4 | NOT RUN |
| R4-07 | 5 | 0 | 0 | 0 | 5 | NOT RUN |
| R4-08 | 5 | 0 | 0 | 0 | 5 | NOT RUN |
| R4-09 | 5 | 0 | 0 | 0 | 5 | NOT RUN |
| **Total** | **39** | **7** | **0** | **0** | **32** | **NO-GO** |

## Ejecuciones

- Acuerdos A01–A07: **aprobados como decisiones de producto, NO verificados por ejecución R4**. R3 integrada/validada según confirmación del responsable; esta plantilla no certifica tests de regresión de R4.

- Bloque 1 (14/10/2026): `npm run build` OK; `oxlint` sin errores; `check:search` (SQL local), `check:search:ui`, `check:home:ui`, `check:home-events`, `check:discovery`, `check:amanecer` PASS con fixtures. `check:discovery:ui` falla en el paso `.planit-marker` también en `main` sin cambios (entorno de mapa). Migración `20261013160000_search_public_events.sql` creada y probada localmente; **NO aplicada al remoto**. Sin HTTP/JWT real. Ver [evidencia](../design/verification/r4-block-1/README.md).
- `npm ci`: NO EJECUTADO.
- Migraciones locales: NO EJECUTADO.
- SQL JWT A/B/cross-account: NO EJECUTADO.
- HTTP/JWT real: NO EJECUTADO.
- Storage/Signed URLs: NO EJECUTADO.
- UI navegador y comparativa PNG: NO EJECUTADO.
- Pruebas de concurrencia/cupo/historial: NO EJECUTADO.
- Regresiones R1–R3: NO EJECUTADO.
- Advisor Supabase/EXPLAIN: NO EJECUTADO.

## Riesgos de lanzamiento por resolver

1. Lectura de eventos ocultos por participación histórica y RPC privilegiada.
2. Canje/revocación de token con bloqueos y grants consistentes.
3. Política público→oculto con asistentes existentes y oculto→público con revocados.
4. Cache y vida residual de imágenes firmadas.
5. R3 aceptada e integrada según responsable; comprobar compatibilidad técnica y regresiones al ejecutar R4. Aceptación R4 todavía pendiente.

## Defectos y evidencias

Completar ID, severidad, pasos de reproducción, esperado/obtenido, evidencia y responsable tras ejecución. Enlazar cada caso a `RELEASE_4_ACCEPTANCE.md` y `RELEASE_4_TEST_PLAN.md`. No inventar URLs de PR/capturas.

## Dictamen GO/NO-GO

**NO-GO provisional por ausencia de implementación y pruebas**, no por un fallo de ejecución observado. Cambiar a GO sólo tras resolver todos los defectos de seguridad relevantes, ejecutar y evidenciar 39 CA, regresiones y aprobación humana explícita.

## QA visual Amanecer v1.2 (13/10/2026; aún NO ejecutado)

La autoridad visual es `DESIGN.md` y `docs/design/DESIGN_SYSTEM.md`; `docs/implementation/RELEASE_4_VISUAL_INTEGRATION.md` especifica rutas, componentes y estados. **No** aprobar ni rechazar la apariencia por comparación pixel-perfect con `docs/design/mockups/release-4.png` o fixtures de `design-lab`: son referencias funcionales/compositivas históricas.

- Incluir nueva UI R4 sobre `HomePage`, `MapPage`, `EventCard`, `ProfilePage`, `CreateEventPage`, `EditEventPage`, `EventManagement`, `EventAttendeesPage` y rutas nuevas; mantener `.amanecer-shell` y `--pi-*`, cuatro tabs y cabeceras vigentes.
- Matriz de viewports 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900, baja altura y texto ampliado. Contraste violeta/tinta, foco 3px, target 44px, translucidez reducida, movimiento reducido, fuente self-hosted, sin gradientes, fondo claro.
- Mapa: Mapbox Standard day, marcadores y preview único, seleccionar/deseleccionar con foco, fallos Mapbox/GPS y radio desde centro visible. Inicio: cursor/paginación, agrupación, resultados filtrados, estados error/vacío. Links: URL no expone token en logs, hash sólo en BD, no acceso sin grant.
- Ejecutar build/lint, `check:amanecer`, `check:home-events`, `check:home:ui`, `check:discovery`, `check:discovery:ui`, `check:mapbox`, `check:events:ui`, `check:edit-event:ui`, `check:event-actions:ui`, `check:attendees:ui`, `check:profile:ui`, `check:participations:ui`, `check:rejoin:ui`, `check:auth` según `package.json`, y suites nuevas. No sobrescribir reportes del refresh; capturas por bloque R4.
- Diferenciar fixtures y PostgreSQL efímero de Auth/JWT A/B reales, dispositivos y aceptación humana. No marcar PASS/E2E/GO si no se ejecutó.
