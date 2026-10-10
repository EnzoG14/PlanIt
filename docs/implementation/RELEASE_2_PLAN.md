# PlanIt — Plan técnico de implementación Release 2 (para Codex)

**Versión:** 1.0 — 10/10/2026 (Argentina).  
**Estado:** plan propuesto; ninguna función de R2 se considera implementada por este documento.  
**Referencia de formato:** docs/implementation/RELEASE_1_PLAN.md.  
**Fuentes funcionales:** documento Planificación (Google Docs), pestañas «Nueva planificación — RF R1 a R7», «Criterios de aceptación — R1 a R7» y «Especificación técnica — R1 a R7», RF-R2-01 a RF-R2-07.  
**Referencia visual:** docs/design/mockups/release-2.png (cinco pantallas), docs/design/DESIGN_SYSTEM.md, SCREENS.md y DESIGN_GAPS.md.  
**Seguimiento vivo:** docs/implementation/RELEASE_2_STATUS.md.

## A. Objetivo y alcance

Construir la experiencia del participante de R2 sobre la R1 ya aceptada manualmente: Inicio con eventos próximos, agrupación por categoría, detalle ampliado, chat grupal por evento, consulta de Mi perfil y centro de notificaciones. No reimplementar Auth, publicación, mapa, cupos o Mis eventos.

La release cubre **7 RF y 28 CA (cuatro por RF)**. Las referencias visuales definen la apariencia, nunca autorizan por sí solas nuevas funciones o datos.

| RF | Nombre del requisito oficial | Bloque |
| --- | --- | --- |
| RF-R2-01 | Consultar el detalle ampliado de un evento | 1 |
| RF-R2-02 | Explorar eventos recientes en Inicio | 1 |
| RF-R2-03 | Visualizar eventos agrupados por categoría | 1 |
| RF-R2-04 | Visualizar mensajes del chat de un evento | 2 |
| RF-R2-05 | Enviar mensajes de texto al chat de un evento | 2 |
| RF-R2-06 | Consultar mi perfil | 3 |
| RF-R2-07 | Consultar un centro de notificaciones | 4 |
| RF-R2-01 a 07 | QA integral, seguridad, responsive y regresión R1 | 5 |

**Orden recomendado:** bloque 0 → 1 → 2 → 3 → 4 → 5. El bloque 3 puede desarrollarse antes del 2 si no hay solapamientos; no fusionar trabajo simultáneo sobre los mismos archivos o migraciones.

## B. Contrato general de trabajo para Codex

1. Leer antes de cada bloque: AGENTS.md, CLAUDE.md, src/AGENTS.md, supabase/AGENTS.md, docs/architecture.md, docs/database.md, docs/implementation/RELEASE_1_PLAN.md, RELEASE_2_PLAN.md, RELEASE_2_STATUS.md y las guías visuales de docs/design.
2. Inspeccionar la rama base y los archivos reales antes de planificar modificaciones. **No asumir que una tabla/RPC documentada ya existe.**
3. **Destino exclusivo** de Supabase: planit-v2, proyecto iepeqmvzjguwlhnecsdq. El proyecto histórico fmqzokxvpqxfzvcnzvjm es exclusivamente de referencia; no escribir, migrar ni cambiar su configuración.
4. No modificar migraciones aplicadas. Toda alteración de esquema/privilegios se versiona como una migración posterior y se prueba primero localmente. **No ejecutar SQL remoto, configurar Auth/Realtime o desplegar sin permiso expreso.**
5. Utilizar la estructura ligera React + TypeScript + Vite + React Router + Supabase. Reutilizar servicios, hooks, cards, layouts y componentes reales de R1. Evitar nuevas capas, backends y dependencias innecesarias.
6. Aplicar RLS/grants desde el primer CREATE y permisos por identidad derivada de auth.uid(); los checks en frontend son UX, no autorización. No usar service_role o secretos en navegador.
7. Fechas de tablas propias según convención ya acordada: timestamp without time zone, con hora Argentina. No agregar timezone a events ni drafts persistentes.
8. **Privacidad:** no exponer birth_date, sex ni otras columnas privadas de profiles a terceros. Para nombre/username/avatar social usar una proyección o función explícitamente autorizada y mínima. Evitar SELECT completo de profiles y evitar RPC que eluda RLS sin validaciones explícitas.
9. Respetar fielmente el diseño marino/azul/violeta de release-2.png; mobile-first, controles táctiles, contraste y safe areas. No copiar datos, fotos o métricas de ejemplo del mockup.
10. No implementar seguidores, DMs, perfiles públicos/editables, filtros avanzados, eventos guardados, pagos, tickets, push, adjuntos de chat ni generación automática de notificaciones que correspondan a otras releases.
11. Cada PR actualiza RELEASE_2_STATUS.md con pruebas realmente realizadas, evidencia y limitaciones. Distinguir tests unitarios, SQL local, REST/Storage/Auth remoto, fixtures y validación humana. Codex no marca «Validado» por su cuenta.
12. Verificar como mínimo npm run build, npm run lint y pruebas del bloque, además de smoke tests de R1. Incluir archivos modificados, riesgos, migraciones pendientes y CA cubiertos.

