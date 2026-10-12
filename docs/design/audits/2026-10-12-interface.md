# Auditoría técnica de la interfaz de PlanIt

Fecha: 12 de octubre de 2026. Skill: impeccable, comando audit. Prioridades: accesibilidad, overflow, responsive, interacción táctil y estados de error. No se modificó la interfaz.

## Veredicto de integridad

**Aprobado con observaciones.** La implementación expresa un sistema coherente con PlanIt: paleta marina/violeta, navegación móvil, componentes compartidos, formularios y operaciones de eventos con confirmación. Los defectos afectan robustez y accesibilidad; no justifican reemplazar la identidad visual.

El detector estático examinó `src/`: **0 hallazgos principales y 75 avisos orientativos**, todos sobre colores, tamaños tipográficos o radios. No equivalen a 75 defectos: DESIGN.md documenta variantes de 11/13/18/24 px y diferencias de componentes que el detector igualmente marca. La falta de advertencias principales tampoco certifica accesibilidad: las pruebas manuales encontraron problemas que ese detector no detectó.

## Resumen

**13/20 — aceptable, con trabajo significativo pendiente.** Evaluación orientativa, no certificación WCAG. **8 problemas: 0 P0, 3 P1, 5 P2, 0 P3.** No se observaron bloqueos universales; el fallo de módulos y el recorte del chat son condicionales.

| Dimensión | Puntuación | Evidencia principal |
|---|---:|---|
| Accesibilidad | 2/4 | Contraste insuficiente en acciones destructivas y límites de campos; historial sin anuncio de novedades |
| Rendimiento | 2/4 | Mapa diferido, pero su módulo pesa 518,60 kB gzip |
| Theming | 3/4 | Tokens compartidos y tema oscuro coherente; variantes locales y documentación desincronizada |
| Responsive | 3/4 | Sin overflow horizontal normal en anchos probados; fechas recortadas y chat limitado en poca altura |
| Integridad de implementación | 3/4 | Sistema coherente; falta recuperación ante errores de módulos diferidos |
| **Total** | **13/20** | **Aceptable** |

## Alcance y método

- CodeGraph para localizar estructura, rutas y componentes; lectura contextual de CSS y de estados de error.
- Detector bundled: `impeccable detect --json src`.
- Edge/Chromium headless, Playwright, datos y sesión simulados. No se escribieron datos en Supabase.
- Primera ronda: Inicio, Mapa, Mis eventos, Perfil, Notificaciones, Crear, Editar, Detalle y Chat a 320, 390, 768 y 1280 px de ancho, altura 800 px. Los intentos de Login/Registro de esa ronda redirigieron por tener sesión: **no se cuentan como pruebas de autenticación**.
- Confirmación: Login/Registro sin sesión y Crear/Chat a 320 y 1280 px; errores de registro, fallo de módulo y aumento de texto al 200% en Perfil de escritorio.
- Comprobación visual de formulario estrecho, mapa, confirmación destructiva, validación y chat a 320×240.
- Taps sintetizados de Playwright para abrir/cerrar confirmación, validar formularios y reintentar Inicio. Esto verifica acciones táctiles discretas. **No se ejercitaron arrastre/pinch del mapa, gestos cancelados, teclado real de iOS/Android, lector de pantalla ni dispositivo físico.** Cambiar la altura a 240 px simula espacio disponible; no prueba un teclado real.
- `npm run build`: aprobado; advertencia de chunk grande del mapa. `npm run lint`: código de salida 0, con advertencias en scripts de la skill.

La medición inicial llamada `text-scale-stress-200percent` multiplicaba tamaños heredados recursivamente: **se descarta**. La confirmación `text-scale-200percent` duplica una vez cada tamaño computado y no muestra overflow horizontal en Perfil a 1280 px. No se probó texto al 200% en todas las pantallas ni zoom real al 400%.

## Hallazgos P1 — resolver antes de publicar

### 1. Fallar al descargar una pantalla deja la aplicación vacía

**Ubicación:** [App.tsx:12](../../../src/App.tsx:12), rutas diferidas y `Suspense` en líneas 32–43. **Categoría:** integridad / estados de error.

Se abortó la descarga de `src/pages/HomePage.tsx` al abrir `/home`. El resultado fue `rootText: ""`: no quedó interfaz de recuperación. `Suspense` cubre espera, pero no el rechazo del import; no hay un boundary de errores en el árbol de la app.

**Impacto:** una conexión interrumpida o un recurso de una versión anterior puede dejar a la persona sin navegación ni instrucciones. **Recomendación:** un Error Boundary alrededor de las rutas, con mensaje claro y acción de recarga/reintento que efectivamente vuelva a intentar descargar el módulo; evitar reintentos automáticos infinitos. **Comando:** `$impeccable harden`.

