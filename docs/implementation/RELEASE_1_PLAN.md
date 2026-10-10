# PlanIt — Plan técnico de implementación Release 1 (para Codex)

Versión 1.0 — 09/10/2026
Estado: propuesta de implementación, no ejecución.
Fuente funcional: RF-R1-01 a RF-R1-07 y CA-01 a CA-04 de cada RF en las pestañas «Nueva planificación — RF R1 a R7», «Criterios de aceptación — R1 a R7» y «Especificación técnica — R1 a R7».
Objetivo de R1: registro/login, creación de eventos completos, mapa de eventos públicos cercanos, inscripción/retiro seguros y Mis eventos.

## A. Contrato general para Codex (leer antes de cada bloque)

Repositorio: https://github.com/EnzoG14/PlanIt
Stack vigente: React + TypeScript + Vite + React Router + vite-plugin-pwa; @supabase/supabase-js; Supabase Auth/PostgreSQL/RLS/Storage.
Destino ÚNICO: planit-v2, ref iepeqmvzjguwlhnecsdq. Base vieja fmqzokxvpqxfzvcnzvjm: SÓLO LECTURA.
Arquitectura: leer AGENTS.md, CLAUDE.md, src/AGENTS.md, supabase/AGENTS.md, docs/architecture.md y docs/database.md; contrastar con lo implementado, no dar por hecho que archivos documentados son código ejecutable.

Reglas no negociables:
1. Trabajar por bloques en ramas/PR pequeños. No fusionar ni ejecutar migraciones remotas sin autorización expresa.
2. Inspeccionar el repositorio y la BD actual antes de programar. No cambiar migraciones aplicadas ni tocar la base antigua.
3. NO crear un backend propio, servicios extras, Docker obligatorio o arquitectura enterprise. Usar Supabase y RPC sólo donde aporte integridad.
4. No persistir drafts en PostgreSQL: formulario local React → insert únicamente cuando esté completo. Todo events es evento publicado.
5. Usar fechas timestamp without time zone según convención aprobada Argentina (America/Argentina/Buenos_Aires), sin campo timezone.
6. Identidad del usuario/organizador se obtiene desde sesión autenticada/auth.uid(), nunca se confía en organizer_id, user_id enviados por cliente.
7. Políticas RLS y grants restrictivos desde CREATE; no exponer birth_date/sex de profiles a terceros.
8. R1 sólo publica/descubre eventos public. Ocultos y enlaces son R4; remociones y reingresos son R3. Preparar esquema compatible, sin implementar interfaces futuras.
9. Mostrar loading/error/empty states reales. No inventar éxito de una operación.
10. Cada entrega incluye archivos tocados, decisiones, comprobación de build/lint, migraciones pendientes/aplicadas, riesgos y checklist de criterios RF verificados.

Comandos de verificación frontend: npm run build y npm run lint. Para migraciones: npx supabase migration list, npx supabase db push --dry-run, siempre verificando la ref de destino. El push real requiere aprobación.

## B. Estado inicial verificado y dependencias

- En Git: package.json con React, TypeScript, Vite, React Router, supabase-js, Supabase CLI y vite-plugin-pwa. La configuración PWA está creada, pero los iconos deben verificarse/agregarse.
- En Supabase nuevo: existen public.profiles y public.categories con RLS; ambas sin datos de prueba.
- Migraciones aplicadas: 20261010011204 (vacía) y 20261010013449 (profiles/categories). No modificarlas.
- No existen aún events, event_participations, participation_history ni Storage/event_images.
- El trigger de auth.users→profiles exige options.data.display_name de longitud 2–60; username generado automáticamente. Falta probar un registro real.
- Asesores: advertencia pendiente por public.rls_auto_enable() ejecutable por anon/authenticated; tratar con nueva migración revisada, no eliminar el trigger ensure_rls.
- El README/docs/database.md del repositorio pueden contener estado desactualizado («no aplicada»); verificar contra Supabase.

## C. Estrategia: siete bloques implementables, no uno por RF

### BLOQUE 0 — Preparación técnica, seguridad y PWA
RF cubiertos: preparación transversal R1-01 a R1-07.
Objetivo: entorno local y contrato de trabajo seguros antes de escribir funcionalidades.

