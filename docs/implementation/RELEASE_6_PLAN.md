# PlanIt — Plan técnico de implementación Release 6 · Gestión avanzada y analítica

**GO humano — 15/10/2026:** el usuario confirmó que las pruebas manuales se completaron y aprobó R6 / B9 en la PR #72. Estado **Validado por aceptación humana**. [Acta de aprobación](../qa/RELEASE_6_HUMAN_APPROVAL.json). Los NO-GO y pendientes humanos inferiores conservan su corte histórico; los límites técnicos registrados no se convierten en pruebas ejecutadas por el agente. Sin merge ni deploy.


**Seguimiento B9 — 15/10/2026:** dos P2 resueltos; HTTP/JWT real, Realtime real, UI autenticada y zoom nativo Edge comprobados. [Resultados y alcance](../qa/r6-block-9/followup/summary.json). NO-GO: aceptación humana y dispositivos pendientes. El informe B9 original se conserva como antecedente.


**B9 — 15/10/2026:** auditoría de B0–B8 integrados desde120d50a; [reporte y NO-GO](../qa/RELEASE_6_TEST_REPORT.md), [evidencia](../qa/r6-block-9/README.md). Sin funcionalidad ni migraciones nuevas; resultados parciales por capa, JWT/Realtime reales y aceptación humana pendientes. El seguimiento actual supera las fotografías de integración inferiores.

**Aplicación remota B7 autorizada — 15/10/2026:** migración `20261015201034` aplicada y verificada en planit-v2 por pedido humano posterior. Marcas **1/1/1/1**, historial36/36 y dry-run sin pendientes. Cuerpos de las tres RPC coincidentes con Git, INVOKER/STABLE/search_path/ACL y RLS verificados; productor/historial/publicación preservados. [Acta](../qa/r6-block-7/remote/summary.json). Sin nuevos hallazgos de seguridad; HTTP JWT/Realtime reales y aceptación integral siguen NOT RUN. Los cortes locales siguientes conservan su fotografía original.

**Entrega B7 — 15/10/2026:** [bandeja `event_full` y evidencia](../qa/r6-block-7/README.md), base integrada PR #69 (`9311c01`). Nombre actual autorizado proyectado por las RPC existentes sin cambiar firmas, etiqueta/icono y revalidación owner-only al abrir; archivados o sin propiedad vigente devuelven título genérico/target NULL. Conserva DM/seguimiento y conciliación existente. Migración `20261015201034` **1 creada / 1 probada local / 0 aplicada remota / 0 verificada remota**. Build/lint, replay36, UI fixtures y regresiones PASS; HTTP JWT y Realtime reales NOT RUN. **Implementado; QA pendiente**; no B8, merge ni deploy.

**Aplicación remota B6 autorizada — 15/10/2026:** migración `20261015185020` aplicada y verificada en planit-v2; marcas **1/1/1/1**, historial35/35 y dry-run sin pendientes. [Acta](../qa/r6-block-6/remote/summary.json). Actualiza el corte local de la entrega inferior; no implica QA JWT/Realtime ni aceptación integral, merge, deploy o autorización B7.

**Entrega B6 — 15/10/2026:** [productor transaccional y evidencia](../qa/r6-block-6/README.md), D07 aplicada sin tabla de control ni contador redundante. Sólo servidor RF-R6-05 CA01/03/04; `event_full` privado y atómico con la confirmación. Migración creada/probada local, sin aplicación remota. Estado **Implementado; QA pendiente**. No adelanta bandeja/Realtime B7 ni autoriza el siguiente bloque.

**Adenda B5 — 15/10/2026:** [D05/D06 y snapshot único aprobados](RELEASE_6_BLOCK_5_DECISIONS.md). CSV de asistentes actuales y movimientos filtrados B4, sin demografía; límite5.000/10MiB/15s, sin archivos parciales. Esta decisión reemplaza paginación del prompt B5. [Implementación y evidencia](../qa/r6-block-5/README.md): Implementado; QA pendiente, migración sólo local. No autoriza B6, SQL remoto, merge ni deploy.

**Adenda B4 — 15/10/2026:** [D03 aprobada](RELEASE_6_BLOCK_4_DECISIONS.md): inicial30 días AR incluyendo hoy, presets7/30/90, manual≤366 y agrupación día/semana lunes/parcial; sólo movimientos históricos. [Implementación y evidencia](../qa/r6-block-4/README.md). Las menciones inferiores a D03 pendiente son antecedentes. No autoriza B5 ni aplicación remota.

