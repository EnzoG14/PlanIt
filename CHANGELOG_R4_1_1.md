# Cambios de R4 v1.0 → v1.1 — 12/10/2026

**Origen:** decisiones expresas del responsable en esta conversación. **No implica implementación ni pruebas en producción.**

| Acuerdo | Cambio de producto | Documentos impactados |
| --- | --- | --- |
| A01 | Fallback visible a centro de mapa cuando GPS no está disponible | plan, prompts 0/2/4/9, test plan, matriz CA |
| A02 | Fecha por `starts_at`, no solapamiento | plan, prompts 0/2/9, pruebas |
| A03 | Inicio+Mapa; no pantalla Buscar adicional | plan, prompts 0/1/2/4/9, pruebas |
| A04 | `public→unlisted`: grants atómicos para confirmados, sin revivir revocados; conflicto exige resolución expresa | plan, prompts 0/5/6/8/9, pruebas |
| A05 | `unlisted→public` visible a todos; revocaciones persistentes para futuro oculto | plan, prompts 5/6/7/8/9, pruebas |
| A06 | Hash de token únicamente; no recuperar secreto, regenerar | plan, prompts 6/7/9, pruebas |
| A07 | R3 confirmada integrada/validada; auditar contratos técnicos pero no reabrir QA | plan, prompts 0/5/9, status y reporte |

**No se alteraron** los requisitos oficiales en `docs/requirements/RELEASE_4_REQUIREMENTS.md` ni los textos de los 39 criterios de aceptación. **Permanecen a revisar** las decisiones técnicas D02/D05/D06/D07/D10-formato/D12/D13/D14. El valor inicial de «39/39 NO EJECUTADOS» se conserva.