Tareas:
- Revisar árbol y scripts actuales; configurar .env.example con VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Nunca publicar secretos o .env.local.
- Centralizar cliente Supabase en src/lib/supabase.ts; verificar conexión con planit-v2.
- Configurar router, layout y páginas mínimas (registro, login, mapa, crear evento, Mis eventos, detalle mínimo, 404).
- Instalar/configurar PWA: manifest, iconos 192/512 y maskable, service worker y comprobación de build. No cachear datos privados de Supabase de forma indiscriminada.
- Seleccionar una estrategia mínima de estilos y componentes compartidos sin añadir librerías innecesarias.
- Preparar migración INCREMENTAL y separada para corregir REVOKE EXECUTE de public.rls_auto_enable() si se confirma que los grants sobran. No modificar la función/trigger preexistente a ciegas.
- Hacer explícito en docs/database.md que la primera migración real ya fue aplicada.
- Elegir de manera justificada librería de mapa de bajo esfuerzo (Leaflet/React Leaflet o MapLibre); documentar fuente de tiles y atribución, sin fijar proveedor de pago sin autorización.

Entregables:
- Arranque local, rutas base, cliente Supabase, configuración de variables e iconos PWA comprobados.
- Posible migración SQL correctiva de seguridad en Git, NO ejecutada.

Pruebas / DoD:
- npm run build + npm run lint pasan.
- La PWA genera manifest/iconos válidos y no expone claves secretas.
- El entorno conecta solamente al proyecto nuevo; sin cambios en la base histórica.
Prompt para Codex: «Implementá BLOQUE 0 de este documento. Inspeccioná el repo antes de editar; hacé el cambio mínimo y prepará un PR. No despliegues SQL ni fusiones a main».

### BLOQUE 1 — Autenticación, registro y sesión
RF agrupados: RF-R1-01 y RF-R1-02.
Objetivo: registro funcional, inicio/cierre de sesión y rutas protegidas.

Tareas BD/servicios:
- Verificar que signUp({email,password,options:{data:{display_name}}}) genera identidad + exactamente un profiles, username autogenerado.
- Confirmar trigger y su manejo de fallos sin crear perfiles sueltos; no crear perfiles manuales desde navegador.
- Verificar RLS en profiles con dos sesiones; cada usuario lee/edita sólo su fila; cats legibles por autenticados pero no editables.
- Si confirmación de email está habilitada, incluir estados de confirmación y retorno. No desactivar la protección sólo para simplificar sin indicarlo.

Tareas frontend:
- /register: email, password, display_name obligatorio, validación de 2–60 caracteres, mensajes comprensibles para fallos.
- /login: signInWithPassword, errores genéricos y estado carga.
- auth context/hook ligero con getSession/onAuthStateChange; rutas protegidas sin pantallas privadas durante carga de sesión.
- Cierre de sesión; restauración tras recarga. Una vista mínima /me para inspeccionar perfil propio, no perfil social R5.
- Confirmar email/configuración de redirect URLs local y futuro hosting.

DoD / criterios:
- RF-R1-01.CA-01..04: alta válida, rechazo de inválidos/duplicados, perfil generado, datos recuperables.
- RF-R1-02.CA-01..04: login válido, fallido, sesión persistente y caducada.
- Evidencia real con al menos dos cuentas de prueba y acceso a perfiles ajenos denegado.
Prompt Codex: «Implementá BLOQUE 1. No rehagas ni edites la migración ya aplicada; si hace falta corregir, generá una nueva. Entregá instrucciones de prueba manual y pruebas automatizadas pertinentes».

### BLOQUE 2 — Catálogo, tabla de eventos y creación completa
RF agrupados: RF-R1-03 + infraestructura necesaria para R1-04/05/07.
Objetivo: persistir eventos completos, con propietario auténtico, ubicación y cupo válido.

Tareas BD:
- Migración para events según diseño de datos: organizer_id FK profiles, category_id FK categories, title, description, starts_at, ends_at, location_name, address, latitude, longitude, capacity, visibility DEFAULT public, cancelled_at, archived_at, created_at, updated_at.
- Reglas: título 1–120, descripción obligatoria max 3000, inicio futuro al crear, fin posterior a inicio, coordenadas obligatorias en rango, capacity > 0, categoría seleccionada activa, prohibir eventos con campos incompletos; NO timezone/publication_status/published_at.
- Índices por organizer_id, category_id/starts_at y consulta geográfica inicial adecuada; RLS para lectura autenticada de eventos public no cancelados/archivados y consulta propia. Restricciones de escritura; crear evento propio con RPC segura que derive organizer_id = auth.uid() y fuerce public en R1.
- Seed versionado de categorías iniciales; NO insertar manualmente desde frontend. Elegir un catálogo acotado y documentarlo.
- Definir fuente de datos de lectura para preview sin exponer perfiles/datos privados; perfil público del organizador si es necesario requerirá proyección segura.