## C. Estado inicial: qué existe antes de R2

**Verificado en main al 10/10/2026:** rutas protegidas de R1 (/map, /events/new, /events/:id, /my-events, /me), creación y fotos, descubrimiento con Leaflet/OpenStreetMap, participación/retiro/cupo e historial, lista Mis eventos. El detalle es mínimo, el perfil /me lee nombre visible/username/email. No hay todavía una página Inicio específica ni bandeja/chat grupal.

**Verificado en Supabase planit-v2 al inicio de R2:** siete migraciones registradas hasta 20261010154930_my_events_read; existen profiles, categories, events, files, event_images, event_participations y participation_history con RLS. Las demás tablas del diseño lógico, incluidas conversations, messages y notifications, aún no están creadas. Revisar nuevamente al ejecutar un bloque porque este estado puede evolucionar.

**R1:** el usuario informó que probó manualmente los principales recorridos y funcionan. Quedan advertencias/restricciones documentadas en docs/qa/RELEASE_1_TEST_REPORT.md y RELEASE_1_STATUS.md; no equiparar esa aceptación humana a una suite E2E automatizada. Mantener regresiones y controles de seguridad relevantes durante R2.

## D. Bloques de implementación

### BLOQUE 0 — Preparación de R2 y navegación visual

**Alcance:** transversal, sin nuevo requisito propio.  
**Meta:** dejar claras las rutas/navegación y el contrato visual sin pantallas ficticias.

**Tareas:**
- Revisar la captura R2 y los documentos DESIGN_SYSTEM, SCREENS, DESIGN_GAPS. Trazar las cinco pantallas: Inicio, Detalle ampliado, Chat del evento, Mi perfil y Notificaciones.
- Revisar la navegación R1 y planificar ubicación de Inicio, Mapa, Mis eventos, Crear y Perfil en dispositivos móviles sin ocultar acciones importantes ni crear controles inertes.
- Proponer rutas estables: /home (Inicio), /events/:id (detalle existente), /events/:id/chat (o tab equivalente de detalle), /me (existente), /notifications. Elegir una sola convención, documentarla, mantener compatibles enlaces y rutas R1.
- Extraer sólo piezas reutilizables necesarias y definir contratos de datos mínimos para cards/estados de las nuevas pantallas.
- Señalar acciones decorativas del mockup que deben omitirse hasta otras releases: buscar/filtros avanzados, favoritos, seguimiento, número de entradas, recordatorios y controles sociales.

**Entregables:** navegación preparada, documentación de rutas/componentes, revisión de diseño y capturas iniciales cuando existan pantallas. Sin migraciones.  
**DoD:** ninguna regresión de rutas R1; ningún enlace/pestaña simula datos u operaciones; build y lint pasan.

### BLOQUE 1 — Inicio, categorías y detalle ampliado

**RF:** R2-01, R2-02 y R2-03.  
**Meta:** descubrimiento no geográfico y ficha completa, reutilizando datos de R1.

