# PlanIt — Consolidación de auditorías UI Refresh R1–R3

Fecha: 12/10/2026. Foundation documental; no se ejecutan nuevas auditorías ni se modifica UI. La severidad y mediciones siguientes proceden de los reportes existentes, no de una nueva evaluación.

## Fuentes y estado inicial

- [Critique](2026-10-12-impeccable-critique.md): 27/40, dos P1 y tres prioridades P2 de composición. Código y capturas de fixtures; sin revisión en vivo de las cinco pantallas autenticadas.
- [Audit técnico](2026-10-12-interface.md): 13/20, ocho problemas (0 P0, 3 P1, 5 P2, 0 P3). Sesión/datos simulados y capturas Chromium; no escrituras remotas. [Mediciones](2026-10-12-interface/measurements.json), [confirmación](2026-10-12-interface/confirmation.json) y [detector](2026-10-12-interface/detector.json).
- [Shape aprobado](../proposals/r1-r3-visual-evolution.md), consolidado en [DESIGN.md](../../../DESIGN.md) y [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md): objetivo visual aprobado, aún sin implementación.
- [QA R3 bloque 7](../verification/r3-block-7/README.md) y [contraste posterior](../verification/r3-block-7/contrast-results.json), incorporados en origin/main antes de esta Foundation: evidencia posterior al audit que debe distinguirse de la fotografía inicial.

La base inicial tiene identidad cromática marina/azul/violeta y componentes compartidos, pero composición repetitiva: cajas redondeadas, chips, gradientes, brillos y placeholders compiten con la tarea. Descubrimiento ya usa tarjetas fotográficas; gestión, filas compactas. La apariencia objetivo no se presume aplicada por existir documentos aprobados.

## Hallazgos de composición (critique)

| ID | Severidad original | Pantalla | Hallazgo registrado | Dirección de corrección |
| --- | --- | --- | --- | --- |
| C1 | P1 | Detalle | Hero sin foto de 220 px móvil / 300 px escritorio; datos y bloques separan disponibilidad de Unirme | Alternativa sin foto compacta; aproximar fecha, lugar, disponibilidad y acción sin omitir datos |
| C2 | P1 | Mapa | Dos columnas móviles dejan tarjetas de ~163 px a 375 px; preview y lista repiten evento | Una columna legible y vista previa con función distinta |
| C3 | P2 | Mis eventos | Primera fila cerca de 480 px; encabezado, pestañas, cinco filtros, explicación y Actualizar preceden lista | Priorizar filas y contextualizar ayuda, conservando filtros/acciones |
| C4 | P2 | Inicio | Placeholder de ~190 px y categoría duplicada; poco contenido expone vacío de grid | Dar peso al evento y al estado sin foto sin inventar contenido |
| C5 | P2 | Navegación / Chat | Perfil repetido arriba/abajo; nombre, username y fecha completa repetidos por mensaje | Reducir competencia/metadatos, preservando destinos, autoría y datos |

Son conclusiones de diseño del critique, no fallos funcionales reproducidos. La paleta inicial denominada nocturna no restringe el catálogo: el shape aprobado incluye actividades diurnas y otras categorías.

## Hallazgos técnicos (audit)

| ID | Severidad original | Pantallas afectadas | Hallazgo registrado | Seguimiento al preparar Foundation |
| --- | --- | --- | --- | --- |
| A1 | P1 | Rutas diferidas, reproducido en Inicio | Descarga abortada deja root vacío; Suspense no recupera rechazo de import | Llevar recuperación efectiva de rutas al trabajo compartido; no consta cierre en las fuentes consultadas |
| A2 | P1 | Cancelar / Remover asistente | Blanco sobre extremo rojo brillante: 3,74:1 | QA bloque 7 ya oscureció el extremo a #dc1743; mediciones existentes 4,94:1 y 5,58:1. No tratar el rojo anterior como actual; objetivo sólido del shape sigue pendiente |
| A3 | P1 | Campos compartidos / formularios | Borde 1,59:1 contra campo y ~1,88:1 contra fondo | control-border está aprobado documentalmente; aplicación y verificación en UI pendientes |
| A4 | P2 | Crear / Editar evento | Fecha parcialmente recortada a 320 px, columna útil ~134 px | Apilar fecha/hora si no cabe el control nativo; validar Safari móvil |
| A5 | P2 | Chat | A 320×240 se recorta textarea y contador, sin scroll de recuperación | Adaptar altura y conservar composer/feedback alcanzables; emulación no prueba teclado real |
| A6 | P2 | Chat | Historial sin mecanismo explícito para anunciar novedades | Anunciar sólo incorporaciones nuevas; verificar con lector de pantalla |
| A7 | P2 | Inicio / EventCard | Enlace de título de 22 px de altura | Ampliar target sin solapar acciones. 44×44 es objetivo ergonómico, no una declaración automática de infracción AA |
| A8 | P2 | Mapa / entrada por mapa / PWA | Módulo de 518,60 kB gzip y precache de 2.538,39 KiB en aquel build | Perfilar en móvil/red limitada antes de decidir optimizaciones; no hay latencia ni Core Web Vitals medidos |

