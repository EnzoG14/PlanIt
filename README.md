# PlanIt — Release 4: paquete técnico para implementar con Codex

**Versión:** 1.1 (decisiones del responsable incorporadas 12/10/2026). **Preparado:** 12/10/2026 (Argentina). **Fuente:** repo `EnzoG14/PlanIt` (`main`, inspeccionado durante preparación) y documento Google Docs «Planificacion», pestañas «Nueva planificación», «Criterios de aceptación», «Especificación técnica» y «Diseño de base de datos». **No se modificó GitHub ni Supabase.**

## Archivos y orden recomendado

1. `docs/requirements/RELEASE_4_REQUIREMENTS.md` — texto funcional oficial: **9 RF, 39 CA**.
2. `docs/implementation/RELEASE_4_PLAN.md` — plan de arquitectura, datos, seguridad, frontend, migraciones, bloques 0–9 y aceptación.
3. `docs/implementation/RELEASE_4_DECISIONS_PROPOSED.md` — registro de **7 acuerdos aprobados (A01–A07)** más propuestas técnicas no cerradas. No confundir estas últimas con las decisiones confirmadas.
4. `docs/implementation/RELEASE_4_STATUS.md` — tabla viva inicial, **todos los bloques pendientes**.
5. `docs/qa/RELEASE_4_ACCEPTANCE.md` — 39 CA literales, 39 estados «Pendiente».
6. `docs/qa/RELEASE_4_TEST_PLAN.md` — casos de test funcionales, A/B/anon, amenazas, migraciones, regresiones.
7. `docs/implementation/RELEASE_4_BLOCK_0_DECISIONS.md` — plantilla de auditoría de Block 0: los hechos verificables se completan al ejecutar.
8. `docs/qa/RELEASE_4_TEST_REPORT.md` — plantilla de reporte, inicialmente 39/39 NOT RUN y NO-GO.
9. `docs/implementation/prompts/RELEASE_4_BLOCK_0.md` a `RELEASE_4_BLOCK_9.md` — un prompt autocontenido por PR, ejecutados en orden y con revisión humana.

## Cómo incorporarlo al repositorio

Copiar `docs/` del paquete a raíz del repositorio **sin reemplazar documentos anteriores**; se crean archivos nuevos R4. Hacer commit de documentación en rama propia, comparar rutas y enlazar desde README si se desea. **Este paquete no incluye migraciones de producción**: cada bloque debe inspeccionar el esquema real y diseñar su SQL incremental con aprobación.

## Decisiones del responsable incorporadas

1. **Ubicación:** fallback al centro del mapa si GPS no está disponible, claramente identificado; no atribuir una ubicación ficticia al usuario.
2. **Fecha:** comparar únicamente `starts_at` por día/rango completo de Argentina; no por solapamiento.
3. **Navegación:** búsqueda y filtros integrados en `/home` y `/map` con estado compartido; sin `/search`.
4. **Público→oculto:** grants `active` transaccionales para confirmados actuales; jamás revivir `revoked`. Conflicto confirmado+revocado se resuelve explícitamente antes del cambio.
5. **Oculto→público:** visible para todos según reglas de evento público; conservar grants revocados y estado de participación para futuros ocultamientos.
6. **Enlaces:** sólo hash en BD, token mostrado al generarse y no recuperable; si se pierde, se rota.
7. **R3:** el responsable declara R3 integrada y validada. Verificar contratos técnicos en `main` sin reabrir su aprobación.

**Propuestas técnicas no aprobadas específicamente:** radios por defecto, parámetros URL, detalle UI intereses, ranking 100/30/20, formato `#token`, revocar enlace al hacer público, exclusiones de recomendaciones y TTL de URLs firmadas. Están identificadas en el registro de decisiones y Bloque 0.

Los prompts de bloques 0–9 incluyen estas reglas. El documento de **39 CA oficiales no se alteró**; se agregaron escenarios de prueba complementarios.

## Estado y limitaciones de auditoría

Se leyó el árbol y archivos relevantes de `main` (React, SQL, R2/R3 docs, políticas y RPC) y las pestañas de Planificación. La imagen PNG de R4 se confirmó presente, pero **no se abrió/inspeccionó visualmente**; los prompts exigen abrirla. No se realizó consulta a Supabase remoto, pruebas JWT A/B ni ejecución de tests de R4. El responsable confirmó R3 integrada/validada con posterioridad al corte documental del STATUS consultado; comprobar exclusivamente que las dependencias técnicas están realmente en la rama base al iniciar R4. Los 39 CA de R4 y sus pruebas siguen pendientes de ejecución.

## Actualización 1.2 — Amanecer (13/10/2026)

Paquete revisado sobre `main` `a378259a60106ddd07b111080a24677ad509bc49` (30 commits desde la base anterior, QA R3 y refresh Amanecer PR #27–#34). Mantiene los **9 RF / 39 CA** y los acuerdos A01–A07. `docs/implementation/RELEASE_4_VISUAL_INTEGRATION.md` fija integración de rutas, componentes, UI y QA. Todos los prompts 0–9 incluyen contrato Amanecer, código reutilizable y regresiones; **no** iniciar R4 desde la documentación v1.1. Diseño: `DESIGN.md` precede al lab y mockups históricos. El paquete es documental: no implanta SQL ni cambios de aplicación.
