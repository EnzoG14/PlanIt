# PlanIt — informe integral de QA R1

Fecha de corte: 10/10/2026, 14:50 ART (`America/Argentina/Buenos_Aires`; 17:01 UTC). Rama `codex/block-6-qa`, base `origin/main` en `9f54deb4be2252eb64ce152d73cf49063280b43d`. El clon de QA usó Node.js 24.19.0, npm, Windows x64, Edge real automatizado y PostgreSQL local 17.5. El destino remoto de sólo lectura fue Supabase `planit-v2` (`iepeqmvzjguwlhnecsdq`). No se consultó ni modificó el proyecto histórico. No se aplicó SQL remoto ni se cambió configuración de Auth.

## Decisión de release

**Aceptación funcional: 28/28 CA aprobados manualmente por confirmación explícita del usuario, 10/10/2026.** El usuario indicó: “Probé todo a mano y funciona, está todo validado”. No aportó pasos, IDs ni capturas por CA, así que esta aceptación queda registrada como evidencia humana y no como una ejecución independiente reproducible por Codex. Las pruebas automatizadas enumeradas abajo conservan sus límites locales/fixture. La matriz completa, con redacción literal de `Planificación`, está en [RELEASE_1_ACCEPTANCE.md](RELEASE_1_ACCEPTANCE.md).

**GO/NO-GO global: pendiente de tratamiento explícito de los WARN de seguridad.** La aceptación funcional no resuelve la clasificación de tres RPC `SECURITY DEFINER`, las políticas SELECT permisivas ni la protección de contraseñas filtradas desactivada. Se solicitó al usuario confirmar si acepta esos avisos para R1 o mantiene NO-GO hasta resolverlos; no hubo respuesta registrada al corte de este informe. No se modificó Auth ni SQL remoto.

Criterios objetivos para GO: aceptación humana de 28/28 CA (registrada); resolución o aceptación explícita de los WARN de seguridad; y revisión de defectos críticos/altos abiertos. La afirmación manual del usuario cubre funcionalmente el trabajo solicitado, pero los pasos y artefactos por caso no están adjuntos para repetición independiente.

## Reconciliación del repositorio y destino

