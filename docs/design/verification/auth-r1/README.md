# Auth R1 — implementación y verificación

Fecha: 10/10/2026. Rama: `codex/block-0-foundation`. Alcance: RF-R1-01 y RF-R1-02. Eventos, mapa con datos y perfil social siguen pendientes.

Fuente funcional: [Planificación — Google Docs](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), pestañas «Especificación técnica — R1 a R7» (`t.58du83a4qpv`), «Criterios de aceptación — R1 a R7» (`t.89mq08i5ups2`) y «Plan técnico Release 1 — Codex (Markdown)» (`t.6lp4c0pya8w2`). Referencia visual: `../../mockups/release-1.png`, teléfonos 1 y 2; contrato `DESIGN_SYSTEM.md`, `SCREENS.md` y `DESIGN_GAPS.md`.

## Comportamiento implementado

- Registro real con email, password y `options.data.display_name`; nombre recortado y validado por caracteres Unicode (2–60). El navegador no inserta perfiles.
- Login real, toggle de contraseña, errores comprensibles, foco al primer campo inválido, prevención de envíos dobles y estados de carga.
- Sesión persistida por el cliente Supabase existente; restauración con `getSession`, comprobación de identidad con `getUser`, suscripción síncrona a `onAuthStateChange` y cleanup. RLS sigue siendo la autoridad de acceso.
- `/my-events`, `/events/new` y `/me` protegidas sin mostrar su contenido durante restauración/error. El login conserva un destino interno permitido; destinos externos se rechazan.
- Logout del dispositivo actual (`scope: local`), con carga/error. En una ruta protegida, cerrar sesión devuelve al login.
- `/me` lee sólo `display_name` y `username` de la fila del propietario; muestra email desde Auth. No abre SELECT a terceros ni agrega datos sociales.
- Confirmación de email habilitada remotamente: ambas cuentas de prueba recibieron confirmación y el usuario confirmó que el retorno abrió PlanIt en `localhost:4177`. No se cambiaron ajustes de Auth.
- Duplicados ocultados por Supabase (`identities: []`) reciben rechazo genérico en UI. No se publica un éxito ficticio ni se implementa una búsqueda anónima de correos.

## Matriz de los ocho CA

| CA | Condición original resumida | Evidencia / resultado |
| --- | --- | --- |
| RF-R1-01.CA-01 | Datos obligatorios válidos permiten crear cuenta y confirmar resultado. | Dos altas reales mediante SDK, misma llamada/options que React, aceptadas en planit-v2; emails confirmados por el usuario y login real posterior. UI de confirmación implementada; no se capturó el alta inicial desde React. |
| RF-R1-01.CA-02 | Duplicado, email inválido o faltantes se rechazan con mensaje comprensible. | Validaciones locales y UI de faltantes; duplicado real devuelve usuario sin identidades y la UI muestra «No se pudo crear la cuenta…». Sin nueva sesión ni consulta anónima de perfiles. |
| RF-R1-01.CA-03 | Perfil asociado y username único; fallo de perfil no se informa como alta exitosa. | Ambas cuentas recuperan exactamente su propia fila, usernames `user_` + 12 hex distintos. Trigger existente inspeccionado: INSERT de perfil en la transacción de Auth y excepción si falla; React procesa errores sin anunciar éxito. **No se indujo un fallo del trigger en remoto.** Edición del username corresponde a una etapa posterior. |
| RF-R1-01.CA-04 | Los datos del alta se conservan al consultar perfil tras login. | API y `/me` verifican `Prueba Auth 1` / `Prueba Auth 2`, usernames generados y email de la identidad correcta. No se confunden cuentas al alternar sesiones. |
| RF-R1-02.CA-01 | Credenciales válidas permiten acceder a secciones protegidas. | Login con ambas cuentas; entrada a `/my-events` tras `next`, consulta de `/me`; las pantallas de eventos mantienen mensajes de funcionalidad pendiente. |
| RF-R1-02.CA-02 | Credenciales incorrectas se rechazan sin exponer datos sensibles. | API `invalid_credentials`; UI muestra «El email o la contraseña no son correctos». No se imprimen contraseñas ni tokens. |
| RF-R1-02.CA-03 | Sesión vigente permite reabrir sin autenticarse otra vez. | Nuevo cliente con el mismo almacenamiento restaura sesión y `getUser` verifica identidad. Recarga y otra pestaña real `/me` recuperaron el perfil sin nuevo login. |
| RF-R1-02.CA-04 | Sesión vencida/inválida exige login para contenido privado. | Prueba SDK con sesión vencida y refresh token revocado devuelve sesión nula; error esperado `refresh_token_not_found`. UI sin sesión redirige `/my-events`, `/events/new` y `/me` al login; logout desde ruta privada hace lo mismo. No se esperó el vencimiento natural del JWT en un teléfono. |

