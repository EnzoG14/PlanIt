# Revisión de diseño B6

Extensión local de formularios/gestión, modo Operate. Contexto Impeccable cargado una vez sobre EditEventPage; PRODUCT/DESIGN/sidecar existentes conservados. Craft floor y guías del proyecto aplicadas; el brief preciso de B6 define composición, sin proponer otro sistema.

Inspección manual de capturas móviles/escritorio: sección de visibilidad coherente con formulario tipográfico; texto de ayuda operativo, ambos horarios presentes, acción Guardar en tinta. Panel embebido sin tarjeta dentro de tarjeta; contraste tinta/lavanda, botón secundario y diálogo blanco con acciones ≥44px y foco violeta. No se mueve el dock ni se añade navegación. Full-page screenshots muestran controles fixed en la posición del viewport capturado; no se interpreta como su ubicación dentro del documento.

Se observó aviso manual de clipboard retenido después de copia exitosa: corregido en un solo lote (setManual(false)) y confirmado en segunda pasada acotada a 390px. Se añadieron permiso denegado y stress 320×400/texto aumentado; diálogo scroll y cancelación alcanzables. Foco/Escape/Tab/restauración comprobados mediante navegador fixture. Hook determinístico sin hallazgos en componentes/estilos revisados; esto no acredita aceptación estética.

Sin ejecución de comando critique/audit binario ni auditoría de accesibilidad exhaustiva: revisión manual documentada, build/lint/tokens y Playwright. Aceptación humana, reduced-transparency específico, lector de pantalla y dispositivo real pendientes. Lab `/b/create` y `/b/event` ejecutado y capturado como referencia ficticia de composición; los tokens y componentes de main son autoridad de implementación. El lab no aporta UI de enlaces, ni autoriza controles extra.
