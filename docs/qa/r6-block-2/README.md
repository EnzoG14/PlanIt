# R6 · Bloque 2 — Panel de ocupación

Estado: **Implementado; QA pendiente**. Fecha: 15/10/2026 (Argentina). Rama `codex/r6-block-2`, base integrada `7933aa9` (merge PR #64), después de `git fetch origin`. R5 conserva GO humano. Esta entrega no autoriza B3.

## Alcance y decisiones

RF-R6-01.CA-01..04, sólo UI. Se leyeron prompt, plan/estado, decisiones B0, requisitos/QA R6, plan/estado/reporte R5, arquitectura/modelo y guías de frontend/diseño. A01–A07 conservadas; D11 se implementa con consulta al entrar y actualización manual. Volver desde otras pantallas monta una consulta nueva. No polling ni dashboard Realtime. D04 no interviene en este bloque.

Dirección de la superficie (Operate): conservar B · Amanecer, Bricolage autoalojada, fondo lavanda, tinta para controles y azul para ocupación. Retorno y título preceden cuatro datos en grilla 2×2 móvil / cuatro columnas escritorio; una sola superficie blanca para la barra. El mockup original `release-6.png` fue inspeccionado: se conserva su información de ocupación; no se incorporan entradas, calificaciones, demografía, series ni CSV. DESIGN.md y mockups intactos. Es una ruta nueva; no existía una pantalla previa que capturar en la base.

## Cambios y seguridad

- Ruta lazy `/events/:id/analytics` bajo RequireAuth, con scope Amanecer de gestión. Mantiene los cuatro destinos existentes del dock.
- Entrada Estadísticas únicamente desde gestión del organizador. El servidor sigue siendo la autoridad: se consume exclusivamente `get_my_event_occupancy(p_event_id uuid) → jsonb` de B1, con ownership por auth.uid(), DEFINER/STABLE, search_path vacío y EXECUTE authenticated.
- Cuatro KPI con unidad, `<progress>` con nombre accesible y valores textuales equivalentes mediante `<dl>` y resumen, estado y hora Argentina. No se presenta check-in ni presencia física.
- Request-key usuario/token/evento por remount; AbortSignal, timeout 10s, descarte de respuestas tardías, validación de event_id de respuesta. Título del documento neutro. Sin persistencia/cache de métricas.
- Al refrescar, fallar, ocultar la pestaña, desconectarse o cambiar contexto se eliminan métricas anteriores. Reconexión/retorno de pestaña requieren acción explícita. Errores de RPC se traducen, nunca se imprimen mensajes privados del servidor.
- Cupo cero/DTO incoherente: el parser estricto B1 lo rechaza y se muestra N/D con error recuperable, sin NaN/Infinity ni porcentajes inventados. Se conserva el contrato de B1.
- Sin SQL nuevo, tablas, triggers, índices, grants ni cambios en RLS. Migraciones B2: **creadas0 / probadas-local0 / aplicadas-remoto0 / verificadas-remoto0**. B1 ya registra 1/1/1/1; no se reaplicó.
- `.env.local` copiado del checkout main `mapbox-worktree`, ignorado por Git. Cambios ajenos del checkout inicial preservados.

Amenazas cubiertas en cliente: IDOR por URL, respuestas fuera de contexto, logout, título previo, error bruto del servidor, red interrumpida, cupo inválido. El rechazo de participantes/link-only/seguidores se representa mediante fixture de RPC denegada; eso **no certifica RLS/JWT remoto**. La autorización SQL y ACL son la dependencia B1, sin modificaciones en B2.

## Reproducción

```powershell
npm ci --ignore-scripts
npm run build
npm run lint
node scripts/check-r6-occupancy-contract.mjs
npm run check:r6:occupancy:ui
$env:PLANIT_TEST_TOOLS_DIR='<herramientas locales>/node_modules'
$env:PLANIT_SQL_OUTPUT='docs/qa/r6-block-2/sql-regressions'
npm run check:r5:regressions
```

El runner UI acepta PLANIT_PLAYWRIGHT_PATH; por defecto usa el runtime local del entorno de esta entrega. Requiere Edge instalado. Sirve `dist` real en localhost, intercepta Auth/RPC con fixtures sintéticos y no escribe datos remotos. PostgreSQL usa las herramientas ya instaladas y scaffold local Auth/Storage; algunos runners históricos requieren además `.participation-test-tools.local/node_modules` (enlace local ignorado).

## Evidencia y CA

| Capa | Resultado / límite |
| --- | --- |
| Build | PASS; [salida](build.txt), aviso heredado de chunk Mapbox >500kB |
| Lint | PASS; [salida](lint.txt), avisos anteriores en DiscoveryFilters/probes históricos |
| Contrato TS B1 | PASS, parser/fórmula, formato es-AR, adapter y AbortSignal; no modifica B1 |
| UI Edge | PASS, 43 grupos; [Resultados ejecutables](ui/results.json), fixtures; 320/360/375/390/768/1280, foco, texto 200%, altura480 |
| Regresiones SQL | PASS, 16 suites; [Resultados y salidas](sql-regressions/regressions.json), replay local con scaffold, sin transporte JWT |
| HTTP/JWT real organizador/no organizador | NOT RUN |
| Realtime real | NOT RUN; el panel no añade suscripciones |
| PWA/dispositivo/lector de pantalla real | NOT RUN; build genera SW, no certifica instalación ni uso real |
| Aceptación integral | NOT RUN; 0/24 CA aceptados |

| CA | Cobertura UI con fixtures |
| --- | --- |
| RF-R6-01.CA-01 | Cuatro KPI, estado vigente/finalizado/cancelado/archivado, datos0 |
| RF-R6-01.CA-02 | Cupo10, confirmados4, libres6, 40%; cero cupo falla seguro |
| RF-R6-01.CA-03 | Refresh tras baja: confirmados3, libres7, 30%; consulta nueva al entrar |
| RF-R6-01.CA-04 | Ruta anónima→login; RPC denegada sin título/métricas; otra ruta limpia contexto; entrada sólo owner |

Capturas de app compilada con fixture «Encuentro de primavera»: [móvil](ui/occupancy-390.png), [escritorio](ui/occupancy-1280.png); en `ui/` también estados vacío/cancelado, error, denegado, texto200 y altura corta por ancho. Inspección visual móvil/escritorio: jerarquía, tokens, cifras tabulares, foco3px, ausencia de tarjetas anidadas y overflow de página. El dock es flotante y el contenido conserva el espacio inferior del layout existente. Emulación de texto ampliado no equivale a todas las configuraciones de zoom/tecnologías asistivas reales.

Incidentes de entorno: npm ci inicial falló por DNS del sandbox; completado con acceso autorizado. Edge requirió ejecución fuera del sandbox. Primeras regresiones sin herramientas locales: BLOCKED por módulo ausente; [salida inicial](regressions-initial.json). Reintento con herramientas detectó rutas locales faltantes en runners históricos; se corrigió el enlace ignorado y se repitieron sólo esas suites. No se cambiaron sus aserciones ni scripts para obtener PASS.

## Puerta de revisión

PR draft a main, sin merge/deploy/DDL remoto ni cambios de Google Doc. Pendiente QA autenticada real y aceptación humana. Detenerse aquí: B3 requiere aprobación independiente.
