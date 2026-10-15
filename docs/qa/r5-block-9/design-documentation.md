# R5 B9 — documentación de la extensión visual

## Alcance y autoridad

Extensión ordinaria del sistema aprobado **Amanecer**, aplicada al bloqueo y desbloqueo desde perfil social y conversación privada. `PRODUCT.md` conserva el contexto de PWA móvil, idioma rioplatense y privacidad; `DESIGN.md` sigue siendo la autoridad visual. Los mockups originales de release 5 permanecen como referencia funcional. Este informe registra la construcción final; no define otra identidad, composición aprobada ni sistema de tokens.

## Comparación con el sistema vigente

| Aspecto | Construcción final | Correspondencia |
| --- | --- | --- |
| Fondo y texto | Campo lavanda claro y tinta marina en perfil, chat y diálogo | Conserva Amanecer y la jerarquía existente. |
| Tipografía | El componente usa la familia y tamaños de los tokens compartidos; Bricolage Grotesque autoalojada sigue siendo la familia aprobada | No incorpora otra fuente ni descarga de CDN. |
| Superficies | Diálogo blanco, scrim y sombra de diálogo compartidos, radio de hoja | Extiende el material existente. |
| Confirmación de bloqueo | Píldora de peligro sólido con etiqueta blanca | Aplica el contrato de acción destructiva. |
| Confirmación de desbloqueo | Píldora marina con etiqueta blanca; cancelar conserva contorno y fondo claro | Aplica el contrato de acción principal y secundaria. |
| Adaptación | Diálogo de hasta 440 px, ancho limitado al viewport, altura máxima y desplazamiento interno; acciones flexibles de al menos 48 px de alto | La captura móvil apila las acciones; escritorio las presenta en fila. |
| Seguridad visible | Perfil y autores neutrales cuando no están disponibles; historial privado conservado y composer deshabilitado | El estado se comunica por texto, además del aspecto deshabilitado. |
| Feedback | Carga, confirmación, error y resultado incierto tienen mensajes propios; la recuperación consulta el estado | Conserva la distinción entre espera y deshabilitado del sistema. |

`BlockUserAction` reutiliza tokens de color, familia, tamaño, radio, sombra y foco. El diálogo tiene nombre y descripción asociados, foco inicial en cancelar, manejo de Escape y retorno al disparador en el código. La integración de perfil retira la identidad durante una operación incierta; la integración de DM retira la identidad, aborta una escritura en curso y conserva el historial. Estas observaciones de código no equivalen a una prueba con lector de pantalla.

## Evidencia inspeccionada

- `PRODUCT.md`, `DESIGN.md` y `docs/qa/r5-block-9/design-review.md`.
- `src/components/BlockUserAction.tsx`, `src/components/block-user-action.css`, `src/pages/SocialIdentityPage.tsx` y `src/pages/DirectChatPage.tsx`; llamadas existentes a `block_user` y `unblock_user` en `src/features/social/blocks.ts`.
- `ui/unblock-confirm-390.png`: diálogo móvil con etiqueta blanca legible en la confirmación marina y acciones apiladas.
- `ui/block-confirm-1280.png`: diálogo blanco sobre scrim, acciones paralelas y confirmación roja sólida.
- `ui/chat-blocked-390.png`: identidad neutral, mensajes históricos disponibles, aviso de sólo lectura y composer deshabilitado.

Las capturas son evidencia de fixtures locales. No acreditan dispositivos físicos, lector de pantalla ni autorización real de JWT/RLS. Este pase no ejecutó nuevamente build, lint ni las suites funcionales; su resultado se consulta en la evidencia de QA del bloque.

## Cierre del hallazgo puntuado

El review inicial pidió corregir el texto oscuro de la confirmación de desbloqueo sobre fondo marino. La construcción final incluye el contrato compartido `gradient-link gradient-button`; el CSS conserva los colores específicos del estado deshabilitado. La captura móvil inspeccionada muestra el texto blanco corregido. El pase final del reviewer registra también la recaptura de escritorio y dispone **ship** para esa corrección puntuada, sin ampliar el alcance de la revisión.

## Persistencia

Este pase sólo añade este informe. Conserva sin modificar `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, los documentos `DESIGN_SYSTEM` existentes y los mockups originales. No promueve ajustes del diálogo a reglas globales ni repara deriva anterior de perfil, chat o navegación. No modifica UI, SQL ni migraciones.
