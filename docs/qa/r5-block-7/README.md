# R5 · Bloque 7 — Solicitudes de seguimiento

**Ampliación posterior autorizada — notificaciones Realtime:** [contrato, migración y evidencia nueva](follow-notifications/README.md). Aviso genérico por nueva pending, campana/bandeja existentes y Ver solicitudes. Migración creada/probada local; aplicación remota pendiente de permiso. Supera la exclusión original de productores de abajo, sin alterar evidencia histórica ni acreditar entrega Realtime remota.

14/10/2026, Argentina. Base `cbb05479388d508cb910b98ca6837d0d55614d36`, rama `codex/r5-block-7`. B0–B6 integrados; B6 por PR #56. Alcance RF-R5-06.CA-01..04 y pruebas adicionales D01/D02/D04. **Implementado; QA pendiente**. [PR #57 en borrador](https://github.com/EnzoG14/PlanIt/pull/57), commit de implementación `0a3db2de293017f587aa6259e8f74b54c549a13f`; el commit posterior enlaza seguimiento y normaliza un espacio de log. Sin merge, deploy, cambios SQL remotos ni edición de Google Docs. B8 no autorizado.

## Comportamiento y contrato

`/me` enlaza a `/me/follow-requests`, ruta protegida con regreso y restauración del foco. La bandeja muestra sólo pendientes entrantes, nombre visible, username, avatar y fecha Argentina. Página30, orden ascendente requested_at/follower_id y cursor compuesto; cada ampliación vuelve a consultar páginas anteriores. Entrada a perfil social y regreso validado a la bandeja. Se conservan cuatro destinos primarios y el sistema Amanecer.

Confirmación inline cancelable (Escape/Volver), sin escritura optimista. `resolve_follow_request(p_follower_id,p_request_version,p_decision)` recibe accepted/rejected, nunca actor ni propietario. El servidor deriva destinatario de auth.uid(), toma locks de perfiles en orden UUID y comprueba bloqueo, pareja y generación. Repetir la misma decisión devuelve el estado confirmado; una decisión opuesta falla. Rechazar permite volver a solicitar inmediatamente con generación nueva, salvo bloqueo.

Una escritura tiene timeout10s y bloqueo inmediato de doble envío. Ante error/timeout no se afirma éxito ni rollback: se mantiene la operación incierta y se deshabilitan resoluciones hasta **Consultar estado**. La conciliación sólo hace SELECT request_version/status de una pareja entrante filtrada por seguido=self y solicitante; RLS es autoritativo. Si sigue pendiente se habilita una nueva elección; si fue resuelta se informa el estado real; si desapareció o cambió generación se descarta la intención antigua. Nunca se retransmite automáticamente. La versión se guarda en memoria, sin persistir ni mostrarse en DOM.

Se reutiliza useSocialRead: revalidación visible30s, foco/online/retorno; aislamiento por cuenta/token, abort y limpieza al ocultar/offline/cambiar sesión. Abortar una escritura al ocultar no inicia lecturas en segundo plano. Los listados y contadores B6 se releen al regresar; no se agrega caché persistente, publicación Realtime ni productor de notificaciones. La conversión D04, ya implementada por B1/B4, deja vacía la bandeja tras revalidar; no cambia rejected.

## Autorización y amenazas

| Operación / campos | Destinatario | Solicitante | Confirmed, grant-only o tercero | Bloqueado bilateral | Anónimo |
|---|---|---|---|---|---|
| list_follow_requests: follower_id/request_version/requested_at/display_name/username/avatar | Sólo pending propias | Sólo su propia bandeja, no la ajena | Ningún privilegio social por evento o enlace R4 | Filtrado antes de LIMIT, sin identidad | EXECUTE denegado |
| resolve_follow_request: estado accepted/rejected | Sólo generación actual dirigida a auth.uid() | No resuelve la arista enviada; self inválido | Denegado aunque conozca IDs/versiones | Denegado, relación eliminada | Denegado |
| Conciliación SELECT user_follows: request_version/status | Pareja entrante propia | RLS permite sus propias aristas, sin resolverlas | Otras aristas invisibles | Ausente por cleanup; sin proyección social | SELECT denegado |
| INSERT/UPDATE/DELETE directo user_follows | Denegado; mutaciones sólo RPC | Denegado | Denegado | Denegado | Denegado |
| profiles.* / avatar ajeno / eventos | Datos propios por contrato previo | Sólo proyección social autorizada D02 | Confirmed/unlisted no amplía perfil | D01 sin proyección; C02 conserva permisos de evento | Denegado |

