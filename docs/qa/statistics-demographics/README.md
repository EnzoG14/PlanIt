# CSV de estadísticas y demografía desde una persona

29/10/2026. Rama `codex/statistics-csv-demographics`. [Contrato y decisión aprobada](../../implementation/STATISTICS_DEMOGRAPHICS_CSV.md).

Actualización solicitada: «Menores de 18» se retiró de pantalla y CSV. La exportación publica seis rangos de edad y cuatro categorías de sexo. El contrato interno sigue validando todos los confirmados y los porcentajes usan ese total; no se reclasifican edades. Se repitieron build, lint y contratos; el runner CSV comprueba explícitamente la ausencia de la categoría tanto en pantalla como en el archivo, además de evitar desplazar las cantidades al quitar el primer grupo. Las capturas `ui/` corresponden a esta actualización; las de `demographics-ui/` conservan la ejecución anterior.

## Comprobaciones

- `npm run build`: PASS. Advertencias de tamaño de chunks y opción heredada de PWA.
- `npm run lint`: PASS con advertencias preexistentes en probes de diseño y DiscoveryFilters; sin advertencias en los archivos de esta entrega.
- `npm run check:r6:demographics:contract`: PASS, 7 DTO válidos (incluidos 1/4/5 y grupos mixtos) y 14 entradas inválidas rechazadas. [Resultado](contract-demographics/contract.json).
- `npm run check:r6:csv:contract`: PASS, cinco grupos de comprobaciones. Python `csv` valida por separado cabeceras, tipos, grupos, cantidades, ceros, períodos y fechas de consulta diferentes, BOM, comillas y saltos de línea. Rechazo de evento ajeno e información parcial. [Resultado](contract-csv/results.json), [CSV de ejemplo](contract-csv/estadisticas.csv).
- `npm run check:r6:demographics`: PASS, replay completo de migraciones en PostgreSQL efímero local y 30 grupos de pruebas. Incluye 0/1/4/5/10, exclusión del organizador, grupos 9/1, sexo faltante/otro, bajas/remociones/reincorporaciones, límites de edad y cumpleaños. Autor, otros usuarios, participante, anónimo y UID ausente; ACL, search_path y RLS de perfiles. [Resultado](sql/sql-results.json).
- `npm run check:r6:csv:ui`: PASS en Edge, 320/360/375/390/768/1280 px. Descargas reales con RPC/Auth simulados: mismas cantidades de edad/sexo que la pantalla, ceros, período sin movimientos, demografía fallida sin exportación y reintento. Se mantienen las pruebas de cancelación, timeout, sesión, navegación, desconexión, pestaña oculta y revocación de object URLs. [Resultado](ui/results.json).
- `npm run check:r6:demographics:ui`: PASS en Edge en los mismos seis anchos, tablas desde 1/4/5 personas, datos faltantes, errores y recuperación, cero y estados del evento, timeout, logout y ruta anónima. [Resultado](demographics-ui/results.json).

Las pruebas de navegador usan `PLANIT_PLAYWRIGHT_PATH=C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`. PostgreSQL y Edge requirieron ejecución fuera del sandbox por restricciones locales de conexión/perfil. El harness SQL agrega únicamente el scaffold de `storage.allow_only_operation` necesario para reproducir las migraciones actuales; no prueba el transporte real de Storage.

## Revisión visual

Corrección del filtro seleccionado: la regla general `.secondary-button:hover` blanqueaba el fondo sin cambiar el texto blanco. Se reprodujo en Edge con colores calculados blanco/blanco; [captura previa móvil](filter-before/preset-hover-390.png). El selector específico de Amanecer preserva el fondo azul del seleccionado sobre hover y foco. El runner verifica 7/30/90 días con teclado y hover, fondo `#0753ff` y texto blanco (contraste 5,69:1), en seis anchos; [captura corregida](ui/preset-hover-390.png). Sin cambios de comportamiento, tokens ni base de datos.

Capturas del build real con fixtures explícitos: [antes móvil](before/exports-375.png), [antes escritorio](before/exports-1280.png), [después móvil](ui/exports-375.png), [después escritorio](ui/exports-1280.png). Se conserva Amanecer, composición y estilos; cambian las tablas visibles y las explicaciones de la descarga. Revisadas móvil y escritorio sin recortes; pruebas de 200% de texto, poca altura, foco y movimiento reducido en seis anchos.

## Límites y publicación

Migración `20261029180809_r6_demographics_without_suppression.sql`: creada y probada localmente, **no aplicada al remoto**. Aplicarla con autorización antes de publicar el frontend. No hubo deploy ni merge. La demografía sigue restringida al organizador; se acepta inferencia para grupos de una persona.

Sin verificación remota JWT/PostgREST, Excel real, lector de pantalla ni dispositivos físicos. Los scripts `r6-live` se adaptaron al nuevo contrato, pero no se ejecutaron. Los snapshots de movimientos y demografía tienen sus propias fechas y no se presentan como una transacción única.
