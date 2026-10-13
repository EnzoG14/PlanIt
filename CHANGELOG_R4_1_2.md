# PlanIt R4 — Cambios de v1.1 a v1.2 · Amanecer

13/10/2026 — Base auditada: `main` `a378259a60106ddd07b111080a24677ad509bc49`.

1. Actualizado contrato visual: B · Amanecer v3.0, jerarquía `PRODUCT.md` → `DESIGN.md` → `DESIGN_SYSTEM.md` → componentes → lab `/b` → mockup R4 histórico. Sin dark-first, degradados de CTA ni diseños v2.0.
2. Incorporada `docs/implementation/RELEASE_4_VISUAL_INTEGRATION.md`: mapa por ruta, integración sobre componentes migrados, estados, accesibilidad, QA.
3. Reescrita la sección de precondiciones y añadido detalle de implementación visual en **los 10 prompts**. Bloques 0/1/2/3/4/6/7/8/9 con UI; 5 preserva backend.
4. Corregida línea de base del plan (30 commits nuevos, PR #25 y #27–#34); no se han observado migraciones SQL nuevas en el refresh.
5. Nuevas rutas propuestas deben entrar en scopes `AppLayout`; no crear `/search` ni quinta pestaña; conservar Mapbox Standard day/preview/foco, Home cursor y formularios Amanecer.
6. Matrices de pruebas y seguimiento actualizadas; no reescribir 39 CA ni inferir pruebas R4. R3: A07 confirmado por responsable pero test report versionado conserva NO-GO documental.
7. **Sin cambios en código, Supabase, migraciones ni aprobaciones funcionales A01–A07.** Decisiones técnicas D02/D05/D06/D07/D12/D13/D14 siguen como propuestas.
