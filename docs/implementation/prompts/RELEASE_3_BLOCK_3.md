# Codex — R3, BLOQUE 3: galería de imágenes

**RF:** R3-03 (CA-01..04). Leé requisitos R3, `RELEASE_3_PLAN.md` (**D/BLOQUE 3**), STATUS, agentes y diseño; revisar `event_media`/`files`/`event_images` reales.

Implementá gestión del organizador: subir hasta 10 fotos, previsualizar, reordenar con alternativa accesible al drag, primera como portada, quitar relaciones sin borrar archivos utilizados por otros eventos. Reutilizar Storage y permisos existentes; no dejar metadatos aparentando carga exitosa cuando el archivo falle. Validar formatos/tamaño, idempotencia y RLS, con errores/estado de carga claros. Sin adjuntos de chat ni historias.

Probar 10/11 imágenes, error Storage parcial, segundo usuario y detalle actualizado; CA, build/lint y responsive. Documentar STATUS y PR separada. No aplicar SQL remoto ni fusionar.