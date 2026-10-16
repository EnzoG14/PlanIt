# R7 · Bloque 8 — Estado de entrega

Fecha: 16/10/2026 (Argentina). Rama: `codex/r7-block-8`. Base limpia tras fetch: `5adf8e455c90d46adc0f5477c5d3e9ee06eb2461`, main con B0/#74 integrado.
PR: pendiente de publicación; se registra al crearla.
Estado: implementación aislada; verificación técnica local PASS. **Aceptación integrada y selector nativo real pendientes; no se declara GO funcional R7.**

## Autorización y alcance

El responsable pidió B8 y confirmó en este chat el contrato: ocultos sólo organizer con invitación válida en memoria; sin token, Compartir deshabilitado y regeneración explícita separada. Luego autorizó implementar el plan. Esto ratifica el contrato de B8/D07 y su interfaz D17; no firma decisiones de otros bloques del acta B0.

Se entregan `share.ts`, `EventShareAction.tsx`, CSS acotado, scripts/fixture y evidencia. No se editaron EventDetailPage, App, EventLinkPanel, links.ts, calendario, migraciones ni seguimiento global. B11 conserva composición y consolidación.

## Criterios y capas

| Criterio | Evidencia de este bloque | Pendiente |
|---|---|---|
| RF-R7-06.CA-01 | PASS local: gesto invoca share inmediatamente; fallback de copia sin soporte | NOT RUN: acción desde detalle y selector nativo real |
| RF-R7-06.CA-02 | PASS local: título/fecha Argentina/URL canónica, Unicode, BASE_URL y origin seguro | NOT RUN: apertura del enlace compartido en despliegue real |
| RF-R7-06.CA-03 | PASS mock/UI: AbortError neutral, limpia éxito previo, conserva ruta | NOT RUN: cancelación de selector nativo en dispositivo |
| RF-R7-06.CA-04 | PASS contrato/UI: allowlist mínima y ocultos owner-only; PASS SQL R4 para ACL, rotación/revocación | NOT RUN: HTTP/JWT remoto e integración final B11 |

| Verificación | Estado / evidencia |
|---|---|
| Contrato Share y Clipboard | PASS: 6 grupos en [contract-results.json](contract-results.json) |
| UI aislada | PASS: 31 comprobaciones, Edge headless, 320/375/390/768/1280 y zoom CSS 200%; [ui-results.json](ui-results.json) |
| Inspección visual | Fixture con shell Amanecer; copia manual, foco y estados; [capturas](visual/) |
| R4 links / access / redeem | PASS: 8 + 8 + 10 grupos; PostgreSQL real aislado con scaffolding Auth/Storage y SET ROLE |
| Concurrencia/negativos | PASS local: doble gesto/respuesta obsoleta; carreras de rotación/canje/revocación y rollback en suites R4 |
| Build / lint | PASS; advertencias preexistentes de lint y tamaño de chunks, sin nuevas dependencias |
| HTTP/JWT remoto, selector real móvil/desktop y recepción externa | NOT RUN |
| Lector de pantalla, hardware móvil y PWA instalada | NOT RUN |
| SW/offline y regresión completa R1–R6 | NOT RUN; sin cambios SW/PWA ni reapertura de R6; build y regresiones R4 no equivalen a QA completa |

## Compatibilidad y seguridad

- Sin cambios de BD, RPC, Storage, SW ni dependencias. Migraciones: **0 creadas / SQL nuevo local N/A / 0 aplicadas remotamente / 0 verificadas remotamente**.
- `.env.local` copiado desde main, ignorado y fuera del commit; no se imprime ni adjunta. Índice CodeGraph propio e ignorado.
- Payload construido por allowlist; excluye dirección, ubicación, asistentes, chats, estadísticas, contactos y credenciales. Para público sólo URL canónica; para oculto sólo invitación R4 autorizada.
- Token sólo en memoria/prop y, si el usuario elige copiar manualmente, campo visible. Sin persistencia, analytics ni rotación al compartir.
- Los booleanos del DTO son UX: R4 decide acceso al canjear. Validar el formato de un token **no comprueba que siga activo**; get_event_link_status sólo devuelve booleano y no identifica el token vigente.
- El componente descarta respuestas anteriores al cambiar entradas o desmontarse; B11 debe remount por sesión y retirar datos al perder autorización.
- Las capturas/fixtures usan datos sintéticos. El origin HTTPS de UI está interceptado hacia Vite local y las APIs Share/Clipboard están mockeadas: no acredita TLS desplegado ni selector nativo.

## Gate y próximos pasos

B8 se entrega como PR draft revisable. B11 debe conectar DTO autorizado y traspaso de invitación efímera del diálogo R4, limpiar al cerrar/cambiar cuenta/rotar, probar flujo desde detalle y mantener D07. Sin token no se inventa un enlace recuperable ni se rota automáticamente. Si se introduce un despliegue en subruta, B11 debe alinear router y generación R4 con BASE_URL; esta PR no cambia ese contrato.

Revisión humana e integración B11 + pruebas reales HTTPS/móvil/desktop habilitan la aceptación funcional. No merge, deploy, SQL remoto ni otros bloques ejecutados. La matriz global RELEASE_7_STATUS.md queda reservada a B11.