SECURITY DEFINER, search_path vacío y EXECUTE sólo authenticated verificados por catálogo y replay; tablas con RLS. La UI aplica allowlists adicionales sin sustituir autorización. No retorna email, birth_date, sex, file_id/path, ni bio en la bandeja. Los IDs de solicitante/cursor/versión son operativos; sólo solicitante forma el enlace de navegación. Gateway avatar conserva fallback y límite residual60s C03; este bloque no cambia Storage.

## Pruebas y límites

| Caso / CA | Resultado | Evidencia / entorno |
|---|---|---|
| CA01: pendientes propias, cero/34, cursor compuesto y empates30+4, proyección exacta | PASS SQL local/UI fixture | [SQL](sql/sql-results.json), [UI78 grupos](ui/ui-results.json) |
| CA02: accepted, acceso D02 y contador, idempotencia | PASS SQL local/UI fixture | [SQL](sql/sql-results.json), [UI](ui/ui-results.json) |
| CA03: rechazo sin bio, nuevo pedido inmediato con versión nueva | PASS SQL local/UI fixture | [SQL](sql/sql-results.json), [UI](ui/ui-results.json) |
| CA04: actor ajeno/self, generación vieja, doble resolución y RLS directo | PASS SQL local/UI fixture; HTTP anon4 PASS | [SQL](sql/sql-results.json), [UI](ui/ui-results.json), [HTTP](remote/http-anon.json) |
| Aceptar/rechazar entre sí, privacidad, bloqueo, cancelación y renovación | PASS17 carreras B7 con wait_event_type=Lock observado; sin deadlock | [SQL/harness](sql/harness.json); además13 carreras B1 y72 audiencias |
| Rollback de resolución y D04; rejected intacto; grant-only/unlisted sin facultades sociales | PASS SQL local | B7 + suite B1 reproducida |
| Catálogo real, sin filas de usuarios | PASS READ ONLY28 migraciones/16 tablas RLS/79 funciones de aplicación coincidentes | [Catálogo](remote/catalog.json), [comparación](sql/remote-comparison.json), [políticas](remote/policies.json) |
| R1–R4,13 suites existentes con28 migraciones | PASS SQL local | [Regresiones](regressions.json) |
| B6 seguimiento/listas/conciliación,54 grupos | PASS UI fixture | [B6 UI](regression-ui/follows/ui-results.json) |
| B3/B5 perfil público/privado | PASS UI fixture54/79 grupos | [B3](regression-ui/profile/ui-results.json), [B5](regression-ui/private-profile/ui-results.json) |
| Build/lint | PASS; avisos previos de chunk grande y lint histórico | Comandos abajo |
| JWT autenticado remoto, Storage/CDN/Realtime reales, dispositivos/lector de pantalla, aceptación humana | NOT RUN | No cuentas/escrituras remotas autorizadas; no se equiparan con mocks |

SQL usa **PostgreSQL17.5** local efímero, SET ROLE authenticated/anon y scaffolds SQL Auth/Storage. No es stack Supabase completo ni transporte JWT. HTTP real sólo verifica denegaciones sin sesión. UI sirve un build real con fixtures de Auth/REST; puede probar render, navegación y red simulada, nunca RLS remoto. Revalidación externa puede demorar hasta30s más latencia; varias RPC/páginas no son un snapshot único. No prometer revocación instantánea ni invalidación de URLs ya emitidas.

### Diseño y evidencia