**Adenda B3 — 15/10/2026:** [D04/D08 y contrato aprobado](RELEASE_6_BLOCK_3_DECISIONS.md) reemplazan el gate previo de anti-inferencia absoluta: cifras exactas actuales con riesgo residual temporal/multievento aceptado, k5 y supresión completa por dimensión pequeña. B3 implementado; QA pendiente, migración aplicada/verificada remotamente con autorización posterior. No autoriza B4 ni cambios remotos. Las propuestas y cortes siguientes se conservan como antecedentes.

**Versión de propuesta:** 1.0 · acuerdos A01–A07 confirmados — 14/10/2026 · **Estado de ejecución al 15/10:** B0–B1 integrados y B2 implementado, QA pendiente; ningún RF validado integralmente. Ver [seguimiento](RELEASE_6_STATUS.md) y [evidencia B1](../qa/r6-block-1/README.md).
**Baseline documental:** Google Doc «Nueva planificación — RF R1 a R7», «Criterios de aceptación — R1 a R7», «Especificación técnica — R1 a R7»; `docs/requirements/RELEASE_6_REQUIREMENTS.md` conserva literalmente 6 RF y 24 CA.  
**Baseline de código verificado al actualizar esta propuesta:** `EnzoG14/PlanIt` `main`, commit `66e24d85f32123ecd70f457f8381c68ae5af1603` (14/10/2026). Revalidar SHA, ramas, estado remoto y catálogo de BD en B0 y en cada bloque.  
**Puerta de entrada:** `docs/qa/RELEASE_5_TEST_REPORT.md` y `docs/implementation/RELEASE_5_STATUS.md` registran **GO por aceptación humana, R5 validada** el 14/10/2026; el reporte preserva claramente las pruebas técnicas no ejecutadas. Verificar integración de PR #60 y catálogo real en B0. La existencia de GO no autoriza escribir en Supabase remoto ni comenzar automáticamente un bloque.

**Fuentes obligatorias:** `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/design/AGENTS.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/UI_WORKFLOW.md`, `docs/architecture.md`, `docs/database.md`, `docs/implementation/RELEASE_5_{PLAN,STATUS}.md`, `docs/qa/RELEASE_5_TEST_REPORT.md`, migraciones y código real. `docs/design/mockups/release-6.png` es referencia histórica de alcance, **no** especificación visual pixel-perfect. Dirección vigente: **B · Amanecer**.

## A. Objetivo y límite de la release

La release permite al **organizador** medir el estado actual de un evento, consultar composición demográfica **agregada** de sus asistentes, analizar movimientos de inscripción por período, descargar CSV **autorizados**, recibir alertas **internas** al completar cupo y comparar sus eventos. **Sprint 1:** RF-R6-01..03. **Sprint 2:** RF-R6-04..06.

| RF | Prioridad | Entrega oficial | CA | Bloques principales |
| --- | --- | --- | ---: | --- |
| RF-R6-01 | Alta | Cupo, confirmados, disponibles, ocupación | 4 | B1–B2 |
| RF-R6-02 | Alta | Distribuciones de edad/sexo y altas iniciales | 4 | B3 |
| RF-R6-03 | Media | Selector temporal y evolución | 4 | B4 |
| RF-R6-04 | Media | CSV asistentes + estadísticas autorizadas | 4 | B5 |
| RF-R6-05 | Alta | Notificación interna al llenarse un evento | 4 | B6–B7 |
| RF-R6-06 | Media | Comparación de dos o más eventos propios | 4 | B8 |

**Acuerdos de producto:** inscripción confirmada (no check-in); evolución **altas / reincorporaciones / bajas** separadas; edad y sexo agrupados con supresión segura; **dos CSV** distintos; un aviso por episodio de lleno; comparación de **2 a 10** eventos propios incluyendo cancelados, archivados y ocultos. R5 consta **GO/Validado** en el repositorio. Detalles técnicos pendientes en D03/D04/D05/D06/D08/D11.

**Fuera de alcance:** establecer/editar cupos (R1/R3), gestionar/borrar asistentes (R3), nuevos permisos sociales (R5), notificaciones push/Web Push (R7), SMS/mail transaccional, pronósticos, ML, BI externo, PDF/XLSX, monetización, integración de pagos, listado público de métricas y cambios al esquema de fechas de eventos. No añadir `events.timezone`, contadores persistidos de ocupación ni un segundo backend.

**Definiciones funcionales esenciales (A01–A07 aprobadas, detalles técnicos señalados como propuestas):**

