# R5 B10 — Revisión visual y accesibilidad

Build real Vite + Edge headless; datos ficticios, servicios simulados. Base `f66d70bcf4f0e28c02fe2aff88088bd238a65e1e`; el cambio de producto se limita a FollowButton. Referencias: PRODUCT.md, DESIGN.md Amanecer y mockup original R5 inspeccionado e intacto. El mockup aporta perfiles/participantes/edición/privacidad/DM; no autoriza copiar apariencia anterior ni inventar llamadas, presencia, intereses públicos o adjuntos.

## Hallazgo y corrección

**P1 — Texto oscuro sobre tinta en seguimiento.** Las capturas de perfil público/privado muestran que los botones HTML con sólo gradient-button no reciben el texto blanco del componente compartido. Afecta Seguir, Solicitar seguimiento y la confirmación de dejar de seguir. Se reutiliza GradientButton, sin cambiar paleta, layout ni comportamiento de autorización; secundario y estados disabled se conservan.

[Antes móvil](before-follow-390.png) · [Antes escritorio](before-follow-1280.png) · [Después móvil](ui/follows/public-390.png) · [Después escritorio](ui/follows/public-1280.png). La suite follows-ui mide contraste calculado ≥4,5:1 de Seguir y Solicitar seguimiento en320/360/375/390/768/1280. Confirma navegación, confirmación/cancelación y operación incierta después del cambio.

## Evaluación acotada

| Dimensión | Puntaje /4 | Evidencia y límite |
| --- | --- | --- |
| Accesibilidad | 3 | Estados nombrados, controles semánticos, foco3px, contraste corregido, nombres largos/texto200%; lector/teclado móvil reales pendientes |
| Performance | 3 | Paginación acotada y fuentes locales; bundle Mapbox conserva aviso de tamaño. No benchmark de dispositivos ni dataset grande |
| Sistema visual | 4 | Claro único Amanecer, tinta/azul/violeta y tokens existentes; no se exige modo oscuro ajeno al producto |
| Responsive | 3 | Seis anchos en Edge y poca altura; no equivale a gestos/teclado físicos |
| Integridad | 4 | Inventario funcional original preservado; componente compartido y cuatro tabs. Detector mecánico sin hallazgos en las superficies auditadas |
| Total | 17/20 | Evaluación de esta pasada, no certificación WCAG ni aceptación funcional |

Primera pasada de capturas encontró contraste defectuoso; corrección única y segunda pasada de perfiles/seguimiento/participantes para confirmar. Sin ciclo abierto de pulido. [Detector](design-detector.json); el hook del archivo FollowButton tampoco encontró problemas deterministas. Ausencia de findings no reemplaza inspección visual.

Otros escenarios: perfil privado mínimo, unavailable sin avatar, historial DM bajo bloqueo y composer deshabilitado, modal blanco, superficies/tipografía Amanecer; loading/empty/error/retry y retorno. Capturas completas/fixtures y resultados por grupo en [UI](ui/). Sin capturas fabricadas ni edición de imágenes para representar una aplicación.

Pendientes: dispositivos320/390 físicos, teclado abierto real, lector de pantalla, instalación PWA, carga/fallback de avatar mediante Storage real y rendimiento del blur. No se declara validación humana.
