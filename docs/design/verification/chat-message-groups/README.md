# Tandas de mensajes · 18/10/2026

Refinamiento sobre [hora y separadores diarios](../chat-day-groups/README.md), en la misma rama `codex/chat-day-groups`.

- Privados: se elimina el nombre sobre cada mensaje; el nombre del interlocutor permanece en el encabezado.
- Eventos: nombre y usuario al inicio de cada tanda. Una tanda continúa sólo si el mensaje inmediatamente anterior es del mismo remitente y del mismo día argentino.
- Ambos: 4 px entre pastillas de una tanda, 20 px al cambiar remitente o junto a separadores diarios. Se conservan hora interior, colores, adjuntos y alineación.

## Evidencia y reproducción

Las capturas anteriores están en `../chat-day-groups/`. Las actuales usan Edge headless con fixtures explícitos de Auth/RPC/Phoenix; el icono PWA identifica la imagen de prueba. Sin datos ni escrituras remotas reales.

`after-*.png`, `days-*.png`, `media-*.png`, `keyboard-height-*.png` y `after-results.json`: eventos en 320/375/390/768/1280 px. El runner comprueba 4 px de separación, ausencia de cabecera en continuaciones y cabeceras en cada inicio de tanda, además de fechas, scroll, paginación, recepción, imágenes, foco, poca altura y texto ampliado.

`dm/`: build de producción con fixtures en 320/360/375/390/768/1280 px; ausencia de nombres en el historial y separación de 4 px, junto con las regresiones existentes de envío, errores, bloqueo, desconexión y retorno. Capturas en 390/1280 px.

```powershell
node scripts/check-chat-dates.mjs
npm run build
npm run lint
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4183'
$env:PLANIT_UI_OUTPUT='docs/design/verification/chat-message-groups'
node scripts/check-chat-layout-ui.mjs
Remove-Item Env:PLANIT_UI_ORIGIN
$env:PLANIT_UI_OUTPUT='docs/design/verification/chat-message-groups/dm'
node scripts/check-r5-messages-ui.mjs
```

Build y lint aprobados, con advertencias preexistentes. Utilidades verificadas para primer mensaje, mismo remitente/día, cambio de remitente y cambio de día. Revisión visual de capturas móvil/escritorio; aceptación humana, dispositivos físicos y lector de pantalla pendientes. No modifica contratos, backend ni aceptación funcional R1–R3.