1. **Ocupación actual:** sólo `event_participations.status = 'confirmed'`; el organizador no se inscribe ni ocupa cupo. `available_spots = greatest(capacity-confirmed_count,0)`; `occupancy_percent = 100 * confirmed_count / capacity` con `capacity > 0` según constraint vigente. Evento terminado, cancelado o archivado conserva estadísticas propias, rotuladas como «estado actual de inscripciones», no presencia física.
2. **Asistencia** en R6 = **inscripción confirmada**, no control de ingreso ni check-in (no existe un evento de presencia). UI debe decir «personas inscriptas/confirmadas» y no insinuar asistencia física verificada.
3. **Serie temporal:** `participation_history` es fuente de transiciones históricas. Presentar **tres series separadas** «altas», «reincorporaciones» y «bajas»; no asumir ocupación histórica; no usar únicamente `event_participations.created_at` para contar reingresos. D02 aprobada; presets y rangos D03 pendientes técnicos.
4. **Datos demográficos:** `profiles.birth_date`/`sex` son opcionales y privados; las RPC sólo devuelven agregados protegidos; nunca filas ni atributos individuales. Contar `sin informar`, y proteger grupos pequeños para evitar reidentificación.
5. **Comparación:** misma fórmula de ocupación que R6-01, por evento y con el estado/fecha de corte rotulados. Si la fecha seleccionada afecta sólo la serie, no presentar la comparación como «ocupación histórica» hasta contar con snapshots calculados correctamente.
6. **Aviso de cupo lleno:** exclusivamente el organizador recibe un registro en `notifications` tras transición transaccional hacia `confirmed` que completa cupo; reintentos idénticos no generan avisos adicionales. D07 aprobada: **nuevo aviso cada vez que pasa de libre a lleno tras una inscripción confirmada**, uno por episodio y nunca por reintentos.

## B. Línea de base observada en el repositorio

| Área | Evidencia comprobada | Riesgo / acción R6 |
| --- | --- | --- |
| Frontend | React 19, TS, Vite 8, router en `src/App.tsx`, rutas `my-events`, `events/:id`, `events/:id/attendees`, `notifications` | Incorporar `/events/:id/analytics` y `/my-events/compare` bajo `RequireAuth`, sin nuevo dock primario |
| Cupos | `events.capacity > 0`; `event_participations` único `(event_id,user_id)`, estados `confirmed/cancelled/removed` | Reutilizar fuente de verdad, incluir remociones y reincorporaciones |
| Historial | `participation_history`: `participation_id`, `previous_status`, `new_status`, `reason`, `changed_by`, `created_at` | Auditar cobertura/replay de todas las transiciones e instantes antes de definir series |
| Perfil | `profiles.birth_date date`, `sex in (female,male,other)` o NULL; lectura íntegra sólo del propietario | RPC agregada privilegiada, sin SELECT demográfico de terceros ni uso de proyecciones sociales |
| RPC previa | `get_event_participation_summary` **no** es owner-only: sirve a participantes/eventos públicos | No reutilizarla como única barrera de seguridad del panel; crear RPC de organizador |
| Gestión R3 | `get_event_attendees`, `remove_participant`, `resolve_rejoin`, `update_event` y sus RLS/grants | No alterar comportamiento; probar que todos los paths registran historia/eventos de lleno |
| Notificaciones | `notifications` con RLS por destinatario; `get_notifications` y `get_notification_target`; Realtime existente | Reutilizar bandeja/campana; nuevo productor `event_full` y deduplicación. Verificar `get_notification_target` actual antes de tocarlo |
| Social R5 | `social_security_model`, notificaciones DM/seguimiento, proyecciones privadas | No ampliar permisos demográficos ni dañar Realtime/DM; R5 GO por aceptación humana, sin extrapolar QA no ejecutada |
| Diseño | Amanecer B, tokens `--pi-*`, patrones de gestión, `EventManagement` y `MyEventsPage` | KPI legibles, gráficas accesibles, escalas y tablas, sin librería de gráficos por defecto |

**No comprobado:** base de datos remota en vivo, versiones realmente aplicadas hoy, volumen de participantes, datos de edad/sexo realmente presentes, emisiones Realtime en dispositivo y validaciones técnicas no ejecutadas de R5. Son tareas B0/QA, no hechos asumidos. Los comentarios históricos `NOT applied` en SQL tampoco prueban estado remoto actual.

## C. Arquitectura propuesta y flujos