### 2. Texto blanco sobre el rojo brillante del botón destructivo

**Ubicación:** [event-actions.css:21](../../../src/components/event-actions.css:21); mismo degradado en [event-attendees.css:37](../../../src/pages/event-attendees.css:37), selector `.attendees-remove`. **Categoría:** accesibilidad.

El degradado va de `#ff2254` a `#ce103d`. El contraste blanco contra el extremo brillante es **3,74:1**, frente a **5,58:1** en el oscuro. En el diálogo probado, el rótulo normal de 16 px ocupa también la zona brillante: tener un extremo válido no hace válido todo el texto.

**Impacto:** reduce legibilidad precisamente al confirmar acciones irreversibles. **Estándar:** [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), mínimo 4,5:1 para este tamaño. **Recomendación:** oscurecer la parte roja o usar un fondo sólido que mantenga 4,5:1 debajo de todos los glifos. Revisar también los degradados violeta locales; el color final por sí solo no demuestra un fallo si el texto no llega hasta allí. **Comando:** `$impeccable colorize`.

### 3. Límites de campos poco distinguibles en reposo

**Ubicación:** [index.css:30](../../../src/index.css:30), borde `#303d70`, campo `#151d3e`, fondo `#060b27`. **Categoría:** accesibilidad.

El borde tiene **1,59:1** contra el campo y aproximadamente **1,88:1** contra el fondo. El propio relleno tampoco alcanza 3:1 respecto del fondo. En inputs vacíos, la forma del área editable depende de esos límites; el foco y el estado inválido tienen mayor contraste, pero aparecen después de interactuar.

**Impacto:** dificultad para localizar el área de entrada con baja visión. **Estándar:** [WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), para información visual necesaria para identificar controles. **Recomendación:** crear un token específico de borde de control que alcance 3:1 contra las superficies contiguas; no es necesario cambiar todos los separadores decorativos. **Comando:** `$impeccable colorize`.

## Hallazgos P2 — siguiente pasada

### 4. Fechas recortadas en el formulario a 320 px

**Ubicación:** [App.css:83](../../../src/App.css:83), `.field-pair`; [EventFields.tsx:21](../../../src/components/EventFields.tsx:21). **Categoría:** responsive / overflow interno.

La columna útil mide aproximadamente 134 px. El padding para el icono, el texto del control nativo y su selector no caben cómodamente; la captura muestra la fecha parcialmente oculta. El documento puede tener `scrollWidth === innerWidth` y aun así recortar contenido interno.

**Impacto:** cuesta revisar la fecha completa antes de publicar. **Recomendación:** apilar fecha y hora a anchos estrechos o retirar el icono redundante y comprobar que el control nativo conserva espacio suficiente. Confirmar con valores completos y en Safari móvil. **Comando:** `$impeccable adapt`.

### 5. Chat recortado cuando quedan 240 px de altura

**Ubicación:** [App.css:3](../../../src/App.css:3), shell fijo; [chat.css:1](../../../src/pages/chat.css:1), elementos no contraíbles y composer. **Categoría:** responsive / estados de error.

En 320×240 el historial queda casi sin espacio, el textarea se corta por abajo y el contador queda fuera del área visible. El shell y la página ocultan overflow y el documento no permite desplazarse para recuperar esa parte.

**Impacto:** con teclado o poca altura se pierde contexto y parte del feedback del mensaje. **Recomendación:** variante de altura reducida, header/estado más compactos, composer acotado y scroll de recuperación para contenido y errores. La adaptación existente a VisualViewport es una buena base. **Comando:** `$impeccable adapt`.

### 6. El historial del chat no anuncia mensajes nuevos

**Ubicación:** [EventChatPage.tsx:161](../../../src/pages/EventChatPage.tsx:161), `ol.chat-messages`. **Categoría:** accesibilidad / interacción.

El historial está etiquetado y puede recibir foco, pero no tiene `role="log"` ni una región de anuncio dedicada. Las inserciones de Realtime actualizan la lista sin un mecanismo explícito para avisar a quien usa lector de pantalla.

**Impacto:** los mensajes nuevos pueden pasar inadvertidos mientras se escribe. **Recomendación:** anunciar sólo incorporaciones nuevas, evitando leer todo el historial al cargar o paginar; mantener autor y texto en el anuncio. Referencia: [WCAG 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). Verificar el comportamiento con lector de pantalla antes de afirmar cumplimiento. **Comando:** `$impeccable harden`.

### 7. El enlace al evento en Inicio tiene sólo 22 px de altura

**Ubicación:** [EventCard.tsx:65](../../../src/components/EventCard.tsx:65), tarjeta de descubrimiento; [home.css:10](../../../src/pages/home.css:10), acciones de tarjeta ocultas. **Categoría:** interacción táctil.