Tareas frontend:
- Formulario React de título, descripción, fecha/hora inicio/fin, categoría, cupo, ubicación/dirección y coordenadas.
- Selección geográfica con pin sobre mapa o ubicación manual, sin depender obligatoriamente de geocodificación comercial.
- Validar campos en UI y confiar en validaciones SQL/RPC como autoridad.
- Mantener datos únicamente en estado del formulario hasta pulsar «Publicar»; navegación tras crear.
- Cargas, fallos, confirmación de éxito, prevención de doble envío.

Decisión de alcance de imágenes R1:
- RF-R1-03 menciona «imágenes disponibles» aunque gestión avanzada de galería es R3-03. Preferencia para cobertura completa: habilitar carga opcional al crear (hasta 10) con versión mínima de files + event_images y Storage privado, transacción/limpieza ante errores; reservar ordenar/quitar imágenes para R3. Si posponer imágenes, dejar desviación explícita para aprobación y no marcar R1 totalmente terminado.

DoD / criterios:
- RF-R1-03.CA-01..04: evento válido guardado, inválido rechazado sin fila, organizador real asignado, evento público visible en consultas.
- Un usuario no crea evento a nombre de otro ni modifica eventos ajenos.
- Categorías vacías/desactivadas y ubicación inválida manejadas correctamente.
Prompt Codex: «Implementá BLOQUE 2 con migraciones versionadas y frontend de creación. NO apliques SQL remoto hasta la revisión. Incluí las imágenes mínimas si se confirma el alcance R1».

### BLOQUE 3 — Mapa, descubrimiento y detalle mínimo
RF agrupados: RF-R1-04 y navegación de R1-03/R1-05.
Objetivo: explorar eventos públicos cercanos, seleccionarlos y ver datos necesarios para decidir inscripción.

Tareas:
- Página /map con lib elegida, geolocalización del navegador si usuario acepta, fallback manual/centrado por defecto si deniega. Mostrar aviso si no hay HTTPS fuera de localhost o permisos.
- Consulta de eventos próximos/activos public, no cancelados ni archivados, con coords y límite razonable. Fecha/hora según convención Argentina. Excluir unlisted aun si hay ID directo sin autorización.
- Marcadores y popover/preview con título, fecha, categoría, lugar y cupo disponible si ya existe participación; navegar a /events/:id.
- Página de detalle MÍNIMA R1 con datos imprescindibles para participar; el detalle expandido con galería, organizador y funciones extra corresponde a R2.
- Estados loading, error, cero resultados y sin permisos de ubicación; accesibilidad básica y responsive para pantalla móvil.
- Evitar inicialmente PostGIS u optimización espacial compleja sin necesidad. Si hay limitación de tiles/atribución del proveedor, documentarla.

DoD / criterios:
- RF-R1-04.CA-01..04: mapa cercano con resultados públicos vigentes, marcador abre preview/detalle, ocultos/cancelados no visibles, fallback geolocalización/no resultados.
- Integración con R1-03: evento creado aparece en la zona correspondiente.
Prompt Codex: «Implementá BLOQUE 3 con mapa, consulta segura, preview y detalle mínimo reutilizable; no agregues filtros avanzados R4».

### BLOQUE 4 — Inscripción, retiro y consistencia de cupos
RF agrupados: RF-R1-05 y RF-R1-06 (comparten modelo y operaciones).
Objetivo: soportar alta/baja/reinscripción sin duplicados ni sobrecupos.

Tareas BD:
- Crear event_participations y participation_history con las columnas/índices del diseño aprobado; UNIQUE(event_id,user_id); estados confirmed/cancelled/removed.
- RPC register_for_event: validar sesión, evento public vigente, no cancelled/archived/ended, usuario != organizer, status previo; bloquear fila events para serializar altas/cupos, contar confirmed, aceptar si cupo disponible. Insertar/reconfirmar una sola fila e historial atómicamente.
- RPC leave_event: sólo titular con estado confirmed; transición a cancelled, historial en la misma transacción; conserva relación y libera cupo.
- Reinscripción cancelled → confirmed directamente si disponible. Removed → denegada (sistema de solicitudes se añade en R3).
- Denegar UPDATE/INSERT directo inseguro en tablas para usuarios si las reglas dependen de la RPC; proteger historial frente a falsificaciones.
- Tests de concurrencia para último lugar; dos cuentas y cupo 1.