```text
PWA React (sesión Supabase Auth)
  ├── /events/:id/analytics ──┐
  ├── /my-events/compare ─────┼── src/features/analytics/api.ts + tipos/formatos
  └── /notifications ────────┘            │
                                          ▼
                           Supabase Data API (JWT usuario)
                                          │
                   RPC OWNER-ONLY, parámetros limitados y validados
                         ├─ occupancy + compare ── events / participations
                         ├─ demographics ───────── profiles + participations
                         ├─ time_series ────────── participation_history
                         └─ export projections ── datos visibles al organizador
                                          │
                               Postgres / RLS / ACL
                                          │
                 trigger after status→confirmed (lock previo evento)
                           └─ notifications(event_full) ── Realtime/bandeja
```

**Dependencia DB:** primero auditar catálogos y firmas, luego migraciones incrementales de sólo lectura agregada, y más tarde productor de alertas. Las RPC diseñadas abajo son **nombres/firma candidatos, NO SQL implementado ni obligación de inventar tablas**:

| Operación propuesta | Parámetros | Resultado recomendado | Autorización |
| --- | --- | --- | --- |
| `get_my_event_occupancy` | `p_event_id uuid` | 1 registro (`id,title,capacity,confirmed_count,available_spots,occupancy_percent,event_state,as_of`) | `events.organizer_id=auth.uid()` |
| `get_my_event_demographics` | `p_event_id uuid` | totales agrupados, buckets de edad/sexo, `unknown_count`, supresión; **sin** PII individual | owner, mínimo de privacidad verificado en servidor |
| `get_my_event_participation_series` | `p_event_id uuid,p_from timestamp,p_to timestamp,p_bucket text` | bucket start, alta/retorno/baja y, si procede, saldo o ocupación histórica | owner, rango y límites acotados |
| `get_my_event_export_rows` | `p_event_id uuid,p_cursor …,p_limit int` | paginado de columnas permitidas y orden estable | owner, jamás acceso directo completo a `profiles` |
| `compare_my_event_occupancy` | `p_event_ids uuid[]` | lista ordenada con ocupación por evento | owner sobre **cada** ID, 2..N sin respuesta parcial |

**Regla transversal:** `SECURITY INVOKER` cuando los grants/RLS permitan el contrato; en estos agregados el RLS actual impide a un organizador consultar la totalidad de participaciones y datos privados, por lo que probablemente se requiera `SECURITY DEFINER` **con autorización explícita antes de cada SELECT**, `set search_path=''`, nombres calificados, `auth.uid()` no nulo, acceso `EXECUTE` sólo a `authenticated`, validación de parámetros aun con resultado vacío, `REVOKE EXECUTE FROM PUBLIC, anon`, y test REST/JWT. Evitar proyectar columnas privadas mediante filas, JSON de depuración, exceptions, notices, logs o Realtime. Validar que no se expone `planit_private` por Data API.

### C1. Contrato de ocupación

- Query estable con `count(*) FILTER (WHERE status='confirmed')`, agrupada por evento; permitir cero inscritos usando `LEFT JOIN`.
- Filtro propietario en servidor **antes** de devolver filas, incluso si el id no existe; recomendar error genérico `event_unavailable` para no enumerar eventos ajenos.
- No almacenar `occupancy_percent` persistido. Cálculo numérico consistente con escala y redondeo definidos en D01; valor raw para comparaciones, presentación redondeada en UI.
- En cancelado/archivado, conservar visión propia. Diferenciar «capacidad configurada» vs «personas confirmadas ahora».
- Invalidar y reconsultar al volver a la pestaña, tras mutaciones R1/R3 y al recuperar conectividad; Realtime **opcional** como invalidación, no como fuente autoritativa de contadores.

### C2. Métricas demográficas y privacidad

- Cohorte **sólo participantes `confirmed` al consultar**. En JSON devolver `total_confirmed`, `with_birth_date_count`, `without_birth_date_count`, `with_sex_count`, `without_sex_count` o totales seguros según D04; no emitir `birth_date`, edad exacta, `sex` individual ni `user_id`.
- Edad: `date_part('year',age(p_reference_date,birth_date))` sobre fecha de referencia aprobada; no usar diferencia de años sin corregir cumpleaños. Categorías fijas/rotuladas, sin precisión personal.
- `sex`: valores reales DB `female`, `male`, `other`, `NULL` → etiquetas en UI «Femenino», «Masculino», «Otro», «Sin informar». No inferir identidad de género a partir del campo ni inventar valores.
- **Privacidad anti-inferencia:** agrupación y ocultamiento de grupos pequeños aprobados en principio (A03); `k=5` es **valor inicial propuesto**, no ratificación expresa del número. B0 cierra umbral, supresión complementaria y pruebas de no reidentificación. Para eventos pequeños mostrar «Datos insuficientes para un desglose seguro». La RPC impone supresión antes de enviar resultados.
- Un evento privado (`unlisted`) no da a un invitado permiso analítico; el perfil privado/social y el bloqueo no conceden ni quitan derechos de dueño sobre métricas de su propio evento.

