# Ajuste del selector de galería — B4

14/10/2026. Reporte del responsable: no puede elegir desde su galería en Android con Chrome.

El clic del selector original sí abre filechooser en Chromium de escritorio/emulado; la disposición del selector Android no se reproduce en ese entorno. Se cambia el filtro HTML de tres MIME específicos a `image/*` como ajuste de compatibilidad para selección de fotos. Se mantiene el input nativo sin `capture`, selección única, mismo diseño y validación posterior JPEG/PNG/WebP de hasta5 MiB. No se amplía el contrato del bucket ni se agrega conversión de formatos o dependencia.

El filtro `accept` es una indicación para el selector; la validación sigue siendo independiente. [MDN: input file y accept](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file). Este cambio es una medida de compatibilidad, no evidencia de que se haya reproducido la causa en un Android real.

PASS: build/lint (avisos previos),18 grupos sobre seis tamaños antes/después. La prueba abre filechooser mediante clic real en el control, barra espaciadora y toque emulado; cancelar no crea selección, elegir PNG produce preview sin upload, y seleccionar GIF se rechaza antes del upload. Esto amplía la cobertura anterior, que asignaba archivos directamente sin verificar la apertura del selector.

[Checks/logs/límites](checks.json), [antes](before/results.json), [después](after/results.json), [preview móvil](after/picker-preview-390.png), [desktop](after/picker-preview-1280.png). Capturas de la app con fixtures; no muestran el diálogo del sistema Android. Confirmación en teléfono Chrome/galería nativos y upload real: NOT RUN. No migración, DDL, deploy ni cambios remotos de datos.

Reproducir: build y luego `$env:PLANIT_R5_PICKER_ONLY='1'`, `$env:PLANIT_R5_PICKER_EXPECT_IMAGES='1'`, `$env:PLANIT_UI_OUTPUT='docs/qa/r5-block-4/gallery-picker/after'`, `node scripts/check-r5-edit-profile-ui.mjs`. Sin estas variables, el runner conserva la suite completa de B4. La entrega original y sus hashes en editorial.json permanecen como fotografía del commit4e11215; esta corrección tiene hashes propios en checks.json.