- Se actualizó la referencia remota `origin/main` y se creó `codex/block-6-qa` directamente desde `9f54deb` (incluye PR #4/Bloque 5). `HEAD` y `origin/main` coinciden en el corte; no se integró ni fusionó nada.
- El workspace original tenía `vite.config.ts` modificado antes del trabajo. Se preservó sin editar y quedó fuera de los cambios de QA. También se ejecutó una prueba PostgreSQL local que actualizó `docs/design/verification/participations-r1/postgres-results.json`; el diff es evidencia del test, no un cambio funcional.
- `supabase/.temp/project-ref` indica `iepeqmvzjguwlhnecsdq`. `list_migrations` de Supabase devolvió las siete versiones: `20261010011204`, `20261010013449`, `20261010023448`, `20261010042701`, `20261010052653`, `20261010150232` y `20261010154930`. La lista coincide con las migraciones esperadas del repo. Consulta read-only; no se ejecutó `db push` ni SQL remoto.
- El `npm ci` en el workspace compartido falló dos veces por `EPERM` al reemplazar el binding nativo `node_modules/@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node`. No se terminó ningún proceso del usuario ni se alteró manualmente `node_modules`. En un clon de QA limpio, `npm ci` terminó: `added 376 packages`, `found 0 vulnerabilities`; se reportó una advertencia de deprecación para `glob@11.1.0`.
- La variable local usada por Vite contiene sólo URL y publishable key de `planit-v2`; no se imprimieron valores. No se leyó `.auth-test.local`, no se usó `service_role` ni se guardaron credenciales.

## Comandos ejecutados

| Comando | Entorno / resultado | Alcance y límites |
|---|---|---|
| `npm ci` | Workspace compartido: falló dos veces con `EPERM` en binding nativo de Rolldown. Clon aislado: pasó, 376 paquetes, 0 vulnerabilidades reportadas por npm. | Instalación; el fallo del workspace no prueba una falla del producto. |
| `npm run build` | Pasó en clon limpio con variables públicas locales; TypeScript y Vite, PWA genera 26 entradas precacheadas, `dist/sw.js` y Workbox. | Build no aprueba R1 funcional. |
| `npm run lint` | Pasó en clon limpio. | Lint estático. |
| `npm run check:foundation` | Pasó en clon limpio. | Configuración, manifest, iconos y SW. |
| `npm run check:foundation -- --connection` | Pasó: `planit-v2 reachable`; lectura anónima del catálogo denegada con HTTP 401 / `42501`. | Única comprobación HTTP anónima remota repetida; no cubre usuarios A/B ni Storage. |
| `npm run check:auth` | Pasó en clon limpio. | Chequeos automatizados/ficticios de Auth; no se creó ni autenticó un usuario remoto. |
| `npm run check:events` | Pasó en clon limpio. | Validación automatizada local; sin publicación autenticada remota. |
| `npm run check:discovery` | Pasó desde el workspace compartido usando PGlite local. | Consulta/visibilidad y reglas de discovery; no es Supabase ni tiles reales. |
| `npm run check:discovery:ui` (`node scripts/check-discovery-ui.mjs`) | Edge pasó a 375×812, 768×1024 y 1280×900. | Auth/REST interceptados y tiles OSM reemplazados por fixture. Probó teclado en marcador, preview/detalle, hora Argentina, geolocalización denegada, vacío/error/reintento, IDs y no-overflow. |
| `npm run check:participations` | Pasó desde el workspace compartido en PostgreSQL 17.5 local; migraciones reejecutadas sobre base limpia. | Incluyó diez carreras reales de dos conexiones backend independientes, locks verificados, una plaza/un ganador por carrera, idempotencia, exclusión del organizador, retiro ajeno e historial. No equivale a RPC REST remota. |
| `npm run check:participations:ui` (`node scripts/check-participations-ui.mjs`) | Edge pasó en móvil y desktop. | HTTP/Auth/RPC fixtures; doble click, retiro/reingreso, cupo lleno, organizador, Argentina, errores/reintento, sin overflow. No es E2E. |
| `npm run check:my-events` | Pasó desde el workspace compartido en PostgreSQL local. | Tres identidades SQL de prueba; roles/privacidad, estados, paginación, historial/media; no Auth/REST real. |
| `npm run check:my-events:ui` (`node scripts/check-my-events-ui.mjs`) | Edge pasó a 375×812 y 1280×900. | Dos identidades fixture con Auth/REST/Storage interceptados; secciones, tabs, alta/retiro/reingreso, detalle, lista vacía/error, paginación, cambio de cuenta/route, teclado y no-overflow. No es E2E. |

Los checks UI fallaron inicialmente al ejecutarse sin servidores Vite: `ERR_CONNECTION_REFUSED`/timeout. Después se levantaron previews locales en puertos libres y los mismos checks pasaron. Estos fallos de infraestructura se conservaron como intentos fallidos, no como defectos de la aplicación.

## E2E autenticado y datos remotos

**Aceptación manual reportada por el usuario; no observada independientemente por Codex.** Antes de esa confirmación, se abrió `http://127.0.0.1:4182/login`, pero Codex no llegó a completar el flujo Auth remoto con dos sesiones aisladas. El usuario luego indicó que probó todo a mano y que está validado; se toma como aceptación de los CA y del flujo descrito en el pedido. No se adjuntaron pasos, IDs, grabación ni capturas de la sesión autenticada. Por eso el informe no afirma que Codex haya ejecutado o reproducido un E2E Auth/REST/Storage.

Codex no creó ni borró eventos, archivos, cuentas ni otros datos remotos durante este QA. Si se requiere limpiar datos creados manualmente, se identificarán los elementos concretos y se pedirá autorización antes de borrarlos.

## Seguridad, RLS y permisos

- **Pruebas locales:** los tests sobre PostgreSQL 17.5 reejecutan migraciones versionadas y comprueban RLS, permisos de funciones, mutaciones directas denegadas, historial no falsificable, participación propia, retiro ajeno denegado, organizador excluido y consistencia transaccional. Son evidencia de la definición SQL versionada bajo scaffolding local.
- **Remoto anon:** `check:foundation -- --connection` confirmó rechazo del catálogo para anon (`401`, código `42501`). No hubo pruebas remotas autenticadas de A/B.
- **Independencia de la comprobación:** Codex no capturó las solicitudes/respuestas remotas A/B ni la prueba de imágenes privadas. La aceptación manual global del usuario se registra para los CA, pero no aporta evidencia técnica por operación para reproducir estos ataques de autorización.
- **RPC `SECURITY DEFINER`:** Security Advisor del proyecto reportó tres funciones ejecutables por `authenticated`: `get_event_participation_summary(uuid)`, `leave_event(uuid)` y `register_for_event(uuid)`. El diseño esperado usa RPC para aplicar autorización y operaciones atómicas, pero la clasificación sigue siendo WARN real que debe revisarse contra permisos y pruebas HTTP; no se ocultó ni se modificó remotamente.
- **Auth:** Security Advisor reportó `Leaked Password Protection Disabled`. Recomendación: habilitar protección contra contraseñas filtradas en Supabase Auth tras revisión del equipo. La configuración no fue cambiada en este QA.
- No se copiaron logs con tokens, emails, IDs privados ni secretos. No se hizo un barrido de logs de producción que pudiera exponer PII.

## Security y Performance Advisors (consulta 10/10/2026, aprox. 13:59 ART)

**Security WARN**

1. Tres RPC `SECURITY DEFINER` disponibles a usuarios autenticados, identificadas arriba. Revisar la necesidad de exposición, `EXECUTE`, `search_path` fijo y autorización derivada de `auth.uid()` en la definición actual; verificar de nuevo desde REST con anon/A/B. No cambiar `SECURITY INVOKER` a ciegas porque las transacciones de cupo dependen de privilegios controlados. [Guía del Advisor 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
2. Protección de contraseña filtrada desactivada. Recomendar habilitarla; autorización de configuración pendiente. [Guía de protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

**Performance INFO**

El Advisor informa cuatro índices sin uso: `events_category_start_idx`, `files_uploaded_by_idx`, `profiles_avatar_file_idx` y `participation_history_changed_by_idx`. La base y las migraciones son recientes; este período de observación corto no justifica eliminarlos. Revaluar tras tráfico representativo. [Guía del Advisor 0005](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

**Performance WARN**

Hay políticas SELECT permisivas múltiples en `public.events` para `authenticated`: `events_select_authenticated` y `events_select_participating`. Es un aviso de evaluación/optimización de políticas, no evidencia por sí mismo de lectura no autorizada. Revisar solapamiento y costo; no consolidar sin tests RLS. [Guía del Advisor 0006](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies).

No se ejecutó carga/benchmark remoto. Las diez carreras de cupo validan exclusión mutua y resultado, no latencia ni capacidad sostenida.

## PWA, conectividad, fechas y accesibilidad

- El build produjo manifest, iconos validados, registro y archivo del service worker; la prueba `check:foundation` pasó. El usuario informó validación manual global; Codex no capturó evidencia independiente de instalación HTTPS, prompt de instalación, actualización offline o dispositivo físico.
- El UI fixture probó 375×812, tablet 768×1024 (discovery) y desktop 1280×900/1280×800; reportó cero errores de página y no-overflow en los checks respectivos. Se ejercitó teclado en marcadores/tabs, foco y navegación. No es una auditoría completa de lector de pantalla/contraste.
- La pantalla de mapa reportó el fallback al denegar ubicación en fixture. No se concedió geolocalización real ni se usó un teléfono físico.
- La visualización de fecha/hora Argentina se comprobó en Edge configurado como `Asia/Tokyo` contra datos sintéticos. Esto prueba la conversión UI del caso automatizado, no una escritura/lectura remota real.
- Se probaron con fixture errores de red, permisos, RPC ausente y listas vacías con reintento. No se desconectó una PWA instalada ni se verificó la política de caché en DevTools con una sesión real; caché privada: **No probado**.
- Rutas directas, refresh de ruta privada, sesión reiniciada y conectividad con Auth remoto quedan pendientes. El check UI cubre rutas de fixture y token inválido.

## Comparación visual y capturas

Capturas incluidas en [`screenshots/`](screenshots/), sin PII, credenciales ni tokens. Los tamaños móvil/desktop cubren login, registro, formulario de creación, mapa, detalle y Mis eventos. Mapa/detalle/Mis eventos fueron generados por Edge con fixtures; las capturas Auth/creación se reutilizan de las verificaciones UI R1 versionadas. **Ninguna captura acredita una sesión remota ni una foto real.**

Comparación con [`release-1.png`](../design/mockups/release-1.png):

- Login y registro conservan jerarquía, navegación y estilo oscuro/gradiente. La pantalla de registro implementa nombre visible, email y contraseña; el mockup muestra además fecha de nacimiento y términos, que no figuran entre los CA R1 vigentes. El mockup de login muestra recuperación de contraseña que no forma parte de estos siete RF. Se registran como diferencias de alcance, no como defectos CA.
- Creación implementa horarios separados, ubicación/coordenadas, cupo, categoría y hasta diez fotos opcionales; el mockup resume campos. El formulario ampliado responde al contrato R1 del plan técnico.
- Mapa y detalle usan Leaflet/OSM con atribución y una ficha mínima. Búsqueda y filtros visuales del mockup corresponden a capacidades posteriores; no se exigen aquí. Los tiles de las capturas del check de discovery son ilustrativos interceptados, no tiles reales.
- No hay mockup individual de Mis eventos en la lámina R1. La vista separa “Organizo” y “Participo”, como exige RF-R1-07; la prueba visual usa una fila sintética.
- No se encontró en las capturas un defecto visual confirmado que justifique una corrección de código. El usuario confirmó manualmente la aceptación funcional; no hay capturas de sus sesiones autenticadas adjuntas para una comparación independiente.

## Incidencias priorizadas

| Prioridad | Hallazgo | Estado / acción |
|---|---|---|
| Evidencia | El usuario aceptó manualmente los 28 CA; no hay detalle/artefactos por criterio adjuntos y Codex no reprodujo el E2E remoto. | Mantener la fuente de aceptación identificada; adjuntar pasos/capturas en una revisión posterior si se necesita reproducibilidad independiente. |
| Alta de release (seguridad) | Los tres RPC `SECURITY DEFINER` y protección de contraseña filtrada desactivada generan WARN. | Revisar el contrato de privilegios y ejecutar pruebas Auth/REST; proponer habilitar leaked-password protection para autorización humana. |
| Media | No se comprobó imagen privada por HTTP ni cacheo privado en navegador real. | Verificar Storage/cache con A/B/anon y DevTools sin guardar credenciales. |
| Media | PWA se verificó en build, no instalada en HTTPS ni en teléfono físico. | Probar desde despliegue HTTPS y dispositivo si está disponible. |
| Baja / informativa | Cuatro índices sin uso en Advisor y policies SELECT múltiples. | No borrar índices recientes; medir y revisar policies con carga representativa. |
| Entorno | `npm ci` falló en el `node_modules` compartido (`EPERM`); pasó en clon limpio. | Si se requiere reinstalar el workspace, reparar el bloqueo del archivo de Rolldown en una sesión aparte; no atribuido al producto. |

No se aplicaron correcciones de producto porque no apareció un fallo funcional reproducible que justificara un cambio acotado y el usuario reportó que la validación manual fue satisfactoria. Las WARN remotas se documentan sin cambios de configuración/SQL; la decisión global de GO queda pendiente de aceptación o resolución explícita.

## Reproducibilidad y límites

1. Usar Node.js 24.19.0, clonar la rama base `codex/block-6-qa`, configurar sólo `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` para `planit-v2`; no usar credenciales en variables `VITE_*`.
2. Ejecutar `npm ci`, `npm run build`, `npm run lint` y los scripts `check:*` de la tabla. Los tres scripts de interfaz necesitan servidor Vite local en los puertos/orígenes documentados por esos scripts y Edge/Playwright.
3. `check:discovery`, `check:participations` y `check:my-events` requieren sus herramientas locales de prueba ignoradas por Git, mencionadas en sus README. Participaciones y Mis eventos usaron PostgreSQL local 17.5, sin conectar Auth/Storage por HTTP.
4. La conexión `check:foundation -- --connection` usa únicamente credenciales públicas y hace lectura anónima; su resultado esperado del catálogo RLS fue 401/42501.
5. Los UI checks interceptan Supabase Auth/REST/Storage; discovery también reemplaza tiles OSM. No reutilizar sus resultados como evidencia de E2E.

Evidencia complementaria versionada: `docs/design/verification/{auth-r1,create-event-r1,map-detail-r1,participations-r1,my-events-r1}/`. Los reportes existentes allí especifican su entorno y fixtures. Los artefactos nuevos de QA no incluyen datos reales de usuarios.
