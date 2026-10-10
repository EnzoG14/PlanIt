# PlanIt — Release 2: seguimiento de implementación

**Plan de referencia:** [RELEASE_2_PLAN.md](RELEASE_2_PLAN.md).  
**Requisitos y aceptación:** RF-R2-01 a RF-R2-07 (28 CA), pestañas «Nueva planificación», «Criterios de aceptación» y «Especificación técnica» del [documento Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit).  
**Diseño:** [Mockup R2](../design/mockups/release-2.png), DESIGN_SYSTEM.md, SCREENS.md, DESIGN_GAPS.md.  
**Proyecto remoto permitido:** planit-v2, ref iepeqmvzjguwlhnecsdq; proyecto antiguo: sólo lectura.  
**Corte inicial:** 10/10/2026 (Argentina). Documento de preparación, sin implementación R2 iniciada.

> Estados: **Pendiente** (no iniciado), **En curso** (trabajo abierto), **Implementado; QA pendiente** (código y evidencia; no aprobado), **Validado** (revisión/aceptación humana + evidencia), **Bloqueado** (dependencia explícita). Sólo el usuario autoriza marcar Validado. No confundir PR abierta con bloque integrado.

## Tablero de R2

| Bloque | Alcance | RF | Estado | PR / evidencia | Pendiente |
| --- | --- | --- | --- | --- | --- |
| 0 | Preparar R2, navegación y contrato de diseño | Transversal | Implementado; QA pendiente | [PR #7 fusionada](https://github.com/EnzoG14/PlanIt/pull/7); [PR #8 de verificación](https://github.com/EnzoG14/PlanIt/pull/8) | Revisión humana del contrato visual; revisión visual responsive pendiente |
| 1 | Inicio, categorías y detalle ampliado | R2-01/02/03 | Implementado; QA pendiente | rama `codex/r2-block-1-home-detail`; PR pendiente | 12 CA cubiertos por checks locales; aceptación humana y Auth/REST/Storage remoto pendientes |
| 2 | Chat de evento: leer y enviar texto | R2-04/05 | Pendiente | — | 8 CA, migración, RLS, envío transaccional, UI |
| 3 | Mi perfil (lectura propia ampliada) | R2-06 | Pendiente | — | 4 CA, perfil propio y avatar opcional |
| 4 | Bandeja de notificaciones | R2-07 | Pendiente | — | 4 CA, migración, RLS, lectura/marcar leído |
| 5 | QA integral, seguridad y regresión R1 | R2-01 a 07 | Pendiente | — | Matriz 28 CA, E2E según autorización y revisión humana |

## Estado de partida

- R1 tiene implementación de bloques 0–5 en main y pruebas manuales exitosas informadas por el usuario. No traducir esto a 28/28 pruebas automatizadas.
- En main existen Auth, eventos/fotos, categorías, mapa OSM/Leaflet, detalle mínimo, inscripciones/retiro y Mis eventos.
- Ruta /me existente con nombre visible, username y email. No existe todavía una pantalla Inicio real ni chat de evento ni bandeja de notificaciones R2.
- Supabase nuevo: 7 migraciones registradas hasta 20261010154930 y 7 tablas públicas conocidas; no existen conversations, messages ni notifications al iniciar R2.
- Las advertencias heredadas y límites de QA se describen en docs/qa/RELEASE_1_TEST_REPORT.md. Comprobar estado actual antes de cada migración.
- La PR de documentación QA R1 puede requerir revisión/merge independiente; **no** fusionarla automáticamente durante R2.

## Protocolo de actualización

1. Antes del trabajo, Codex lee RELEASE_2_PLAN.md, el estado y la carpeta de diseño; contrasta Git/Supabase actual con el corte inicial.
2. Trabaja únicamente el bloque pedido, en rama/PR independiente desde main actualizado.
3. Cambia su fila a En curso al comenzar (si versiona ese estado) y a Implementado; QA pendiente sólo después de contar con código y pruebas documentadas.
4. Registra **PR, commit/ramas, migraciones locales y remotas diferenciadas, resultados reales, capturas, CA cubiertos, errores, decisiones y pasos manuales pendientes**.
5. No reescribe RF ni modifica el plan como si fuera una decisión aprobada. Los cambios de alcance se proponen y validan.
6. No informa pruebas fixture como si fueran API real ni supone éxito remoto por un SQL local; tampoco marca Validado sin aprobación del usuario.
7. Ningún agente fusiona PR, ejecuta migraciones remotas o cambia la configuración Supabase sin autorización expresa.

## Actas de bloques

### Bloque 0 — Preparación

- Estado: Implementado; QA pendiente (no validado por revisión humana).
- Rama base original: `main` en `c2b17f30fc845906c47ef3ae0fedc96b94bbcf25`; rama de implementación: `codex/r2-block-0-navigation-docs`. Seguimiento de verificación basado en el merge `c5afa827bab4990f05320a6b7f5660ce43a6e337` de `origin/main`.
- PRs: [#7 — docs: prepare Release 2 block 0 navigation contract](https://github.com/EnzoG14/PlanIt/pull/7), fusionada; [#8 — docs: record Release 2 block 0 verification results](https://github.com/EnzoG14/PlanIt/pull/8), abierta para registrar los resultados posteriores.
- Cambios: contrato de rutas, disponibilidad por bloque, navegación, estados y límites visuales en `docs/implementation/RELEASE_2_BLOCK_0.md`. Sin cambios de código, migraciones ni recursos remotos.
- Rutas: inspección de `src/App.tsx` y `src/components/AppLayout.tsx` confirmó que `/` redirige a `/map`, las rutas R1 permanecen disponibles y la navegación no enlaza a `/home`, chat ni notificaciones antes de estar implementados. `/events/:id` y `/me` ya existen.
- Diseño: revisión visual de `docs/design/mockups/release-2.png` y contraste con DESIGN_SYSTEM, SCREENS y DESIGN_GAPS; no se modificó la UI, por lo que no se generó captura responsive de la aplicación.
- Verificación posterior al merge: `npm ci` instaló 376 paquetes y reportó 0 vulnerabilidades; `npm run build`, `npm run lint` y `git diff --check` pasaron. Se confirmó que la navegación no enlaza a destinos R2 aún no implementados.
- Límites: no hubo verificación visual responsive en navegador porque el cambio es documental y no modifica la UI. Sin CA funcionales propios de este bloque; no se ejecutó QA de bloques posteriores.
- Decisiones: las rutas R2 se documentan pero permanecen sin registrar ni enlazar hasta sus bloques funcionales. Sin migraciones locales o remotas.

### Bloque 1 — Inicio y detalle

- Estado: Implementado; QA pendiente (sin validación/aceptación humana).
- Rama base: `origin/main` actualizado a `611d169b6a0a167e6cd9837293ae2e085e762eef`; rama `codex/r2-block-1-home-detail`.
- PR: pendiente de creación.
- Migración local propuesta: `20261010165000_home_and_event_organizer_read.sql`, no aplicada en Supabase. No se ejecutó SQL remoto ni se modificó configuración/Auth/Storage.
- Cambios: `/home` autenticado con consulta keyset ordenada por `starts_at,id`, eventos públicos futuros y vigentes, grupos por categoría, portadas firmadas en lote y estados loading/error/empty; detalle amplía organizador mediante proyección autorizada de `display_name,username`, muestra galería disponible y conserva la participación R1. Navegación principal: Inicio, Mapa, Mis eventos y Perfil; Crear permanece accesible desde Mis eventos. `/` y rutas R1 no cambian.
- CA: RF-R2-01.CA-01..04, RF-R2-02.CA-01..04, RF-R2-03.CA-01..04.
- Evidencia automatizada: R2-01.CA-01..04 (fixture de detalle, datos persistidos/locales, fotos presentes/ausentes y acceso/proyección SQL); R2-02.CA-01..04 (eventos próximos, navegación al detalle, exclusión local de pasados/cancelados/archivados y estado vacío); R2-03.CA-01..04 (categoría registrada, agrupación, acceso al detalle y grupos con resultados solamente). Ejecuciones y límites en `docs/design/verification/home-event-detail/`.
- Verificación: `npm ci` (376 paquetes, 0 vulnerabilidades); `npm run build`, `npm run lint`, `npm run check:events`, `npm run check:discovery`, `npm run check:discovery:ui`, `npm run check:home-events` y `npm run check:home:ui` pasaron. PostgreSQL fue local con scaffold Auth/Storage; UI usa respuestas fixture. `git diff --check` pasó.
- Diseño: capturas Playwright en 375×812 y 1280×900, revisadas contra los teléfonos 1/2 del mockup. La UI fixture cubre portada, galería, ausencia de fotos, categorías, error/vacío y paginación.
- Pendiente: revisión humana; REST/Auth/Storage real con dos sesiones; ejecutar migración sólo tras autorización; smoke manual de R1 en un navegador/entorno real. No se marca el bloque como Validado.
- Riesgo/decisión: `get_event_organizer` es SECURITY DEFINER limitado a nombre visible/username, autenticación y acceso equivalente al evento; nunca concede SELECT general sobre profiles. Revisar la migración propuesta antes de aplicarla.

### Bloque 2 — Chat del evento

- Estado: Pendiente.
- PR: —
- Migraciones: —
- CA: RF-R2-04.CA-01..04 y RF-R2-05.CA-01..04.
- Evidencia y pruebas: —
- Riesgos: acceso por ID, historial, cierre del evento, suplantación de remitente y Realtime/RLS.

### Bloque 3 — Mi perfil

- Estado: Pendiente.
- PR: —
- Migraciones: —
- CA: RF-R2-06.CA-01..04.
- Evidencia y pruebas: —
- Riesgos: datos privados entre sesiones, fotos inexistentes, UI del mockup con acciones R5.

### Bloque 4 — Notificaciones

- Estado: Pendiente.
- PR: —
- Migraciones: —
- CA: RF-R2-07.CA-01..04.
- Evidencia y pruebas: —
- Riesgos: no exponer ni permitir falsificar avisos ajenos; bandeja vacía legítima hasta R6.

### Bloque 5 — QA y aceptación R2

- Estado: Pendiente.
- PR: —
- Matriz de 28 CA: docs/qa/RELEASE_2_ACCEPTANCE.md (se crea durante el bloque).
- Informe: docs/qa/RELEASE_2_TEST_REPORT.md (se crea durante el bloque).
- Evidencia y pruebas: —
- Decisión final: Pendiente de revisión y aceptación humana.

## Checklist de cierre de cada bloque

- [ ] Contrastar código real y dependencias contra el plan.
- [ ] Ejecutar npm run build y npm run lint, más tests relevantes del bloque.
- [ ] Probar autorización y manejo de errores con casos positivos y negativos.
- [ ] Registrar migraciones sin modificar las ya aplicadas; remoto sólo con autorización.
- [ ] Comparar visualmente con mockup R2 en móvil y escritorio.
- [ ] Registrar CA cubiertos y límites de cada evidencia (fixture, PostgreSQL local, REST real).
- [ ] Actualizar este archivo; enviar PR; esperar revisión.