Los resultados describen lo efectivamente probado; no equivalen a aprobación visual ni a una prueba ejecutada de fallo del trigger.

## Seguridad y pruebas reales

- Único destino: `iepeqmvzjguwlhnecsdq` (planit-v2), usando sólo publishable key. No se utilizó la base histórica, secret/service_role, DDL, SQL remoto ni migraciones.
- Cada cuenta lee su fila. Lectura directa por ID ajeno devuelve `[]` en ambos sentidos; SELECT sin filtro devuelve sólo la fila propia. Esto verifica RLS sin depender del filtro de React.
- Se mantuvieron el trigger y los grants. Ninguna inserción de `profiles` desde cliente.
- Credenciales de prueba en `.auth-test.local`, ignorado por Git. No copiarlas al informe, screenshots ni repositorio. Las cuentas confirmadas permanecen en planit-v2; las sesiones de las pruebas se cerraron.
- `npm run check:auth` valida límites de nombre Unicode, faltantes, email, contraseña, destinos internos y mensajes que no repiten errores arbitrarios del servidor.
- `npm run check:auth -- --signup` crea sólo las dos cuentas explícitamente autorizadas mediante variables `PLANIT_TEST_EMAIL_A/B`; guarda fixture local y evita reenvíos automáticos.
- `npm run check:auth -- --live` comprueba login, perfil/username, RLS cruzado y sin filtro, restauración, credenciales inválidas, duplicado, logout y expiración con refresh revocado. Las llamadas remotas requieren acceso de red autorizado. No elimina cuentas ni modifica contraseñas.

## Resultados de comandos

| Comando | Salida / resultado |
| --- | --- |
| `npm run build` | Exit 0. TypeScript y Vite pasan; PWA genera `dist/sw.js`, Workbox y 13 entradas de precache. |
| `npm run lint` | Exit 0, sin advertencias en la verificación final. |
| `npm run check:foundation` | Exit 0. Configuración restringida a planit-v2/publishable; manifest, iconos, precache y registro SW correctos. |
| `npm run check:auth` | Exit 0. PASS de validación y destinos seguros. |
| `npm run check:auth -- --signup` | Exit 0. Dos solicitudes aceptadas; `confirmationPending: true`. |
| `npm run check:auth -- --live` | Exit 0. PASS de dos perfiles, RLS, sesión, credenciales inválidas, logout y sesión vencida. El SDK imprime `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` en el caso negativo esperado; la aserción de sesión nula pasa. |

## Capturas y comparación visual

Las seis capturas base tienen tamaño de bitmap verificado: login y registro a **375×812**, **390×844** y **1280×800**. Son capturas de navegador, sin marco ni contenido del póster.

| Viewport | Login | Registro |
| --- | --- | --- |
| 375×812 | [Captura](login-375x812.jpg) | [Captura](register-375x812.jpg) |
| 390×844 | [Captura](login-390x844.jpg) | [Captura](register-390x844.jpg) |
| 1280×800 | [Captura](login-1280x800.jpg) | [Captura](register-1280x800.jpg) |

