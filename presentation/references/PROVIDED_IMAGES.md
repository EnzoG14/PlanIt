# Imágenes y cadencia aportadas por el usuario

Los doce recursos renderizados proceden de PNG adjuntados por el usuario. Once se copiaron byte a byte a `public/assets/tools/`; Scrum se publicó como derivado transparente obtenido con ImageGen por petición expresa. El original Scrum se conserva en `assets/originals/scrum.png`. `provenance.json` conserva el nombre original, origen y SHA-256 de cada archivo. No se descargaron sustitutos; PWA y Mapbox conservan sus originales. La excepción de edición es Scrum, cuyo fondo blanco fue retirado mediante ImageGen; el resultado conserva un canal alfa real y su procedencia se diferencia de los originales. La procedencia se conserva en este documento y en el sidecar JSON; no se atribuye una licencia que no haya sido acreditada.

| Recurso original | Archivo local | Diapositiva |
| --- | --- | --- |
| pwa.png | pwa.png | 15 · Stack tecnológico, Navegación y PWA |
| mapbox_logo_icon_169974.png | mapbox.png | 15 · Stack tecnológico, Mapas y ubicación |
| scrum.png | scrum-transparent.png | 17 · Scrum, junto al recorrido del backlog al incremento |
| typescript.png | typescript.png | 15 · Stack tecnológico, Interfaz |
| supabase.png | supabase.png | 15 · Stack tecnológico, Datos y servicios |
| moscow-model-2.png | moscow.png | 18 · Priorización y estimación, MoSCoW |
| planning-poker-svgrepo-com.png | planning-poker.png | 18 · Priorización y estimación, Planning Poker |
| 67f1c5e58e84d-Jira.png | jira.png | 19 · Herramientas de colaboración |
| github-logo.png | github.png | 19 · Herramientas de colaboración |
| google-docs.png | google-docs.png | 19 · Herramientas de colaboración |
| whatsapp-logo-png-2260.png | whatsapp.png | 19 · Herramientas de colaboración |
| discord-logo-png-32876.png | discord.png | 19 · Herramientas de colaboración |

Las imágenes se muestran mediante tamaños CSS y `object-fit: contain`. Jira tiene amplios márgenes transparentes: su marco CSS limita el viewport al logo sin recortar el archivo original. Los nombres y descripciones permanecen como texto editable. No se incorporan las tallas retiradas de estimación ni la aclaración retirada de los pies.

La duración «Sprints de 2 semanas» de la página 17 fue indicada expresamente por el usuario. Esta confirmación sustituye la cautela editorial anterior de no asumir una duración universal. Las fechas de releases, los períodos de referencia y los 13 sprints funcionales se conservan sin recalcularse ni reinterpretarse.

Se preserva la exportación previa como `exports/planit-completa-antes-logos.pdf`; la entrega sigue teniendo 54 páginas.

La transparencia de Scrum se verificó sobre su canal alfa (mínimo 0, máximo 255) y en la diapositiva sobre fondo Amanecer. El viewport CSS de 300 × 150 px aprovecha el área del diagrama; el PNG generado no se vuelve a editar. Se conserva la versión anterior como `exports/planit-completa-antes-scrum.pdf`.
