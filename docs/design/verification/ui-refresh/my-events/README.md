# Mis eventos — piloto UI Refresh

12/10/2026. Rama `design/ui-refresh-my-events`, desde `origin/main` 796aadc con Foundation #26 integrada. Implementación lista para revisión; aceptación visual y funcional humana pendiente. No cambia las releases funcionales.

## Comparación

| Vista | Antes | Después | Primera fila antes → después |
| --- | --- | --- | --- |
| 320 × 800 | [Captura](before/organizing-320x800.png) | [Captura](after/organizing-320x800.png) | 478 → 379 px |
| 360 × 800 | [Captura](before/organizing-360x800.png) | [Captura](after/organizing-360x800.png) | 478 → 379 px |
| 375 × 812 | [Captura](before/organizing-375x812.png) | [Captura](after/organizing-375x812.png) | 478 → 379 px |
| 390 × 844 | [Captura](before/organizing-390x844.png) | [Captura](after/organizing-390x844.png) | 478 → 379 px |
| 768 × 1024 | [Captura](before/organizing-768x1024.png) | [Captura](after/organizing-768x1024.png) | 429 → 343 px |
| 1280 × 900 | [Captura](before/organizing-1280x900.png) | [Captura](after/organizing-1280x900.png) | 429 → 343 px |

Las posiciones proceden de los JSON de mediciones, no de una estimación visual. Las imágenes son capturas de la app real en Edge Chromium headless, con Auth/REST/Storage interceptados. Identidades, eventos y portada geométrica son fixtures; la portada no representa una fotografía de un evento real. Zona del navegador Asia/Tokyo para detectar dependencia accidental del horario del equipo. No se realizaron escrituras remotas.

## Cambios y criterio

- Dirección aprobada: fondo marino uniforme, acción y filtro activos azules sólidos, pestañas planas con indicador, navegación activa sólida sólo en esta ruta. Se reutilizan `AppLayout`, `CompactEventCard`, `StatusMessage` y el diálogo existente. Sin dependencias nuevas.
- Lista continua con divisores, miniatura compacta, título a 17 px, fecha/lugar y estados a 14 px. Categoría secundaria sin otra pill. Acciones separadas del enlace del evento. Creación con texto visible «Crear» en móvil y «Crear evento» en escritorio.
- C3: se eliminan el contenedor de pestañas y la ayuda histórica permanente; la explicación de Próximos sigue junto al filtro. Se conserva Actualizar y se elimina el margen de la región de éxito cuando está vacía.
- Accesibilidad/plataforma: contorno perceptible de filtros, targets de al menos 44 px, foco heredado, menú con scroll, borde funcional y aviso de continuación cuando hay poca altura (el sistema operativo puede ocultar su scrollbar). Títulos extremos limitados visualmente a tres líneas y lugar a dos; su texto íntegro permanece en el DOM/nombre accesible y en el detalle enlazado. Fecha y estados no se truncan. El área fotográfica decorativa no añade «Sin foto» al nombre del evento cuando una imagen la cubre.
- El encabezado puede envolver al aumentar texto. Se mantienen safe areas y reserva inferior del shell existente. El menú conserva el cálculo de altura/posición y su restauración de foco, sin nuevos permisos ni cambios de operaciones.
- Los estilos del piloto están acotados por `.my-events-shell`/`.my-events-page`. `EventCard` de descubrimiento, CSS global, backend, RPC, SQL, RLS y estados funcionales no se modificaron. El cambio local previo de Vite se excluye de la PR.

## Evidencia de estados y pruebas

36 capturas anteriores y 48 posteriores cubren Organizo, Participo (confirmada/cancelada/removida), 36 eventos y carga adicional, menú en el último evento, textos largos, foto fallida/ausente, vacío, red fallida y reintento, carga, altura de 360 px y ampliación de texto.

[Mediciones anteriores](before/measurements.json), [posteriores](after/measurements.json), [critique](critique.md) y [audit final](audit.md). Las capturas `short-menu` conservan en su nombre las dimensiones iniciales, pero el viewport efectivo mide **360 px de altura**, registrado en el JSON posterior. `fullPage` incluye el contenido fuera del viewport; la barra fija aparece en su posición visible. El caso `text-200` duplica los tamaños computados de todos los elementos de la pantalla; es una prueba sintética de texto, no zoom nativo ni lector de pantalla.

