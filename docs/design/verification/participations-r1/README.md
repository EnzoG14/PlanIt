# Bloque 4 — participación R1

Estado: **Implementado; QA pendiente**, sin aprobación humana de CA. Fecha: 10/10/2026 (Argentina).

## Implementación y contrato

- `20261010150232_event_participations.sql`: **aplicada en planit-v2 el 10/10/2026, con autorización expresa del usuario**. CLI `db push --skip-vault --project-ref iepeqmvzjguwlhnecsdq --yes` aplicó exclusivamente este archivo. Historial posterior muestra las seis versiones sincronizadas y dry-run posterior indica cero pendientes. No se modificó el proyecto histórico ni se hizo merge.
- `register_for_event(p_event_id uuid)` y `leave_event(p_event_id uuid)` devuelven `void`. Identidad exclusivamente `auth.uid()`. Lock de `events` antes de consulta/cambio de participación; inscripción sólo en público vigente, organizador excluido. `cancelled` reutiliza la fila; `removed` no puede reingresar. Retiro propio permitido también después de fin/cancelación/archivo. Repetir la misma operación mientras el estado ya es su destino no altera fila ni historial.
- PostgreSQL `READ COMMITTED` permite consultar confirmados después de esperar el lock. Registro rechaza aislamiento con snapshot congelado con SQLSTATE `40001` (`retry_read_committed`), evitando que una transacción `REPEATABLE READ` reserve con un conteo anterior. Operaciones futuras R3 que cambien cupos o participaciones deberán tomar el mismo lock primero.
- RLS: participación/historial sólo propios; no lectura de asistentes por organizador o terceros en R1. Sin grants INSERT/UPDATE/DELETE a anon/authenticated ni posibilidad de falsificar historial. FK RESTRICT preservan relaciones. Trigger agrega una entrada por creación/transición real dentro de la transacción y usa actor de sesión.
- `get_event_participation_summary(p_event_id uuid)` devuelve exclusivamente `confirmed_count`, `capacity`, `available_spots`, `own_status`, `is_organizer`, `event_state`. Sin identidades, listado, demografía ni perfiles. Autorización: organizador, público accesible o titular de participación histórica. Una política adicional conserva lectura del evento de esa participación tras cancelación/archivo.
- SECURITY DEFINER permite bloquear `events` sin otorgar UPDATE, contar filas ajenas sin exponerlas y escribir participación/historial dentro de la operación controlada. Endpoints con `search_path=''`, objetos calificados, sin SQL dinámico, check de sesión y ownership/acceso, EXECUTE exclusivamente authenticated; trigger interno no invocable. Véase [seguridad de funciones Supabase](https://supabase.com/docs/guides/database/functions).
- UI: componente `EventParticipation` y contrato `features/events/participation.ts`, independientes del mapa. Consultas iniciales, tras cada acción incluso fallida, al recuperar foco/visibilidad, cada 30 segundos y manuales. No cambios optimistas de conteo. Sin resumen confirmado se ocultan números y se deshabilita el CTA. Mutex inmediato evita dos submits antes del repaint. La autorización final siempre está en la RPC.

## Evidencia ejecutada

- `npm run build`: PASS (TypeScript, Vite y generación de service worker).
- `npm run lint`: PASS sin avisos.
- `npm run check:discovery`: PASS, regresión SQL local de descubrimiento (PGlite; no sustituye concurrencia).
- `node scripts/check-participations.mjs`: PASS con **PostgreSQL 17.5 real**, proceso local, clientes TCP independientes. [Resultados y PIDs](postgres-results.json). Replay del SQL versionado completo sobre base limpia con scaffolding Auth/Storage; RLS/grants/path, dos participantes y terceros, retry, retiro/reinscripción, organizador, removed, estados de evento, constraints, acceso histórico autorizado, rollback forzado del historial y diez carreras del último cupo. Cada carrera verifica ambos PIDs esperando un lock real antes de liberar la transacción de control: un confirmado, un `event_full`, una entrada de historial. Además retry simultáneo del mismo usuario y rechazo de snapshot congelado.
- `node scripts/check-participations-ui.mjs`: PASS con Edge/Playwright, HTTP Supabase interceptado, sesión ficticia. [Resultados](ui-results.json). Dos clicks sin repaint → una petición; retiro/reinscripción, respuesta perdida con estado reconciliado, caída de resumen sin cifras cacheadas, retry, último cupo ocupado mientras se envía, removed, vencido, cancelado/archivado y organizador. Payload RPC sólo event_id. Sin overflow ni errores JS. No equivale a Auth/REST real.
- Regresión `scripts/check-discovery-ui.mjs`: PASS móvil/tablet/escritorio con el contrato nuevo de participación; capturas de esta regresión se guardaron en carpeta local ignorada para conservar evidencia original del bloque 3. Sigue usando fixtures HTTP.
- `git diff --check`: PASS.

## Criterios RF

Desglose según el DoD del plan técnico R1 versionado; el plan resume los CA originales. Estos resultados son evidencia local, **no estado Validado ni aprobación de QA humana**.

| Criterio | Resultado observado | Evidencia / límite |
|---|---|---|
| RF-R1-05.CA-01 | PASS local: inscripción propia confirmada; organizador rechazado y excluido de ocupación | PostgreSQL + UI fixture; pendiente sesión real Supabase |
| RF-R1-05.CA-02 | PASS local: vínculo único por evento/usuario, reinscripción conserva ID | PostgreSQL UNIQUE/FK y consulta de ID |
| RF-R1-05.CA-03 | PASS local: doble submit y retries sin duplicados ni historial falso | PostgreSQL mismo usuario en dos conexiones + UI doble click y respuesta perdida |
| RF-R1-05.CA-04 | PASS local: sólo un usuario reserva el último cupo | Diez carreras reales multiconexión PostgreSQL, PIDs y lock-waits registrados |
| RF-R1-06.CA-01 | PASS local: retiro confirmado → cancelled exclusivamente del titular | PostgreSQL dos identidades + UI |
| RF-R1-06.CA-02 | PASS local: cupo liberado e historial retenido, reinscripción sobre misma fila | PostgreSQL tres transiciones; FK RESTRICT; rollback conjunto |
| RF-R1-06.CA-03 | PASS local: usuario ajeno no puede retirar al titular | RPC sin user_id, error not_participating; direct UPDATE negado; RLS de lectura |
| RF-R1-06.CA-04 | PASS fixture: error informado, refresco/reintento y estado servidor reconciliado | UI caída/respuesta perdida; pendiente red real/dispositivo físico |

## Capturas y contraste visual

Referencia: [R1 teléfono 5](../../mockups/release-1.png). Se conserva el hero/placeholder, fondo marino, tipografía, categoría, metadatos y enlace a Mis eventos; se agregan ocupación y barra azul-violeta dentro de la card existente, CTA gradiente ancho completo. Datos de prueba claramente identificados. No se extraen fotos del póster ni se agregan favoritos, solicitudes R3 o funciones futuras.

- [Detalle móvil completo](detail-375x812.png), [viewport móvil con CTA](action-375x812.png), [confirmado móvil](confirmed-375x812.png), [completo móvil](full-375x812.png).
- [Detalle escritorio completo](detail-1280x900.png), [viewport escritorio](action-1280x900.png), [confirmado escritorio](confirmed-1280x900.png), [completo escritorio](full-1280x900.png).

Comparación visual realizada: card de ocupación y CTA mantienen lenguaje de teléfono 5. Se mantiene el placeholder existente porque no hay foto real de prueba; labels de inicio/fin/dirección ocupan más altura que el collage por datos obligatorios y accesibilidad. Pantalla requiere scroll; el test verifica CTA libre de navegación fija al desplazarse. Capturas full-page incluyen navegación fija situada al borde del viewport original. No se afirma fidelidad píxel a píxel ni aceptación humana.

## Reproducir y pendientes

En Windows x64, instalar herramientas aisladas (sin dependencias de producción):

```powershell
npm install --prefix .participation-test-tools.local --no-save embedded-postgres@17.5.0-beta.15 pg@8.16.3
npm run check:participations
npm run dev -- --host 127.0.0.1 --port 4185
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4185'
npm run check:participations:ui
```

El test usa binarios PostgreSQL Windows, detecta puerto libre, inicia con ventana oculta y escucha sólo 127.0.0.1; crea cluster nuevo por corrida en carpeta ignorada y lo detiene en finally. El cluster de prueba queda conservado, sin borrar datos del usuario. Auth/Storage son scaffolding SQL compatible; no un stack completo Supabase. Playwright usa el runtime local de Codex o `PLANIT_PLAYWRIGHT_PATH` configurado por el ejecutor.

Pendientes: pruebas con dos sesiones reales Auth/PostgREST; QA humana de los ocho CA y teléfono físico. Ocupación es snapshot al consultar, puede cambiar entre consultas; la RPC resuelve carreras con el estado real. No se implementó bloque 5 ni su pantalla Mis eventos; se mantiene el enlace existente.

## Despliegue remoto autorizado — 10/10/2026

Aplicación finalizada en `planit-v2` (`iepeqmvzjguwlhnecsdq`). Las dos tablas tienen RLS activo; authenticated no tiene INSERT/UPDATE/DELETE directos. Las tres RPC tienen `search_path=''`, EXECUTE para authenticated y denegado a anon.

Prueba SQL remota PASS usando las dos identidades existentes bajo rol authenticated: organizador no se inscribe; visitante se registra y reintenta sin historial duplicado; propietario no lee participación ajena ni la retira; retiro/retry libera cupo; reinscripción conserva ID; exactamente tres entradas de historial; UPDATE directo y RPC anónima denegados. La prueba se cerró con ROLLBACK, sin conservar evento ni participaciones de prueba. Esta prueba comprueba SQL/RLS con identidades reales, **no login de navegador ni JWT HTTP**, y no reemplaza la concurrencia multiconexión local ya registrada.

Advisors de seguridad antes/después: aviso previo de [protección de contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Tras el despliegue hay tres avisos de [SECURITY DEFINER ejecutable por autenticados](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), uno por RPC. Su exposición es intencional: necesitan lock, conteo agregado sin acceso a filas ajenas y escritura transaccional sin grants directos; las validaciones de sesión/ownership/acceso y permisos fueron verificadas. No se cambió configuración Auth ni se marca el bloque Validado.
