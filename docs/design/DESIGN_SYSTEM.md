# PlanIt — Sistema visual de referencia (v1.0)

> **Fuente principal:** imágenes `mockups/release-1.png` a `mockups/release-7.png`, proporcionadas para preservar el diseño original de la app al reconstruirla como PWA React. Las capturas son *referencias visuales*, no planos de medidas exactas ni prueba de funcionalidades implementadas.
>
> **Jerarquía de verdad:** requisitos funcionales/criterios de aceptación y decisiones de arquitectura determinan **qué hace** PlanIt; estos mockups determinan **cómo se ve y organiza** la interfaz. Si chocan, informar el conflicto y respetar el comportamiento aprobado. No implementar funcionalidades por el solo hecho de aparecer en una imagen.

## 1. ADN visual — innegociable

- **Dark-first:** fondos azul medianoche, no fondos blancos, beige ni verde. Aplicación de estética oscura, tecnológica y social, con profundidad por superficies azul-marino superpuestas.
- **Acento eléctrico:** azul cobalto intenso que transiciona a violeta/lila. Los CTA principales usan degradado **azul → violeta** horizontal; elementos seleccionados usan azul.
- **Tipografía:** sans-serif contemporánea y compacta, blanca o gris lavanda, con títulos claros y de buena jerarquía. Inter o una fuente sans del sistema puede aproximarla, **pero no se conoce la familia exacta original**.
- **Elementos:** formularios en superficies oscuras suavemente iluminadas, bordes finos azul-lavanda, esquinas redondeadas, pills para categorías y filtros, íconos lineales.
- **Imágenes de eventos:** protagonistas. Tarjetas con fotografías grandes de fiestas, música, arte, rooftops y encuentros nocturnos. Overlays oscuros y legibilidad alta.
- **Mobile-first:** el diseño de producto que muestran los mockups es una app de una columna, con CTA accesibles desde el pulgar y navegación inferior para áreas principales; desktop será una adaptación responsiva, **no otro diseño nuevo**.
- **Sensación visual:** premium pero simple; no incorporar glassmorphism extremo, estética corporativa genérica, gradientes verde-mint, emojis como íconos ni sombras exageradas.

### Importante: póster versus interfaz

Cada PNG representa un **collage de cinco teléfonos sobre un póster de presentación** (título enorme, círculos exteriores, numeración y subtítulos bajo los teléfonos). **Los círculos azules gigantes, la numeración 1–5 y los títulos “R1/R2...” no son parte de la UI móvil**. Sólo utilizar como diseño de aplicación lo que aparece *dentro de las pantallas de los teléfonos*.

## 2. Tokens aproximados

Colores propuestos observando los mockups; **son aproximaciones visuales iniciales, no valores extraídos de Figma ni exactos**. Ajustarlos comparando screenshots reales contra las referencias.

| Token | Valor inicial sugerido | Uso |
| --- | --- | --- |
| `--color-bg` | `#060B27` | Fondo profundo de la aplicación |
| `--color-bg-elevated` | `#0D1638` | Tarjetas y bloques secundarios |
| `--color-field` | `#151D3E` | Inputs, filtros, filas clicables |
| `--color-border` | `#303D70` | Bordes y divisores tenues |
| `--color-text` | `#F8F8FF` | Títulos y contenido destacado |
| `--color-text-muted` | `#ADB7D8` | Descripciones, metadatos |
| `--color-primary` | `#0753FF` | Selección y comienzo de CTA |
| `--color-purple` | `#8D66FA` | Final de CTA, acento alternativo |
| `--color-accent-pink` | `#CF54E9` | Acento ocasional |
| `--color-success` | `#13CB92` | Confirmado / disponible |
| `--color-danger` | `#FF526C` | Cancelar / eliminar visualmente (archivar en negocio) |

Gradiente de CTA: `linear-gradient(95deg, #0753FF 0%, #8D66FA 100%)`.

```css
:root {
  color-scheme: dark;
  --color-bg: #060b27;
  --color-bg-elevated: #0d1638;
  --color-field: #151d3e;
  --color-border: #303d70;
  --color-text: #f8f8ff;
  --color-text-muted: #adb7d8;
  --color-primary: #0753ff;
  --color-purple: #8d66fa;
  --color-success: #13cb92;
  --color-danger: #ff526c;
  --gradient-primary: linear-gradient(95deg, #0753ff, #8d66fa);
  --radius-control: 12px;
  --radius-card: 16px;
  --radius-pill: 999px;
}
```

## 3. Tipografía y densidad