Evidencia adicional: `login-required-375x812.jpg`, `login-error-375x812.jpg`, `register-required-390x844.jpg`, `register-duplicate-390x844.jpg`, `register-focus-390x460.jpg`, `my-events-authenticated-390x844.jpg`, `logout-protected-390x844.jpg`. Los nombres indican el viewport solicitado; el navegador reduce proporcionalmente algunos JPEG de pantallas con scrollbar (por ejemplo, la captura de foco es 375×442 para viewport 390×460). `measurements.json` contiene las dimensiones CSS y áreas de controles observadas.

- Preservados frente a R1: fondo navy, círculo de login/usuario, título/subtítulo centrados, inputs rectangulares oscuros con iconos lineales y CTA azul→violeta de ancho completo.
- Diferencias documentadas: labels visibles; sólo tres campos de registro; sin DOB, checkbox de términos, recuperación inerte ni indicadores de progreso; adaptación desktop sin header corporativo.
- Inputs/CTA: 52 px. Tipografía de input: 16 px. Toggle: 44×44. Navegación inferior autenticada: Mapa/Mis eventos/Crear/Perfil; áreas de 56 px de alto y aproximadamente 91.5 px de ancho a 390 px.
- No overflow horizontal en las vistas medidas; los errores incrementan altura y permiten scroll. Foco visible de 3 px y foco en el primer inválido.
- En viewport 390×460, la contraseña enfocada queda entre y=207.78 y 259.78 y se puede alcanzar el CTA por scroll. Es simulación de altura disponible, **no una prueba de teclado virtual físico**.
- Safe-area conservada en padding inferior del contenido y navegación. El navegador de pruebas tiene inset 0; falta una revisión en dispositivo con cutout/teclado.

## Archivos y diff de este bloque

| Archivo | Cambio Auth R1 |
| --- | --- |
| `src/features/auth/AuthProvider.tsx`, `useAuth.ts` | Estado de sesión, restauración/verificación, eventos y retry. |
| `src/features/auth/RequireAuth.tsx`, `validation.ts` | Protección y validación/mensajes/destino permitido. |
| `src/pages/AuthPage.tsx` | Formularios funcionales compartidos de login/registro. |
| `src/pages/ProfilePage.tsx` | Consulta mínima segura del perfil propio. |
| `src/components/FormField.tsx`, `GradientButton.tsx` | Campos y botones compartidos con uso real. |
| `src/components/Icon.tsx` | Iconos lineales propios email/lock/eye/eyeOff; sin dependencia nueva. |
| `src/App.tsx` | Provider, rutas Auth y grupo protegido, `/me`. |
| `src/components/AppLayout.tsx` | Cuenta/salir, loading/error y acceso Perfil. |
| `src/pages/FoundationPage.tsx` | Retira placeholders de Auth; conserva estado pendiente de eventos/mapa. |
| `src/App.css` | Campos, toggle, feedback, botones, perfil y distribución de nav. |
| `scripts/check-auth.mjs`, `package.json` | Pruebas locales y opt-in de integración. |
| `docs/design/DESIGN_GAPS.md`, este informe y capturas | Excepciones y evidencia. |

La rama conserva cambios anteriores del bloque visual (tokens, iconos PWA, favicon, tema y layout) y archivos preexistentes del usuario. No se modificaron SQL, `src/lib/supabase.ts`, validación de claves ni configuración de caché SW en Auth R1. No se hizo commit, push, merge ni despliegue.

## Pendientes antes de aceptación final

- [ ] Revisión visual del usuario contra R1 y aprobación de esta entrega.
- [ ] Prueba de teclado/safe-area en teléfono físico.
- [ ] Ensayo controlado de fallo del trigger de perfil, si se requiere evidencia negativa en remoto; no se alteró la BD para inducirlo.
- [ ] Al definir hosting, autorizar allí las URLs de retorno de Auth y repetir confirmación. El retorno local ya fue confirmado por el usuario.

Los bloques siguientes implementarán eventos/mapa. Este bloque no agrega favoritos, categorías múltiples, borradores persistidos, entradas, reseñas, pagos ni otras acciones futuras.
