# Release 6 · B3 — Demografía agregada

**Estado: Implementado; QA pendiente.** 15/10/2026, Codex. Base integrada `e6a25a1f81a6c25ab4694fc4c16cf695e8ab6dfa` (merge PR #65); rama `codex/r6-block-3`. B1/B2 comprobados tras fetch. R5 conserva GO humano; no se convierten sus NOT RUN en PASS. PR y SHA funcional final en el seguimiento. B4 requiere aprobación independiente.

[Decisión humana y contrato](../../implementation/RELEASE_6_BLOCK_3_DECISIONS.md): exactitud actual con **riesgo residual de inferencia aceptado**, D08 ratificada y supresión completa por dimensión si alguna celda es 1..4, incluidos faltantes. No certifica anonimato ni cumplimiento legal.

## Inventario y seguridad

- Nueva migración `20261015160324_r6_demographic_aggregates.sql`, RPC owner-only `get_my_event_demographics(uuid) → jsonb`. DEFINER justificado por RLS privada; STABLE, search_path vacío, EXECUTE authenticated exclusivamente, auth.uid/owner antes de consultar. Sin nuevas tablas, políticas, triggers, índices ni grants de lectura. Sin modificar SQL histórico.
- Adaptador RPC/validador allowlist y `DemographicsPanel`: tablas con cantidades/porcentajes y barras decorativas, etiquetas para datos faltantes, cero real, supresión y error. Reutiliza ruta/KPI/B2, tokens Amanecer, cuatro destinos y actualización manual. No librerías nuevas.
- Remount por usuario/token/evento y borrado al refrescar, ocultar pestaña, perder conexión o cerrar sesión. Errores RPC sin detalles del servidor. No cache privada nueva, Realtime ni exportación en B3.
- `.env.local` copiado desde `mapbox-worktree` (main local), ignorado/no versionado; checkout original y modificaciones ajenas conservados. Mockup original inspeccionado, sin modificar DESIGN ni imágenes originales. Su gráfico de público guía el alcance; apariencia Amanecer y tabla accesible prevalecen sobre el donut histórico.

## Evidencia ejecutada

| Capa | Resultado | Evidencia y límites |
| --- | --- | --- |
| Build | PASS | `npm run build`; [salida](build.txt), advertencia heredada de tamaño de chunks |
| Lint | PASS con advertencias heredadas | `npm run lint`; [salida](lint.txt), sin errores |
| DTO | PASS | `npm run check:r6:demographics:contract`; [3 válidos/13 rechazados](contract.json) |
| SQL local | PASS | `npm run check:r6:demographics`; [replay/roles/resultados](sql/sql-results.json), [runner](sql/harness.json) |
| Rendimiento local | PASS informativo | [1.000 participantes, 20 consultas, EXPLAIN y p95](sql/demographics-benchmark.json); aprox. 2,1 ms, no SLA remoto |
| UI navegador | PASS fixtures | `npm run check:r6:demographics:ui`; [resultados](ui/results.json), app compilada real en Edge headless, Auth/RPC sintéticos |
| HTTP con JWT real / REST remoto | NOT RUN | No usuarios reales ni aplicación remota autorizada; SET ROLE SQL no sustituye JWT |
| Realtime / dispositivos / lector de pantalla real | NOT RUN | B3 no añade canales. Emulación no acredita dispositivos ni lector |
| Aceptación integral | NOT RUN | CA01/03/04 cubiertos parcialmente por SQL/UI, CA02 reservado B4; 0/24 aceptados |

El replay usa PostgreSQL18.4 efímero y 32 migraciones, scaffolds SQL Auth/Storage, roles A owner/B participante/C link-only o social/D ajeno/anon/sin UID. Incluye regresión social R5 (72 combinaciones, 13 carreras reales y R3/R4), acceso directo SQL, perfiles privados y ACL. Casos B3: 0/1/4/5/10/1000, female/male/other/NULL, 9+1 complementario, faltantes, partidas/reingresos, cumpleaños hoy/mañana, bandas límite, 29/02, oculto/archivado, consultas repetidas y **contraejemplo temporal/multievento aceptado**. El EXPLAIN interno de diagnóstico usa sólo fixtures sintéticos; no se expone por RPC.

UI: 320/360/375/390/768/1280, teclado/foco del botón Actualizar, texto al200% con tablas visibles, altura480, reduced-motion, fecha Argentina con navegador en Tokio, loading/empty/suppressed/unknown/error/retry, URL ajena/anon, offline, timeout10s/respuesta tardía, logout y cambios de ruta. Capturas disponibles: [320px](ui/demographics-available-320.png), [1280px](ui/demographics-available-1280.png), [supresión](ui/demographics-suppressed-390.png), [sin informar](ui/demographics-unknown-390.png), [error](ui/demographics-error-390.png). Baseline visual previo: capturas B2 versionadas en `../r6-block-2/ui/`; no se hizo una nueva captura del build anterior en este chat. Revisión visual móvil/escritorio: tablas legibles, composición sin tarjetas anidadas, colores/labels explícitos; contraste heredado de tokens aprobados, sin auditoría instrumental nueva. Zoom de texto emulado, no zoom nativo/dispositivo.

## Reproducción y migraciones

```powershell
npm ci --ignore-scripts
npm run build
npm run lint
npm run check:r6:demographics:contract
$env:PLANIT_TEST_TOOLS_DIR='<directorio de herramientas PostgreSQL>/node_modules'
npm run check:r6:demographics
# Playwright externo del harness existente; PLANIT_PLAYWRIGHT_PATH permite indicar su index.mjs.
npm run check:r6:demographics:ui
```

No se añadieron dependencias a la aplicación. Fallos de preparación corregidos: primer npm ci sin acceso a red (reintento autorizado exitoso); CLI con telemetría sin permiso (generación local autorizada); primer intento SQL sin permiso de conexión local (reintento autorizado); primer fixture SQL sin UID para historial (actor corregido); selector de texto vacío ambiguo en UI (selector exacto). No se atribuye PASS a esos intentos.

Migración B3: **creada1 / probada local1 / aplicada remota0 / verificada remota0**. No hubo `db push`, DDL remoto, deploy, merge ni actualización de Google Doc. La UI mostrará demografía no disponible en remoto hasta aplicar la migración con autorización y verificarla. Las garantías antiguas absolutas de anti-inferencia quedan sustituidas por la adenda aprobada; el requisito literal permanece sin adulterar.
