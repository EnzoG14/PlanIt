# Evidencia nueva — correcciones P1

Base runtime `89f32d5`, fixtures interceptados; auditoría histórica independiente en [PR #36](https://github.com/EnzoG14/PlanIt/pull/36).

- [Desarrollo](development/results.json): 52 PASS; módulos fuente abortados.
- [Producción](production/results.json): 52 PASS; chunks assets abortados, service worker desactivado.
- [Build y checks](build-checks.json).
- [Regresiones complementarias](regressions/supplemental-results.json): 7 PASS y 2 FAIL conocidos.
- [Regresiones UI R3](regressions/r3-ui/results.json): selección UI, sin replay SQL; consultar el resultado de cada suite.
- Logs de comando y exit codes separados; los archivos `initial` conservan el fallo inicial del selector del test.

Las capturas completas del check P1 están en development/ y production/. Los runners adicionales generan muchas capturas repetidas: el manifiesto de regresión registra sus hashes y se conservan muestras por suite. El informe de alcance y límites está en [UI_REFRESH_P1_FIXES.md](../../../../../implementation/UI_REFRESH_P1_FIXES.md).

Reproducción: instalar las dependencias existentes con npm ci, iniciar Vite en 4200 con las variables públicas de fixture y ejecutar `npm run check:ui:p1`. Para producción, ejecutar build con dichas variables, servir preview en 4201 y ejecutar `npm run check:ui:p1 -- --production`. `PLANIT_PLAYWRIGHT_PATH` admite un runtime Playwright externo; `PLANIT_UI_ORIGIN` y `PLANIT_UI_OUTPUT` cambian servidor y destino. El runner usa el canal msedge y no añade dependencias al proyecto.
Los logs de esta corrección normalizan saltos de línea y espacios finales; se conservan contenido, errores y exit codes. El campo genérico de entorno emitido por el runner R3 menciona PostgreSQL, pero esta ejecución seleccionó sólo sus once suites UI: no ejecutó SQL.
