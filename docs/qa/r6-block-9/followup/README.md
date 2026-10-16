# R6 B9 — seguimiento autorizado

Continúa la PR draft #72. [Resumen y 24 CA](summary.json), [reporte vigente](../../RELEASE_6_TEST_REPORT.md). Los originales B9 y sus hashes permanecen intactos. NO-GO hasta aceptación humana expresa.

## Resultado

- Dos P2 resueltos: reflow sin mínimo rígido, dock de cuatro destinos con reserva medida; test de Cuenta actualizado con teclado, Escape, foco y regreso.
- Run `20261015-01`: HTTP/JWT 11 casos, Realtime SDK 4, app abierta 2; preparación y cierre de 12 eventos PASS.
- Run `20261015-02`: UI real 50 casos, zoom nativo Edge 24, cierre de 11 eventos PASS. Se reutilizaron los 14 usuarios QA dedicados.
- Build/lint y contratos 5/5; regresiones compartidas de notificaciones/navegación 5/5. Los intentos fallidos quedan conservados; el resumen usa el último resultado.

## Reproducción

1. `npm ci`, `.env.local` ignorado con URL y publishable key de planit-v2; `npm run build`.
2. Proveer por canal privado `.r6-live.local/admin.json` con `{ "project": "iepeqmvzjguwlhnecsdq", "key": "<admin privada>" }`, sólo para crear usuarios. El aprovisionador verifica también dos cuentas existentes de `PLANIT_EXISTING_QA_ACCOUNTS` (array local de email/password; por defecto D:/planit/.auth-test.local).
3. Elegir run_id nuevo. Ejecutar cada etapa explícitamente: `npm run check:r6:live -- prepare --remote --project-ref iepeqmvzjguwlhnecsdq --run-id RUN`, luego `http`, `realtime`, `browser`, `ui`, `native` y finalmente `close` con los mismos argumentos.
4. `npm run check:r6:followup -- checks --run-id RUN` y `regression-ui` guardan logs nuevos sin sobrescribir B9. El generador de reporte consolida los runs auditados 20261015-01/02; para nuevas ejecuciones revisar esos identificadores.

Las credenciales, sesiones, manifiestos y perfiles Edge viven únicamente bajo `.r6-live.local/`, ignorado. Nunca pasar clave administrativa en CLI, VITE, navegador o evidencia. Sólo prepare la lee; todas las aserciones usan login normal + publishable key. Los IDs públicos en evidencia identifican exclusivamente fixtures sintéticos. Cerrar la ejecución incluso si falla una etapa; no borrar usuarios o historial. `close` valida propietario/título, archiva mediante RPC y confirma cancelación y archivo. La copia administrativa local fue retirada. No hay DDL ni migraciones.

## Métodos y límites

HTTP prueba cinco RPC analíticas y lecturas privadas con A/B/C/D/anon. Realtime espera SUBSCRIBED (30s), entrega positiva (30s) y 15s de observación negativa. Cubre episodios, reintento de una operación confirmada y reconexión; no simula una pérdida real de acuse TCP. La app usa REST/WebSocket real sin interceptar; la desconexión de red se induce con Playwright y se observa la conciliación.

UI mide 320/360/375/390/768/1280, normal y CSS zoom200%, títulos y controles internos, último control desplazable sobre dock. Edge nativo usa una extensión local temporal con tabs.setZoom/getZoom: se registran dimensiones antes/después, innerWidth/outerWidth, DPR, visualViewport.scale y body.zoom; no se sustituye con CSS, pinch ni densidad forzada. Los viewports están emulados; dispositivos físicos, lector de pantalla y Excel real siguen pendientes. Capturas nativas de viewport evitan que fullPage cambie las dimensiones al capturar.

El último cambio sólo renombra las variables de medidas dinámicas a `--dock-*` para distinguirlas de tokens normativos `--pi-*`; build/lint/contrato Amanecer final PASS. No cambia las medidas probadas ni la paleta.