- Texto primario en blanco cálido; secundario en azul-gris o lavanda. Nunca azul tenue sobre fondo azul sin comprobar contraste.
- Título de pantalla móvil aprox. 22–28 px, peso 650–750; títulos de tarjeta 16–20; body 14–16; metadata 12–13. Son guías para web móvil, no medidas obtenidas del PNG.
- Utilizar una escala de espacio coherente de 4/8/12/16/24/32 px; mantener respiración sin hacer la interfaz innecesariamente alta.
- Formularios con label o placeholder legible, ícono a la izquierda cuando sea útil, input mínimo ~48–52 px; foco visible, error debajo y no solamente color.
- CTA principal ancho completo, altura aproximada 48–54 px, esquinas ~12 px, texto blanco semibold.
- Controles interactivos con área táctil de al menos 44×44 CSS px; teclado/foco y `prefers-reduced-motion`.

## 4. Componentes base a extraer (cuando haya caso real)

1. `AppShell` / `BottomNavigation` para pantallas autenticadas (Inicio, Mapa, Mis eventos, Perfil; ocultar o no mostrar rutas futuras hasta implementarlas).
2. `AuthScreenLayout`: fondo marino, encabezado compacto/progreso sólo si representa un flujo real, ícono circular, formulario y CTA inferior.
3. `GradientButton`, variantes primaria/secundaria/peligro; disabled/loading.
4. `TextField`, `PasswordField`, `SelectField`, `DateTimeField`, `LocationField` visualmente compatibles.
5. `CategoryChip`: inactiva contorno fino, activa azul eléctrico; una sola categoría por evento, aunque existan múltiples chips en filtro de búsqueda futuro.
6. `EventCard`: imagen con overlay, título, horario, lugar, etiquetas y acción coherente con RF.
7. `EventHero`: fotografía grande, información agrupada, capacidad y CTA.
8. `CapacityBar`: barra azul-violeta y texto n/N; derivada de participantes confirmados.
9. `ListRow`: icono lineal, título, descripción/badge, chevron; para menús y listas.
10. `ScreenHeader`: flecha atrás, título, acciones autorizadas. **No inventar favoritos, entradas, rating, share o funciones no aprobadas**.
11. `LoadingState` / `EmptyState` / `ErrorState` estilizados; evitar páginas placeholder de marketing como solución definitiva.

No construir una biblioteca propia extensa antes de tener dos pantallas que requieran reutilización. No incorporar un UI kit con estilos ajenos a los mockups.

## 5. Estructura y navegación

- **Pantallas de autenticación:** diseño dedicado a pantalla completa, sin header corporativo de escritorio ni footer promocional.
- **Zona de exploración:** búsqueda superior, chips y mapa o tarjetas; la búsqueda avanzada, filtros múltiples y favoritos corresponden a releases posteriores.
- **Detalle:** imagen hero, título, fecha/hora, dirección, descripción, capacidad, acción principal de inscripción. Mantener CTA visible sin tapar contenido.
- **Navegación inferior móvil:** los mockups R2 muestran cuatro secciones `Inicio`, `Mapa`, `Mis eventos`, `Perfil` con ícono + etiqueta y estado activo azul. R1 puede necesitar una versión reducida coherente con las rutas realmente disponibles. Respetar áreas seguras: `env(safe-area-inset-bottom)`.
- **Escritorio:** contenido con máximo ancho legible, grid en listados y navegación adaptada, conservando tokens y jerarquía visual; no replicar marco de teléfono en la web.
- **Mapa:** usar un mapa geográfico real cuando se implemente (ej., Leaflet). El dibujo oscuro del mockup ilustra apariencia, no sustituye datos geográficos ni las atribuciones del proveedor de tiles.

## 6. Fotografía, íconos y activos

- Las fotos ilustrativas dentro de los mockups son referencias de composición/color, **no un paquete de assets reutilizables**. No recortar y publicar fotos extraídas del collage como contenido real de eventos.
- Usar iconos lineales consistentes (un único set, por ejemplo Lucide si está aceptado como dependencia), no mezcla arbitraria de Unicode/emojis.
- El logo e iconografía de PWA que creó BLOQUE 0 son provisionales frente al diseño original: revisarlos comparando el mockup. No reemplazarlos por otro branding sin aprobación.
- Si faltan fotos reales de prueba, usar placeholders propios y dejar indicado que son datos ficticios; nunca simular en la app eventos reales inexistentes.

## 7. Criterios de fidelidad

- Comparar capturas reales de navegador móvil (360×800, 375×812 y 390×844) con la parte correspondiente del mockup; no usar comparación pixel a pixel contra el collage reducido.
- Revisar fondos, acentos, títulos, proporciones, card/image crops, botones, inputs, chips, navegación, áreas táctiles y safe-area.
- Validar también ancho 768 px y escritorio >= 1200 px sin desbordes.
- Aceptación: misma identidad visual y organización; diferencias razonables para accesibilidad, responsive y campos obligatorios adicionales, documentadas.
- Ante duda de colores exactos o layout oculto por el collage, marcar `NO DEFINIDO POR MOCKUP` y pedir decisión; no fingir precisión.
