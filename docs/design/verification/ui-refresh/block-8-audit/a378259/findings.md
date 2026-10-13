# Hallazgos del SHA a378259

13/10/2026, Argentina. Evidencia local nueva; sin correcciones de producto. Severidades P1/P2 del audit Impeccable; un fallo que vacía una ruta es P1 de resiliencia porque necesita una falla de red inducida, no un bloqueo permanente del recorrido normal.

| ID | Severidad | Estado | Superficie | Evidencia |
| --- | --- | --- | --- | --- |
| B8-01 | P1 | Reproducido, heredado A1 sigue abierto | Rutas diferidas, muestra Inicio/Mapa/Detalle | [JSON](targeted/results.json), [Inicio vacío](targeted/lazy-home-390x844.png) |
| B8-02 | P1 | Reproducido; integración de CSS heredado sobre Amanecer | Detalle, éxito de gestión | [Mediciones](integration/results.json), [captura 390](integration/notice-390x844.png), [contrastes](contrasts.json) |
| B8-03 | P2 | Código + inspección de diseño; copy | Perfil | [Assessment A](assessment-a.md), captura representativa de perfil en manifiesto |
| B8-04 | P2 | Código + inspección; piloto conservado | Mis eventos, confirmación | [Assessment A](assessment-a.md), evidencia de diálogo en manifiesto |
| B8-05 | P2 | Observado sólo en IAB Windows; Edge headless no reproduce | Auth a 320px con scrollbar clásica | [Assessment B](assessment-b.md), contraste de entornos [JSON](integration/results.json) |

## B8-01 — rechazo de import deja la aplicación vacía

**Ubicación:** `src/App.tsx:12–22` y `:33–43`. Suspense maneja espera; no hay boundary que recupere rejection de import. El alcance confirmado es HomePage, MapPage y EventDetailPage, no se afirma que se haya abortado cada ruta diferida.

**Pasos:** servir este checkout con configuración pública ficticia; inicializar sesión fixture; abortar `**/src/pages/HomePage.tsx*` y abrir `/home` (equivalentes MapPage y EventDetailPage). La nueva prueba registra `Failed to fetch dynamically imported module`, `rootChildren=0`, texto vacío y cero botones Reintentar. Capturas de 390×844 en `targeted/`.

**Impacto:** red inestable impide descubrir o consultar eventos y retira navegación/feedback. Es el A1 histórico de la auditoría anterior, comprobado de nuevo, no causado necesariamente por el refresh. NO-GO para cierre técnico integral.

**Recomendación futura:** boundary con mensaje/acción de recarga recuperable para rutas lazy, conservando destino y sin bucle de retry de una promesa ya rechazada. Probar además chunks del build/PWA publicado. `$impeccable harden`, luego `$impeccable audit`. Prueba actual: abort de módulos Vite en Edge local; no SW publicado.

## B8-02 — éxito de gestión casi ilegible

**Ubicación:** `src/components/event-actions.css:31`, `src/pages/EventDetailPage.tsx:100`, `src/pages/discovery.css:133` (sólo oculta vacío).

**Pasos:** Detalle de evento propio futuro → Gestionar evento → Cancelar evento → confirmar. RPC interceptada, una escritura de fixture por tamaño, relectura local. Desplazar al aviso «El evento fue cancelado. Sus datos e historial se conservan.».

