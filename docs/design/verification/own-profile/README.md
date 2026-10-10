# R2 — Bloque 3: Mi perfil

Implementado; QA pendiente. Referencia: teléfono 4 de `docs/design/mockups/release-2.png`.

## Matriz de aceptación

| CA | Evidencia ejecutada | Límite |
| --- | --- | --- |
| RF-R2-06.CA-01 | `/me`, Perfil activo en navegación móvil/desktop y acceso real a Mis eventos | Navegador con fixtures |
| RF-R2-06.CA-02 | Identidades A/B, correo desde Auth, nombre/username/bio propios; cambio de sesión con respuesta A pendiente. SQL: consultas cruzadas, sin filtro y por ID sólo devuelven el propietario | Auth/REST interceptados; PostgreSQL local con scaffold Auth/Storage |
| RF-R2-06.CA-03 | Actualizar, recargar y recuperar foco reflejan valores de fixture; UPDATE/SELECT local comprueba persistencia | Sin edición nueva en UI ni cambios remotos |
| RF-R2-06.CA-04 | Error elimina datos, reintento; ignorar respuesta tardía A; logout protege ruta. Avatar ausente, denegado, ajeno o roto conserva datos básicos con placeholder | No E2E con JWT/Storage real |

## Ejecución

- `npm run build`, `npm run lint`, `npm run check:auth`, `npm run check:events` y `git diff --check`.
- `node scripts/check-profile.mjs`: PostgreSQL real temporal en localhost, replay de migraciones versionadas; dos roles authenticated con identidad simulada y anon. [Resultados](postgres-results.json).
- `node scripts/check-profile-ui.mjs`: Playwright con Edge, fixtures explícitos de Auth/REST/Storage, 375×812 y 1280×900. [Resultados](ui-results.json). Vite estaba en 4181 (`PLANIT_UI_ORIGIN=http://127.0.0.1:4181`).
- Herramientas SQL reutilizan `.participation-test-tools.local/node_modules` (pg y embedded-postgres); Playwright usa el runtime existente. No se agregaron dependencias al proyecto.
- El sandbox impidió iniciar Edge/conectar PostgreSQL; ejecuciones finales fuera del sandbox. Un fallo inicial de fixture por caché de imagen se corrigió con URLs distintas; la simulación de sesiones usa BroadcastChannel como el cliente Supabase real.

## Comparación visual

Se revisaron capturas móvil y desktop: marino, azul/violeta, avatar circular, identidad y biografía centradas, menú de filas y Perfil activo. Se conserva el shell existente, con título y Actualizar perfil. El correo de Auth se agrega como dato real de cuenta. No se trasladan contadores, intereses, seguidores, entradas ni botones de edición/configuración inexistentes del collage.

- [Avatar móvil](profile-avatar-mobile.png), [avatar desktop](profile-avatar-desktop.png): imagen sintética mínima de prueba, no foto del collage.
- [Placeholder móvil](profile-placeholder-mobile.png), [placeholder desktop](profile-placeholder-desktop.png).
- [Error móvil](profile-error-mobile.png), [error desktop](profile-error-desktop.png).

## Seguridad y decisiones

SELECT explícito de `display_name,username,bio,avatar_file_id`, limitado al ID de Auth y protegido por RLS existente. No se consultan birth_date/sex ni datos sociales de terceros. Email sólo desde sesión Auth. Estado nuevo por identidad/token, limpieza al recargar y descarte de peticiones obsoletas, también antes de iniciar consultas de media.

Avatar opcional: referencia persistida, archivo propio (`uploaded_by`), bucket existente `event_media`, ruta bajo ID propio y MIME permitido. URL firmada 300 segundos mediante Storage autorizado; sin URL pública ni permisos adicionales. Si la referencia no existe o falla cualquier paso, placeholder. No se implementa carga/edición de avatar ni se habilita UPDATE de avatar_file_id: permanece para R5. Actualizar/reabrir/foco vuelve a resolver la firma; errores de imagen también usan placeholder.

Sin migraciones ni escrituras/configuración remotas. Lectura íntegra de perfiles sigue restringida al dueño. Los guards del navegador complementan RLS, no la reemplazan.

## Pendientes

Aceptación humana y prueba con dos cuentas reales contra Auth/REST/Storage de planit-v2; avatar previamente persistido si existe; smoke completo R1 y teclado/safe areas en dispositivo físico. No hay credenciales de prueba locales disponibles (`.auth-test.local` ausente). Esta evidencia no marca el bloque Validado y no inicia bloques 4/5.
