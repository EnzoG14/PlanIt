# Evidencia BLOQUE 5 — Release 2

11/10/2026 Argentina; base `8d21ed4`, rama `codex/r2-block-5-qa`.

Los `.txt` y JSON corresponden a esta corrida. `local-results.json` registra doce suites locales PASS; `ui-results.json` registra las ejecuciones finales exitosas, conservando el intento previo de mapa en `ui-initial-results.json`. `live-readonly.json` contiene sólo aserciones de Auth/REST/Storage y navegador reales: exit 0 con tres escenarios PENDING, sin escrituras de datos. `advisors.json` y `migrations.json` proceden de MCP de lectura. No se incluyen credenciales ni datos personales reales.

Las capturas son **fixtures** (Edge a 375×812 y 1280×900); no son E2E remoto ni aceptación humana. La revisión preserva la identidad original del [mockup R2](../../../design/mockups/release-2.png).

| Pantalla | Móvil | Escritorio |
| --- | --- | --- |
| Inicio | [Captura](home-detail/home-mobile.png) | [Captura](home-detail/home-desktop.png) |
| Detalle | [Captura](home-detail/detail-mobile.png) | [Organizador/CTA](home-detail/detail-organizer-desktop.png) |
| Chat | [Captura](event-chat/chat-mobile.png) | [Captura](event-chat/chat-desktop.png) |
| Mi perfil | [Captura](own-profile/profile-avatar-mobile.png) | [Captura](own-profile/profile-avatar-desktop.png) |
| Notificaciones | [Captura](notifications/mobile-inbox.png) | [Captura](notifications/desktop-inbox.png) |

[Matriz de 28 CA](../../RELEASE_2_ACCEPTANCE.md) · [Informe, riesgos y pendientes](../../RELEASE_2_TEST_REPORT.md). Ningún CA se marca Validado.