### C3. Serie temporal y semántica

- Interpretar `participation_history.created_at` como **hora local Argentina sin TZ**, al igual que las demás columnas propias. Definir internamente rangos **semiabiertos** `[from,to)` y bucket consistente `day`/`week`. No reinterpretar como UTC ni añadir timezone a `events`.
- Distinguir: `new_confirmations` (primera transición a confirmed), `reconfirmations` (cancelled/removed→confirmed), `departures` (confirmed→cancelled/removed); sólo usar `participation_history` para reconstrucción histórica; no contar `created_at` de fila actual como toda la historia.
- Un saldo histórico al corte se calcula reproduciendo la última transición de cada participación hasta ese instante; un gráfico que muestra **flujo** no debe etiquetarse «ocupación» (stock). Si se desea ocupación histórica, calcularla explícitamente y probar contra casos con reingresos, cambios de cupo y cierres. Preferir en primera versión «Nuevas inscripciones por período» para evitar inferencia de snapshots mal definida.
- Presets propuestos 7, 30 y 90 días + rango manual. `from < to`, máximo de 366 días, límites de puntos (≤ 366 día / ≤ 53 semana), sin permitir cargas arbitrarias. D02 aprobada para tres series; D03 pendiente técnico.
- Evitar saltos de estado UI: cancelar respuesta previa con AbortController cuando proceda y usar request key vinculada a usuario+evento+rango. Loading distinto de cero real.

### C4. Exportación CSV

**Dos descargas distintas por evento (aprobado A04)**; columnas concretas y formato final por ratificar en B0:

1. **«CSV de asistentes»**: encabezados `evento,username,nombre_visible,estado,fecha_primera_inscripcion` (fecha de historia registrada, no falsa `created_at` si hubo reingreso). Si no se expone un dato por contrato, quitar la columna; no introducir email, teléfono, DOB, sexo individual, biografía, UUID técnicos innecesarios, mensajes ni imágenes. Por defecto `estado=confirmed`; cancelados/removidos quedan fuera salvo decisión explícita.
2. **«CSV de estadísticas»**: columnas `evento,desde,hasta,granularidad,inscripciones_nuevas,reincorporaciones,bajas` ; y/o filas por bucket, usando exactamente la misma RPC que gráfico. Un agregado demográfico sólo se exporta si pasó el mismo filtro anti-inferencia del servidor. No generar una tabla adicional con microdatos.

CSV con UTF-8 y BOM sugerido (Excel AR), delimitador propuesto `;` (no confirmado expresamente), campos entrecomillados y dobles comillas escapadas, CRLF o LF estable, protección **CSV formula injection** también con espacios prefijados y tabs (prefijar `'` donde primer carácter significativo es `= + - @` o control). Descarga sólo tras recibir **todas** las páginas autorizadas y superar límites de memoria o límite seguro; aborto y error claros sin parcial declarado como éxito. Asegurar paginación estable `(clave, id)`; por tamaño alto usar B0 decisión sobre exportación servida en Edge Function o límite de filas. No confiar en UI para autorización de exportación.

### C5. Aviso de evento lleno

- Gatilho propuesto: transición efectiva **hacia** `confirmed` en `event_participations`/`participation_history` después de que RPC R1/R3 obtuvieron lock de `events`; confirmar que **todos** los paths (registro, reingreso aprobado, ocultos) pasan por esa ruta.
- Dentro de **la misma transacción** que la confirmación, comprobar `count(confirmed)=capacity` y que antes había una vacante; insertar `notifications(recipient_id=organizer_id,event_id,type='event_full',title,body)` por mecanismo de servidor. No exponer invitado ni datos privados en el aviso.
- Idempotencia: esquema mínimo propuesto `event_full_notification_events(event_id, participation_history_id UNIQUE, created_at)` o clave de dedupe equivalente **si realmente necesaria**; `ON CONFLICT DO NOTHING` sobre evento de transición. Analizar reintentos/rollback/concurrencia y ciclos lleno→libre→lleno para definir dedupe por episodio; no usar un UNIQUE sólo `(event_id,type)` que impida futuras alertas legítimas sin aprobación.
- **Actualizar cupo** exactamente a la cantidad confirmada podría completar evento sin nueva inscripción; el RF y la especificación dicen aviso ante **inscripción confirmada**. No ampliar ese gatillo a edición de cupo sin decisión D07.
- RLS recipient-only existente, canal `notifications` Realtime existente; `get_notification_target` debe resolver `/events/:id` y volver a comprobar acceso, sin confiar en texto del aviso. En frontend agregar etiqueta `event_full: 'Cupo completo'` y actualizar campana/bandeja sin nuevos permisos ni Web Push.

