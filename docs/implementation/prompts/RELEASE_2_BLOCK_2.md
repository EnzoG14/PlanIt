# Codex — R2, BLOQUE 2: chat grupal por evento

**RF:** R2-04 y R2-05 (8 CA).

Leé docs/implementation/RELEASE_2_PLAN.md (**B, C, D/BLOQUE 2 y E**), RELEASE_2_STATUS.md, docs/database.md, la especificación/CA oficiales y la pantalla 3 del mockup R2. Revisá esquema, migraciones y seguridad de participaciones de R1 antes de escribir código.

Implementá conversations + messages para un chat por evento (backfill idempotente + nuevos eventos), historial ordenado, envío de texto no vacío y UI oscura. **Autorización en BD:** sólo organizador y asistentes confirmed acceden; cierre/cancelación/archivo obliga a sólo lectura, removed/no miembro no accede, sender_id = auth.uid(). Proteger RLS, rutas directas y escrituras REST; limitar tamaño y evitar duplicados. Realtime sólo si se verifica que respeta autorización, con alternativa realista de refresco.

No DMs, adjuntos, audio ni avisos por cada mensaje. Probar con dos usuarios/no miembro, acceso por ID, historial y carrera con cierre del evento. Ejecutar build/lint, registrar evidencias/CA y actualizar status. PR separada y detenerse; **no aplicar migraciones ni configurar Realtime remoto sin permiso**.
