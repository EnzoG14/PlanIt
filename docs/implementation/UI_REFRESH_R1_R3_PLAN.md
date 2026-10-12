# PlanIt — Plan visual UI Refresh R1–R3

Fecha: 12/10/2026. Seguimiento independiente de las releases funcionales. Estos bloques son una propuesta de trabajo visual sobre funciones existentes, no nuevas releases ni autorización para implementarlas en Foundation.

## Referencias y límites

Aplicar [AGENTS.md raíz](../../AGENTS.md), [guía frontend](../../src/AGENTS.md) y [reglas de diseño](../design/AGENTS.md). Jerarquía visual: [PRODUCT.md](../../PRODUCT.md) cuando exista → [DESIGN.md](../../DESIGN.md) aprobado → [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) → patrones aprobados → mockups históricos. [Shape](../design/proposals/r1-r3-visual-evolution.md) y [auditoría consolidada](../design/audits/UI_REFRESH_R1_R3.md) aportan dirección y evidencia.

Conservar funcionalidades R1–R3, seguridad/Auth/RLS, datos, RPC, migraciones, permisos, fechas, validaciones y estructura. No cambiar reglas de negocio por estética. Reutilizar componentes existentes; no incorporar nuevas funciones, UI kits o dependencias innecesarias. No regenerar sistema ni repetir los comandos de Foundation.

No modificar [estado funcional R1](RELEASE_1_STATUS.md), [R2](RELEASE_2_STATUS.md) o [R3](RELEASE_3_STATUS.md) por avances visuales. El estado de estos bloques vive en [UI_REFRESH_R1_R3_STATUS.md](UI_REFRESH_R1_R3_STATUS.md).

## Etapas propuestas

| Bloque | Etapa | Entrega y alcance | Hallazgos relacionados |
| --- | --- | --- | --- |
| 0 | Foundation y consolidación del sistema visual | Preservar documentos aprobados y reportes, alinear instrucciones, consolidar auditoría, crear plan/estado y entregar PR documental | Trazabilidad y jerarquía de referencias |
| 1 | Pantalla piloto: Mis eventos | Priorizar primera fila, contextualizar ayuda/Actualizar, conservar Organizo/Participo, cinco filtros, estados, paginación y menú; validar patrones reutilizables | C3; revisar shell y recuperación A1, controles compartidos A3 en alcance autorizado |
| 2 | Login y registro | Encabezado compacto, formulario directo, campos/foco legibles; preservar sesión, errores, mostrar contraseña y confirmación de correo | A3; dirección de shape, sin inventar severidades |
| 3 | Crear y editar eventos | Formulario por secciones sin contenedores redundantes; fechas completas, inicio/fin, ubicación, cupo y portada de edición compacta | A3/A4; conservar validación y estado local |
| 4 | Inicio, mapa y detalle del evento | Fotos naturales, fallback compacto, apertura amplia, una columna móvil en resultados; acercar disponibilidad y participación | C1/C2/C4, A1/A7; medir A8 antes de ampliar alcance técnico |
| 5 | Galería y asistentes | Fotos como superficie principal; filas/divisores y acciones estables, portada/orden/eliminación y privacidad preservados | Shape; A2 ya tiene corrección histórica de contraste, objetivo sólido pendiente |
| 6 | Chat, perfil y notificaciones | Conversación y composer alcanzables, metadatos legibles, identidad y novedades jerarquizadas; preservar Realtime, permisos y estados | C5, A5/A6; lector de pantalla y teclado real |
| 7 | Acciones y reincorporaciones | Acciones sólidas, confirmaciones y filas claras; preservar cancelación/archivo, duplicación, solicitudes, cupos y resultado incierto | A2: migración visual pendiente, sin reabrir el rojo anterior como fallo actual |
| 8 | Auditoría integral y regresión | Evaluación nueva con alcance explícito, capturas, matriz de recorridos/estados, accesibilidad y regresión R1–R3 | Reevaluar hallazgos con evidencia; no sobrescribir reportes históricos |

Todos los bloques de UI comienzan pendientes. Foundation sólo se completa al existir documentación coherente, validaciones y commit/PR; no implica implementación o aceptación visual de ninguna pantalla.

## Orden y dependencias

Mis eventos prueba la densidad, filas y estados antes de extenderlos. Ajustar componentes compartidos sólo dentro del pedido de implementación y comprobar superficies consumidoras. Los P1 históricos de recuperación de módulos y bordes requieren atención temprana, sin esperar al bloque 8. Si la solución excede el bloque, explicitar ese alcance y su validación antes de propagarla.

La métrica de peso del mapa es un riesgo documentado, no permiso para reemplazar proveedor o ruta inicial. Separar el perfilado de cualquier decisión de dependencias. Cambiar un componente compartido no autoriza dar por terminadas otras pantallas sin verificarlas.

## Criterios de cierre de cada bloque de UI

1. Implementación contrastada con DESIGN.md/shape, componentes reutilizados, funcionalidades y permisos vigentes conservados.
2. Capturas reales antes/después en móvil y escritorio, identificando datos de prueba, estado, viewport y limitaciones. Revisar 320/375/390/768/1280 px, texto ampliado y poca altura.
3. Estados de carga, vacío, error, éxito, sin foto y sin acceso; títulos largos, listas de distinta longitud y galerías 0/1/10 cuando correspondan. Comprobar recortes internos además del overflow del documento.
4. Contraste, labels/errores, orden/foco de teclado, targets, safe areas, navegación y recuperación. Lector de pantalla, gestos y teclado real se registran por separado de emulación.
5. Build/lint de frontend y regresión de los recorridos afectados. No aplicar migraciones desde el refresh.
6. Evidencia y pendientes registrados en el estado visual; separar implementación, prueba técnica y aceptación humana. No marcar completo un caso no probado.

## Cierre de Foundation

Verificar enlaces y coherencia entre AGENTS, ejecutar git diff --check y comparar hashes de fuentes aprobadas, reportes, UI, Supabase y estados funcionales con la base recibida. Seleccionar sólo Foundation para commit y PR draft hacia main; no fusionar. Conservar cambios ajenos locales sin incluirlos. Detenerse al entregar esa PR.