### C6. Comparación de eventos

- `compare_my_event_occupancy` acepta 2..N UUID únicos, tamaño acotado (propuesta N≤10); owner de **todos**; no filtrar silenciosamente eventos ajenos para dejar resultados parciales.
- Misma función/CTE para `confirmed_count`, `capacity`, `available_spots`, ocupación que en R6-01; cero eventos válidos es error/empty explícito. `capacity>0` por CHECK, pero contrato maneja NULL/0/legacy como N/D, jamás NaN/∞.
- Mostrar nombres y estado del evento, cantidad absoluta y porcentaje, fecha de consulta. Comparar ocupación actual no implica «rendimiento histórico» ni «asistencia física». Ordenar de modo determinístico y permitir lectura accesible con tabla, no sólo barras.
- No ampliar autorización a seguidores, participantes ni usuarios con enlace oculto.

## D. Pantallas, UX y diseño

**Diseño vigente:** B · Amanecer, claro, tipografía Bricolage autoalojada, tokens `--pi-*`, tinta marina, azul sólo estado/acción, luz violeta decorativa, sin gradientes de controles, no duplicar wrappers de tarjetas. Seguir `docs/design/AGENTS.md` y revisar componentes existentes primero.

- **Entrada**: desde «Gestionar evento» en `EventManagement.tsx` agregar «Estadísticas» sólo al organizador; en «Mis eventos/Organizados» acceso secundario «Comparar eventos» si hay 2 propios. No crear quinto elemento de dock.
- **`/events/:id/analytics`**: `ScreenHeader` con retorno preservado; título y estado; 4 KPI (cupo, confirmados, disponibles, ocupación), barra con label textual, distribución de edad/sexo sólo si segura, serie y selector de período, CTA CSV contextual. `aria` descriptivos; pantalla no muestra PII individual.
- **`/my-events/compare`**: multiselección de eventos propios, 2..10, filtros de búsqueda locales sobre lista autorizada, tabla responsive con scroll horizontal accesible, barras textuales (porcentaje y absolutos), CTA de volver; no presentar porcentajes sin denominador.
- **Estados**: carga con skeleton no engañoso o mensaje, sin datos, datos demográficos insuficientes, error de permiso, error de red y reintento explícito, exportación en curso/fallo, sesión vencida. Si se cambia selección, limpiar resultados previos hasta validar nuevo contexto.
- **A11y/QA visual**: 320/360/375/390/768/1280px, alto corto, zoom 200%, navegación teclado/lectores, contraste ≥4.5:1 texto normal, foco visible, reduced motion, colores + etiquetas no depender sólo de gráficos, touch targets, safe areas y teclado móvil. Capturas **de app real** y reporte de diferencias frente a Amanecer.

## E. Plan de ejecución por bloques

| Bloque | Sprint | Dependencias | Contenido / entrega | Gate |
| --- | --- | --- | --- | --- |
| **B0** | Preparación | R5 GO humano en `main` verificado; comprobar integración/HEAD/ACL | Auditoría repo+DB READ ONLY, fuente original, contratos de métricas, privacidad/CSV/alerta, decisiones D01–D12 | Revisión y firma de decisiones; **sin SQL ni código funcional** |
| **B1** | Infra de Sprint 1 | B0 aprobado | RPC owner-only de ocupación, contrato de datos, pruebas SQL/JWT locales | Seguridad, totales 0/cancelado/oculto, auditoría performance |
| **B2** | Sprint 1 | B1 integrado | Entrada gestión, ruta y KPIs RF-R6-01 en Amanecer | UI responsive/permiso/refresh |
| **B3** | Sprint 1 | B1–B2 | RPC agregada demográfica protegida + gráficos seguros RF-R6-02 | No exposición de PII ni grupos pequeños, fixtures nulos |
| **B4** | Sprint 1 | B3 | Series históricas/selector RF-R6-03 + período inicial de R6-02 | Intervalos, reingresos, semántica y UI |
| **B5** | Sprint 2 | B4 | CSV asistencia/estadísticas RF-R6-04 | Sanitización, permisos, paginación, archivo correcto |
| **B6** | Sprint 2 | B1, B0 D07 | Trigger/producer de aviso `event_full` RF-R6-05 | atomicidad, duplicados, full→free→full |
| **B7** | Sprint 2 | B6 | Integración de nuevo tipo en bandeja, navegación y Realtime | Cuenta correcta, read-at y regresión DM/follows |
| **B8** | Sprint 2 | B1,B2 | RPC batch + multiselección + comparación RF-R6-06 | ≥2 eventos, IDOR, porcentaje idéntico |
| **B9** | Cierre | B0..B8 + aprobaciones remotas | 24 CA, regresiones R1–R5, SQL/JWT/UI/Realtime, seguridad/DoD y GO/NO-GO | Aceptación humana; no autodeclarar Release completada |

