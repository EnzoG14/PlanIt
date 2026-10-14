# R4 bloque 7 — Canje de enlace y autorización persistente

13/10/2026, Argentina. Rama `codex/r4-block-7`, base `origin/main` `a0ba1c3` (bloques 5 y 6 integrados). **Implementado; QA pendiente.** RF-R4-08, 5 CA. A01–A07 no se reabren. Sin JWT real, sin aceptación humana, sin «Validado».

## Qué se entrega

| Pieza | Detalle |
| --- | --- |
| SQL | `supabase/migrations/20261014120005_redeem_event_link.sql`: `redeem_event_link(p_token text) returns uuid` (DEFINER, `search_path=''`, EXECUTE sólo `authenticated`). **Creada y probada localmente; aplicada a `planit-v2` el 13/10/2026 con autorización expresa posterior** ([acta](remote-migration-summary.json)). |
| Ruta | `/invite#token=…` (`src/pages/InvitePage.tsx`, `invite.css`), fuera de `RequireAuth`; scope `amanecer-shell invite-shell` en `AppLayout`. |
| Secreto | `src/features/events/invite.ts`: memoria del módulo, ligado a identidad, descartado al cerrar sesión/cambiar de cuenta/consumir/cancelar. `safeReturnPath` admite sólo `/invite` exacto además de los destinos previos. |
| Pruebas | `scripts/check-invite.mjs` (SQL), `scripts/check-invite-ui.mjs` (navegador, fixtures), `scripts/check-invite-http.mjs` (REST/RPC con JWT de fixture, **NOT RUN**). |

## Decisiones de contrato

- Un único error `invite_unavailable` (P0001) para formato inválido, token desconocido, rotado/revocado, evento cerrado o no oculto y usuario revocado: sin enumeración de eventos. Falla de red, sesión vencida y no válido se distinguen sólo en el cliente (por el transporte/estado HTTP), nunca por mensajes SQL distintos.
- Orden de locks: evento → link (relectura) → grant. La rotación, la visibilidad, el cierre y el registro ya toman el lock del evento, de modo que rotar/revocar/publicar antes del canje lo invalida y canjear antes de rotar conserva el grant y mata el token viejo.
- `grant revoked` tiene prioridad absoluta: ni el link vigente ni uno nuevo lo reactivan. Si A pasa el evento a público, C lo ve como público (A05) sin cambiar su grant; al reocultar vuelve a quedar denegado.
- Canjear no inscribe ni consume cupo; «Inscribirse» sigue siendo la acción R1 independiente y exige grant activo. Chat y asistentes siguen exigiendo organizador/`confirmed` real.
- El organizador que abre su propio enlace obtiene el `event_id` sin crear grant.

## Resultados

| Prueba | Tipo | Resultado |
| --- | --- | --- |
| `check:invite` | local SQL (PostgreSQL embebido, `SET ROLE`; sin HTTP/JWT) | 10 grupos PASS: [resultados](postgres-results.json) |
| `check:invite:ui` | navegador Edge, build de producción, Auth/REST interceptados, WebSocket bloqueado | PASS en 320/375/1280: [resultados](ui/results.json) y capturas en [`ui/`](ui) |
| Regresiones | `check:hidden-access`, `check:event-links`, `check:auth`, `check:amanecer`, `check:participations`, build, lint | PASS (lint conserva avisos previos ajenos) |
| HTTP/JWT real, dispositivos, lector de pantalla | — | **NOT RUN** |

Cobertura de CA: CA-01 canje sin inscripción ni cupo; CA-02 idempotencia y nueva sesión sin enlace; CA-03 D y anon denegados por UUID/RPC; CA-04 sólo-grant sin chat ni asistentes; CA-05 token alterado/rotado/revocado, evento finalizado/cancelado/archivado y evento no oculto. Además: revocado C sin recuperación con token nuevo, ida y vuelta público↔oculto, y 5 carreras con espera real en `pg_stat_activity` (rotar primero, canjear primero, doble canje del mismo usuario, revocar primero, publicar primero).

UI: el fragmento desaparece de la URL; el token no aparece en URL de ninguna solicitud ni en `localStorage`/`sessionStorage`; sólo viaja en el cuerpo del RPC; no hay escritura de inscripción; recargar descarta el secreto; red caída → «No pudimos comprobar» sin afirmar acceso; relectura vacía → no se anuncia «Acceso confirmado»; cambio de cuenta descarta el secreto pendiente.

## Composición, foco y scopes (no existía pantalla en el collage)

`docs/design/mockups/release-4.png` no incluye canje; se compuso con Amanecer v3.0 y patrones existentes, usando el lab `/b` sólo como referencia:

- Fondo claro `#f6f5fd`, una mancha superior decorativa `aria-hidden` (`.invite-wash`), un único `h1`, `StatusMessage` para resultados, CTA tinta (`gradient-link`/`GradientButton`) y `secondary-link`, sin gradientes en controles, sin tarjetas anidadas, sin segundo sistema de diseño.
- `AppLayout`: `isInvite` → `amanecer-shell invite-shell`; se mantiene el dock de cuatro destinos (sin quinta pestaña) y el foco a `#main-content` al cambiar de ruta. La página mueve el foco al contenedor del resultado cuando cambia el estado (no válido, red, sesión vencida, acceso confirmado).
- Áreas táctiles ≥44 px (medidas), foco violeta de 3 px, texto operativo ≥13,5 px, `prefers-reduced-motion`/`reduced-transparency` heredados de `.amanecer-shell`.
- Capturas **nuevas** (la pantalla no existía; no hay baseline que comparar). El detalle posterior al canje usa la pantalla existente sin cambios; no se sobrescribe QA histórica.

## Riesgos y límites de evidencia

- **No se declara el token seguro de extremo a extremo.** El fragmento no se envía al servidor, pero existe en la barra/historial hasta ser limpiado y es legible por extensiones; el secreto se pega por el usuario en el portapapeles al compartirlo (B6). Sin telemetría/analytics en el proyecto.
- Confirmar el correo de registro redirige a `/map` (`emailRedirectTo`), por lo que ese camino exige reabrir el enlace original (D10). Recargar también.
- La migración ya está aplicada en `planit-v2`, pero ningún canje real se probó con JWT.
- Todo lo ejecutado es SQL local o fixtures de navegador; ningún CA está validado con JWT real.
