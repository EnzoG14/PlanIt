# PlanIt — Reglas específicas para agentes de diseño/UI

Complementan [AGENTS.md raíz](../../AGENTS.md) y [la guía de frontend](../../src/AGENTS.md). Consultar las referencias antes de modificar UI; no hace falta que el prompt vuelva a citarlas para que sean obligatorias.

## Autoridad

**Funcionalidad:** requisitos y criterios de aceptación aprobados → especificación técnica y decisiones de negocio → contratos de datos, migraciones y autorizaciones vigentes. No inventar requisitos ni convertir una ilustración en una función.

**Diseño:** [PRODUCT.md](../../PRODUCT.md) cuando exista → [DESIGN.md](../../DESIGN.md) aprobado → [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) → [decisión de dirección Amanecer](proposals/amanecer-direction.md) → componentes y patrones aprobados → prototipo [design-lab](../../design-lab/README.md) (`/b`) → mockups históricos R1–R3. PRODUCT.md aporta contexto; DESIGN.md define tokens. La decisión de dirección registra qué cambió y qué elementos del lab requieren decisión funcional.

El prototipo del lab ilustra composición, estados y movimiento, pero sus datos son ficticios y no es fuente de tokens: ante diferencia con DESIGN.md manda DESIGN.md. El [shape R1–R3](proposals/r1-r3-visual-evolution.md), [SCREENS.md](SCREENS.md), [DESIGN_GAPS.md](DESIGN_GAPS.md), los mockups y los prompts anteriores aportan inventario funcional y contexto histórico; sus instrucciones de apariencia (marino oscuro, CTA degradados o azules, brillos, recuperación del diseño original) quedan subordinadas a Amanecer. No exigir fidelidad pixel-perfect a collages, capturas anteriores al refresh ni al lab.

## Dirección y uso de Impeccable

- **B · Amanecer:** la agenda manda y el color es luz, no relleno. Modo claro único (`bg` lavanda casi blanca), tinta marina para la acción y la navegación, azul para filtros seleccionados y progreso, violeta como luz y acento. Conservar nombre, logo, iconos lineales, rutas y las cuatro pestañas.
- Una mancha difusa superior por pantalla; tarjetas blancas/cristal con sombras lavanda suaves; píldoras para lo accionable; títulos grandes con tracking negativo; Bricolage Grotesque autoalojada. Sin gradientes en botones, tarjetas, chips ni mensajes; sin tarjetas anidadas; sin tema oscuro.
- Estados siempre con texto o icono; violeta sólo con texto tinta; datos operativos ≥ 13,5 px; foco violeta de 3 px; áreas ≥ 44 px.
- Utilizar Impeccable cuando esté disponible en rediseño, crítica y refinamiento, leyendo antes `impeccable context` (PRODUCT.md y DESIGN.md). No cambiar la dirección aprobada ni regenerar DESIGN.md, el sidecar o DESIGN_SYSTEM.md por iniciativa propia: una nueva dirección o reedición del sistema exige pedido del usuario. Las observaciones de init/document/critique/audit/shape anteriores a Amanecer son evidencia histórica; las nuevas evaluaciones se reportan sin sobrescribirlas.
- Reutilizar componentes existentes y su responsabilidad; evitar variantes redundantes, UI kits o dependencias sin necesidad. La única fuente externa autorizada es Bricolage Grotesque, autoalojada.
- Mobile-first con continuidad en escritorio, accesibilidad, foco visible, targets cómodos, safe areas y estados recuperables.

## Protocolo de implementación futura

1. Leer sistema, [decisión de dirección](proposals/amanecer-direction.md), [auditoría consolidada](audits/UI_REFRESH_R1_R3.md), [plan](../implementation/UI_REFRESH_R1_R3_PLAN.md), [estado visual](../implementation/UI_REFRESH_R1_R3_STATUS.md) y contratos funcionales aplicables.
2. Inspeccionar la pantalla actual y tomar capturas reales antes de editar; identificar sesión, datos de prueba y dimensiones. Consultar el lab (`npx vite --config design-lab/vite.config.ts`, `/b/<pantalla>`) para composición y estados; el código y los tokens salen de DESIGN.md.
3. Implementar el bloque autorizado con el cambio mínimo y componentes reutilizables, preservando comportamiento. Una decisión aprobada no necesita nueva aprobación dentro del pedido; plantear conflictos o cambios de dirección fuera del alcance antes de aplicarlos. Los elementos del lab listados en la sección 4 de la decisión no se implementan sin decisión funcional.
4. Los componentes compartidos (tokens globales, botón, campo, dock/AppLayout, StatusMessage, diálogo) se migran en el bloque de Fundación Amanecer antes de propagar a pantallas; comprobar las superficies consumidoras al tocarlos.
5. Verificar capturas antes/después en móvil/escritorio contra DESIGN.md. Comprobar 320/375/390/768/1280 px, texto ampliado, poca altura, recortes internos, foco, navegación, carga de la fuente, `prefers-reduced-motion`, `prefers-reduced-transparency` y contraste del cristal sobre la mancha. Ejecutar build/lint si cambia frontend.
6. Probar dispositivos reales para teclado, safe areas, rendimiento del desenfoque y gestos del mapa, y lector de pantalla para anuncios (incluido el dock con iconos inactivos); registrar los casos no ejercitados. No presentar fixtures o emulación como aceptación humana o prueba remota.
7. Actualizar sólo el seguimiento visual con cambios, evidencia y pendientes. Las etapas visuales no son nuevas releases funcionales; no actualizar estados funcionales por trabajo estético.

## Restricciones conservadas

- Mantener seguridad, autenticación, permisos, privacidad, validaciones, fechas Argentina y estructura del proyecto. No tocar modelos de datos, RPC, migraciones, RLS, SQL ni reglas de negocio por motivos estéticos; no escribir en Supabase desde tareas de diseño.
- No persistir borradores; no borrar eventos o historiales; conservar cancelación/archivo y comprobaciones de resultado incierto.
- No eliminar campos exigidos por RF/BD aunque no aparezcan en mockups o en el lab, incluido ends_at.
- No agregar entradas/pagos, reseñas, rating, favoritos, amigos, audio, filtros o buscadores nuevos, contadores de perfil ni permisos por verse en una captura; no dibujar botones inertes de futuras releases.
- No replicar títulos R1–R7, círculos externos o numeración del póster; no usar capturas, collages o ilustraciones SVG del lab como contenido real.
- No extraer fotos del collage como eventos reales; usar contenido autorizado o fixtures identificados. Ausencia de foto implica una alternativa compacta, no una portada ficticia.
- No declarar pantallas migradas, defectos resueltos o aceptación por actualizar documentación. Esta tarea documental no modifica pantallas.
