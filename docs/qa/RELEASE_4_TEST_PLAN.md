# PlanIt — Release 4: plan de pruebas y seguridad

**Tipo de documento:** diseño de pruebas, no resultados. **Acuerdos de producto A01–A07 confirmados el 12/10/2026**; son escenarios obligatorios, no alternativas. Matriz oficial 39 CA en `RELEASE_4_ACCEPTANCE.md`. Preparar fixture local seguro con cinco identidades: A dueño, B invitado con `active`, C invitado `revoked`, D tercero autenticado sin grant, E participante confirmado histórico de evento convertido; y anon. Fechas y horas interpretadas en Argentina. Los usuarios deben ser de prueba, sin identificar personas reales.

## 1. Casos funcionales y de descubrimiento

| ID | Escenario | Resultado esperado |
| --- | --- | --- |
| D01 | Buscar título y sólo descripción; mayúsculas/minúsculas | Coincidencias correctas sin falsos positivos |
| D02 | Literal `%`, `_`, `\\`, comillas, cadenas vacías y texto muy largo | Escaping correcto, sin wildcard libre ni SQL injection |
| D03 | Dos categorías elegidas | Unión OR sólo dentro de categorías |
| D04 | Texto + categorías + fecha + radio | Intersección AND entre grupos; no inconsistencias mapa/lista |
| D05 | Limpiar categoría o fecha únicamente | Mantener otros filtros sin estado obsoleto |
| D06 | Fechas inicio/fin invertidas, 29/02 inválido, rango de un día | Validación y límites completos AR |
| D07 | Evento cruza medianoche; navegador en UTC/u otra zona | Coincide si **starts_at** cae en rango AR; si comenzó antes queda fuera aunque finalice dentro (A02) |
| D08 | GPS denegado, timeout o HTTP sin HTTPS | Fallback automático **centro del mapa**, etiqueta clara; centro inicial Buenos Aires no se llama GPS ni ubicación del usuario (A01) |
| D09 | Radio en el borde, 0, negativo, NaN, 1e12, lon ±180 | Distancia válida/bounded; parámetros inválidos rechazados |
| D10 | Cambio rápido de filtros, mapa movido, paginación con cursor | Respuestas viejas descartadas, resultados deduplicados |
| D11 | Red interrumpida/error RPC y lista vacía legítima | Mensajes separados, reintento sin pérdida de criterios |
| D12 | Búsqueda y filtros integrados en Inicio y Mapa | Ambos preservan filtros, no existe nueva ruta `/search`, mismo universo público autorizado (A03) |

## 2. Preferencias y recomendaciones

| ID | Escenario | Resultado esperado |
| --- | --- | --- |
| P01 | A guarda 0, 1, varias categorías y reabre | Estado persistido correcto; sin duplicados |
| P02 | A guarda intereses y B consulta/escribe A por REST/RPC | Denegado; aislamiento A/B |
| P03 | Categoría inactiva y selección concurrente/cambio de catálogo | No agregar nuevo interés inactivo; error sin guardado parcial |
| P04 | Falla de red a mitad de guardado | Estado confirmado se conserva o se reconcilia, sin falso éxito |
| P05 | Ranking con igual score y candidatos permutados | Desempate reproducible y misma prioridad |
| P06 | Sin intereses, sin GPS, sin eventos o evento ya cerrado | Fallback explicado o vacío real; no inventar resultados |
| P07 | Evento `unlisted` con grant `active` | Jamás aparece en «Para vos» general |

## 3. Seguridad y flujo oculto (incluir SQL + HTTP JWT real)

