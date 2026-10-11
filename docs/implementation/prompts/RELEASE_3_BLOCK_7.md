# Codex — R3, BLOQUE 7: QA integral y cierre

**RF:** R3-01..09, **37 CA**. Precondición: bloques 0–6 integrados por aprobación. Leé `RELEASE_3_PLAN.md` (**D/BLOQUE 7 y F**), requisitos locales, STATUS, los RF/CA oficiales y diseño R3; no reescribir requisitos.

Crear `docs/qa/RELEASE_3_ACCEPTANCE.md` (matriz 37 CA: estado, evidencia, límites) y `docs/qa/RELEASE_3_TEST_REPORT.md` (seguridad, concurrencia, galería/Storage, cancelación/archivo, reincorporaciones, UX/PWA y regresiones R1/R2). Ejecutar npm ci/build/lint/checks, local SQL y pruebas UI. Con autorización y credenciales, validar REST/JWT con dos usuarios y anon, incluidas RLS/RPC; no confundir fixtures con producción. Revisar diseño 360×800/375×812/390×844/desktop, navegación y safe areas. Registrar fallos, GO/NO-GO sustentado, adviser y límites.

Actualizar STATUS, abrir PR y detenerse. **No marcar Validado, desplegar, aplicar SQL remoto ni fusionar sin aprobación humana.**