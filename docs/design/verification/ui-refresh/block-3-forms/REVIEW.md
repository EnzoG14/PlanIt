# Impeccable — Bloque 3

12/10/2026. Modo Operate. Dirección aprobada B · Amanecer v3.0.

## Critique

Method: dual-agent (A: `/root/critique_design` · B: `/root/critique_detector`). Assessments independientes, inicialmente sobre código. A terminó sin acceder a los resultados del detector; B examinó Crear/Editar y devolvió `[]` en ambos. La inspección visual del agente principal se hizo después con capturas reales de Edge.

Context se ejecutó una vez desde el checkout inicial, donde faltaban PRODUCT.md y DESIGN.md. No se ejecutó init/document/shape. En el worktree basado en main se leyeron directamente los documentos aprobados existentes. No se regeneró el sistema.

### Estado previo

La interfaz mantenía fondo oscuro, gran emblema centrado, CTA degradado y jerarquía plana. Fecha/hora a dos columnas dejaba poco espacio a los controles nativos. La base funcional era sólida: errores próximos, foco en el primer campo inválido, publicación incierta y protección de doble envío.

| Heurística Nielsen | Antes /4 |
| --- | ---: |
| Visibilidad de estado | 3 |
| Lenguaje del usuario | 2 |
| Control y libertad | 3 |
| Consistencia | 2 |
| Prevención | 3 |
| Reconocimiento | 3 |
| Eficiencia | 2 |
| Minimalismo | 2 |
| Recuperación | 3 |
| Ayuda | 3 |
| Total | 26/40 |

Prioridades resueltas: activar el opt-in de estas rutas (P1), ampliar fecha/hora móvil (P1), agrupar secciones (P2), compactar encabezados (P2), completar selector de archivos, hints y errores de ubicación (P2). Coordenadas manuales se conservan por contrato, sin inventar un mapa o wizard.

Questions skipped: el usuario ya especificó dirección, alcance y cambios a implementar; no se requiere una nueva decisión de diseño.

## Polish

Se reutilizaron tokens, fuente autoalojada, controles, botones, StatusMessage y dock Foundation. Se corrigió la línea de foco heredada del contenedor principal, se mantuvo el foco violeta de los controles y se completó la luz superior decorativa con texto de encabezado `text-on-wash`. Formulario de una columna sin tarjetas anidadas. Fecha/hora se apila bajo 480 px; coordenadas bajo 360 px. La confirmación visual final está en `confirm/`, separada de `before/` y de las capturas anteriores al último refinamiento en `after/`.

## Harden

Edge headless, seis anchos: 320, 360, 375, 390, 768 y 1280. Fixtures interceptan Auth/REST/Storage; no escrituras remotas.

- Formulario vacío, todos los campos obligatorios, datos largos con emoji/acentos y fechas/horas completas.
- Sin overflow horizontal; controles de al menos 44 px; inputs de 16 px. A 320, fecha/hora miden 288 × 52 px, con padding inline de 12 px (`states/states-metrics.json`).
- Ubicación denegada y ubicación obtenida con permiso emulado; coordenadas manuales preservadas.
- Catálogo vacío, error de publicación/subida, selección y eliminación de fotos, límite de diez, tipos y tamaños.
- Envío en curso, campos bloqueados, reintentos, respuesta perdida y reconciliación sin segunda creación.
- Edición de propietario, denegación a terceros, eventos congelados, cupo inferior a confirmados, regreso con filtro y error de carga recuperable.
- Duplicación histórica precargada, fechas vacías, sin fotos/participaciones, sin persistencia antes de publicar, salida y cambio de origen/cuenta.

## Audit de cierre

| Dimensión | /4 | Evidencia y límite |
| --- | ---: | --- |
| Accesibilidad | 3 | Labels/errores vinculados, foco y targets; sin lector de pantalla físico |
| Performance | 3 | CSS específico, fuente existente, sin dependencias; aviso previo del chunk Mapbox en build |
| Theming | 4 | Tokens `--pi-*`, opt-in y ausencia de cambios globales |
| Responsive | 3 | Seis anchos, controles nativos y overflow medidos; teclado móvil físico pendiente |
| Integridad | 4 | Componentes/APIs existentes, lógica intacta, detector Crear/Editar sin hallazgos |
| Total | 17/20 | Evaluación técnica local; no certificación WCAG ni aceptación humana |

No se identificaron defectos bloqueantes dentro del bloque después de los ajustes. Límites P2 de validación: teclado/safe areas en dispositivo físico, VoiceOver/NVDA, controles nativos de Safari/iOS y Android, alto contraste, ampliación al 200% y rendimiento en dispositivos lentos pendientes. No se presenta la emulación como cobertura de esos casos.

## Capacidades y ejecución

Launcher/detector y hook Impeccable disponibles. Critique dual independiente, polish, harden y audit aplicados como flujos de revisión, no como supuestos comandos CLI. Live Mode/overlay no ejecutados: el navegador integrado devolvió `ERR_CONNECTION_TIMED_OUT` al intentar el servidor local. La evidencia procede del runner de regresión Edge existente, con permiso para ejecutarlo fuera del aislamiento de red. No hay overlay visible ni live-server Impeccable iniciado. No se crearon snapshots fuera de esta carpeta por la restricción explícita de evidencia del bloque.

La prueba adicional de creación inicialmente encontró un selector ambiguo del harness (meta description y textarea); se acotó a `form`. El check original esperaba el título de login anterior a PR #29; se actualizó a `Ingresá a PlanIt`, manteniendo la comprobación del guard de Auth. `create-ui.log` y los logs `npm-*.log` contienen los resultados finales; `ui-checks.log` conserva el intento del harness y las regresiones de edición/acciones/Mis eventos.
