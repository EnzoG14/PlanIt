# PlanIt

PWA universitaria para descubrir, organizar y participar en eventos. React 19, TypeScript, Vite, React Router y Supabase.

## Arranque local

Usar Node compatible con Vite 8 (20.19+ o 22.12+) y npm.

```powershell
npm ci
Copy-Item .env.example .env.local
# Completar la clave publishable de planit-v2 en .env.local.
npm run dev
```

Variables públicas: `VITE_SUPABASE_URL` debe ser `https://iepeqmvzjguwlhnecsdq.supabase.co`; `VITE_SUPABASE_PUBLISHABLE_KEY` debe contener la clave `sb_publishable_...` del mismo proyecto. Obtenerla en la configuración de API de Supabase. Reiniciar Vite después de cambiar variables. Nunca usar secret keys, service_role ni claves privadas en VITE_*. Los archivos de entorno reales se excluyen de Git.

Si falta configuración o el destino es incorrecto, la app muestra un aviso y no inicializa Supabase. Una configuración válida sólo habilita el cliente; no demuestra por sí sola conectividad o permisos.

Vite rechaza una clave no pública antes de iniciar o compilar, para impedir que termine incluida en el bundle. El mensaje no imprime la clave.

## Estado del BLOQUE 0

Rutas base: `/map`, `/register`, `/login`, `/events/new`, `/my-events`, `/events/:id` y 404. `/` redirige a `/map`. Las páginas informan funciones pendientes: todavía no hay registro/login, protección de rutas, mapa ni operaciones de eventos. CSS propio responsive, sin dependencias de estilos.

La PWA genera manifest, iconos y service worker en producción; precachea recursos estáticos locales y no almacena respuestas de Supabase ni tiles. Para probarla:

```powershell
npm run build
npm run lint
npm run check:foundation
npm run preview -- --host 127.0.0.1
```

Abrir la URL que imprime Vite. Verificar rutas directas, navegación con teclado, 404 y diseño móvil. En DevTools → Application comprobar manifest, iconos 192/512/maskable, service worker activo y Cache Storage con recursos locales únicamente. La instalación requiere un navegador compatible y HTTPS fuera de localhost. Hosting futuro debe resolver rutas de la SPA a `index.html`.

`npm run check:foundation` prueba configuración inválida, destino histórico/imitado, claves no públicas, manifest y PNG del build. `npm run check:foundation -- --connection` añade una lectura real del catálogo con la clave publishable local; espera acceso anónimo denegado, no un catálogo vacío. No escribe datos ni imprime la clave.

Iconos geométricos propios: generados con `scripts/generate-icons.py` (Python + Pillow), coherentes con `public/favicon.svg`. PNG opacos; contenido maskable dentro de la zona segura central. No se necesita Python para compilar la app.

Mapa futuro: Leaflet + React Leaflet, instalación al primer uso. Tiles OpenStreetMap con atribución visible y sin descarga anticipada/offline; ver [decisión y límites](docs/architecture.md).

## Base de datos

Destino único: **planit-v2 — iepeqmvzjguwlhnecsdq**. La base histórica es intocable.

- Aplicadas: `20261010011204` (vacía) y `20261010013449` (profiles/categories).
- Pendiente: `20261010023448_restrict_rls_auto_enable_execute.sql`, revocación de permisos de ejecución de una función interna. Conserva `ensure_rls`.
- El dry-run del BLOQUE 0 sólo identifica esa migración pendiente. No se aplicó SQL remoto.

Antes de cualquier despliegue, revisar la ref de `supabase/.temp/project-ref`, que debe coincidir con el destino; consultar ayuda de la CLI instalada. Comprobaciones sin aplicación:

```powershell
npx supabase migration list --project-ref iepeqmvzjguwlhnecsdq
npx supabase db push --dry-run --skip-vault --project-ref iepeqmvzjguwlhnecsdq
```

El dry-run enumera cambios pendientes; no valida ejecutando el SQL. Aplicar migraciones requiere autorización expresa. No editar migraciones ya aplicadas.

## Documentación y verificación

[Arquitectura](docs/architecture.md), [modelo de datos](docs/database.md), [instrucciones](AGENTS.md) y [evidencia del BLOQUE 0](docs/block-0-verification.md).

Los criterios funcionales RF-R1-01 a RF-R1-07 siguen pendientes de los bloques 1–6. No se crearon cuentas ni datos de prueba en BLOQUE 0.