| ID | Escenario | Resultado esperado |
| --- | --- | --- |
| H01 | A publica directamente `unlisted` | Jamás existe estado `public` intermedio |
| H02 | D conoce UUID de evento oculto pero no token/grant | SELECT, RPC, detalle, medias y listas denegados |
| H03 | D obtiene texto/token de invitación sin canje | No habilita chat, asistentes ni lectura libre por URL normal |
| H04 | B canjea token y abre detalle | `grant active` persistente; sin inscripción/cupo consumido |
| H05 | B repite canje; dos peticiones simultáneas | Un único grant por pareja; ninguna violación de integridad |
| H06 | A rota token dos veces simultáneamente | Un solo link activo; anteriores inutilizados para nuevos canjes |
| H07 | A rota token luego de conceder B | Grant `active` B permanece vigente |
| H08 | C está `revoked`, abre token antiguo/nuevo | Denegado; nunca pasa a active por canje |
| H09 | Token con un byte alterado/inválido/ausente | Error controlado sin revelar si evento existe |
| H10 | Canje con evento terminado/cancelado/archivado | Nuevos accesos denegados; grants previos conservados salvo revocación |
| H11 | A convierte public→unlisted con E confirmed sin revoked | Crear grant active a E dentro de la misma transacción; E conserva acceso y chat por confirmed (A04) |
| H12 | A convierte unlisted→public con C revoked | C ve detalle por política pública sin recibir grant active ni reingreso; al reocultar C vuelve a quedar excluido (A05) |
| H13 | Usuario B no confirmed con grant active | Detalle permitido; chat/participantes denegados por RPC/REST |
| H14 | C confirmed; A revoca | Transacción remueve a C, historia exactamente una vez, libera cupo, grant revoked |
| H15 | Fallo inyectado en historial/cambio de grant | Rollback total sin parcialidad ni cupo falso |
| H16 | Concurrencia revocación vs inscripción/reingreso | Sin deadlock persistente ni sobrecupo; locks consistentes |
| H17 | A restituye a C | Grant active; C no vuelve a confirmed ni chat automáticamente |
| H18 | Usuario B intenta revocar a D / llamar RPC de A | Denegación 42501/RLS sin efectos |
| H19 | C revocado tenía participación histórica | `events_select_participating`, summary, rejoin, organizer, dup source, gallery NO filtran datos ocultos |
| H20 | C conoce storage_path y pide nueva URL firmada | Denegación a `files`/`event_images`/Storage; documentar URL vieja hasta TTL |
| H21 | Vence Auth durante canje; login y retoma | Token no termina en logs/referrer, canje sólo tras auth; limpieza de URL |
| H22 | Se cambia de usuario B→D con pestaña abierta | No persisten datos privados en estado, media firmada ni SW cache |
| H23 | Evento oculto con dueño A, grant B, no invitado D | RLS `SELECT` sobre tablas links/grants no revela token_hash ni otras personas |
| H24 | A duplica evento oculto | No copia token, grants, historial, chat; visibilidad se decide conscientemente |
| H25 | Convertir public→unlisted con C `confirmed` + grant `revoked` | Abort transaccional completo, mensaje de conflicto, no reinscribir ni expulsar silenciosamente (A04/A05) |
| H26 | Reabrir como unlisted después de etapa public | Grants `revoked` históricos siguen revocados; el enlace viejo no vuelve a admitir canjes si se adopta D12 |
| H27 | Hash solamente y enlace perdido | No existen tokens claros persistidos ni mecanismos de recuperación; al regenerar, token anterior inválido, grants activos conservados (A06) |
| H28 | Carrera entre inscripción y public→unlisted | Bloquear evento evita confirmed sin grant; completar grant o fallar atómicamente |

## 4. Regresiones R1–R3 mínimas

- Registro/login/revalidación email y redirect HTTPS; logout, sesiones cruzadas.
- Crear eventos públicos y media, editar y validar cupo, cancelar, archivar, duplicar y navegación My Events.
- Mapa/Inicio, detalle, categorías, fotos/Storage, coordenadas; no degradar viewport y paginación.
- Registro/leave/cupo, participación `cancelled/removed` e historial; no permitir reintegración unilateral.
- Chat real y Realtime: dueño/confirmed sí, removed/cancelled no; flujo read-only al cerrar.
- Reincorporación pendiente/rechazada/aprobada, cooldown de 7 días, última plaza, fallos transaccionales. **R3 está aceptada según el responsable**: ejecutar sólo smoke de regresión e integración, no reabrir validación funcional previa.
- Perfil, bandeja de notificaciones y rutas directas.

## 5. Instrumentación / reporte

Cada caso debe registrar dataset y reset/ROLLBACK, SQL o comando, identidad/rol, request/response **sin tokens**, resultado esperado/obtenido, fecha, evidencia y tipo (mock vs JWT real). Capturas en viewport 360, 375, 390, 768 y 1280. Revisar Advisors Supabase antes/después y EXPLAIN para consultas costosas. Informe final `RELEASE_4_TEST_REPORT.md` con defectos abiertos, impacto y decisión GO/NO-GO. No ejecutar operaciones remotas de prueba sin autorización.

## QA visual Amanecer v1.2 (13/10/2026; aún NO ejecutado)

La autoridad visual es `DESIGN.md` y `docs/design/DESIGN_SYSTEM.md`; `docs/implementation/RELEASE_4_VISUAL_INTEGRATION.md` especifica rutas, componentes y estados. **No** aprobar ni rechazar la apariencia por comparación pixel-perfect con `docs/design/mockups/release-4.png` o fixtures de `design-lab`: son referencias funcionales/compositivas históricas.

- Incluir nueva UI R4 sobre `HomePage`, `MapPage`, `EventCard`, `ProfilePage`, `CreateEventPage`, `EditEventPage`, `EventManagement`, `EventAttendeesPage` y rutas nuevas; mantener `.amanecer-shell` y `--pi-*`, cuatro tabs y cabeceras vigentes.
- Matriz de viewports 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900, baja altura y texto ampliado. Contraste violeta/tinta, foco 3px, target 44px, translucidez reducida, movimiento reducido, fuente self-hosted, sin gradientes, fondo claro.
- Mapa: Mapbox Standard day, marcadores y preview único, seleccionar/deseleccionar con foco, fallos Mapbox/GPS y radio desde centro visible. Inicio: cursor/paginación, agrupación, resultados filtrados, estados error/vacío. Links: URL no expone token en logs, hash sólo en BD, no acceso sin grant.
- Ejecutar build/lint, `check:amanecer`, `check:home-events`, `check:home:ui`, `check:discovery`, `check:discovery:ui`, `check:mapbox`, `check:events:ui`, `check:edit-event:ui`, `check:event-actions:ui`, `check:attendees:ui`, `check:profile:ui`, `check:participations:ui`, `check:rejoin:ui`, `check:auth` según `package.json`, y suites nuevas. No sobrescribir reportes del refresh; capturas por bloque R4.
- Diferenciar fixtures y PostgreSQL efímero de Auth/JWT A/B reales, dispositivos y aceptación humana. No marcar PASS/E2E/GO si no se ejecutó.
