# R4 · Bloque 3 — intereses privados

13/10/2026, Argentina. Rama `codex/r4-block-3`, base `main` **cff3e6b41c9473690d40573cc4d17f14609ca72f**, con bloque 2 integrado. **Implementado; QA pendiente**. Sin aceptación humana, JWT real, metadata remota, aplicación SQL remota, merge ni deploy.

## Contrato y seguridad

Se consultó la especificación vigente de RF-R4-05 en [Planificación](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit): intereses múltiples sin límite obligatorio, propiedad privada, inactivas no se agregan nuevamente, sugerencias en bloque 4. Los cuatro textos oficiales permanecen literales. A01–A07 intactas; la brecha documental de evidencia R3 no reabre A07.

- Tabla `public.user_category_interests(user_id, category_id, created_at)`, PK compuesta, FKs RESTRICT a profiles/categories y fecha sin zona con reloj Argentina. Ausente en migraciones de la base; creada por replay real local. Existencia efectiva en remoto **no inspeccionada**.
- RLS SELECT propio y grants de tabla sólo SELECT authenticated. PUBLIC/anon sin acceso; sin escrituras REST, incluso propias.
- `set_my_category_interests(p_category_ids uuid[]) returns table(category_id uuid)`: auth.uid autoritativo, sin user_id de cliente. Array no nulo, sin nulos/duplicados; UUIDs y categorías existentes. `[]` limpia; inactivas guardadas se conservan hasta quitarlas, sin nuevas altas/realtas inactivas.
- DEFINER necesario sólo para escrituras controladas sin DML de cliente: search_path vacío, referencias calificadas, EXECUTE authenticated y guards de Auth/perfil. Locks perfil propio → categorías ordenadas FOR SHARE, compatibles con desactivación concurrente. Reemplazo atómico; filas retenidas conservan created_at. No amplía grants de profiles.
- **20261014120001_user_category_interests.sql**, generada con CLI y renumerada inmediatamente después del máximo versionado porque bloque 2 tenía un prefijo posterior al reloj actual. Nueva, probada local, **no aplicada remotamente**. No se modificaron migraciones anteriores.

## Composición, foco y estados

Perfil agrega «Mis intereses» conservando identidad/cabecera/cuenta. `/me/interests` protegida y diferida amplía explícitamente `.amanecer-shell.social-shell`, con una social-wash aria-hidden y dock de cuatro destinos (Perfil activo). ScreenHeader y controles existentes, grid de píldoras aria-pressed con check, azul seleccionado y CTA tinta. Tokens `--pi-*`, fuente y dirección Amanecer preservados; no se regeneraron DESIGN/sidecar ni QA histórica.

Retorno a `/me` enfoca su enlace «Mis intereses»; entrada/reapertura enfoca h1 después del efecto compartido del layout. Se adoptó la elección del usuario de confirmar salida sucia: diálogo nativo, «Seguir editando» como foco inicial, Escape/restauración, y «Descartar cambios». RouterProvider/createBrowserRouter mantiene las rutas/protección/Suspense/AuthProvider y habilita useBlocker para enlaces/dock/Atrás; beforeunload cubre recarga/cierre con aviso nativo sujeto al navegador. Login sólo agrega el destino interno exacto al allowlist.

Selección editable y persistida separadas, carga/vacío/error/reintento, bloqueo de edición/doble envío, ACK más relectura coincidente antes de éxito. Si se pierde la respuesta o falla la reconciliación, «Comprobar guardado» realiza sólo lectura; coincidencia confirma, diferencia habilita revisar/reintentar. Salir con solicitud pendiente advierte que puede haberse guardado: un error de red no prueba rollback.

Inactivas guardadas visibles con explicación y opción de quitar; pueden restaurarse antes de confirmar su eliminación. Actualizar catálogo conserva elecciones disponibles y quita una elección nueva ya desactivada. Estado/revisiones/abort por identidad; token renovado conserva cambios, cuenta/logout descartan la vista y respuestas anteriores. Sin caché privada persistente nuevo ni filtro automático de Inicio.

## Pruebas y reproducción

