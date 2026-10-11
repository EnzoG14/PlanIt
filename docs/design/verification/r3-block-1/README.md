# Release 3 — Bloque 1: Mis eventos organizados

**Fecha:** 11/10/2026, Argentina. **Estado:** Implementado; QA pendiente. No implica aceptación humana ni despliegue remoto.

## Contrato implementado

Organizo usa `get_my_organized_events(p_filter text default 'all', p_offset integer default 0)`. Devuelve la proyección existente de Mis eventos; identidad exclusivamente desde `auth.uid()`, SECURITY INVOKER, search_path vacío, EXECUTE sólo authenticated. No modifica políticas, permisos de tablas ni `get_my_events(text, integer)`, que sigue atendiendo Participo y clientes anteriores.

| Filtro | Regla aplicada antes de paginar |
| --- | --- |
| Todos (`all`) | Propios no archivados, incluidos cancelados y finalizados |
| Próximos (`upcoming`) | Publicados con fin posterior al reloj servidor; incluye eventos en curso |
| Pasados (`past`) | Finalizados sin cancelación ni archivo |
| Cancelados (`cancelled`) | Cancelados no archivados |
| Archivados (`archived`) | Sólo propios archivados |

Precedencia: archived → cancelled → ended (fin <= ahora Argentina) → open. Orden: starts_at descendente, id; páginas de 30 con lookahead de 31. El filtro se conserva en URL y regreso del detalle. Vacíos específicos no afirman que el usuario nunca creó eventos cuando sólo tiene históricos. El menú del organizador contiene únicamente **Ver detalle**; edición/cancelación/asistentes pertenecen a bloques posteriores. Actualizar, foco, visibilidad y retorno desde detalle reconsultan; una página adicional fallida conserva lo cargado y reintenta el mismo offset.

## Casos y evidencia

| CA | Caso ejecutado | Evidencia y límite |
| --- | --- | --- |
| R3-04.CA-01 | A lista propios; cinco filtros, histórico, evento en curso y coincidencias posteriores a 35 filas; paginación completa | [PostgreSQL](postgres-results.json), [Edge con fixtures](ui-results.json); no HTTP/JWT real |
| R3-04.CA-02 | Tarjeta y menú abren detalle; regreso conserva filtro/sección; histórico propio accesible; menú con foco/Escape/clic exterior | [Menú móvil](menu-375x812.png), [detalle](detail-filtered-375x812.png), ui-results; acciones de gestión de bloques 2/4/5 aún pendientes |
| R3-04.CA-03 | RPC A/B/tercero separa autorías, no acepta organizer_id; anon y JWT ausente rechazados; REST equivalente en SQL conserva RLS histórica; no UPDATE/DELETE cliente | postgres-results; fixture de cambio de cuenta en ui-results no prueba autorización real del servidor |
| R3-04.CA-04 | Cambios de título/cancelación/archivo aparecen al reconsultar; retorno/foco/visibilidad y Actualizar; error de página adicional sin pérdida | SQL modifica datos sólo en instancia local aislada; Edge modifica fixtures y reconsulta, no invoca futuras RPC de mutación |

Resultados: seis grupos SQL PASS y diecinueve grupos UI PASS por viewport, 375×812 y 1280×900. Las regresiones cubren creación, inscripción/retiro/reinscripción, historial removed, Participo (carga adicional, errores, fotos y navegación), cambio de cuenta, respuestas tardías, RPC ausente y sesión inválida. Se comprueban destinos Inicio/Mapa y rechazo de state con URLs externas.

### Reproducción

```powershell
npm run build
npm run lint
npm run check:my-events
npm run dev -- --host 127.0.0.1 --port 4187 --strictPort
# En otra terminal:
$env:PLANIT_UI_ORIGIN='http://127.0.0.1:4187'
npm run check:my-events:ui
```

SQL: PostgreSQL 17.5 embebido mediante herramientas locales existentes `.participation-test-tools.local`, replay completo de migraciones, scaffolding SQL Auth/Storage e identidades simuladas; sin conexión remota. UI: Edge real y Playwright local existente, Supabase Auth/REST/Storage interceptados, zona del navegador Asia/Tokyo. No incorpora dependencias. La ejecución del servidor/navegador necesitó acceso fuera del aislamiento de sockets. Las primeras ejecuciones fallaron por acceso local y por una fixture de creación que heredaba marcas de archivo; se corrigió la fixture y la ejecución final pasó.

Build y lint PASS. Build conserva el aviso de tamaño del chunk Mapbox. `git diff --check` PASS. El cambio previo de `vite.config.ts` es únicamente allowedHosts de desarrollo: preservado, excluido de la entrega y sin efecto en el bundle de producción.

## Comparación visual

Se abrieron [01-mis-eventos original](../../mockups/r3/01-mis-eventos.png) y [collage original](../../mockups/release-3.png), y se inspeccionaron capturas de Organizo móvil/escritorio, menú móvil y Archivados escritorio. Se conserva fondo marino, gradiente azul/violeta, pestañas segmentadas, chips, cards con miniatura/metadatos/estado y menú lateral.

- [Organizo móvil](organizing-375x812.png) / [escritorio](organizing-1280x900.png).
- [Archivados móvil](filter-Archivados-375x812.png) / [escritorio](filter-Archivados-1280x900.png).
- [Participo móvil](participating-375x812.png) / [escritorio](participating-1280x900.png).
- Capturas adicionales: filtros Pasados/Cancelados, vacío de Participo, error, permisos, historial, menú y detalle en ambos tamaños.

Excepciones: shell vigente con Mapa y cabecera de cuenta; chips se distribuyen en filas para targets de 44 px; se mantienen categoría y fechas completas existentes; se añaden aclaración histórica y Actualizar. Fotos de estas capturas son fixtures geométricas o placeholders, no fotografías extraídas del mockup ni datos remotos reales. No se replica marco de teléfono, decoración, Borradores ni acciones futuras. No hay overflow horizontal en ninguno de los tamaños probados. Safe-area y teclado físico móvil requieren revisión manual.

## Migración y pendientes

`20261011232326_my_organized_events_read.sql`: creada con CLI, probada mediante replay local; **no aplicada remotamente**. Los clientes anteriores conservan su RPC; el frontend de este bloque requiere aplicar la nueva migración antes de desplegarse, con autorización. Si falta, Organizo muestra error reintentable, sin fallback a filtrado parcial; Participo conserva su consulta.

Consultas administrativas remotas de sólo lectura confirmaron definición/grants de get_my_events y políticas existentes de events/participaciones/media en planit-v2. No acreditan HTTP con JWT real. Pendientes: autorización para aplicación remota, verificación HTTP/Auth/REST/Storage con cuentas A/B reales, acciones de bloques posteriores, QA integral y aceptación humana. No se ejecutó SQL/configuración remota, merge, despliegue ni operaciones sobre el proyecto antiguo.
