Method: dual-agent (A: /root/assessment_a · B: /root/assessment_b)

# Impeccable — Fundación Amanecer

12/10/2026. Target `src/components/AppLayout.tsx`, tokens y patrones compartidos. Modo Operate, alcance preservador del bloque 0.5. Skill 4.5.2, engine 0.1.14. Context se ejecutó una vez; se leyeron extract, critique, polish, harden, audit y craft-floor. No se regeneró la dirección, el sidecar ni el sistema visual.

## Critique

**Especificidad:** la agenda, hora lateral, distinción Organizo/Participo y tinta/azul por función expresan PlanIt. La extracción conserva esa identidad y no introduce una plantilla nueva. La composición, densidad y navegación del piloto permanecen; las pantallas pendientes reciben sólo infraestructura disponible.

| Heurística de Nielsen | Score / 4 | Evidencia |
| --- | --- | --- |
| Visibilidad del estado | 3 | Carga, vacío, error y selección diferenciados |
| Lenguaje del mundo real | 3 | Español natural; dos usos de Cancelar en confirmación |
| Control y libertad | 3 | Navegación, Escape y retorno de foco |
| Consistencia | 3 | Patrones del piloto coherentes; convivencia heredada documentada |
| Prevención de errores | 3 | Confirmación destructiva, doble envío y resultado incierto conservados |
| Reconocimiento | 2 | Destinos inactivos y creación estrecha dependen de iconos |
| Flexibilidad y eficiencia | 2 | Filtros y acciones directas; no exige funciones nuevas |
| Estética y mínima información | 3 | Agenda y una superficie por evento |
| Recuperación | 3 | Reintento real y errores contextualizados |
| Ayuda | 2 | Contexto en vacío/confirmación; orientación limitada sobre estados |
| **Total** | **27/40** | Diagnóstico del piloto conservado; no certificación de accesibilidad |

**Carga cognitiva:** dos fallos orientativos de ocho (chunking y opciones mínimas), asociados a los cinco filtros existentes. No justifican cambiar funciones ni colapsar filtros dentro de esta fundación. Jerarquía, agrupación, foco de tarea, secuencia, memoria y despliegue de acciones secundarias se conservan.

**Fortalezas:** la agenda prioriza cuándo/qué/estado; vacío/error dan explicación y salida; dock y acciones tienen áreas amplias y nombres accesibles en código. El recorrido sensible de cancelar explica consecuencias y preservación del historial.

**Prioridades:**

- **P1 introducido durante extracción, corregido:** el import compartido precedía `.app-shell` heredado con igual especificidad; aparecía fondo radial marino bajo la mancha. Se corrigió a `.app-shell.amanecer-shell`. La confirmación final debe conservar la wash clara y geometría. No se cambió el diseño para resolverlo.
- **P2 preexistente, fuera del cambio:** texto al 200 % a 320 px solapa las tabs y fragmenta el título. Baseline también lo muestra; overflow del documento no detecta ese solapamiento. Registrar una futura adaptación autorizada (`impeccable adapt`).
- **P3 preexistente:** secundario “Cancelar” y destructivo “Cancelar evento” demandan interpretación. Un futuro bloque puede revisar copy (`impeccable clarify`); aquí se preservó.
- **P3, tradeoff aprobado:** iconos inactivos y “+” móvil requieren aprendizaje. Validar descubribilidad; no revertir el patrón normativo por una heurística genérica.

**Personas:** Jordan puede vacilar entre iconos y verbos de cancelación; Sam cuenta con nombres/foco pero encuentra el solapamiento de texto ampliado; Casey dispone de dock alcanzable, mientras Crear requiere reconocer el “+”. Sin nueva investigación humana ni lector de pantalla.

Assessment B ejecutó [detector](detector.json): exit 0, JSON `[]`, cero hallazgos/reglas/ubicaciones y ningún falso positivo. Su scan de AppLayout no evalúa la cascada CSS ni los descendientes; la regresión del fondo fue identificada visualmente tanto por A como por B. Se conservaron evaluaciones independientes; el padre recibió el aviso de detector de B antes de finalizar A, pero no lo compartió con A ni lo utilizó en la síntesis hasta terminar ambos.

## Polish y harden

Pasadas acotadas sobre la fundación, sin rediseño: centralizar valores y quitar namespace paralelo; conservar valores del piloto; mantener scope explícito y respaldo opaco; corregir prioridad del fondo y preparar ScreenHeader sin que la regla heredada de Auth lo reduzca. Mantener rutas, componentes/API, filtros, timeline y breakpoint intactos.

Harden utilizó recorridos existentes: título/lugar largos, foto rota, vacío, carga, error, reintento, listas largas, poca altura, Escape, foco devuelto, resultado incierto, respuesta tardía, cuenta cambiada y doble envío. El fixture DOM aislado ejercita componentes preparados sin activar otras rutas. La regla existente de reducción de movimiento `.01ms` se conserva por equivalencia; no se atribuye como mejora de accesibilidad. No se modificó lógica de negocio.

Las capturas y checks del proyecto son evidencia independiente de Impeccable; ninguno de estos flujos por sí solo acredita aprobación humana.

## Audit técnico de fundación

**Integridad:** PASS en el alcance de extracción, una fuente normativa, valores centrales y opt-in; deudas del piloto/legacy diferenciadas. El detector limpio no equivale a ausencia de defectos.

| Dimensión | Score / 4 | Límite observado |
| --- | --- | --- |
| Accesibilidad | 2 | Foco/targets/diálogo probados; deuda de texto ampliado y lector no probado |
| Performance | 3 | Misma fuente, sin dependencias; Mapbox y blur físico sin perfilado |
| Theming | 3 | Tokens centrales; adaptadores y CSS heredado pendientes de retirada |
| Responsive | 3 | Geometría preservada en seis tamaños; dispositivos físicos pendientes |
| Integridad de implementación | 3 | Scope y contratos preservados; captura dinámica exige controles adicionales |
| **Total** | **14/20** | Bueno en alcance; no certificación de todas las rutas |

**Patrón sistémico:** coexistencia de CSS antiguo y nuevo demanda scope y revisión de cada ruta. No reemplazar `--color-*` globalmente. Los valores nominales de diseño no autorizan normalizar tamaños particulares del piloto. Recomendación futura: `adapt` para texto aumentado, `clarify` para copy del diálogo, `audit` de cada ruta migrada y `polish` al cierre de ese bloque.

## Proveniencia y límites

Slug: `src-components-applayout-tsx`; no existe ignore list de critique. A revisó fuentes/CodeGraph y capturas con view_image, sin detector. B ejecutó detector y revisó capturas; abrió un tab nuevo oculto en localhost, que pasó de Login a Mapa tras recuperar sesión, y lo cerró. El browser documenta evaluate de lectura: no hubo inyección mutable, overlay ni detector en consola. No se inició live-server de Impeccable. Señal de fallback: capturas Edge de la app con interceptores y estilos computados, no sesión remota.

Se registra este reporte portable en la evidencia del bloque; no se versionan snapshots/cache de `.impeccable/critique`. No se lee trend porque el target actual es fundación, no continuación del critique histórico marino. El servidor Vite de QA se detiene antes de entregar; scripts temporales de comparación se eliminan tras restaurar fuentes. La limpieza efectiva se registra en README.

Questions skipped: el usuario fijó dirección, alcance preservador y cierre en PR draft; no se amplía el trabajo a las deudas históricas ni se pregunta por una nueva dirección.