Tareas frontend:
- Detalle: contador confirmado/disponible derivado, botón Inscribirme/Retirarme según estado, confirmaciones, loading, error y feedback.
- Tras RPC, refrescar event detail y Mis eventos. Evitar duplicar acción con doble click.
- Mensajes diferenciados: evento lleno, vencido, propio, removido, ya confirmado, error transitorio.

DoD / criterios:
- RF-R1-05.CA-01..04: alta sin contar organizador, vínculo único, sin duplicados, último lugar reservado por un solo usuario.
- RF-R1-06.CA-01..04: cancelación propia, cupo liberado e historial retenido, no retiro ajeno, fallo informado; reinscripción reutiliza fila.
- Test simultáneo real contra PostgreSQL, no sólo mocks.
Prompt Codex: «Implementá BLOQUE 4. Priorizá integridad de base y RLS antes de agregar botones. No expongas operaciones inseguras de UPDATE directo».

### BLOQUE 5 — Mis eventos y navegación integral
RF agrupados: RF-R1-07 y cierre de experiencia de R1-03/05/06.
Objetivo: demostrar los flujos completos de organizador y participante.

Tareas:
- Página /my-events con secciones claramente separadas: «Organizo» (events.organizer_id = auth.uid()) y «Participo» (event_participations.user_id = auth.uid()).
- Consultas por propietario y por participante con seguridad de base; mostrar estado confirmado o cancelado cuando corresponda; no incluir terceros.
- Tarjetas reutilizables con categoría, fecha/hora, estado de asistencia y enlace al detalle; responsive y accesible.
- Refrescar después de crear, inscribirse, retirarse y volver a inscribirse.
- Manejar de forma diferenciada listas vacías, carga y fallos; nunca confundir eventos organizados con inscripciones.
- Ajustar navegación y estados de la aplicación para completar el flujo «crear → ver en mapa → inscribirse desde otra cuenta → retirar → Mis eventos».

DoD / criterios:
- RF-R1-07.CA-01..04: separación por rol, acceso a detalle, cambios reflejados, vacíos explícitos y privacidad.
Prompt Codex: «Implementá BLOQUE 5 sin duplicar consultas/componentes. Usá las operaciones seguras ya creadas y probá navegación entre pantallas».

### BLOQUE 6 — QA de Release 1, auditoría y cierre
RF agrupados: todos RF-R1-01 a RF-R1-07.
Objetivo: release demostrable y verificable antes de empezar R2.

Tareas:
- Ejecutar build/lint; revisar tipos y errores en consola; validar instalación PWA en desktop y móvil compatible (HTTPS en despliegue).
- Pruebas de flujos con dos cuentas: registro, login, persistencia de sesión, creación, geolocalización denegada, mapa, inscripción, cupo 1 concurrente, retiro y Mis eventos.
- Comprobar cada RF-R1-xx.CA-01..04 con una matriz de 28 criterios (7 × 4), indicando aprobado/fallido/pendiente y evidencia.
- Inspeccionar RLS, grants y Storage para usuarios ajenos, anon y autenticados. Ejecutar Security/Performance Advisors; documentar excepciones justificadas y corregir advertencias de privilegios.
- Revisar rutas directas e intents por URL, errores de red, fechas en horario argentino, estados vacíos, no hay datos privados filtrados.
- Añadir instrucciones README con setup local, variables, migraciones, cómo correr tests y checklist de demo.
- No ejecutar SQL en base histórica ni usar service_role en frontend. Confirmar que migrations en Git reflejan lo aplicado.

DoD / criterios:
- Todos los 28 criterios R1 aprobados o pendientes explícitamente aceptados; sin incidencias altas abiertas.
- Los principales flujos se verifican en navegador real, no sólo por inspección de código.
- PR listo para revisión humana y merge deliberado.
Prompt Codex: «Ejecutá BLOQUE 6. Producí matriz de trazabilidad 28 CA → evidencias, informe de riesgos y acciones pendientes. No marques aprobado sin prueba».

## D. Trazabilidad RF → bloques