Los contadores pertenecen a cada evaluación histórica; no sumarlos como una auditoría nueva ni asignar nuevas severidades al shape. Salvo A2, los cierres requieren comprobación futura; esta consolidación no vuelve a ejecutar los casos. A2 conserva su prioridad histórica aunque exista evidencia posterior de corrección parcial respecto del sistema objetivo.

## Dirección visual aprobada

Fotografía expresiva sobre interfaz marina y sobria. Azul sólido para acción/selección, violeta puntual, fondos uniformes y superficies planas. Espacio/divisores antes que tarjetas anidadas; elevación para capas reales. Familia de sistema, campos legibles y una unidad por evento. Fotografía natural protagonista en descubrimiento/detalle; gestión y formularios priorizan tarea. Conservar rutas, branding, navegación y alcance implementado R1–R3, incluidas reincorporaciones.

El shape describe Login/Registro, Crear/Editar, Galería, Asistentes, Perfil y Notificaciones además de las cinco superficies del critique. Esas direcciones no equivalen a nuevos hallazgos auditados con severidad propia. Tokens exactos permanecen en DESIGN.md; este reporte no define una paleta paralela.

## Patrones a conservar y corregir

Conservar la identidad marina, iconografía, tarjetas de descubrimiento y filas de gestión, labels, aria-invalid/errores asociados, foco visible, skip link, navegación semántica, imágenes lazy y alternativas de foto. Preservar diálogos nativos con foco/restauración, validación con foco en error, reintentos reales, protección contra doble envío y texto de chat conservado ante fallo. Son aspectos positivos registrados en las auditorías, no una certificación universal.

Retirar según el shape los gradientes decorativos, fondos radiales, halos y superficies anidadas. Corregir placeholders dominantes, duplicación informativa, controles poco distinguibles, recortes internos y separación entre información y acción. No corregirlos eliminando datos obligatorios, filtros vigentes, confirmaciones o permisos.

## Implementación gradual

Seguir el [plan independiente](../../implementation/UI_REFRESH_R1_R3_PLAN.md): Foundation → piloto Mis eventos → autenticación → formularios → Inicio/Mapa/Detalle → Galería/Asistentes → Chat/Perfil/Notificaciones → Acciones/Reincorporaciones → auditoría integral. El piloto verifica patrones compartidos antes de propagarlos. Vincular A1/A3 a trabajo compartido temprano; no esperar a la última auditoría para atender P1. Separar alcance visual de cualquier optimización técnica que requiera mediciones adicionales. No implementar en esta Foundation.

## Riesgos, límites y validación

- Las capturas históricas usan fixtures; ausencia de calles en mapa simulado o “Conectando…” no demuestra fallo de producción. Los links absolutos del critique original se conservan como registro local; esta consolidación usa fuentes relativas portables.
- El audit descarta el primer escalado recursivo y los intentos Login/Registro con sesión. La confirmación de texto al 200% sólo cubre Perfil escritorio. No acredita zoom al 400%, lector de pantalla, gestos, teclado iOS/Android ni dispositivo físico.
- Detector: 0 hallazgos en los cinco TSX del critique; audit de src: 0 principales y 75 avisos orientativos. No equivalen a ausencia de defectos ni a 75 problemas confirmados.
- Preservar seguridad/Auth/RLS, privacidad, fechas Argentina, cupos, validaciones, estados y contratos. Ningún motivo estético autoriza SQL, cambios de RPC o nuevas funciones R4–R7.
- Validación futura: capturas reales antes/después a 320/375/390/768/1280 px, fotos claras/oscuras/ausentes, títulos largos, galerías 0/1/10 y listas cortas/largas. Revisar overflow y recorte interno, poca altura, texto ampliado, safe areas y navegación.
- Comprobar contraste en estados/superficies, foco y teclado, anuncios nuevos sin releer historial, recuperación de errores y datos locales preservados. Probar gestos/teclado móvil en dispositivos y lector de pantalla antes de declarar esos casos cubiertos.
- No hay fuentes faltantes para la consolidación: critique, audit y shape están disponibles. Sí faltan implementación y evidencia del nuevo sistema; el perfilado móvil del mapa y las pruebas reales indicadas siguen pendientes.

Las recomendaciones antiguas de regenerar documentos en el audit no se ejecutan: esta Foundation preserva el sistema consolidado y los resultados previos tal como fueron recibidos.