**Backend / consulta:**
- Reutilizar events, categories, event_images/files y las RPC/lecturas existentes cuando sirvan. Para Inicio crear como máximo una consulta/paginación nueva que devuelva eventos públicos, vigentes y accesibles, ordenados de forma determinista (preferencia: próximos por starts_at y desempate por id).
- Filtrar en servidor/RLS visibilidad, cancelación/archivo y vigencia; no resolver seguridad únicamente con JS. Evitar SELECT de todos los eventos, consultas por tarjeta y firmas individuales de portada.
- Agrupar por category_id sin cambiar que cada evento pertenece a una única categoría. Ocultar secciones sin eventos; no duplicar tarjetas entre categorías. Si el límite/paginación pudiera truncar categorías, explicitarlo y evitar resultados engañosos.
- Ampliar /events/:id: título, descripción, inicio/fin, dirección/ubicación, categoría, organizador (solo nombre/username social autorizado), imágenes disponibles y ocupación/participación de R1. Mantener el detalle de cancelados/históricos para quienes están autorizados.
- No abrir SELECT general de profiles a authenticated: crear proyección segura para organizador si se necesita; justificar columnas/grants/políticas. Usar datos reales, placeholders claros cuando falten opcionales.
- No crear un sistema de «eventos destacados» editorial si no existe regla aprobada; presentar próximos/recientes de manera honesta.

**Frontend / UX:**
- Página Inicio mobile-first según teléfono 1 R2: filas/tarjetas con portada, categoría, horario/lugar y acceso al detalle; agrupación por categorías. Búsqueda/chips ilustrativos sólo si tienen comportamiento aprobado; de lo contrario omitir.
- En detalle, mantener hero, galería y CTA de R1; sumar organizador, información adicional y navegación consistente. No mostrar asistentes identificados, seguimientos o eventos relacionados sin RF/aprobación.
- Loading/error/empty y tratamiento de fotos privadas/URLs firmadas vencidas.

**Pruebas y DoD:** RF-R2-01.CA-01..04, R2-02.CA-01..04 y R2-03.CA-01..04 (12 CA); dos identidades para privacidad de organizador, detalle correcto, ausencia de imágenes, vacíos, categoría/orden y revisión visual 375×812 y desktop. Regresión de mapa, creación y participación R1.

### BLOQUE 2 — Chat grupal de eventos: lectura y envío de texto

**RF:** R2-04 y R2-05.  
**Meta:** una conversación de evento desde su publicación, con historial autorizado y envío únicamente durante vigencia.

**Persistencia y autorización:**
- Crear en nueva migración **conversations** (kind event/direct previsto en diseño lógico, pero R2 solo event) y **messages** (texto; sin adjuntos ni DM), con FK, UUID, timestamps Argentina, índices para lectura por conversación/fecha y RLS/grants mínimos.
- Invariante: exactamente una conversación por evento; no duplicar si se solicitan chats en paralelo. Asegurar creación para eventos nuevos al publicarlos y **backfill idempotente** para los eventos existentes de R1. El chat existe aunque todavía no tenga mensajes.
- Organizador y participantes con event_participations.status = confirmed pueden leer el chat. Nunca permitir acceso por conocer conversation_id; enlace a evento sin membresía no concede chat. Los removidos/no confirmados no acceden a un chat vigente. Tras cierre/cancelación/archivo, conservar historial para la audiencia todavía autorizada y prohibir nuevas escrituras.
- Para nombres/avatares de remitentes, exponer exclusivamente representación social segura del emisor a miembros autorizados. No revelar birth_date, sex, emails ni perfiles completos.
- Implementar operación segura de envío: sender_id siempre auth.uid(); texto no vacío tras trim, longitud acotada (propuesta del diseño: hasta 2000 caracteres), validar estado del evento y pertenencia en PostgreSQL. Proteger también de inserciones REST directas que eludan la operación.
- Prevenir carrera «evento termina/cambia de estado mientras se envía»: autorización y persistencia deben observar un estado consistente dentro de la transacción.
- Mantener arquitectura apta para R5 (DM) y R7 (una imagen por mensaje de evento), **sin adelantar funcionalidades**. Nada de notificaciones por cada mensaje grupal.

**Interfaz / entrega:**
- Ruta/tab de chat desde detalle. Header del evento, burbujas entrantes y propias, nombre/fecha, listado cronológico, textarea/composer y envío con estado de error/reintento.
- Chat vacío claramente identificado, historial paginado o limitado, scroll razonable, doble envío prevenido.
- Para actualización entre sesiones, preferir **Supabase Realtime** si es justificable y autorizada su configuración de publicación; si no, refresco/reconsulta explícito honesto como base. Independientemente del transporte, toda lectura está controlada por RLS y el mensaje se recupera desde PostgreSQL.
- Eventos cerrados: interfaz sólo lectura con explicación; no mostrar botón Enviar operativo.

