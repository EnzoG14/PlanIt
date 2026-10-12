# Dirección B · Amanecer

**Estado: APROBADA el 12/10/2026.** Consolidada en [DESIGN.md](../../DESIGN.md) y [DESIGN_SYSTEM.md](../../docs/design/DESIGN_SYSTEM.md); decisión en [amanecer-direction.md](../../docs/design/proposals/amanecer-direction.md). Si este contrato difiere de DESIGN.md, manda DESIGN.md.

**Referencia:** app de agenda con luz difusa (fondo claro con mancha de color, tipografía grande, píldoras negras, tarjetas blancas, agenda en timeline).

THESIS: la agenda manda y el color es luz, no relleno. Una mancha difusa violeta→azul detrás de tarjetas blancas; el negro (marino) es la tinta y la acción.
OWN-WORLD: lavanda casi blanca `#f6f5fd`, tinta marino `#060b27`, azul `#0753ff` para selección de filtro, violeta como luz de fondo y acento (texto en `#5b34d6`). Tarjetas blancas translúcidas (28 px), píldoras de tinta como botones, dock oscuro con la pestaña activa como píldora blanca con etiqueta. Tipografía Bricolage Grotesque, títulos grandes (36–40 px) con tracking negativo moderado.
STORY: "¿Qué plan armamos esta semana?" → elegís un día en la tira semanal y ves lo que hay; Mis eventos es una línea de tiempo con hora a la izquierda y barra de color por estado.
FIRST VIEWPORT (Inicio): marca, saludo, titular grande, dos tarjetas rápidas (próximo evento / crear), tira de 7 días con conteo.
QUÉ ROMPE DE DESIGN.md: modo claro, gradiente/mancha de fondo, vidrio y sombras suaves, píldora grande de tinta, fuente externa.
ANTI-REFERENCIAS: el amarillo de la referencia, asistente de IA (PlanIt no lo tiene), gradiente dentro de botones o tarjetas.
RIESGO: texto secundario sobre la mancha — se usa `#2f3664` ahí (≥5,2:1).

## Iteración 2 (pantallas de evento y cuenta)
Subpantallas sin barra inferior: acción principal fija abajo (píldora de tinta) en Detalle, composer en Chat, publicar en Crear. Diálogos y hojas en blanco sobre velo marino (el destructivo usa `#ce103d` con texto blanco). Estados siempre con texto, no solo color. Campos con label visible, 16 px, 52 px de alto y borde de control `#8c93b8`.