Se midió el enlace del título en 390 y 1280 px: altura **22 px**. En Inicio no aparece el enlace secundario de acciones; la foto y el resto de la tarjeta no amplían automáticamente ese target.

**Impacto:** resulta más difícil abrir eventos con el pulgar. **Recomendación:** extender el área activable del enlace dentro de la tarjeta, manteniendo foco visible y evitando solapar otros controles. **44×44 es el objetivo ergonómico de esta auditoría**, no el umbral general AA: [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) usa 24 px y admite excepciones de separación/inline. No se declara una infracción automática por medir menos de 44 px. Los enlaces inline de atribución de Mapbox se excluyen del conteo de defectos. **Comando:** `$impeccable adapt`.

### 8. El mapa sigue siendo una descarga inicial costosa

**Ubicación:** [EventMap.tsx:2](../../../src/components/maps/EventMap.tsx:2), import de Mapbox; [App.tsx:29](../../../src/App.tsx:29), entrada por `/map`. **Categoría:** rendimiento.

El build genera `EventMap` de **1.865,09 kB minificado / 518,60 kB gzip**, más CSS de 6,20 kB gzip. La carga diferida está implementada, pero la ruta inicial conduce al mapa, por lo que gran parte del coste se paga al entrar. La PWA precachea 48 recursos, 2.538,39 KiB según el build.

**Impacto:** mayor coste de transferencia y procesamiento en teléfonos modestos. No se midieron tiempos reales ni Core Web Vitals: el tamaño es evidencia de riesgo, no una latencia demostrada. **Recomendación:** perfilar el mapa en un teléfono/red limitada y comprobar carga y caché antes de cambiar proveedor o dependencias; conservar tarjetas como alternativa durante carga y error. **Comando:** `$impeccable optimize`.

## Patrones y aspectos positivos

Los defectos principales son compartidos: un límite de error ausente en el router, bordes de controles demasiado oscuros y variantes de degradados que necesitan validación por componente. La ausencia de overflow del documento no detecta recortes dentro de inputs o shells fijos.

Se mantienen buenas prácticas: `lang="es-AR"`, zoom no bloqueado, labels reales, `aria-invalid` y errores descritos, foco visible, skip link, navegación semántica, controles principales de 44–56 px, imágenes lazy en tarjetas/detalle y fallbacks de foto. La validación vacía de Registro enfoca `display-name` y marca tres campos; Crear también conserva sus campos y dirige el foco al error. Inicio ofrece recuperación tras un fallo REST: el reintento sintetizado volvió a cargar el evento. Los diálogos de acciones usan el elemento nativo, foco inicial y restauración del foco. El chat tiene protección contra envíos duplicados y conserva el texto ante error.

## Orden recomendado

1. **P1 — `$impeccable harden`:** recuperación de módulos diferidos; después anuncios nuevos del chat.
2. **P1 — `$impeccable colorize`:** texto destructivo y token de borde de controles.
3. **P2 — `$impeccable adapt`:** fechas a 320 px, chat con poca altura y enlace de tarjeta más fácil de tocar.
4. **P2 — `$impeccable optimize`:** medir coste de Mapbox en móvil real antes de decidir cambios.
5. **`$impeccable polish`:** revisión final de los cambios; volver a ejecutar `$impeccable audit` para actualizar la evaluación.

Podés pedir los comandos uno por uno, todos juntos o en el orden que prefieras.

## Documentación desincronizada

El contexto de impeccable informa que `.impeccable/design.json` es anterior a DESIGN.md y puede contradecir sus tokens. Se puede ejecutar `$impeccable document` para refrescar el sidecar conservando DESIGN.md. No se reparó como efecto secundario de esta auditoría.

## Evidencia

- [detector.json](2026-10-12-interface/detector.json): salida completa del detector.
- [measurements.json](2026-10-12-interface/measurements.json): primera ronda (descartar los intentos autenticados de Login/Registro y el escalado recursivo, según lo explicado arriba).
- [confirmation.json](2026-10-12-interface/confirmation.json): autenticación sin sesión, escalado corregido y fallo de módulo.
- [form-320.png](../verification/interface-audit-2026-10-12/form-320.png), [map-320.png](../verification/interface-audit-2026-10-12/map-320.png), [chat-240.png](../verification/interface-audit-2026-10-12/chat-240.png), [dialog.png](../verification/interface-audit-2026-10-12/dialog.png), [auth-errors.png](../verification/interface-audit-2026-10-12/auth-errors.png), [text-200.png](../verification/interface-audit-2026-10-12/text-200.png), [error-home.png](../verification/interface-audit-2026-10-12/error-home.png): capturas locales.

La auditoría no evalúa RLS, permisos de base de datos ni aceptación funcional remota. No se aplicaron migraciones ni se modificaron datos reales.

