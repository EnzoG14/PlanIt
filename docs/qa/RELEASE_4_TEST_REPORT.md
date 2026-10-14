# PlanIt — Release 4: QA integral del Bloque 9

**Fecha:** 14/10/2026, Argentina. **Base:** `090fbabfd68a648ca69f49c27daaedfa07d137e8`. **Rama:** `codex/r4-block-9`. **Estado: Validado. GO por aceptación humana**, por aprobación explícita del responsable tras declarar pruebas manuales completas. [Acta](r4-block-9/human-acceptance.json). El NO-GO técnico previo queda superado por esta decisión. Los resultados automatizados registrados no cambian ni se infieren cuentas, dispositivos o JWT utilizados por el responsable.

## Alcance, fuentes y autorización

Se siguieron `RELEASE_4_BLOCK_9.md`, plan/estado R4, RF/CA, test plan, A01–A07, guías raíz/src/Supabase/diseño y precondiciones visuales. La especificación técnica RF-R4-01..09 de Planificación se consultó por Google Drive read-only; [revisión de fuente](r4-block-9/source.json). Amanecer v3.0 y componentes vigentes son la autoridad visual. No se usan collages históricos como baseline de píxeles.

El responsable eligió **local + remoto de sólo lectura**. No se crearon cuentas/eventos remotos ni se canjearon tokens reales, aplicaron migraciones, desplegó o fusionó. Proyecto histórico sin consultas ni cambios. R3 sigue aceptada según A07; estas regresiones técnicas no reabren su aceptación ni acreditan las pruebas E2E históricamente pendientes. La plantilla/reporte anterior de main se conserva como [corte histórico](r4-block-9/baseline-report.md); este informe lo actualiza con ejecución B9.

## Aceptación humana

El responsable indicó en este chat: «ya probé todo manualmente, asi que da por aprobado todo r9». Por el contexto de esta entrega se registra como aprobación del Bloque 9 de Release 4 y sus 39 CA. Fuente: declaración directa del responsable, no ejecución nueva del agente. No se aportó desglose de pruebas ni se generaron evidencias HTTP/JWT/Storage/Realtime o físicas adicionales. La aprobación funcional no autoriza merge, migraciones ni deploy.

## Resultado por capa

| Capa | Resultado | Evidencia y alcance |
| --- | --- | --- |
| Instalación | PASS aislado / FAIL en checkout | `npm ci` falló por binario Rolldown en uso; `npm ci --prefix .qa-b9.local` instaló 372 paquetes, audit 0 vulnerabilidades. Lockfile y binario preservado coinciden byte a byte: [instalación](r4-block-9/installation.json), [hashes](r4-block-9/dependency-recovery.json) |
| Build, lint y suites | PASS final | 52 comandos/suites distintos, incluidos los mínimos del prompt y R4/R1–R3. [Comandos, códigos, duración e intentos](r4-block-9/commands.json); [primer corte](r4-block-9/commands-initial.json). Lint mantiene advertencias previas y build el chunk Mapbox grande |
| SQL local | PASS | PostgreSQL **17.5** efímero, initdb nuevo y replay ordenado de 25 migraciones; Auth/Storage scaffold y SET ROLE. No equivale a reset de stack Supabase completo ni HTTP JWT |
| CA | PASS local/fixture, 39/39 | [Trazabilidad por CA y caso](r4-block-9/TRACEABILITY.md), [39 textos literales y escenarios](r4-block-9/traceability.json). Estados **Validado por aceptación humana**; evidencia automatizada local conservada |
| D/P/H | PASS en capas locales indicadas | D01–D12, P01–P07, H01–H28: 47 escenarios vinculados a suites. Las variantes inseguro/timeout GPS son unitarias; denegación/fallback son navegador fixture |
| UI/PWA | PASS emulado | [55 grupos suplementarios](r4-block-9/check-r4-ui/results.json), [caché SW](r4-block-9/check-r4-ui/pwa-cache.json), suites por superficie. Edge sobre producción, Auth/REST interceptados; WebSocket bloqueado o transporte simulado según suite |
| Metadata remota | PASS | 25 versiones sincronizadas; [dry-run sin pendientes](r4-block-9/remote/db-push-dry-run.txt). 14 tablas públicas con RLS y [55 cuerpos/configuración/permisos iguales](r4-block-9/remote/comparison.json), normalizando sólo CRLF/LF y excluyendo stub local rls_auto_enable |
| HTTP JWT / Storage / Realtime real | NOT RUN | No fixtures remotos funcionales ni autorización para provisionarlos. Runners opt-in HTTP no ejecutados; metadata no sustituye estas pruebas |
| Dispositivos / lector de pantalla por el agente | NOT RUN | Sin nueva evidencia física, Safari/iOS, Android, lector de pantalla o zoom nativo registrada por el agente |
| Aceptación humana | APROBADO / Validado | Responsable declara pruebas manuales completas y aprueba 39/39 CA; acta, sin inventar detalle por dispositivo/cuenta |

