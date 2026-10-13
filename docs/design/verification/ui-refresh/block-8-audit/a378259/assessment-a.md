# Assessment A — revisión independiente de diseño

Fecha: 13/10/2026. Objetivo estable: `src/App.tsx` y superficies R1–R3 del checkout `C:/Users/enzog/planit-worktrees/amanecer-block-8-audit`, SHA `a378259a60106ddd07b111080a24677ad509bc49`. Agente: `/root/assessment_a`. Assessment B y detector no consultados. Sin cambios de UI, suites ni servidor propio.

## Método y límites

Leída la referencia completa `critique.md`, AGENTS raíz/frontend/diseño, PRODUCT, DESIGN, DESIGN_SYSTEM, decisión Amanecer, workflow y estado visual. Raíz resuelta con Git; índice propio existente; CodeGraph utilizado antes de explorar código. Código servido por CodeGraph con líneas actuales. CSS no indexado leído de forma acotada después del intento.

Inspección en pestaña propia de navegador: `/login` y `/register` de `http://127.0.0.1:4198`, escritorio 1280×720 observado, configuración pública ficticia informada por el coordinador. Lectura AX y capturas visuales sin introducir credenciales ni enviar formularios; pestaña cerrada. Rutas protegidas evaluadas con código vigente y evidencia histórica versionada, sin sesión remota. No se declara inspección interactiva actual de dichas rutas. No se emula lector de pantalla, dispositivo físico, zoom nativo ni gestos del mapa.

Capturas históricas visualmente inspeccionadas:

- `block-4-discovery/regressions/home/home-mobile.png` y `detail-organizer-mobile.png`.
- `block-3-forms/after/check-events-ui/form-390x844.png`.
- `block-6-social/after/profile-full-390.png`, `notifications-full-390.png`, `chat-layout/after-390x844.png`.
- `block-7-actions/after/actions/cancel-dialog-390.png`.

Rutas de capturas relativas a `docs/design/verification/ui-refresh/`. El header antiguo Mi perfil/Salir de bloques 3–4 ya difiere de AccountMenu vigente: no es defecto del SHA. Full-page con dock sobre una fila intermedia no prueba solapamiento permanente. El fixture denominado organizer contiene un CTA Unirme y tampoco se usa para afirmar un fallo de autorización actual. Las fotografías geométricas de QA no prueban calidad de fotografías naturales.

## Especificidad e impresión general

La dirección está aplicada de forma reconocible: tinta marina, luz superior difusa, Bricolage, superficies claras y agenda por día. Mis eventos se distingue por la relación Organizo/Participo y sus estados; Auth conserva un único camino de lectura. Chat usa tinta para voz propia y blanco para la ajena. Esta coherencia tiene más carácter que un formulario genérico con acento violeta. Perfil y bandeja son composiciones convencionales, razonables para su tarea; no necesitan ornamentación adicional.

La principal oportunidad verificable es precisión de microcopy. Dos controles emplean palabras que implican otra acción o hacen dudar en una operación irreversible. No se han demostrado defectos P0/P1 ni regresiones nuevas en esta evaluación A; esa conclusión no reemplaza las suites del coordinador.

## Salud heurística provisional

Modo Operate. Las diez heurísticas aplican; ninguna es n/a. Puntajes basados en muestras inspeccionadas y código, sin acreditar todos los recorridos interactivos.

| # | Heurística | Puntos /4 | Evidencia o límite |
| --- | --- | --- | --- |
| 1 | Estado del sistema | 3 | Carga, reintento, conexión y guardado con texto; anuncios reales pendientes |
| 2 | Lenguaje del usuario | 3 | Rioplatense y Argentina explícitos; Actualizar perfil promete edición |
| 3 | Control y libertad | 3 | Escape, retorno de foco y salidas; ambigüedad Cancelar/Cancelar evento en piloto |
| 4 | Consistencia | 3 | Scope compartido; dismissLabel diferente entre Detalle y Mis eventos |
| 5 | Prevención de errores | 3 | Fechas mínimas, confirmación, envío bloqueado y comprobación de resultado incierto |
| 6 | Reconocimiento | 3 | Texto de estado y contexto visibles; dock inactivo sólo tiene iconos por decisión aprobada |
| 7 | Eficiencia y flexibilidad | 2 | Tabs por teclado, duplicación y filtros; recorrido completo experto no observado |
| 8 | Diseño mínimo | 3 | Jerarquía clara y agrupaciones; formularios largos corresponden a campos exigidos |
| 9 | Recuperación de errores | 3 | Reintentos específicos y errores cercanos; caminos interactivos parciales |
| 10 | Ayuda | 2 | Ayuda contextual en campos y estados; no hay evidencia de ayuda global |
| Total | | **28/40** | **Good, provisional; no aceptación humana** |

## Fortalezas

1. Auth: labels permanentes, formulario directo y CTA de tinta. No hay tarjeta adicional que duplique el contenedor. El registro presenta el mínimo de contraseña antes de enviar.
2. Los estados operativos mantienen texto: inscripción, leído/no leído, conexión y resultado incierto. Se evita depender sólo de color.
3. El formulario separa información, horarios, ubicación y cupo. Los horarios Argentina están explicados; cancelación explicita que se conservan datos e historial.