| Comando | Resultado y alcance |
| --- | --- |
| `npm run build` | PASS; conserva aviso del módulo Mapbox (~518,61 kB gzip), fuera de este bloque |
| `npm run lint` | Exit 0; 204 warnings en binarios JS locales de Impeccable bajo `.agents`/`.claude`, excluidos de la PR |
| `npx oxlint src scripts` | PASS sin diagnósticos |
| `npm run check:my-events` | PASS, seis grupos sobre PostgreSQL 17.5 aislado; replay de migraciones sólo en la BD efímera local |
| `npm run check:my-events:ui` | PASS a 375 × 812 y 1280 × 900; [resultados](regression-list/ui-results.json) |
| `npm run check:event-actions:ui` | PASS a 360/375/390/768/1280 px; [resultados](regression-actions/ui-results.json) |
| `node scripts/check-my-events-refresh-ui.mjs before` / `after` | PASS; sin overflow horizontal, targets comprobados suficientes, último comando del menú alcanzable por foco con poca altura |
| `git diff --check` | PASS |

[Resultados PostgreSQL](regression-list/postgres-results.json). Las regresiones preservan filtros previos a paginación, precedencia, historia archivada, estados, cuenta/sesión, regreso contextual, respuestas tardías, carga adicional/reintento, Storage y permisos. Los checks de acciones incluyen duplicación, cancelación/archivo, resultado incierto, restricciones por estado y ausencia de segunda escritura. Las escrituras de los recorridos de UI se interceptan; no son pruebas E2E remotas.

Los runners existentes admiten ahora `PLANIT_UI_OUTPUT` para guardar resultados nuevos sin sobrescribir evidencia histórica. El nuevo runner no añade dependencias.

## Impeccable y límites

### Ajuste de Cuenta aprobado durante la revisión

Mi perfil y Salir del header se agrupan ahora en **Cuenta**, junto a la campana. Disclosure con icono/etiqueta/flecha, superficie marina, perfil y cierre de sesión separados. Se aplica únicamente al piloto; el header de otras rutas conserva su comportamiento anterior. Nuevos `AccountMenu.tsx`/`account-menu.css`, dos iconos lineales en el registro existente y composición en AppLayout. No cambia la llamada de logout ni el alcance local de sesión.

El runner posterior verifica ArrowDown, foco inicial en Mi perfil, Escape/retorno de foco, clic afuera, navegación a `/me`, alcance por ruta, estado bloqueado durante logout y eliminación de la sesión local tanto con respuesta HTTP rechazada como exitosa (una solicitud por intento). [Cuenta móvil](after/account-menu-320x800.png), [Cuenta escritorio](after/account-menu-1280x900.png), [logout con rechazo remoto simulado](after/account-logout-rejected-375x812.png). Los seis tamaños anteriores mantienen los checks de layout y estados; las capturas posteriores incorporan este ajuste. Build/lint y la regresión de Mis eventos se repiten.

Se corrigieron dos supuestos del nuevo test: el clic afuera apuntaba al título cubierto por el panel, y se esperaba que un fallo HTTP mantuviera al usuario conectado. El SDK instalado (`@supabase/auth-js`, `_signOut`) elimina la sesión local incluso al devolver ese error; se comprobó contra su código y la [documentación de signOut](https://supabase.com/docs/reference/javascript/auth-signout). Esa lógica preexistente no se modificó. La prueba además detectó blur/cierre anticipado al deshabilitar el control; el menú ahora conserva el estado visible mientras espera.

Se ejecutó `context` una vez y se leyeron critique/polish/harden/audit/craft-floor. Crítica con dos subagentes independientes autorizados, detector TSX y revisión de capturas; refinamiento acotado y confirmación final. El helper `live` respondió, pero no hubo sesión durable activa (`live-resume: active:false`). La navegación inicial del navegador integrado falló; el assessment B consiguió luego abrir una pestaña nueva, inspeccionar AX/estilos/captura y cerrarla. No se inyectó un overlay ni se generaron/aceptaron variantes Live: la evaluación visual principal usa la automatización existente. Se emitió `live-server stop`; no quedó helper de esta tarea activo.

Pendientes: aceptación humana, lector de pantalla, zoom nativo, teclado y safe areas en iOS/Android físicos, fotografías reales claras/oscuras y E2E remoto. Las pruebas automáticas no acreditan esos casos. Los diálogos mantienen su diseño anterior; el refresh de acciones completas pertenece al bloque 7. A1 (recuperación de módulos), A3 global (inputs) y A8 (perfilado del mapa) siguen pendientes en sus alcances; el borde de control se aplica aquí sólo a controles del piloto. No se propone una dirección nueva ni quedan decisiones visuales nuevas para aprobar.
