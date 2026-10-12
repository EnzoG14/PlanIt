# PlanIt — Dirección visual aprobada: B · Amanecer

**Fecha:** 12/10/2026. **Estado:** dirección confirmada por el usuario; aplicación en la PWA pendiente. **Modo:** Operate. **Prototipo de referencia:** [design-lab](../../../design-lab/README.md), rutas `/b` y `/b/<pantalla>`; contrato de la dirección en [design-lab/directions/b.md](../../../design-lab/directions/b.md).

Esta decisión **reemplaza la dirección marina oscura v2.0** consolidada tras el [shape R1–R3](r1-r3-visual-evolution.md). De ese shape siguen vigentes los objetivos de usabilidad (jerarquía por pantalla, estados, fotografía real, mobile-first, límites funcionales); dejan de serlo su fondo marino uniforme, la paleta oscura y la prohibición de vidrio/sombras suaves. Los tokens y patrones están en [DESIGN.md](../../../DESIGN.md); su aplicación y aceptación, en [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md).

## 1. Por qué B

El lab comparó tres direcciones sobre las mismas pantallas (Inicio, Mapa, Mis eventos, Perfil) y, para B, también el detalle y las subpantallas de R1–R3 (asistentes, solicitudes, chat, notificaciones, crear).

| | A · Marea nocturna | **B · Amanecer** | C · Bento tonal |
|---|---|---|---|
| Modo | Oscuro | **Claro** | Claro |
| Protagonista | Fotografía | **Agenda / tipografía** | Datos en baldosas |
| Acción primaria | Píldora azul | **Píldora de tinta** | Botón marino + FAB |
| Navegación | Barra flotante de vidrio | **Dock de tinta con píldora activa** | Barra blanca con acción central |

B se eligió porque la agenda y la lectura de cuándo/dónde/cupo mandan sobre la decoración; porque reutiliza la paleta (tinta marina, azul, violeta) con roles claros; y porque cubre todas las pantallas R1–R3 con estados (unirme, inscripto, cupo completo, removido, en revisión, finalizado, organizador).

## 2. Qué cambia respecto de v2.0

| Aspecto | v2.0 (marino) | **Amanecer** |
|---|---|---|
| Modo | Oscuro, `#060b27` de fondo | Claro único, `#f6f5fd`; el marino pasa a ser tinta |
| Acción principal | Botón azul sólido 52 px | Píldora de tinta 48/56 px; azul reservado a filtros/progreso |
| Atmósfera | Sin fondos radiales ni halos | Mancha difusa superior (una por pantalla, `aria-hidden`) |
| Superficies | Planas, sin vidrio | Tarjetas blancas translúcidas, cristal y sombras lavanda suaves |
| Tipografía | Segoe UI, sin fuente externa | Bricolage Grotesque autoalojada, títulos 32–40 px con tracking negativo |
| Formas | Radios 8–20 px | Píldoras y radios de 26–36 px en superficies |
| Navegación | Barra inferior de 56 px con etiquetas | Dock flotante de tinta; sólo la pestaña activa muestra etiqueta |
| Fotografía | Texto debajo de la foto | Foto lateral 100×124 con hora en insignia; portada de 300 px en detalle |
| Se mantiene | Funcionalidad, rutas, nombre PlanIt, iconos lineales, azul y violeta, usabilidad móvil, estados con texto, una superficie por unidad, nada de tarjetas anidadas |

## 3. Desviaciones deliberadas del lab (a favor de accesibilidad)

1. `control-border` pasa de `#8c93b8` a `#7a82a8` (el lab daba 2,78:1 sobre el fondo; el nuevo 3,47:1 y 3,76:1 sobre blanco).
2. El violeta `#8d66fa` sólo lleva texto tinta; texto blanco sobre violeta da 3,88:1.
3. El cristal tiene fallback sin `backdrop-filter` (blanco ≥ .94) y respeta `prefers-reduced-transparency`.
4. La fuente se autoaloja; el lab la carga desde Google Fonts sólo por conveniencia de prototipo.
5. Los mocks usan datos ficticios e ilustraciones SVG; la PWA usa datos reales y fotografías autorizadas.

## 4. Elementos del lab que requieren decisión funcional

El lab es una propuesta visual. Los siguientes elementos no deben implementarse por estar dibujados; cada uno se decide al iniciar el bloque que lo contiene. Hasta entonces se implementa la versión compatible con el contrato R1–R3.

| Elemento del lab | Pantalla | Situación | Hasta decidir |
|---|---|---|---|
| Tira de 7 días con conteo que filtra la lista | Inicio | Es una navegación/filtro por fecha; los filtros de exploración pertenecen a R4 | Conservar la estructura actual de Inicio (agrupación existente) con el estilo Amanecer |
| Tarjetas rápidas "próximo evento" y "Crear evento" | Inicio | "Crear" ya existe como destino; "próximo evento" requiere definir su fuente (participaciones u organizados) | No dibujar tarjetas sin datos reales; reutilizar acciones existentes |
| Saludo "Hola, {nombre}" | Inicio | Usa `display_name`, ya disponible | Admitido |
| Contadores Organizás / Participás / Próximos | Perfil | El perfil propio no define contadores | No implementar |
| Campana con pip y contador de notificaciones | Inicio, Perfil | La bandeja existe; el contador de no leídas debe provenir de datos reales | Admitido sólo con datos reales |
| Buscador y chips de categoría de Inicio/Mapa | Inicio, Mapa | Composición del lab, no función R1–R3 | No implementar |
| Botón de ubicación del mapa | Mapa | La geolocalización existe en el mapa y en creación | Admitido según comportamiento actual |
| Dock con etiqueta sólo en la activa | Global | Iconos inactivos sin texto visible | Admitido; exige nombre accesible, `aria-current` y verificación con lector de pantalla |

## 5. Piloto Mis eventos (PR #27)

El [piloto de Mis eventos](../verification/ui-refresh/my-events/README.md) se implementó con la dirección marina v2.0. Su estructura (filas con miniatura, filtros, estados, paginación, menú y la lógica funcional) se conserva; su capa visual (fondo, colores, botones, pestañas, menú Cuenta) debe realinearse con Amanecer en el bloque de Foundation visual. No se aceptó ni fusionó: la revisión humana sigue pendiente y debe hacerse sobre la versión alineada.

## 6. Orden de aplicación

1. **Fundación Amanecer:** tokens CSS globales y reemplazo de las variables `--color-*`/`--gradient-primary`, fuente autoalojada, botón, campo, dock/AppLayout, StatusMessage y diálogo; realinear el piloto Mis eventos.
2. Login/registro y Crear/Editar.
3. Inicio, Mapa y Detalle (tras decidir la sección 4).
4. Galería y Asistentes; Chat, Perfil y Notificaciones; Acciones y Reincorporaciones.
5. Auditoría integral y regresión.

Ver [plan](../../implementation/UI_REFRESH_R1_R3_PLAN.md) y [estado](../../implementation/UI_REFRESH_R1_R3_STATUS.md).

## 7. Límites

No cambia rutas, backend, SQL, RLS, validaciones, horario Argentina, branding ni el alcance R1–R3. No añade funciones R4–R7 (favoritos, entradas, filtros, métricas). Actualizar documentos no declara migrada, probada ni aceptada ninguna pantalla.
