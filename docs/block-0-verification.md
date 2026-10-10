# BLOQUE 0 — Evidencia de verificación

Fecha: 09/10/2026, Argentina. Rama: `codex/block-0-foundation`.

## Cambios

- Router y páginas base en español, layout responsive y componentes compartidos de mensajes; reemplazo de la plantilla visual de Vite.
- Cliente central con configuración tipada, destino único y errores sin valores de claves; Vite rechaza claves no públicas antes del bundle.
- `.env.example`, exclusión de entornos reales y `.codegraph/`.
- Manifest, favicon e iconos PNG propios de 192/512 y maskable. Precaching local; sin runtime caching de APIs o tiles.
- Migración incremental de permisos y documentación de estado remoto/decisión Leaflet + React Leaflet.

## Checklist y resultados

| Comprobación | Resultado y evidencia |
| --- | --- |
| Build | `npm run build`: exit 0; genera manifest, registro SW, sw.js y Workbox. |
| Lint | `npm run lint`: exit 0. |
| Configuración y artefactos PWA | `npm run check:foundation`: exit 0. Prueba ausencias/placeholders, rechazo de URL histórica/imitada/HTTP y claves no públicas sin eco de claves. Verifica manifest, dimensiones PNG, opacidad, maskable y precache de iconos. |
| Clave secreta ficticia | Build con `sb_secret_test_only` rechazado antes del empaquetado, como se esperaba. No se utilizaron secretos reales. |
| Conectividad real | `npm run check:foundation -- --connection`: exit 0. GET de categories en planit-v2 con publishable local: HTTP 401, código 42501. Acceso anónimo denegado; no se interpreta como catálogo vacío. |
| Navegación | Navegador real: `/` redirige a `/map`; clic en Mis eventos y rutas directas `/register`, `/login`, `/events/new`, `/events/test-id` y `/missing-page` muestran títulos y estados pendientes/404 correctos. Recarga funciona. |
| Configuración ausente | Instancia temporal con variables vacías: aviso visible; sin inicialización del cliente. No se editó `.env.local`. |
| Destino incorrecto | Instancia temporal con URL histórica y clave ficticia: aviso visible de destino planit-v2; no inicializa cliente ni consulta la base histórica. |
| Responsive y consola | Verificación visual de escritorio y móvil; viewport móvil observado 375 px, scrollWidth 375 px, sin desbordamiento horizontal. Sin warnings/errors de consola en la vista de producción. Capturas guardadas como artefactos locales de esta conversación. |
| Registro y caché PWA | HTML servido incluye `/registerSW.js`. Inspección del worker generado: sólo recursos estáticos locales y ninguna URL de Supabase o tiles. No se verificó instalación en dispositivo ni activación/cache runtime desde DevTools. |
| Historial remoto | MCP y `npx supabase migration list --project-ref iepeqmvzjguwlhnecsdq`: las dos migraciones iniciales están aplicadas; la nueva está pendiente. |
| Dry-run | `npx supabase db push --dry-run --skip-vault --project-ref iepeqmvzjguwlhnecsdq`: exit 0; sólo enumera `20261010023448_restrict_rls_auto_enable_execute.sql`. No ejecuta ni valida el SQL por aplicación. |
| Función/trigger | SELECT de catálogo remoto confirma SECURITY DEFINER, EXECUTE para PUBLIC/anon/authenticated y `ensure_rls` habilitado. Migración sólo revoca EXECUTE; conserva definición y propietario. |

## Migraciones y límites

- Aplicadas previamente: `20261010011204` (vacía), `20261010013449` (profiles/categories). No se modificaron.
- Pendiente: `20261010023448_restrict_rls_auto_enable_execute.sql`. No se aplicó SQL remoto ni se fusionó a main.
- Las advertencias de ejecución pública de la función seguirán presentes hasta aplicar y verificar la nueva migración con autorización. Remediación oficial: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable.
- No se crearon usuarios ni datos de prueba. Registro/login, protección por sesión, mapa y operaciones de eventos siguen pendientes; los RF funcionales no se marcan aprobados.
- Instalación PWA en dispositivo, inspección de caché runtime y prueba posterior a aplicación de SQL quedan pendientes. El hosting necesitará HTTPS y fallback SPA a index.html.
- Leaflet no se instaló todavía. Los tiles públicos de OSM tienen disponibilidad best-effort y requieren cumplir atribución/política.

La implementación se detiene en BLOQUE 0 para revisión.