**Pruebas y DoD:** RF-R2-04.CA-01..04 y R2-05.CA-01..04 (8 CA). Dos usuarios confirmados vs no miembro/removido, usuario anónimo, acceso directo por ID, evento finalizado/cancelado/archivado, espacios en blanco, historial reabierto y ausencia de duplicados. Probar chat visible desde publicación previa y RLS/REST si hay autorización; no declarar Realtime real si solo se probó con fixtures.

**Decisión que debe documentarse si surge:** el estado cancelled/removed no acredita chat vigente. No conceder acceso histórico a ex participantes por inferencia; si los RF exigen conservarlo para quienes salieron, solicitar una decisión funcional antes de ampliar RLS.

### BLOQUE 3 — Consultar Mi perfil

**RF:** R2-06.  
**Meta:** ampliar /me sin construir todavía perfil público ni edición social de R5.

**Tareas:**
- Reutilizar AuthProvider y lectura propia de profiles; mostrar nombre visible, username, email desde Auth (no desde tabla), avatar si hay archivo propio accesible y bio/campos básicos que realmente existan. Los campos opcionales ausentes no producen datos inventados.
- Revisar el contraste con teléfono 4 R2; conservar marino/violeta, foto circular/placeholder y navegación real. Omitir «Seguir», contadores sociales, intereses, «Mis entradas», edición avanzada y datos falsos del collage.
- Mantener lectura sólo del dueño, mostrar cambios ya persistidos al refrescar/reabrir y un estado de error que nunca deje datos del usuario anterior en pantalla.

**Pruebas y DoD:** RF-R2-06.CA-01..04 (4 CA); acceso desde navegación, dos sesiones sin mezcla, datos propios y actualizados, campos ausentes, error y mobile/desktop. Si el avatar no puede resolverse sin ampliar Storage de R5, mostrar placeholder y documentarlo, no abrir permisos generales.

### BLOQUE 4 — Centro de notificaciones

**RF:** R2-07.  
**Meta:** bandeja real de avisos persistidos, sin sistemas de generación de avisos futuros.

**Persistencia:**
- Crear **notifications** según el diseño lógico: id, recipient_id, actor_id, event_id, conversation_id, type, title, body, read_at, created_at y FK/índices necesarios. RLS: lectura por recipient_id = auth.uid(); actualización limitada de read_at únicamente para propietario; inserción restringida a rutas de backend autorizadas.
- Evitar que un cliente falsifique avisos hacia otro usuario, actor_id y type. Mantener roles/grants mínimos y no confiar en recipient_id desde el navegador.
- **R2 no genera automáticamente avisos de cupo, inscripción, eventos ni chat.** R6 incorpora los generadores definidos; una bandeja inicialmente vacía es correcta.
- Preparar lectura paginada ordenada por created_at y operación segura de marcar como leída sólo del destinatario; contador real de no leídas si se muestra. No instalar Web Push ni programar recordatorios.

**Frontend:**
- Ruta /notifications accesible desde navegación coherente. Filas de aviso con tipo/título/cuerpo/hora y estado leído; enlace al evento/conversación solo si el recurso existe y usuario está autorizado. Sin chips de filtro falsos.
- Empty/loading/error y manejo de lista cambiada entre consultas. No generar ni mostrar notificaciones ficticias para rellenar la pantalla.

**Pruebas y DoD:** RF-R2-07.CA-01..04 (4 CA), privacidad A/B/anon, lectura/marca individual, bandeja vacía y detalle temporal; datos de prueba controlados solo en entornos permitidos, sin inventar generadores en producción.

### BLOQUE 5 — QA, regresión y cierre de R2

**RF:** R2-01 a R2-07; **28 CA**.  
**Meta:** cierre trazable, manteniendo R1 funcional.