## Resumen por RF y regresiones

| RF | CA | Evidencia principal local/fixture |
| --- | --- | --- |
| R4-01 Búsqueda | 4 | search SQL/UI: título/descripción, case, literals, resultados vacíos/error y respuesta tardía |
| R4-02 Categorías | 4 | search + filters UI: OR por categorías, AND entre grupos y limpieza |
| R4-03 Fecha | 4 | search + filters + boundaries: starts_at, día AR completo, cruce medianoche, rango invertido y calendario |
| R4-04 Radio | 4 | search + filters + boundaries: bordes, antimeridiano/polos, validaciones, GPS y centro rotulado |
| R4-05 Intereses | 4 | interests SQL + 54 grupos UI: privacidad, persistencia, catálogo, fallo/conciliación y cuentas |
| R4-06 Sugerencias | 4 | suggestions SQL/UI: ranking antes de LIMIT, desempates, vacíos, ocultos/cerrados, origen, polling y expiración |
| R4-07 Visibilidad/enlace | 5 | event-links SQL/UI + invite SQL: creación oculta atómica, hash, rotación, transiciones y cierre |
| R4-08 Canje | 5 | invite SQL/UI + hidden-access: persistencia sin inscripción, no enumeración y denegación de chat/asistentes |
| R4-09 Accesos | 5 | event-access SQL/UI: dueño, proyección, revoke/remoción/historial/cupo, restore sin reinscripción |

**A01–A07:** fallback centro de mapa rotulado; fecha por inicio; filtros compartidos Inicio/Mapa; grants atómicos al ocultar y conflicto confirmed+revoked; lectura pública sin restauración al volver público; hash sin recuperación y regeneración; contratos R3 presentes. No se reabrieron decisiones. D12/D14 y el comportamiento de ocultos cerrados aprobado en B8 se conservan.

Seguridad local: 96 combinaciones de B5, cinco carreras de B5, rotaciones concurrentes B6, cinco carreras de canje B7 y siete carreras B8 con espera real de locks y cero deadlocks observados. A/B/C/D/anon y E histórico distinto: confirmed E conserva grant al ocultar, luego historial cancelado no permite lectura revocada; restituir no cambia participación/historial ni concede chat. Storage es tabla/política local, no API de firmas real.

Regresiones R1–R3: configuración/Auth/registro fixture, crear/editar, categorías/Inicio/Mapa, galería, cancelar/archivar/duplicar, Mis eventos, inscripción/retiro/cupo, asistentes/remoción/historial, reingreso/cooldown/última plaza, chat, perfil, notificaciones y Realtime simulado. El SW de producción local contiene sólo app assets tras logout/cambio A→B; no REST/medios/eventos privados ni tokens. Las URLs firmadas ya emitidas y bytes descargados conservan sus límites históricos: TTL solicitado 60s no es cap impuesto al API; revalidación visible 30s no es revocación instantánea.

## Defectos y reparaciones

