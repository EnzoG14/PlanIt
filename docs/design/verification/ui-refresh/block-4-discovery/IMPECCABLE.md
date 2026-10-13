# Impeccable — Bloque 4

Method: dual-agent (A: /root/design_assessment · B: /root/technical_assessment). Usuario autorizó ambos assessments; trabajaron de manera independiente. A finalizó antes de incorporar detector B a la síntesis. Fecha: 12/10/2026. Target: src/pages/HomePage.tsx, relacionado con MapPage/EventDetailPage/EventCard/EventMap/AppLayout. Sistema aprobado B · Amanecer v3.0, modo Operate.

## Critique

Veredicto: coherencia reconocible con el piloto Amanecer; información temporal/geográfica y apertura del evento mandan sobre decoración. Sin foto no existe portada ficticia. No se necesita nueva identidad ni funciones del lab. Detector B ejecutado una vez en seis TSX: JSON literal `[]`, exit0, **0 findings, 0 advisories, 0 falsos positivos**. Detector no examina CSS calculado ni certifica accesibilidad.

Evaluación A inicial, antes del lote de polish/harden; no se infla el puntaje tras corregir.

| Heurística | Score | Evidencia |
| --- | --- | --- |
| Visibilidad de estado | 3 | Carga/error/vacío/cupo con mensajes; selección tenía pérdida de foco |
| Mundo real | 3 | Español, inicio/fin/lugar; aviso técnico si falta Mapbox |
| Control y libertad | 3 | Retorno contextual y cierre de preview |
| Consistencia | 3 | Tokens/patrones; cuenta conserva enlaces vigentes |
| Prevención de errores | 3 | Estados indisponibles; resultado incierto conservado |
| Reconocimiento | 3 | Tarjetas/detalle claros; nombres del dock accesibles |
| Flexibilidad/eficiencia | 2 | Lista y mapa alternativos; canvas fallido demasiado alto |
| Estética/minimalismo | 3 | Superficie única por evento; fallback compacto |
| Recuperación | 3 | Reintentos reales; aviso de mapa inicialmente bajo |
| Ayuda/contexto | 3 | Zona inicial y horarios Argentina |
| Total | **29/40** | Good; score del assessment inicial |

Fortalezas: jerarquía operativa, ausencia de foto compacta, feedback de resultado incierto preservado. Carga cognitiva baja en Inicio, moderada en Mapa/Detalle; no se agregan filtros ni decisiones nuevas. Valle emocional: fallo de mapa sin recuperación inmediata; acción inferior mantiene continuidad de participación.

Personas: Sam (teclado) necesitaba transferencia/retorno de foco; Jordan (nuevo usuario) necesitaba aviso de mapa antes de un canvas grande; conexión débil dispone de lista alternativa. Las limitaciones reales se conservan sin reemplazar datos ni proveedor.

## Hallazgos y lote de polish/harden

- **P1, A y B:** Ver marcador eliminaba el botón enfocado al trasladar el evento a preview. Resuelto: foco al enlace de preview cuando viene de lista, vuelta al botón al cerrar; marcador mantiene su origen. Regresión check:discovery:ui pasa comprobación de ambos focos, canvas estable y llamadas de consulta sin duplicación.
- **P2, A:** canvas de mapa fallido grande. Resuelto con clase de presentación has-error y altura180; controles/atribuciones/lista mantienen acceso.
- **P2, A:** portada300 en320 postergaba fechas detrás de las capas fijas. Resuelto:220 en teléfonos estrechos; escritorio300. Fallback sin foto no crece.
- **P2, B:** atribución11px heredada. Resuelto: token meta13,5 y enlaces mínimo44 de altura. Servicio real revisado390/1280 con calles, marcador y atribución presentes.
- **P2, B:** acción+dock reducen lectura con poca altura. Mitigación:220px de reserva y scroll-padding190px, botón limitado al viewport con overflow accesible. Capturas short-height360 y stress CSS de texto pasan posición/overflow. No prueba teclado físico ni zoom nativo.
- **P2, B / decisión conservada:** ninguna pestaña activa en detalle. Se conserva la navegación existente porque el pedido no autoriza rediseñar dock; enlace Volver nombra el origen. Integración futura debe decidir navegación de subpantallas globalmente.
- **P3, B:** se desactivó content-visibility. Se restauró auto con intrinsic size210 para conservar optimización de listas; fotos lazy. Sin afirmaciones de rendimiento físico.

## Audit técnico final

| Dimensión | Score | Evidencia y límite |
| --- | --- | --- |
| Accesibilidad | 3 | Foco de selección/cierre, 44px, tokens/contraste; lector y teclado físico pendientes |
| Performance | 2 | Mapbox lazy, listas auto, fotos lazy; chunk518,63kB gzip, sin perfil físico |
| Theming | 4 | --pi-* y scope; modo claro único aprobado; fallback reducido comprobado |
| Responsive | 3 | Seis anchos, poca altura, stress sin overflow; gestos/zoom nativo pendientes |
| Integridad | 4 | Contratos/componentes de acciones preservados; detector0 y regresiones |
| Total | **16/20** | Good; evaluación técnica local, no certificación WCAG |

Sin P0/P1 abierto demostrado en los casos locales tras el lote. Riesgos: dos capas inferiores en altura extrema y rendimiento de Mapbox; aceptarlos documentalmente no sustituye QA física. No afirmar que todas las imágenes naturales tienen legibilidad por haber probado media geométrica.

## Run notes

Contexto Impeccable4.5.2/engine0.1.14 cargado una vez en proyecto. No se regeneran PRODUCT/DESIGN/sidecar ni se actualiza la tool. Ignore list ausente. Cada assessment creó una pestaña nueva; entrada normal redirigió a login al carecer de fixtures. Ambos cerraron pestañas sin autenticación ni llamadas Supabase reales. Overlay omitido por API evaluate read-only y frontera de sesión: no hay overlay user-visible ni console scan. Señal alternativa: detector CLI, source y capturas de tests interceptados. Servicio Mapbox real sí inspeccionado en montaje independiente sin Auth/Supabase.

Servidores de Vite/lab se detienen al terminar; montaje y runner temporales de Mapbox se retiran. Snapshot local se archiva mediante critique-storage, no se versiona. Questions skipped: el usuario ya autorizó el bloque y sus correcciones; no abrir otro alcance en esta entrega.