**Resultado:** seis tamaños 320/360/375/390/768/1280. Texto efectivo `rgb(131,243,201)` (#83f3c9), superficie transparente sobre bg #f6f5fd, 16px, role=status. Contraste **1,241:1**, bajo 4,5:1 (WCAG 1.4.3). [Captura](integration/notice-390x844.png). El texto conserva el verde del tema oscuro, sin adaptador en Detalle; Mis eventos sí adapta su aviso.

**Impacto:** organizador con baja visión no puede confirmar fácilmente el resultado. La operación funcional y los tests de acciones pueden pasar sin advertir la ilegibilidad.

**Recomendación futura:** adoptar patrón semántico success-bg/success-on-bg para aviso no vacío de Detalle, preservar anuncio y reconciliación. `$impeccable harden`/`$impeccable colorize`, luego `$impeccable polish`. No se modifica código en este bloque.

## B8-03 — Actualizar perfil promete modificación

**Ubicación:** `src/pages/ProfilePage.tsx:22` y `:72`. El botón limpia resultado y reconsulta; no abre edición. Perfil → Actualizar perfil vuelve a cargar el mismo dato.

**Impacto:** usuario nuevo puede buscar cambiar identidad/bio en una acción que sólo refresca. No se reclama un editor nuevo ni se altera el contrato funcional.

**Recomendación futura:** etiqueta Actualizar o Recargar datos. `$impeccable clarify`.

## B8-04 — Cancelar y Cancelar evento en el mismo diálogo

**Ubicación:** `src/components/EventCard.tsx:65`, `src/components/EventActionDialog.tsx:7` y `:77`. Mis eventos → Organizo → menú → Cancelar evento. La salida segura conserva el default Cancelar; el botón destructivo dice Cancelar evento. Detalle ya usa Conservar evento (`EventManagement.tsx:19`).

**Impacto:** lectura apresurada requiere distinguir qué se cancela. Color rojo, explicación y foco seguro mitigan riesgo; no se observó cancelación accidental. No es razón para alterar el piloto desde esta auditoría.

**Recomendación futura:** valorar Conservar evento en futura revisión autorizada del piloto. `$impeccable clarify`.

## B8-05 — scrollbar clásica reduce ancho útil

**Ubicación:** `src/index.css:29`, `body { min-width:320px }`. Assessment B observó IAB Windows 320×568: `clientWidth=305`, `scrollWidth=320`, body 320 y scrollbar horizontal en login/registro. No se guardó PNG nativo de esa observación; evidencia disponible es medición y revisión del evaluador.

**Contraprueba:** Edge headless 320×800 con stable gutter sigue midiendo clientWidth=scrollWidth=bodyWidth=320. No declarar fallo móvil universal ni presentar esa captura como reproducción de IAB. Este hallazgo necesita confirmar con screenshot persistido en navegador con scrollbar clásica o equipo físico.

**Recomendación futura:** evaluar piso global y composición al ancho realmente disponible; `$impeccable adapt`. Prioridad P2 acotada al entorno observado, sin inventar regresión en las seis matrices headless.

## Señales sin defecto confirmado

- Detector: 70 advisories (39 color, 19 font-size, 12 radius); no equivalen a 70 problemas. Enmascarado negro y CSS legacy sobreescrito son ejemplos descartados. El aviso verde sí es activo.
- Títulos de 22px: Assessment B lo marca P3 de tokenización. El sistema permite medidas nominales; sin impacto demostrado, la síntesis lo conserva como revisión de coherencia, **no** como defecto P3 confirmado.
- `text-muted` sobre blanco alpha .72 y violeta puro da 4,408:1. Es una sonda conservadora de tokens, no medición del backdrop efectivo de una pantalla. Sobre la mancha usar text-on-wash; falta inspección por píxel de todos los cristales antes de afirmar una infracción actual adicional.
- Refresco periódico de participación: la primera sonda conserva BUTTON Unirme antes/después, pero no registra la petición durante clock simulado. Evidencia insuficiente para validar ese intervalo o declarar pérdida de foco. Pendiente específico, no PASS de foco completo.
- Zoom nativo, lector de pantalla, teclado móvil, safe areas y gestos físicos no ejercitados. Fixtures de fotografía son gráficos, no fotos naturales.

Questions skipped: alcance, dirección y detención en PR documental ya definidos por el usuario.

## B8-06 — [P2] header compartido desborda con texto al 200%

**Ubicación:** `src/styles/amanecer.css:25–31` (brand sin wrap ni shrink, Cuenta nowrap), combinación con navegación de AppLayout. Reproducido en `/me` y `/notifications`; no extrapolar la misma medición a todas las rutas sin ejecutar el protocolo allí.

**Pasos:** fixture social long → recopilar una vez tamaños computados de todos los HTMLElement de `.social-shell` → asignar cada tamaño a 2× (evita doble multiplicación recursiva por herencia) → Perfil 320×800 o Notificaciones 390×844. No cambia páginas ni CSS versionados; es texto-only emulado, no zoom nativo.

**Resultado:** Perfil ancho documental 397 frente a viewport 320; Cuenta termina x=396,70. Notificaciones 430 frente a 390; Cuenta termina x=430,11. Mismo overflow en 320/360/375/390 en ambas rutas, sin overflow a 768/1280. JSON [stress](social-stress/measurements.json) y [confirmación](social-confirm/measurements.json); screenshots [Perfil](social-confirm/profile-320x800-200-viewport.png), [Notificaciones](social-confirm/notifications-390x844-200-viewport.png). El header, no la biografía, causa la extensión horizontal.

**Impacto:** texto ampliado hace que la cuenta y parte del rótulo estén fuera de pantalla; requiere scroll lateral. P2 responsive confirmado en emulación; no se declara certificación/infracción WCAG ni pérdida completa de función sin zoom nativo y pruebas de lector.

**Recomendación futura:** reflow del header con tamaños computados al 200%, preservando marca/campana/Cuenta y targets. Revisar consumidores compartidos. `$impeccable adapt`, `$impeccable audit`, finalizar con `$impeccable polish`.

## Confirmación de Chat con poca altura

Antes de enfocar, chat long 320×240 tiene composer bottom 311px; texto al 200% bottom 705px. **Después de focus/scrollIntoView**, textarea queda top≈88, bottom≈152 y hit-test verdadero. [Captura normal recuperada](social-confirm/chat-320x240-100-viewport.png). No confundir rect previo con obstrucción permanente; datos de `social-confirm/measurements.json` registran ambos momentos. La recuperación completa por gestos/touch y el contador durante teclado real requieren hardware; no se suma otro P1 a partir de esta sonda.

## B8-07 — [P2] Crear/Editar conservan navegación y acción en flujo, distinto del objetivo aprobado

**Ubicación:** `src/components/AppLayout.tsx:74–92`, `src/pages/event-forms.css:32`; DESIGN.md Components/Navigation y DESIGN_SYSTEM.md §5 piden subpantalla de Crear/Editar sin dock y acción de publicar fija.

**Evidencia:** AppLayout excluye dock sólo en Auth/Chat, no en isEventForm. Screenshots nuevas [Crear normal](forms-rejoin/create-normal-320.png), [Editar al 200%](forms-rejoin/edit-text200-320.png) muestran el dock sobre la zona baja del formulario; CSS de composición no fija el CTA. La documentación histórica BLOCK_3 explica «navegación intacta», sin constancia de aceptación humana de esta excepción normativa.

**Impacto/clasificación:** desviación de composición y competencia de navegación con completar el formulario; **no** regresión funcional ni bloqueo observado. Fecha/hora al 200% caben a 320 y el CTA es recuperable con foco/scroll a 240 en los probes. Diseño activo Amanecer con composición parcial respecto del objetivo, sin convertir la ruta en heredada por esta diferencia.

**Recomendación futura:** reconciliar explícitamente la entrega del bloque 3 con el objetivo aprobado, preservando destinos, formulario en React y guardado/reconciliación; `$impeccable adapt`/`$impeccable polish` en tarea autorizada. No cambiar navegación aquí.

### Ampliación de B8-06

El probe forms-rejoin confirma el mismo desbordamiento del header al 200% en Solicitudes de reincorporación a 320/360/375/390. [Mediciones](forms-rejoin/measurements.json), [captura](forms-rejoin/rejoin-text200-320.png). Crear/Editar y sus fechas no tienen overflow en ese probe; Cuenta se evalúa sólo en los consumidores que efectivamente la muestran.


Questions skipped: alcance, dirección y detención en PR documental ya definidos por el usuario.