**Tareas:**
- Crear docs/qa/RELEASE_2_ACCEPTANCE.md y docs/qa/RELEASE_2_TEST_REPORT.md, con texto literal de CA oficial, estado, evidencia y pendientes.
- Ejecutar npm ci, npm run build, npm run lint y checks específicos; distinguir unitarios, SQL real local, UI fixture, HTTP/JWT/Storage en planit-v2 y pruebas manuales del usuario.
- Con dos sesiones aisladas comprobar: Inicio y categorías, detalle con organizador y fotos; chat solo para organizador/confirmados, mensaje enviado/recuperado, denegación de no miembro y sólo lectura al cerrar; Mi perfil por cuenta; notificaciones propias/vacías/marca de lectura.
- Revisar políticas RLS, SELECT de columnas privadas, grants, RPC/trigger, límites de acceso por ID, security/performance advisors y permisos de canales si hay Realtime.
- Revisar estética de cinco pantallas de mockup R2 en móvil 375×812 y desktop, navegación y safe areas, scroll de chat, PWA/HTTPS y fallos de red. No confundir screenshots fixture con E2E.
- Ejecutar smoke de R1: registro, creación con foto, mapa, inscripción/retiro/cupo y Mis eventos. Verificar migraciones locales vs remotas antes/después; no ejecutar DDL remoto sin permiso.
- Documentar fallos priorizados, excepciones justificadas, recomendaciones GO/NO-GO y aceptación humana. Actualizar RELEASE_2_STATUS.md sin declarar «Validado» automáticamente.

**DoD:** 28 CA verificados o pendientes explícitamente aceptados por el usuario, ninguna incidencia alta/crítica abierta, seguridad revisada, regresión R1 sin roturas y PR preparada para merge humano.

## E. Dependencias y decisiones técnicas

- **Reutilización obligatoria:** components/EventCard, detalle, consulta/autorización de eventos, política Storage privada y componentes de UI; no duplicar las fuentes de datos.
- **Perfil social:** R1 restringe profiles a su propietario; una proyección segura del organizador/emisor puede ser indispensable en R2. Ese cambio debe diseñarse y probarse sin abrir SELECT general de profiles.
- **Chat:** la escritura debe verificar membresía y estado en la propia BD; recibir Realtime no es evidencia de autorización. Mensajes directos y adjuntos quedan para R5/R7.
- **Notificaciones:** el esquema y la bandeja se adelantan porque R2 los necesita, pero los productores de eventos/avisos quedan para R6. No añadir push_subscriptions aún.
- **UX:** el mockup R2 incluye filtros, favoritos, seguimientos, entradas y métricas sociales que no están definidos para R2. Omitirlos o mostrar solamente funciones reales ya existentes.
- **Aislamiento:** mantener Leaflet dentro de components/maps; la pantalla Inicio no debe depender de Leaflet ni de API de geocodificación.
- **Seguridad heredada:** R1 mantiene avisos de algunas RPC SECURITY DEFINER y leaked-password protection; auditar cualquier superficie nueva, evitar ampliar privilegios por conveniencia. No bloquear R2 por avisos meramente informativos, pero no ignorarlos.

## F. Protocolo de ramas, documentación y aceptación

- Preferir una PR por bloque y, dentro del bloque 2, separar migración de chat y UI si el diff crece demasiado.
- Plan = contrato de alcance; Status = bitácora editable. Si Codex cree que una regla cambia, proponer cambio en PR y pedir aprobación; no reescribir la especificación funcional silenciosamente.
- Actualizar la fila de RELEASE_2_STATUS.md y registrar archivos, pruebas realmente ejecutadas, migraciones, URLs de PR, decisiones y limitaciones; sólo el usuario confirma «Validado».
- **No aplicar SQL remoto, cambiar Realtime o Auth ni hacer merge sin permiso.** Conservar rastreabilidad de autorizaciones y fecha.
- Si un CA requiere una operación imposible con las tablas presentes, explicar la dependencia y proponer la migración mínima antes de construir una simulación visual.

## G. Contrato de prompts breves

Los archivos docs/implementation/prompts/RELEASE_2_BLOCK_0.md a RELEASE_2_BLOCK_5.md contienen solamente el alcance particular de cada bloque. **Se completan leyendo este plan**, los RF/CA oficiales, el estado y el mockup. No reemplazan este documento.

Al recibir un prompt:
1. Leer plan + status + documentación aplicable.
2. Revisar código y base actual.
3. Implementar sólo el bloque.
4. Probar y actualizar status con evidencias.
5. Preparar PR y detenerse hasta revisión.