## Prioridades verificables

### [P2] Actualizar perfil implica modificar datos, pero sólo recarga

**Ubicación:** `src/pages/ProfilePage.tsx:22` y `:72`. `refresh` limpia el resultado y vuelve a consultar; no abre editor ni permite modificar datos.

**Reproducción:** abrir Perfil con datos, elegir Actualizar perfil; reaparece la consulta del mismo perfil. Código confirma el comportamiento y `block-6-social/after/profile-full-390.png` muestra el texto.

**Impacto:** Jordan busca cambiar su nombre o biografía y puede interpretar el botón como el inicio de esa tarea. La ausencia de edición no es un requisito inventado: el problema es la promesa verbal del botón.

**Recomendación:** cambiar sólo la etiqueta a Actualizar o Recargar datos en un futuro bloque autorizado; no añadir editor ni permisos. Comando sugerido: `$impeccable clarify`.

### [P2] La confirmación de cancelación en Mis eventos ofrece Cancelar y Cancelar evento

**Ubicación:** `src/components/EventActionDialog.tsx:7` y `:77`; `src/components/EventCard.tsx:65` no pasa dismissLabel. En cambio `src/components/EventManagement.tsx:19` usa Conservar evento para esta acción.

**Reproducción:** Mis eventos → Organizo → menú de un evento publicado → Cancelar evento. La opción segura se llama Cancelar y la destructiva Cancelar evento; captura histórica de bloque 7 confirma las dos etiquetas. Detalle usa ya una etiqueta inequívoca.

**Impacto:** lectura apresurada exige interpretar qué objeto cancela cada botón. Texto explicativo, color rojo y foco inicial seguro mitigan el riesgo; no se ha demostrado ejecución accidental, por eso P2.

**Recomendación:** registrar para una futura revisión autorizada del piloto: usar Conservar evento o Volver como salida, conservando el foco seguro y comportamiento. No alterar ahora diálogos aprobados ni sus capturas. Comando sugerido: `$impeccable clarify`.

## Carga cognitiva

Auth: foco único, agrupación, jerarquía, una decisión, opciones mínimas, reconocimiento y memoria adecuados (0 fallos observados). Formularios: secciones reconocibles; ubicación exige dirección y coordenadas, carga intrínseca real del contrato actual. La ayuda actual aclara que geolocalizar sólo sirve si se está allí (`EventFields.tsx:27–33`); no se propone geocoder nuevo por iniciativa de diseño.

Mis eventos: el menú de un evento abierto puede mostrar hasta siete acciones (`EventCard.tsx:59–62`), decisión con >4 opciones. Está tras divulgación progresiva, contiene operaciones distintas y dispone de scroll/hint; carga moderada local, sin evidencia de bloqueo. No contar cada enlace de una lista de eventos como decisión simultánea de todo el producto. El dock ofrece cuatro destinos; cumple el límite de opciones.

Checklist transversal: foco, agrupación, jerarquía, memoria y divulgación adecuados en muestras; opciones mínimas falla en el menú abierto; one thing at a time requiere interpretar las opciones de cancelación. **2 fallos locales, carga moderada**, no una medición experimental.

## Recorrido emocional y personas

**Jordan, primer uso:** registro claro → exploración → detalle con cuándo/dónde → participación. Red flag verificado al consultar Perfil: Actualizar perfil no cambia datos. Dock inactivo sin etiquetas visibles eleva aprendizaje, pero corresponde al diseño aprobado y mantiene nombres accesibles; no se recomienda cambiarlo sin decisión.

**Sam, teclado/lector:** labels, aria-invalid/describedby, tablist con flechas, Escape y retorno están implementados. No se afirma aprobación de lector a partir de AX. Cancelar frente a Cancelar evento exige contexto semántico adicional justo al salir de una operación destructiva.

**Casey, móvil interrumpido:** formularios agrupados y datos de horario claros. El formulario sólo vive en React por decisión de producto: recargar puede perder el progreso, riesgo previsto que no autoriza persistencia nueva. Cancelar ambiguo es el punto de ansiedad verificable; Conservar evento reduce interpretación.

El pico positivo es publicar/cambiar un evento con confirmación textual y abrir la información resultante. El valle es una acción irreversible o resultado de red incierto; la explicación de conservación de historial y Comprobar estado aportan tranquilidad. No atribuir emociones efectivamente medidas a estos recorridos: son lectura de diseño.

## Observaciones menores y preguntas

- Estado visual y documentos normativos tienen banners de migración antiguos, mientras `AppLayout.tsx:70` activa Amanecer en todas las rutas auditadas. Debe explicarse como desfasaje documental; no sobrescribir históricos ni el status protegido.
- Las capturas de QA no sustituyen la revisión de fotos naturales ni rendimiento/blur en dispositivos.
- ¿La siguiente revisión de microcopy debería alinear la salida segura del piloto con Conservar evento? ¿Puede Actualizar perfil llamarse simplemente Actualizar para mantener el mismo patrón de bandeja y listas?

Preguntas de dirección quedan para síntesis del coordinador; sólo hay dos Priority Issues verificables en A. No se fuerza una tercera para completar una plantilla. Archivo auxiliar preparado en D:/planit para copiar a la carpeta nueva de evidencia; ningún informe previo alterado.
