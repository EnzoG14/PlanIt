# R7 B3 — lectura de imágenes, corrección posterior

16/10/2026. Rama `codex/r7-chat-upload-fix`, base `9d917a4`; continuación de [PR draft #82](https://github.com/EnzoG14/PlanIt/pull/82). **Lector desplegado y migración aplicada con autorización expresa «desplegalo»; visualización real confirmada por el responsable («ahora si se visualiza»).** No habilita otro bloque.

## Diagnóstico y alcance

El usuario acredita HTTP 400 `NoSuchKey`, incluso con identidad comprobada mediante Auth. La consulta remota de diagnóstico encuentra la fila, membresía y operación permitidas; la descarga administrativa recupera 1.924.936 bytes del objeto existente. Esto acredita existencia física, pero **no identifica la causa exacta del rechazo del GET con JWT del usuario**. No se presenta como resuelto.

El ensayo de contexto GET por `request.path`/`request.method` no corrigió el fallo. Se conserva su migración aplicada para trazabilidad y se revierte mediante otra migración incremental. Verificación remota READ ONLY: ambas versiones registradas y política restaurada con `allow_only_operation`, sin referencias a `request.path`/`request.method`. No se publican IDs, rutas privadas, imagen ni credenciales de diagnóstico.

La alternativa preparada es `r7-chat-image`: recibe exclusivamente `message_id`, valida el JWT con Auth y deriva allí el usuario. Una RPC sólo ejecutable por `service_role` comprueba mensaje/claim/objeto atestado y acceso actual al chat (organizador o participante confirmado, con grant activo si es oculto). El servidor descarga como máximo el tamaño atestado, comprueba SHA-256 y vuelve a comprobar permisos e identidad del objeto después de la descarga. Sólo entonces devuelve bytes con `no-store` y `nosniff`. No hay URL pública/firmada, path ni viewer ID aceptados del navegador. El privilegio de servicio queda exclusivamente en Edge.

El cliente usa el JWT actual, conserva la caja y el ciclo de revocación de Blob existentes. La interfaz Amanecer, adjuntos, composición y DM no cambian. No hay dependencias nuevas, cambios de SW ni secretos nuevos. Esta vía necesita la migración y el despliegue de la nueva función antes de poder funcionar en remoto; el frontend de esta rama ya apunta a ella.

## Verificación

- `npm run build`: PASS. `npm run lint`: PASS (advertencias existentes y del scaffold temporal; cero errores).
- `deno check supabase/functions/r7-chat-image/index.ts`: PASS.
- `node scripts/check-r7-chat-image-edge.mjs`: 3 grupos PASS sobre el handler real con HTTP simulado: autenticación, entrega y digest; entradas inválidas; denegación, retirada durante I/O, objeto cambiado, hash incorrecto y exceso de tamaño. [Evidencia](edge-results.json). No acredita JWT remoto.
- `node scripts/check-r7-chat-image.mjs`: 8 grupos PASS; replay completo en PostgreSQL local, grants mínimos, organizador/confirmado, pendientes/retirados/terceros denegados, baja y revocación de grant oculto, regresiones B1/B2, operaciones concurrentes y rollback. [Evidencia](sql/sql-results.json).
- `$env:PLANIT_UI_OUTPUT='docs/qa/r7-block-3/download-fix/ui'; node scripts/check-r7-chat-ui.mjs`: 62 checks PASS con fixtures, anchos 320/375/390/768/1280, éxito/error de imagen, autorización enviada y `cache: no-store`, revocación de Blob y regresión del compositor. [Evidencia](ui/results.json). Inspección visual de captura 375 px sin cambio de identidad.
- `supabase db push --linked --skip-vault --dry-run` con staging de historial remoto: PASS; propone únicamente `20261016185634_r7_chat_image_delivery.sql`, sin seeds ni roles. Tras la autorización expresa se ejecutó ese push correctamente.
- `supabase functions deploy r7-chat-image --project-ref iepeqmvzjguwlhnecsdq --use-api`: PASS. ACTIVE v1, `verify_jwt=true`. CORS OPTIONS 204; GET sin credenciales e inválidas 401. [HTTP remoto](deploy-http.json).
- Catálogo remoto: migración registrada, `SECURITY DEFINER` con `search_path=''`, EXECUTE permitido sólo a `service_role`, denegado a anon/authenticated, target del último adjunto disponible para su autor y nulo sin identidad. [Evidencia](deployment.json). No acredita entrega de bytes con JWT real del usuario.
- Asesor de seguridad remoto: cero errores, ningún hallazgo sobre `get_r7_chat_image_target`; 59 advertencias sobre otras RPC SECURITY DEFINER y protección de contraseñas filtradas. No se modifican esas funciones ni la configuración Auth en este arreglo. [Resumen](deploy-advisors.json).

Los primeros intentos de pruebas dentro del sandbox fallaron por EACCES de loopback/lanzamiento de Edge; las ejecuciones finales fuera del sandbox pasaron. La prueba SQL también detectó un fixture de revocación sin `revoked_at`; se corrigió el fixture respetando el CHECK existente.

## Migraciones y puerta de despliegue

| Versión | Creada | Probada local | Aplicada remota con aprobación previa | Verificada remota |
|---|---|---|---|---|
| 20261016185018, ensayo GET de contexto | Sí | Sí, replay | Sí | Sí, registrada; ensayo fallido para el caso real |
| 20261016185322, restaurar guard original | Sí | Sí, replay | Sí | Sí, política original restaurada |
| 20261016185634, target sólo de servicio | Sí | Sí, positivos/negativos | Sí, «desplegalo» | Sí, catálogo/permisos/target |

La migración anterior de preflight y el validator desplegado se documentan en [storage-fix](../storage-fix/README.md). El nuevo lector no se confunde con aquel despliegue autorizado.

El responsable confirmó desde su sesión: «ahora si se visualiza». PASS manual reportado para la visualización de la imagen que fallaba; no se capturaron tokens ni se infieren códigos HTTP o pruebas negativas adicionales. El despliegue autorizado es del backend Supabase; no se publica otro frontend. No hay merge ni avance al siguiente bloque. RF-R7-02 y sus CA siguen sin aceptación integral; las pruebas con fixtures no se contabilizan como aceptación real.
