# Verificación del bloque 6 social

Base: `da90d985865d9c9f681bbda0e011fa484d39040e`. Dirección aprobada: B · Amanecer v3.0. Alcance: chat de evento, perfil propio y bandeja interna.

## Evidencia visual

- `before/`: 32 capturas de las fuentes del SHA base, no una recreación del tema mediante overrides; además 3 referencias del lab con datos ficticios. [Mediciones](before/results.json).
- `after/`: 33 capturas del refresh final. [Mediciones](after/results.json). Comparación a 320×800, 360×800, 375×812, 390×844, 768×1024 y 1280×900; mismo Edge y fixtures HTTP/Phoenix. Sin overflow horizontal detectado.
- En ambos: carga, error, vacío/datos ausentes y textos largos a 390 px; chat con 50 mensajes cargados, sólo lectura y viewport de 320×400; captura adicional de altura de teclado simulada 320×320.
- Después: reduced-motion/reduced-transparency, texto de perfil aumentado y foco/retorno del menú Cuenta. Fuente local esperada con `document.fonts.ready`; no prueba de bloqueo de fuente.

Primera inspección móvil/escritorio detectó el marco de foco automático de main. Se corrigió localmente sin retirar foco de controles; segunda tanda confirma su eliminación. Burbujas, composer, identidad, contraste de estados y wrapping de filas comparados con el lab y DESIGN.md. La primera ejecución de baseline falló al medir inmediatamente después de un resize; el runner ahora espera la actualización de viewport y la evidencia base se regeneró desde una copia aislada del SHA. El fallo transitorio no se declaró como prueba aprobada.

El dock fijo puede aparecer sobre una fila intermedia en una captura full-page; en la interfaz sigue el viewport. El padding inferior conserva alcance del último aviso. La bandeja no tiene agrupación existente; se preserva su orden.

## Checks

[Resultados](checks.json) y archivos `*.txt` guardan la ejecución. Todos los checks solicitados terminaron con exit 0:

| Check | Evidencia / alcance |
| --- | --- |
| `npm run build` | `build.txt`; build y PWA; advertencia existente de peso del chunk Mapbox |
| `npm run lint` | `lint.txt` |
| `npm run check:amanecer` | `check-amanecer.txt` |
| `npm run check:chat:layout` | `chat-layout/after-results.json`; anclaje, scroll, teclado/offset/safe area simulados, envío, lectura y cleanup |
| `npm run check:realtime` | `check-realtime.txt`; reconciliación y ciclo de canales simulados |
| `npm run check:realtime:ui` | `check-realtime-ui.txt` y carpeta homónima; dos sesiones/pestañas fixture, ráfagas, recuperación >100 mensajes, deduplicación, permiso revocado, read updates y logout |
| `npm run check:profile` | `check-profile.txt` y carpeta homónima; PostgreSQL efímero, aislamiento y RLS existentes |
| `npm run check:profile:ui` | `check-profile-ui.txt` y carpeta homónima; errores, avatar ausente/roto/ajeno, cambio de cuenta, logout y navegación |
| `npm run check:notifications` | `check-notifications.txt` y carpeta homónima; PostgreSQL efímero, lectura idempotente, destinos autorizados y privacidad |
| `npm run check:notifications:ui` | `check-notifications-ui.txt` y carpeta homónima; paginación, error al marcar, reintento, destino revocado, carga/vacío/error y cuenta nueva |
| `npm run check:my-events:ui` | `check-my-events-ui.txt` y carpeta homónima; regresión de gestión |
| `npm run check:auth` | `check-auth.txt`; contratos locales |
| `npm run check:amanecer:auth:ui` | `check-amanecer-auth-ui.txt` y carpeta homónima; regresión visual/funcional de Auth |
| `npm run check:social:ui` | `social-ui.txt`, before/after; matrices de layout |

Los primeros UI runners fallaron por selectores antiguos/ambiguos (`Salir`, enlaces repetidos tras añadir acceso desde perfil). Se actualizaron para seleccionar destinos explícitos y Cuenta → Cerrar sesión; se repitieron completos y pasaron. Nuevas entradas npm reutilizan scripts existentes; `PLANIT_UI_OUTPUT` evita sobrescribir carpetas históricas. No dependencias nuevas de producto.

## Impeccable y accesibilidad

[Evaluación](IMPECCABLE.md) con dos assessments independientes; [detector](detector.json): cero hallazgos primarios, un advisory de máscara alfa descartado en contexto. Se aplicaron critique, polish, harden y audit preservando el sistema aprobado. No overlay inyectado.

Labels, historial enfocable, status de conexión, alerts y estados existentes conservados; metadata operativa ≥13,5 px, área táctil ≥44 px y foco violeta de controles. Colores del texto, borde de campo y botones son pares normativos del sistema. Preferencias reducidas probadas con emulación; el fallback opaco lo aporta Foundation sin cambios.

## Límites

Todas las pruebas son locales: Edge con HTTP/Storage/WebSocket interceptados, algoritmos simulados o PostgreSQL efímero. No se usaron cuentas reales ni se escribieron datos en Supabase. No acreditan E2E remoto, RLS remoto vigente, entrega real de Realtime ni aceptación humana.

Pendientes: lector de pantalla, teclado y gestos móviles reales, safe areas físicas, zoom nativo, blur en hardware, bloqueo de carga de fuente y navegador sin backdrop-filter. Textos de laboratorio y prueba son ficticios. `STATUS` global y resultados históricos quedan fuera del diff.