| Comando | Resultado / evidencia |
| --- | --- |
| `check:interests` | PASS, 10 checks [SQL](sql/results.json) |
| `check:interests:ui` | PASS, 54 checks [UI/geometría](ui/results.json), seis tamaños |
| `build` / `lint` | PASS; [build](build.txt), [lint](lint.txt); advertencias previas de Mapbox y código ajeno |
| `check:amanecer` | PASS, 83 valores/fuente |
| `check:profile` / `check:profile:ui` | PASS; [SQL](regressions/profile-sql/postgres-results.json), [UI](regressions/profile-ui/ui-results.json) |
| `check:search` / `check:filters:ui` | PASS; [SQL](regressions/search-sql/postgres-results.json), [UI](regressions/filters-ui/ui-results.json) |
| `check:auth` / `check:amanecer:auth:ui` | PASS; validaciones locales y [Auth UI](regressions/auth-ui/results.json) |
| `check:home:ui` / `check:discovery:ui` | PASS; [Inicio](regressions/home-ui/ui-results.json), [Mapa/detalle](regressions/discovery-ui/results.json) |
| Detector Impeccable / `git diff --check` | PASS, 0 hallazgos deterministas; no certificación visual |

SQL: PostgreSQL embebido efímero real, replay completo, scaffolding Auth/Storage y claims simulados, cuentas A/B y anon. 0/1/N, duplicados/nulos/UUID desconocido/inválido, created_at retenido, RLS/permisos/cruces, inactivas, rollback forzado tras DELETE, guardados concurrentes sobre cuenta vacía, desactivación concurrente y nueva conexión autenticada.

UI: Edge/Playwright con Auth/REST interceptados y WebSocket bloqueado, dos cuentas ficticias. Guardado/reapertura, fallo rechazado y respuestas perdidas con/sin commit, relectura fallida/reintento, categoría inactiva, vacío/error inicial, cambio de token/cuenta/logout y respuestas tardías tanto de lectura como escritura. Diálogo, enlaces/dock/Atrás, Escape, foco inicial/reapertura/retorno. Anchos **320/360/375/390/768/1280**, sin overflow y opciones ≥44px; texto aumentado, altura 320px y preferencias reducidas emuladas.

```powershell
$env:PLANIT_PLAYWRIGHT_PATH = '<ruta instalada>/playwright/index.mjs'
$env:PLANIT_UI_ORIGIN = 'http://127.0.0.1:4181'
$env:PLANIT_UI_NO_PROXY = '1'
npm run dev -- --host 127.0.0.1 --port 4181 --strictPort
# En otro terminal con las mismas variables:
npm run check:interests
npm run check:interests:ui
```

Sin dependencias nuevas. Los runners de regresión aceptan PLANIT_UI_OUTPUT y escribieron sólo carpetas nuevas. Opción de evitar proxy de Edge agregada a runners afectados tras fallos de loopback del entorno. Capturas completas de regresiones ajenas conservadas localmente en la carpeta ignorada `.participation-test-tools.local/r4-block-3-regression-captures`; resultados y capturas de Perfil versionados. Incidencias iniciales corregidas: ambigüedad SQL del ON CONFLICT (constraint explícita), selector de prueba que cambiaba índices al deseleccionar y coordinación de foco con AppLayout.

## Evidencia visual y pendientes

Baseline definitiva: `git archive cff3e6b` servido separado en 4182, sin editar la app en ejecución. [Perfil móvil](before-immutable/profile-avatar-mobile.png), [escritorio](before-immutable/profile-avatar-desktop.png), [resultados](before-immutable/ui-results.json). `before/` conserva el primer baseline del checkout previo a editar UI.

Resultado: [390px](ui/390-interests.png), [1280px](ui/1280-interests.png), [error](ui/390-save-error.png), [vacío](ui/390-empty.png), [diálogo con poca altura](ui/390-leave-short.png) y Perfil en `regressions/profile-ui/`. Mockup R4 sólo inventario funcional; lab B referencia de composición, nunca fuente de tokens. Inspección propia de móvil/escritorio, estados/grid/etiquetas/CTA/dock; sin evaluación independiente ni aceptación humana. El aviso previo del hook sobre sidecar más antiguo queda registrado, sin regenerarlo.

NOT RUN: metadata/advisors y migración remotos; HTTP/JWT A/B/anon real, Storage/Realtime real, dispositivo/PWA físico, teclado móvil/lector de pantalla/zoom nativo, rendimiento blur y motor sin backdrop-filter. Texto aumentado no acredita zoom nativo. Antes de autorizar SQL remoto comprobar drift/historial/grants y seguridad de planit-v2; el proyecto histórico no se consultó ni modificó. Ningún CA pasa a «Validado».
