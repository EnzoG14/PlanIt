# Mensajes: hora interior y separadores diarios · 18/10/2026

Rama `codex/chat-day-groups`. Chats privados y de eventos conservan sus pastillas y muestran la hora HH:mm dentro, abajo a la derecha. Un separador por día muestra «Hoy», «Ayer» o fecha completa. Argentina es la zona de referencia. Adjuntos y texto comparten burbuja; la hora queda debajo de la imagen. Sin cambios de contratos ni backend.

## Evidencia

- `before-*.png`: chat de eventos previo en 360, 375, 390 y 1280 px, con fixtures de un solo día.
- `after-*.png`, `days-*.png`, `media-*.png`, `keyboard-height-*.png` y `after-results.json`: Edge headless con fixtures explícitos de Auth/RPC/Phoenix, tres días e icono PWA como imagen de prueba. Anchos 320, 375, 390, 768 y 1280 px. No son datos reales.
- `dm-after/`: matriz privada en 320, 360, 375, 390, 768 y 1280 px; capturas del runner en 390/1280 px.
- `dm-build/`: comprobación adicional del build de producción en 390 px, servido por el propio runner.
- `dm-before/`: baseline privado móvil de 390 px. Falló después de capturar historial, en una carrera del runner al reintentar un error de red. El runner final espera la petición fallida y usa el control estable de actualización; la matriz final se ejecutó completa.

La revisión visual de capturas conserva Amanecer: pastillas marinas/blancas, hora secundaria y fechas centradas con tokens existentes. Los separadores quedan fuera de la selección del mensaje usado como anclaje de scroll. Las etiquetas relativas se actualizan a medianoche y al regresar a la ventana/pestaña.

## Reproducción

Con Vite disponible en `http://127.0.0.1:4183`:

```powershell
node scripts/check-chat-dates.mjs
node scripts/check-realtime.mjs
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4183'
$env:PLANIT_UI_OUTPUT='docs/design/verification/chat-day-groups'
node scripts/check-chat-layout-ui.mjs
$env:PLANIT_UI_OUTPUT='docs/design/verification/chat-day-groups/dm-after'
node scripts/check-r5-messages-ui.mjs
```

Para probar el build privado, quitar `PLANIT_UI_ORIGIN`, usar `PLANIT_DM_WIDTH=390` y ejecutar el runner DM después de `npm run build`. Requiere Edge y el Playwright local indicado por cada runner.

## Resultados y límites

PASS: build, lint (advertencias preexistentes), fechas (medianoche argentina, cambio de mes/año, año bisiesto y fracciones), reconciliación/realtime simulado y matrices UI. Se verificaron horas dentro de burbujas, separadores únicos, navegación/fechas en Tokio, medianoche automática con reloj simulado, adjuntos con/sin texto, paginación con anclaje, recepción mientras se lee, envío, sólo lectura, foco, texto200%, poca altura y viewport visual. DM también cubre reconciliación de envío, bloqueo, errores, desconexión y texto largo.

El runner de eventos se actualizó a `get_event_chat_messages_v2` y `send_event_chat_message_v2`, contratos vigentes. Las pruebas interceptan los servicios y no acreditan JWT/RLS ni escrituras remotas.

`node scripts/check-r5-messages.mjs` no pudo iniciar la comprobación SQL: falta `.participation-test-tools.local/node_modules/pg/lib/index.js`. No se instalaron dependencias ni se aplicaron migraciones.

Pendientes: aceptación humana, dispositivo físico, teclado móvil, lector de pantalla y comprobación específica de fallback de fuente y preferencias de transparencia/movimiento. La emulación no acredita esas verificaciones. No cambia la aceptación funcional histórica de R1–R3.
