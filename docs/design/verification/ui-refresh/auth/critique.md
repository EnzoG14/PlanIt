Method: dual-agent (A: /root/auth_design_assessment · B: /root/auth_evidence_assessment)

# Login y Registro — critique de Amanecer

12/10/2026. Impeccable skill 4.5.2 / engine 0.1.14. Contexto PRODUCT.md y DESIGN.md aprobado; modo Operate. Assessment A revisó fuente y capturas sin detector; B ejecutó detector y revisó evidencia de navegador sin recibir hallazgos de A. Síntesis posterior a ambos resultados. Fixtures identificados, sin escrituras remotas.

## Especificidad y experiencia

La composición expresa Amanecer con Bricolage, tinta marina, campo blanco y luz superior. El formulario convencional sirve a la tarea; la identidad está en el sistema de PlanIt, sin inventar promesas ni adornos de eventos. Dos/tres campos, una acción dominante y alternativas discretas: carga cognitiva baja, sin decisión entre más de cuatro acciones.

| Heurística | Score / 4 | Observación de A |
| --- | --- | --- |
| Visibilidad del estado | 3 | Espera/envío con texto; error/confirmación reciben foco |
| Correspondencia con mundo real | 3 | Español rioplatense; validación heredada menciona Supabase |
| Control y libertad | 3 | Mapa, cambio de modo, mostrar contraseña |
| Consistencia | 4 | Componentes y tokens Amanecer |
| Prevención de errores | 3 | Labels, validación y doble envío; ayuda inicialmente efímera |
| Reconocimiento | 3 | Acciones/labels visibles; inicialmente ayuda en placeholder |
| Eficiencia | 3 | Autocomplete y controles nativos |
| Estética y minimalismo | 4 | Formulario directo, sin superficies anidadas |
| Recuperación de errores | 3 | Datos conservados, reintento |
| Ayuda y documentación | 2 | Instrucciones contextuales, sin nueva función de ayuda |
| **Total inicial** | **31/40** | No se infiere aceptación humana ni nueva puntuación tras polish |

## Fortalezas

- Acción de tinta dominante; la atmósfera permanece detrás del encabezado.
- Errores asociados al campo y foco al primero inválido.
- Continuidad móvil/escritorio y estados con contenido real del contrato.

## Dos prioridades de presentación y resolución

1. **P2 · Lectura del título al 200%.** A 320 px, «Bienvenido» se partía dentro de la palabra. Polish usa el título de tarea «Ingresá a PlanIt», que envuelve entre palabras en la captura final, manteniendo la ampliación. No modifica destino, envío ni mensajes de error. Comando aplicado: polish/typeset dentro del scope autorizado.
2. **P2 · Orientación del registro.** La ayuda desaparecía al escribir y la confirmación reunía tres situaciones en un párrafo. Polish muestra permanentemente «Al menos 6 caracteres» con descripción accesible y separa visualmente las mismas tres frases de confirmación. La validación, texto condicional y ausencia de sesión permanecen intactos. Comando aplicado: polish; verificación posterior con harden.

El marco violeta alrededor de main visto en capturas de la primera versión provenía de foco heredado; se corrigió localmente antes de cerrar las evaluaciones. No se cuenta como defecto final.

## Personas y trayectoria

Sam dispone de labels, errores asociados, foco y targets; lector de pantalla real pendiente. Jordan reconoce ingresar/crear y ahora lee separadamente el siguiente paso de confirmación. Casey tiene autocomplete, pocos campos y scroll recuperable con altura reducida; teclado móvil/safe areas físicos pendientes. Entrada tranquila → datos → error con recuperación → confirmación con próximo paso visible.

La referencia a Supabase en la validación y la ausencia de recuperación de contraseña son características heredadas fuera del alcance; no se cambian ni se presentan como fallos nuevos.

## Evidencia y límites

B: detector `[]`, exit 0, sin falsos positivos; [resultado](detector.json). Los hooks posteriores también informaron cero hallazgos deterministas. El navegador nativo rechazó la mutación de document.title (API read-only), por lo que no existe overlay visible ni resultado de consola de detector en página. Se usaron capturas Playwright/Edge y mediciones; no se arrancó un servidor de overlay. A intentó pestaña about:blank, con timeout, y completó la evaluación mediante capturas actuales. Fuente/composición y resultados finales se revisaron después de polish.

Questions skipped: 2 Priority Issues; el pedido ya autoriza polish/harden y fija el alcance y la dirección.
