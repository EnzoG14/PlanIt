# Bloque 8 — Auditoría Amanecer en 89f32d5

**SHA:** `89f32d5c83a0f91477863fb3b1b4dcf904f55f9b`. **Fecha:** 13/10/2026, Argentina. Rama `test/amanecer-block-8-audit`.

**NO-GO para cierre técnico integral de UI en este SHA.** Dos P1 / cinco P2 y tres runners adicionales FAIL se mantienen. Los seis checks obligatorios y R3 28/28 PASS son evidencia local **reutilizada**, no reejecutada. No se validan los RF/CA de R1–R3 ni se infiere aceptación visual humana.

[Evidencia por SHA](../../design/verification/ui-refresh/block-8-audit/89f32d5/README.md) · [matriz](../../design/verification/ui-refresh/block-8-audit/89f32d5/route-matrix.md) · [resultado](../../design/verification/ui-refresh/block-8-audit/89f32d5/results.json) · [prueba de reutilización](../../design/verification/ui-refresh/block-8-audit/89f32d5/reuse.json).

## Cambio de main y preservación

La ejecución original se creó desde origin/main a378259, con fetch y checkout/CodeGraph propios. Main avanzó a 89f32d5 por PR 35:22 archivos de documentación R4/README/changelogs, sin runtime nuevo. Se conservó la carpeta/informe anterior como registro histórico en un commit y luego se actualizó únicamente la rama documental sobre origin/main. Ninguna UI ajena se usó como main ni se fusionó a main.

Se compararon **189 archivos protegidos**, blob a blob, entre a378259 y89f32d5: todos idénticos. Incluyen src/assets/scripts/public/Supabase/lockfiles/configs/normas/AGENTS/QA R1–R3. Se revisaron nuevos README, estado e integración visual R4: sólo plan documental; no hay nuevas rutas ni funciones implementadas que incorporar al inventario R1–R3. Por eso se reutilizan mediciones y capturas válidas, incluidos sus fallos/limitaciones, sin duplicar imágenes ni sobrescribir la ejecución anterior.

## Resultado vigente

Los bloques 0/0.5/1–7 siguen integrados (PR 26–34). PR 35 es documental R4, no un bloque visual nuevo. No había PR abierta de UI al corte de preparación. El STATUS visual histórico se conserva sin editar; no acredita el alcance por sí solo.

| Prioridad | Hallazgo | Evidencia original vigente |
| --- | --- | --- |
| P1 B8-01 | Abort de import de Inicio/Mapa/Detalle deja root vacío sin recuperación | targeted/results.json y tres PNG en a378259 |
| P1 B8-02 | Aviso de éxito en Detalle, #83f3c9 sobre #f6f5fd:1,241:1 | integración seis tamaños/contrastes/PNG |
| P2 B8-06 | Header al 200% desplaza Cuenta; reproducido social/solicitudes y overflow en Detalle | medidas/capturas/runner FAIL |
| P2 B8-03/B8-04 | Copy de Actualizar perfil y Cancelar/Cancelar evento | evaluadores/código/capturas |
| P2 B8-05 | Scrollbar clásica IAB320, no reproducido en Edge headless | medición B, límite sin PNG nativo |
| P2 B8-07 | Crear/Editar conservan dock y CTA en flujo respecto del objetivo normativo | AppLayout/forms/screenshot; función local conservada |

## Verificación reutilizada

[Informe detallado original](BLOCK_8_a378259.md) registra comandos, severidad, pasos, screenshots, métodos y límites. `results.json` conserva los tiempos originales, sin reemplazarlos por fechas de una ejecución inventada.

- PASS: build/lint/check:amanecer/check:foundation/check:auth/check:r3 (28/28), creación PGlite, Auth UI, eventos UI, Chat layout, perfil UI, header/scope y social UI.
- FAIL original: check:notifications:ui (también FAIL en repetición), runner piloto (expectativa Cuenta=0 obsoleta frente al header compartido), runner descubrimiento (overflow al 200%).
- Probes separados: avisos con espera de fin de recarga PASS, observación descubrimiento 126 registros/4overflow, galería/asistentes audit con geometría PASS, forms/rejoin 42 y social 24 medidas, 18 normales estabilizados. No convierten las suites originales en PASS.
- Detector original:70 advisories, con revisión de cascada/falsos positivos; no aceptación por detector. Dos evaluaciones independientes y síntesis provisional 26/40,13/20.

No se repiten tests porque el cambio de main no toca sus entradas ni las superficies. Verificaciones nuevas de esta derivación: árbol Git, revisión documental R4, existencia de enlaces y conservación exacta de archivos de la ejecución previa.

## Alcance del cierre

Auditoría de main con aceptación y cobertura remota/física parciales. Las14 rutas existen, activan Amanecer; forms tienen composición parcial. Pantallas sin fallo demostrado sólo se verifican técnicamente en muestra local; ninguna se acepta visualmente por revisión humana. R1 conserva aceptación funcional histórica, R2/R3 sus pendientes.

Build anterior: EventMap 1.865,04kB/518,53kB gzip y precache 2644,80KiB; no FPS/GPU/red lenta ni Core Web Vitals. Fuente/fallback/preferencias/contrastes y teclado se verificaron por suites específicas; emulación no acredita zoom nativo, NVDA/VoiceOver, PWA/teclado/safe areas/gestos/fotos reales. Sin E2E HTTP/Auth/JWT, Storage o Realtime remoto, mutaciones ni migraciones remotas.

Conservar NO-GO hasta tratar P1, fallos/fragilidad de runners y evidencias críticas. Recomendaciones quedan en documentos, sin cambios de UI/CSS/tokens/backend/tests/package ni UI_REFRESH_R1_R3_STATUS.md. La PR contiene ambas ejecuciones, titulo `test: audit Amanecer UI refresh at 89f32d5`, draft hacia main. Detenerse al entregarla; no fusionar.
