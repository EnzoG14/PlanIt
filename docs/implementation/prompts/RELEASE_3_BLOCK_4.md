# Codex — R3, BLOQUE 4: asistentes y remoción

**RF:** R3-05 y R3-06 (8 CA). Leé requisitos R3, `RELEASE_3_PLAN.md` (**D/BLOQUE 4**), STATUS, agentes y mockup de asistentes.

Crear administración de asistentes de eventos propios, búsqueda por nombre, confirmados y removidos diferenciados. Exponer únicamente identidad social autorizada (no emails/sexo/DOB). Mostrar acción Remover para confirmed con confirmación cancelable; RPC transaccional `removed` + `participation_history`, actualizar cupo/lista y pérdida de acceso al chat R2. No borrar inscripciones ni abrir perfiles privados, no estado pending de participación.

Probar organizador vs terceros/anon, REST directo, historial, conteo y regresión chat/cupo. Build/lint, móvil/escritorio y evidencias para 8 CA. Migraciones sólo locales hasta autorización; PR independiente, sin merge.