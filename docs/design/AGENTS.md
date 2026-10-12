# PlanIt — Reglas específicas para agentes de diseño/UI

Complementan [AGENTS.md raíz](../../AGENTS.md) y [la guía de frontend](../../src/AGENTS.md). Consultar las referencias antes de modificar UI; no hace falta que el prompt vuelva a citarlas para que sean obligatorias.

## Autoridad

**Funcionalidad:** requisitos y criterios de aceptación aprobados → especificación técnica y decisiones de negocio → contratos de datos, migraciones y autorizaciones vigentes. No inventar requisitos ni convertir una ilustración en una función.

**Diseño:** [PRODUCT.md](../../PRODUCT.md) cuando exista → [DESIGN.md](../../DESIGN.md) aprobado → [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) → componentes y patrones aprobados → mockups históricos R1–R3. PRODUCT.md aporta contexto; DESIGN.md define tokens. El [shape aprobado](proposals/r1-r3-visual-evolution.md) desarrolla la composición por pantalla.

[SCREENS.md](SCREENS.md), [DESIGN_GAPS.md](DESIGN_GAPS.md), mockups y prompts anteriores aportan inventario y contexto histórico. Sus instrucciones de fidelidad, CTA degradados, brillos o recuperación de la apariencia original quedan subordinadas al sistema aprobado. No exigir fidelidad pixel-perfect a collages ni a capturas anteriores al refresh.

## Dirección y uso de Impeccable

- Fotografía expresiva, interfaz marina y sobria. Conservar nombre, logo, paleta azul/violeta, iconos lineales, rutas y navegación vigente.
- Dar prioridad al producto y a la tarea: acciones sólidas, superficies planas, espacio/divisores y una unidad visual por evento. Retirar gradientes decorativos, halos y contenedores anidados según el shape.
- Utilizar Impeccable cuando esté disponible en rediseño, crítica y refinamiento. Leer el contexto aprobado antes de actuar; no cambiar decisiones ni regenerar el sistema por iniciativa propia.
- Foundation no vuelve a ejecutar init, document, critique, audit o shape. Conservar sus resultados. Las observaciones históricas sobre documentación desincronizada no autorizan regenerarla como efecto secundario. Una auditoría integral posterior requiere su propio alcance y reporte, sin sobrescribir evidencia previa.
- Reutilizar componentes existentes y su responsabilidad; evitar variantes redundantes, fuentes externas, UI kits o dependencias sin necesidad.
- Mobile-first con continuidad en escritorio, accesibilidad, foco visible, targets cómodos, safe areas y estados recuperables.

## Protocolo de implementación futura

1. Leer sistema, shape, [auditoría consolidada](audits/UI_REFRESH_R1_R3.md), [plan](../implementation/UI_REFRESH_R1_R3_PLAN.md), [estado visual](../implementation/UI_REFRESH_R1_R3_STATUS.md) y contratos funcionales aplicables.
2. Inspeccionar la pantalla actual y tomar capturas reales antes de editar; identificar sesión, datos de prueba y dimensiones. Consultar mockups sólo para rasgos conservados.
3. Implementar el bloque autorizado con el cambio mínimo y componentes reutilizables, preservando comportamiento. Una decisión aprobada no necesita nueva aprobación para ejecutarse dentro del pedido; plantear conflictos o cambios de dirección fuera del alcance antes de aplicarlos.
4. Verificar capturas después del cambio en móvil/escritorio contra el objetivo aprobado. Comprobar 320/375/390/768/1280 px, texto ampliado, poca altura, recortes internos, foco, navegación y estados. Ejecutar build/lint si cambia frontend.
5. Probar dispositivos reales para teclado, safe areas y gestos del mapa, y lector de pantalla para anuncios; registrar claramente los casos no ejercitados. No presentar fixtures o emulación como aceptación humana o prueba remota.
6. Actualizar sólo el seguimiento visual con cambios, evidencia y pendientes. Las etapas visuales no son nuevas releases funcionales; no actualizar estados funcionales por trabajo estético.

## Restricciones conservadas

- Mantener seguridad, autenticación, permisos, privacidad, validaciones, fechas Argentina y estructura del proyecto. No tocar modelos de datos, RPC, migraciones, RLS, SQL ni reglas de negocio por motivos estéticos; no escribir en Supabase desde tareas de diseño.
- No persistir borradores; no borrar eventos o historiales; conservar cancelación/archivo y comprobaciones de resultado incierto.
- No eliminar campos exigidos por RF/BD aunque no aparezcan en mockups, incluido ends_at.
- No agregar entradas/pagos, reseñas, rating, favoritos, amigos, audio, filtros nuevos o permisos por verse en una captura; no dibujar botones inertes de futuras releases.
- No replicar títulos R1–R7, círculos externos o numeración del póster. No conservar verde/crema de marketing como identidad ni usar capturas como fondos.
- No extraer fotos del collage como eventos reales; usar contenido autorizado o fixtures identificados. Ausencia de foto implica una alternativa compacta, no una portada ficticia.
- No declarar pantallas migradas, defectos resueltos o aceptación por actualizar documentación. Foundation termina con su PR y no modifica pantallas.