Modo Operate heredado: tokens --pi-*, mancha superior única, Bricolage autoalojada, botones compartidos y superficies sociales. No se cambian DESIGN, tokens ni mockups. Baseline de perfil existente en [before](ui/before/); la bandeja es nueva y no tiene captura anterior equivalente. Capturas finales de bandeja/confirmación/vacío/error/denegación/resultado incierto/texto largo en390/1280, realizadas sobre aplicación ejecutada con fixtures. Verificación automatizada320/360/375/390/768/1280, texto200%, altura400, Escape/foco y controles44px. Detector mecánico sin hallazgos; no equivale a aceptación visual.

La inspección detectó contraste incorrecto al usar sólo la clase del botón: se sustituyó por GradientButton compartido y se añadió aserción blanco/tinta. Se corrigió también la reconsulta tras abortar una escritura en pestaña oculta. Los primeros intentos del runner detectaron expectativas/esperas incorrectas, uso de una API de reloj inexistente y reinyección de sesión fixture tras logout; se ajustó el runner. La regresión B3 necesitó respuestas fixture para relationship/counts agregadas por B6: se añadieron sin cambiar expectativas históricas. Sólo los resultados finales de cada JSON acreditan PASS.

### Comandos reproducibles

```powershell
npm run build
npm run lint
npm run check:r5:requests
npm run check:r5:requests:ui
npm run check:r5:requests:http
$env:PLANIT_SQL_OUTPUT='docs/qa/r5-block-7'
node scripts/check-r5-regressions.mjs
$env:PLANIT_UI_OUTPUT='docs/qa/r5-block-7/regression-ui/follows'
node scripts/check-r5-follows-ui.mjs
$env:PLANIT_UI_OUTPUT='docs/qa/r5-block-7/regression-ui/profile'
node scripts/check-r5-profile-ui.mjs
$env:PLANIT_UI_OUTPUT='docs/qa/r5-block-7/regression-ui/private-profile'
node scripts/check-r5-private-profile-ui.mjs
```

La última UI B7 se ejecuta con `PLANIT_UI_BUILD=.r5-final-build.local` tras `npm run build -- --outDir .r5-final-build.local`, para no reemplazar el build usado por regresiones simultáneas. SQL requiere herramientas locales ya utilizadas por B1; Edge/Node disponibles, sin dependencias nuevas. Los runners redirigen evidencia a B7; no sobrescriben QA histórica. Para mantener revisable la PR se conservan JSON/logs de regresión y capturas B7; las capturas duplicadas de regresiones B3/B5/B6 generadas en esta ejecución se retiraron del paquete.

## Archivos, migraciones y revisión

Producto: `src/features/social/requests.ts`, `src/pages/FollowRequestsPage.tsx`, `src/pages/follow-requests.css`; integración mínima en App.tsx, AppLayout.tsx, ProfilePage.tsx y SocialIdentityPage.tsx. Pruebas: tres runners check-r5-requests*, comandos npm y cuatro líneas de compatibilidad de fixtures en check-r5-profile-ui.mjs. Seguimiento: PLAN/STATUS/README R5, matriz de aceptación, arquitectura y estado visual; evidencia nueva en este directorio. Lista exacta y hashes en el manifiesto de entrega.

`.env.local` copiado byte a byte desde la configuración del checkout principal, preservada al partir de main; ignorado, sin contenido ni claves en evidencia o Git. Sin cambios de dependencias/lockfile, SQL histórico, R1–R4, permisos de eventos, fechas o chat grupal.

| Migraciones nuevas B7 | Creada | Probada local | Aplicada remota | Verificada remota |
|---|---|---|---|---|
| Ninguna | 0 | 0 | 0 | 0 |

El replay de28 existentes y comparación remota no es aplicación de migraciones. Para revisión: comprobar generación y conciliación, negativo de actor ajeno, carreras D04, estados/foco móvil y campos permitidos. Los cuatro CA quedan PASS técnico parcial/NOT RUN integral hasta QA con sesiones reales y aceptación humana. D04 Google Docs sigue pendiente de autorización documental separada. Siguiente bloque: B8, mediante instrucción independiente.
