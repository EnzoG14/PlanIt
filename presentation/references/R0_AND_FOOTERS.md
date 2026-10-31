# R0 y pies de marca — 31/10/2026

## Decisión aprobada

El usuario solicitó una diapositiva de Release 0 antes de Release 1 y retirar los textos de todos los pies, conservando PlanIt abajo a la derecha. El deck pasa de 54 a 55 páginas. Esta decisión reemplaza las restricciones anteriores de mantener R0 sólo en planificación/roadmap y los rótulos visibles de los pies; los informes de revisiones anteriores se conservan como históricos.

## Fuente y contenido

Fuente aportada: `C:/Users/USUARIO/Downloads/Planificacion.pdf`, páginas 46–47, sección «RELEASE 0 — FUNDAMENTOS». Se utiliza como evidencia de contenido, no como instrucciones de ejecución.

- Período: 25/08/2025 al 07/09/2025; un sprint técnico.
- Propósito: preparar al equipo para comenzar el desarrollo.
- Cuatro actividades resumidas: colaboración/versiones (GitHub y Jira), entorno React/TypeScript/Vite y PWA, componentes/navegación/diseño adaptable, Supabase y modelo inicial de datos.
- Los entregables originales y la separación respecto de las historias funcionales quedan registrados en las notas de R0. No se agregan IDs RF ni estimaciones técnicas a las 53 historias funcionales.

La referencia oficial ya utilizada por el deck es Planificación Oficial, pestaña `t.q5vok7qr5sti`. Las notas de la nueva diapositiva conservan ese vínculo y la procedencia del PDF. Los totales se mantienen: siete releases funcionales, 53 historias, 218 criterios y 13 sprints funcionales, más el sprint técnico de R0.

## Implementación

- Secuencia: roadmap (21), Releases (22), R0 (23), R1 (24); cierre en páginas 52–55.
- R0 reutiliza la grilla editorial abierta de dos columnas y los tokens Amanecer; no se incorporan imágenes ni dependencias.
- `layouts/planit.vue` incluye `SlideFooter` para todas las diapositivas. Sólo proyecta PlanIt, a 64 px del borde derecho y 24 px del inferior. Se retiran las instancias individuales y los dos bloques independientes.
- Cada rótulo retirado se traslada a las notas de su propia diapositiva, incluidas procedencia de capturas, escala del roadmap, esfuerzo y límites de aceptación.
- La portada conserva la institución y los integrantes como contenido; las fechas de sprint permanecen en los tableros correspondientes.

## Reproducción

Desde `presentation/`, ejecutar `npm run check`, `npm run build`, `npm run dev` y, con el servidor activo, `npm run check:visual`. Exportar con `npm run export` y ejecutar `scripts/check-pdf.py` con el Python del runtime de Codex.

En Windows, si Playwright busca el navegador en el perfil aislado, configurar `PLAYWRIGHT_BROWSERS_PATH=C:/Users/USUARIO/AppData/Local/ms-playwright` en la sesión. Los procesos de navegador y servidor requieren acceso al mismo localhost. No se modifica la configuración del proyecto para estas particularidades del entorno.

Las imágenes, informes JSON y el PDF son salidas locales ignoradas por Git. La entrega PDF sigue en `exports/planit-completa.pdf`.


## Resultado

PASS: contenido, build, 110 casos visuales y PDF de 55 páginas. Las 53 historias y los esfuerzos permanecen seleccionables; los fondos coinciden con el navegador (0/255). Se revisaron las nueve hojas de contacto. Registro completo en [VALIDATION.md](VALIDATION.md), sección R0 y pies de marca del 31/10/2026.