| RF | Implementación central | Validación final |
| --- | --- | --- |
| RF-R1-01 — Registro | 1 | 6 |
| RF-R1-02 — Inicio/restauración sesión | 1 | 6 |
| RF-R1-03 — Crear evento | 2 | 6 |
| RF-R1-04 — Mapa de eventos | 3 | 6 |
| RF-R1-05 — Inscribirse | 4 | 6 |
| RF-R1-06 — Retirarse | 4 | 6 |
| RF-R1-07 — Mis eventos | 5 | 6 |
| Infraestructura transversal | 0 | 6 |

Orden recomendado: 0 → 1 → 2 → 3 → 4 → 5 → 6. El detalle mínimo del evento puede evolucionar entre 3 y 4; evitar implementar pantallas duplicadas.

## E. Contratos críticos de backend para R1

- profiles ya existe: trigger Auth crea profile con display_name; no crear perfiles manualmente desde frontend.
- categories existe pero está vacío: requiere categorías iniciales mediante migración/seed.
- events es una tabla nueva. Crear sólo eventos completos/public, con organizer_id derivado de usuario autenticado. En R1 no permitir unlisted sin permisos que se implementarán en R4.
- event_participations/event history son tablas nuevas y necesitan funciones transaccionales; no usar contador mutable de inscriptos.
- Imagen del evento: files/event_images/Storage pueden adelantarse parcialmente a R1 sin incluir funciones administrativas R3/R7; probar limpieza de archivos al fallar el alta.
- Bloquear acceso a otros usuarios mediante RLS/column grants, incluido id guessing o consultas REST directas.
- Error de validación del backend nunca se oculta bajo un mensaje falso de operación completada.

## F. Definición general de terminado de cada bloque

- Código, SQL y documentación consistentes con reglas y RF.
- Sin features de releases futuros salvo dependencias mínimas justificada (por ejemplo imagen inicial de evento).
- Pruebas unitarias/integración relevantes al bloque; comandos build y lint con salida reportada.
- Migraciones en archivos SQL versionados; listar lo pendiente de ejecutar, sin aplicar por defecto.
- Capturas/registro de demo para criterios manuales cuando sea posible.
- Indicar claramente qué datos de prueba se usaron y cómo se limpian sin eliminar datos reales.
- Pull request pequeño y descriptivo; difs legibles; sin tocar accidentalmente base anterior.

## G. Prompt maestro listo para pegar en Codex

«Trabajamos en EnzoG14/PlanIt, PWA React+TypeScript+Vite con Supabase. Leé AGENTS.md y las instrucciones de carpeta, docs/architecture.md, docs/database.md, y la pestaña 'Plan técnico Release 1 — Codex (Markdown)' del documento de PlanIt (si no podés acceder al documento, pedime el texto de ese bloque).

Tu tarea es implementar SOLAMENTE el BLOQUE [N] de ese plan. Antes de escribir:
(1) inspeccioná el código y migraciones actuales;
(2) detectá dependencias/riesgos;
(3) proponé el cambio mínimo;
(4) respetá la base NUEVA planit-v2 ref iepeqmvzjguwlhnecsdq; la antigua es intocable.

No edites migraciones ya aplicadas ni ejecutes cambios remotos sin autorización. Si necesitás DDL, agregá una nueva migración SQL en el repositorio con RLS/grants desde la creación. Priorizá lógica de negocio segura, UX con loading/empty/error, accesibilidad básica y compatibilidad móvil/PWA. No implementes features de R2-R7 salvo infraestructura mínima justificada.

Entregá archivos modificados, pasos para probar, resultado de npm run build/npm run lint, pruebas funcionales frente a los CA del RF, migraciones pendientes y riesgos. Detenete al terminar este bloque y esperá revisión antes de continuar.»

## H. Recomendaciones específicas de coordinación

- Separar tareas que alteran BD de cambios puramente UI cuando facilite revisión, pero mantener la coherencia por bloque funcional.
- Antes de asignar una tarea a Codex, sincronizar rama local y registrar el bloque activo en un issue/PR.
- Evitar que varios agentes editen la misma migración simultáneamente; usar migración nueva por cambio y serializar el despliegue.
- Los módulos dependen de que existan credenciales válidas y categorías base. No declarar «release lista» sólo porque el frontend compila.
- Futuros RF de R3-R7 no forman parte de R1, aunque la especificación técnica los describe y el modelo de 19 tablas ya los contempla.

