# Amanecer — corrección de B8-01 y B8-02

Base: `origin/main` `89f32d5c83a0f91477863fb3b1b4dcf904f55f9b`. Rama: `codex/fix-ui-refresh-p1`, checkout e índice CodeGraph propios. La auditoría [PR #36](https://github.com/EnzoG14/PlanIt/pull/36) conserva sus resultados y capturas históricas. Este informe acredita únicamente la corrección técnica de sus dos P1; los P2 y la aceptación integral de R1–R3 siguen pendientes.

## Cambios

- **B8-01:** boundary alrededor de `Outlet` dentro de AppLayout. Conserva el shell existente y presenta «No pudimos abrir esta pantalla», explicación, recarga manual y salida a Perfil. Cambiar la ubicación reinicia el error sin usar una key para remontar pantallas sanas. El mensaje recibe foco y el fallback de Chat admite desplazamiento con poca altura. La recarga mantiene pathname, query y hash; no hay reintentos automáticos de la promesa lazy rechazada.
- **B8-02:** únicamente el aviso no vacío de Detalle usa los tokens success-bg y success-on-bg, padding y radio del sistema. Conserva texto, `role="status"` y handlers de cancelación/archivo. Contraste calculado desde los colores renderizados: **8,5508:1** (antes: 1,241:1 según la auditoría).

Sin dependencias nuevas, cambios de Auth, APIs de negocio, SQL, caché o tokens normativos. Se conserva la modificación local de `D:\planit\vite.config.ts` en el checkout original.

## Evidencia específica

[Resultados y capturas](../../design/verification/ui-refresh/p1-fixes/89f32d5/README.md), obtenidos con Edge headless y servicios interceptados, sin mutaciones remotas:

- Desarrollo: **52/52 PASS**. Producción: **52/52 PASS**, abortando los chunks reales del build. Los service workers están desactivados para hacer determinista la descarga; no se acredita recuperación de un service worker real.
- Cada uno de los once módulos diferidos falla realmente por una descarga abortada: Inicio, Mapa, Detalle, Mis eventos, Crear, Editar, Galería, Participantes, Solicitudes de reingreso, Chat y Notificaciones. Se verifica raíz no vacía, foco, Tab/Enter, controles alcanzables, salida a Perfil y a otra ruta sana, regreso al rechazo cacheado y recarga de la misma URL tras restaurar la descarga.
- Inicio, Mapa y Detalle: 320×800, 360×800, 375×812, 390×844, 768×1024 y 1280×900. Chat: 320×240 y 390×240 con texto al 200%. El filtro de Mis eventos conserva la identidad DOM de la pantalla al cambiar la query.
- Cancelación y archivo: ambos mensajes exactos, status conservado, una única operación interceptada, contraste ≥4,5:1 en los seis viewports por entorno. Capturas revisadas de fallback móvil, Chat de poca altura y éxito en producción.
- Build, lint, validación Amanecer, foundation y auth: PASS. Detector Impeccable sobre el cambio: sin findings; no sustituye pruebas ni aceptación humana.

Los primeros intentos del check específico fallaron por buscar «Archivar» para abrir el diálogo, cuyo botón existente es «Archivar evento». Se corrigió el selector del test; se conservan logs y resultados iniciales con exit 1, separados de las ejecuciones finales PASS.

## Regresiones y límites

Se ejecutaron los runners existentes con fixtures y salida aislada. Los resultados completos y sus comandos están en el directorio de evidencia. Las once suites UI seleccionadas de R3 pasan (11/11): Mis eventos, edición, galería, participantes, acciones, reingreso, participaciones, Inicio, Chat, Realtime y descubrimiento. Los checks adicionales de Auth Amanecer, eventos, layout de Chat, Perfil, Notificaciones, social y shell pasan. El runner de Notificaciones pasa esta vez; su fallo intermitente registrado en #36 sigue siendo evidencia histórica.

Se conservan explícitamente como **FAIL** dos runners conocidos:

- `check-my-events-refresh-ui.mjs after`: expectativa antigua de ausencia de Cuenta en otras rutas; el encabezado compartido ya muestra Cuenta.
- `check-discovery-refresh-ui.mjs after`: desbordamiento horizontal de Detalle a 320 px con texto ampliado, P2 fuera del alcance.

No se modificaron estos runners para convertirlos en PASS. La prueba específica nueva cubre las correcciones aunque la regresión general conserve esos fallos. No se realizaron pruebas físicas de teclado móvil, gestos, lector de pantalla o aceptación humana; `role="status"` preservado no acredita por sí solo un anuncio real con lector de pantalla. No se repitieron pruebas SQL ni se alteró el estado funcional de las releases. Sin merge automático.
