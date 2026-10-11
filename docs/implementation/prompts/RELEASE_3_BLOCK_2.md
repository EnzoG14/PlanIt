# Codex — R3, BLOQUE 2: editar evento

**RF:** R3-01 (CA-01..04). Leé requisitos locales R3, `RELEASE_3_PLAN.md` (**D/BLOQUE 2**) y STATUS; agentes, guías visuales y mockup de edición.

Reutilizá tipos/formulario/validaciones de Crear evento; precargá campos existentes incluyendo inicio/fin, lugar/coordenadas, categoría y cupo. Edición sólo del organizador, con fechas válidas y cupo nunca inferior a inscriptos confirmed; resolver en BD la carrera de concurrencia. Guardar cambia el mismo evento y actualiza detalle, Mis eventos y mapa. No duplicar publicación ni permitir editar terceros por RPC/REST. Si hace falta SQL, migración incremental local; remoto sólo con autorización expresa.

Probar fechas, último cupo, acceso ajeno, fallo/reintento y responsive; build/lint, CA y evidencia STATUS. PR única, sin merge.