**Ciclo de trabajo por bloque:** verificar HEAD/PR anteriores, definir diff y pruebas, rama `codex/r6-block-N` desde base integrada, implementar únicamente ese bloque, evidencia `docs/qa/r6-block-N/`, actualizar `RELEASE_6_STATUS.md` y `RELEASE_6_ACCEPTANCE.md`, abrir PR **draft**, detenerse. Ramas no se crean desde un commit no integrado. Un bloque por PR y aprobación independiente.

## F. Inventario sugerido de cambios de código (no creados aún)

| Bloque | Archivo probable | Tipo |
| --- | --- | --- |
| B1 | `supabase/migrations/<nueva>_r6_organizer_occupancy.sql` | Nuevas RPC y ACL sobre esquema real, nombres verificados en B0 |
| B1/B3/B4/B8 | `src/features/analytics/api.ts`, `types.ts`, `format.ts` | Cliente RPC, parseo validado, abort/cursors |
| B2 | `src/pages/EventAnalyticsPage.tsx`, `src/pages/event-analytics.css` | UI KPI |
| B2 | `src/App.tsx`, `src/components/EventManagement.tsx` | Router y navegación |
| B3 | `src/components/analytics/DemographicsPanel.tsx` | Grupos seguros y estados |
| B4 | `src/components/analytics/PeriodSelector.tsx`, `TrendPanel.tsx` | Filtros/serie |
| B5 | `src/features/analytics/csv.ts`, UI de descarga | Exportación segura, sin libs nuevas salvo justificación |
| B6 | `supabase/migrations/<nueva>_r6_event_full_notifications.sql` | Trigger/dedupe y grants, sin modificar migraciones aplicadas |
| B7 | `src/pages/NotificationsPage.tsx` y/o `src/features/notifications/api.ts` | Nuevo tipo y destino, preservando tipos existentes |
| B8 | `src/pages/CompareEventsPage.tsx`, CSS, `src/pages/MyEventsPage.tsx` | Comparación |
| B0..B9 | `docs/implementation/RELEASE_6_STATUS.md`, `docs/qa/RELEASE_6_ACCEPTANCE.md`, `docs/qa/r6-block-N/`, `scripts/check-r6-*.mjs`, `package.json` | Evidencia/runners y scripts reproducibles |

**Archivos a no editar por inercia:** migraciones históricas, `.impeccable/design.json`, `DESIGN.md`, mockups aprobados, campos sociales/`profiles` directos, `events.timezone`, `src/pages/EventAttendeesPage.tsx` si no hace falta. Sólo cambiar rutas/SQL ajenos con razón y pruebas de regresión.

## G. Matriz mínima de amenazas y controles

| Actor / estado | Ocupación owner-only | Demo/series | Export CSV | Aviso `event_full` | Comparar |
| --- | --- | --- | --- | --- | --- |
| Organizador A, propio público/oculto/archivado | Sí | Sí, agregado seguro | Sí, permitido | Sólo aviso de sus propios eventos | Sí, sólo propios |
| Asistente confirmed B | **No** (sin panel owner) | No | No | No | No |
| Cancelled/removed B | No | No | No | No | No |
| Link-only `unlisted` C | No | No | No | No | No |
| Seguidor `accepted`, perfil público/privado | No | No | No | No | No |
| Usuario ajeno D / bloqueado social | No | No | No | No | No |
| Anónimo | No | No | No | No | No |

Pruebas obligatorias por actor: URL directa, Data API REST con JWT, RPC de otra persona, parámetros UUID manipulados, función con lista mixta, lectura directa `profiles` y `participation_history`, Realtime de `notifications`, fugas en errores/CSV/cache. `get_event_participation_summary` preexistente seguirá con acceso de participantes; su respuesta no transforma la autorización del panel propietario.

## H. Casuística de rendimiento, concurrencia e integridad