| Hallazgo | Resultado final |
| --- | --- |
| P2: al volver de Mis intereses, AppLayout sobrescribía el foco de Perfil | Corregido en ProfilePage: requestAnimationFrame con cleanup después del foco de ruta; confirmado por interests UI y perfil UI |
| Search UI fallaba ante 43.999969px de un control CSS44 | Runner mide con precisión centesimal consistente con B2/B4; no se alteraron targets |
| Suggestions UI importaba `/src/...` inexistente en producción | Reemplazado por navegación real Mapa→Inicio, comprobando nuevo origen y recalculo |
| Notifications UI eliminaba su botón por polling antes del caso de revocación | Fixture revoca en el chequeo autoritativo de destino; se conservan denegación, ausencia de navegación y eliminación de acción |
| Auth UI comparaba rgba literal contra hex minificado | Comprueba blanco y alpha calculados con tolerancia de cuantización de 8 bits; reduced-transparency sigue exigido |
| Runners chat/participations/hidden-access UI escribían en QA histórica | Salida configurable; runner B9 asigna directorios propios |

Los fallos iniciales y el error de nombre duplicado durante ampliación del test SQL se conservan entre intentos; no se presentan como PASS hasta la corrección/retest. No hubo reparación SQL ni cambios a contratos/APIs de aplicación.

## Rendimiento y revisión visual

[Medición local reproducible](r4-block-9/check-r4-performance/results.json): 5000 eventos, 10% ocultos, una categoría, fechas fijas2099, distribución geométrica determinista; tres warmups y veinte muestras secuenciales bajo authenticated. p50/p95: texto **6,46/6,77ms**, fecha/radio **1,89/2,27ms**, ranking **24,12/26,44ms**. No son SLA ni incluyen HTTP/red. RPC EXPLAIN expone Function Scan; dos consultas diagnósticas del filtro geográfico muestran planes internos con buffers: Haversine **4,26/5,01ms**, caja conservadora+Haversine **0,54/0,65ms**, ambas 104 coincidencias. No se agregan índices por este dataset sintético.

[Auditoría Impeccable acotada](r4-block-9/IMPECCABLE.md), detector sin findings y capturas reales del navegador en siete tamaños. Baseline de main fijado antes de corregir foco: [assets/SHA](r4-block-9/baseline.json). Confirmación con build final, scopes, cuatro destinos, fuente autoalojada, controles, texto200% por CSS, altura400, foco/Escape, reduced-motion/transparency y fallback fuente. Se versionan 162 PNG representativas con toda la matriz suplementaria; las adicionales/repetidas se conservan localmente ignoradas con [inventario/hashes](r4-block-9/local-capture-archive.json), no como adjuntos de PR. Sin regenerar sistema. No se ejecutó critique formal de dos evaluaciones independientes. El sidecar anterior a DESIGN se conserva según instrucción explícita del bloque.

## Riesgos, excepciones y salida

- La evidencia automatizada remota end-to-end sigue sin ampliarse. El NO-GO previo queda reemplazado por **GO por aceptación humana**. La declaración manual del responsable no se convierte en logs HTTP/JWT A/B/C/D/E/anon, Storage/Realtime ni pruebas físicas ejecutadas por el agente; esas brechas de trazabilidad se conservan.
- Asesores remotos sin ERROR: [29 avisos DEFINER authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) intencionales con autorización en cuerpos; [links sin política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) denegación por defecto; [protección de contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) previa. [Evidencia seguridad](r4-block-9/remote/security-advisors.json).
- Performance Advisor: [FK category_id de intereses sin índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys) y 12 índices sin uso observado, INFO; no se eliminan/crean índices a partir de eso. [Evidencia](r4-block-9/remote/performance-advisors.json).
- npm ci directo en checkout bloqueado por Windows; instalación aislada y hashes respaldan recuperación, sin afirmar una instalación directa limpia. Algunos runners conservan etiquetas de origen B5/B6: la base de ejecución es commands.json y las listas de 25 migraciones.
- Emulación no acredita dispositivos, blur/WebGL/gestos físicos, teclado móvil ni lector de pantalla. El fallo Mapbox se inyecta y la suite discovery usa engine con estilo local; no se acredita proveedor real end-to-end.
- A01–A07 se conservan. R4/B9 y los 39 CA quedan aceptados; no se reabre R3. Las brechas de evidencia automatizada remota/física siguen documentadas, sin afirmar nuevas ejecuciones.

**Salida:** [PR #48](https://github.com/EnzoG14/PlanIt/pull/48), seguimiento/matriz actualizados, aprobación humana registrada. **Validado; GO por aceptación humana.** Sin merge ni deploy.