- Índices existentes: `participations_event_status_idx`, `participation_history_participation_created_idx`; verificar `EXPLAIN (ANALYZE, BUFFERS)` en fixture sintético, sin consultas N+1 ni un SELECT por día/evento.
- Índice adicional sólo con evidencia; probablemente se evalúe `(event_id,status)`, join `history`→`participation_id`, `created_at` histórico global y `(organizer_id)` de eventos. No añadir índices «por si acaso».
- Ejecutar replays con 0, 1, 10, 100, 1.000 asistentes y 10 eventos, siempre evitando que el rendimiento local se presente como carga remota validada. Criterio objetivo propuesto, no SLA oficial: RPC ocupación p95 <300 ms para fixtures representativos y CSV <=5.000 filas en memoria acotada, a validar con B0.
- Concurrencia crítica: dos últimas inscripciones compitiendo, reingreso + remoción, edición de cupo + inscripción, dos reintentos del mismo registro, respuesta de red perdida tras commit, transacción rollback del aviso.
- La UI nunca es fuente de verdad. Ante timeout de descarga/alerta, reconsultar estado sin crear duplicados ni informar éxito sin evidencia.
- Zona local Argentina en las tablas propias; no mezclar timestamps de `auth`/Storage de tipos distintos como si fueran iguales.

## I. QA, criterios de cierre y evidencias

**24 CA oficiales**; cada uno requiere identificador, descripción literal, casos positivos y negativos, entorno, evidencia y estado `NOT RUN/PASS/FAIL/BLOCKED` **por capa**, sin inferir aceptación integral de pruebas aisladas. Archivo matriz: `docs/qa/RELEASE_6_ACCEPTANCE.md`; plan: `docs/qa/RELEASE_6_TEST_PLAN.md`.

- SQL local: migraciones replay, RLS/ACL/CALL/privileged projections, aislamiento `auth.uid`, estado vacío y error; catalogación de funciones y controles de grupos pequeños.
- HTTP JWT real A/B/C/D/anon cuando haya autorización y usuarios de prueba: no declarar PASS por fixtures SQL o mock de sesión.
- UI navegador: estados, permisos, gráficos accesibles, export CSV, cambios de período, comparación, keyboard responsive y screenshots reales.
- Realtime/Storage/PWA: no alterar controles, verificar entrega del `event_full` y ausencia de exposición cruzada; ejecutar escenarios reales si se autorizan.
- Scripts: `npm run build`, `npm run lint`, `npm run check:r5:release`/regresiones que existan a la fecha; crear `check:r6:*` con pruebas de contratos y resultados reproducibles, no sólo grep.
- SQL remoto: 4 estados independientes **creada**, **probada local**, **aplicada remota con permiso**, **verificada remota**. `supabase db push` y cualquier escritura requieren autorización expresa; no desplegar ni hacer merge como efecto lateral.
- Estado final R6: **NO-GO** si falla autorización, demográficos filtran PII, trigger duplica, el CSV permite fórmulas, hay inconsistencias, faltan migraciones remotas requeridas o no existe aceptación humana. Mantener `Implementado; QA pendiente` hasta verificación integral.

## J. Decisiones abiertas y orden de aprobación

`RELEASE_6_DECISIONS_PROPOSED.md` contiene D01–D12; **A01–A07 están aprobadas** (R5 GO, inscripciones confirmadas, tres series, agrupación demográfica, dos CSV, alertas recurrentes y comparación 2–10 con todos los estados). Bloque 0 NO debe volver a solicitar esas respuestas; debe ratificar parámetros técnicos pendientes: D03 períodos, D04 umbral/supresión, D05/D06 campos/formato/límites, D08 edades y D11 refresh. Ninguna precisión pendiente permite recortar silenciosamente los 24 criterios oficiales.

## K. Definición de terminado y reporte obligatorio por bloque

1. Commit base, rama, PR draft, dependencias verificadas y decisiones activas. 2. Cambio preciso, firmas RPC/DDL/grants/índices, archivos tocados. 3. Seguridad por actor y por acceso directo; si hay DEF(INER), demostrar por qué y cómo se restringe. 4. Casos CA, datos de fixture, resultados y comandos **ejecutados realmente** (o `NOT RUN`). 5. Screenshots/contraste/Amanecer/accessibility donde aplique. 6. Riesgos, migraciones (4 estados separados), impacto sobre R1–R5, permiso remoto solicitado y próxima puerta. **No** fusionar, desplegar, modificar la BD remota, actualizar Google Docs ni pasar al siguiente bloque automáticamente.
