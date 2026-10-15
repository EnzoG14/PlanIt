# PlanIt — Release 6 · Plan de pruebas técnicas y de aceptación

**Ejecución B9 — 15/10/2026:** [comandos/casos](r6-block-9/README.md), [24 CA y fuentes](r6-block-9/summary.json), [reporte](RELEASE_6_TEST_REPORT.md). Capas independientes; NO-GO. D04/D08 B3 aceptan exactitud y riesgo residual temporal/multievento: TC02-04 documenta ese límite y no exige anonimato absoluto. D05/D06 B5 sustituyen paginación por snapshot único≤5000filas/10MiB/15s; probar límites completos y ausencia de archivo parcial. Las propuestas históricas inferiores se interpretan con estas adendas.

**Versión:** 0.1 — 14/10/2026. **Estado:** plan NO ejecutado. **Contrato:** [24 CA oficiales](../requirements/RELEASE_6_REQUIREMENTS.md). **Tracking:** [matriz CA](RELEASE_6_ACCEPTANCE.md).  
**Dependencia crítica:** R5 consta **Validado / GO por aceptación humana** en el reporte y STATUS de `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` (14/10/2026). Comprobar integración de PR #60, catálogo y alcance de QA técnica al iniciar B0. Ningún caso con «PASS» en este archivo: **son escenarios propuestos**.

## 1. Metodología y evidencia

Prioridad: seguridad, consistencia, no filtración y concurrencia antes que apariencia o rapidez. Regla de decisión: una verificación con mocks no equivale a integración con Supabase. Registrar separadamente:

- **SQL-local**: esquema replay/migración, assertions de invariantes, funciones SQL con claims de identidad y locks simulados en Postgres local. Documentar Postgres, Supabase CLI y SHA, script y stdout.
- **HTTP-JWT-real**: llamadas Data API reales bajo tokens de A/B/C/D/anon, con permisos explícitos y fixtures autorizados. No registrar tokens ni datos demográficos privados en evidencia.
- **UI-real**: PWA realmente ejecutada, capturas/resolución, pruebas de accesibilidad, errores de red, navegador y navegación directa. Aclarar si respuestas Supabase se simulan.
- **Realtime-real**: sesiones distintas, canal autorizado, notificación del organizador tras inscripción real, remoción/cambio de sesión y re-sincronización.
- **Integración/humana**: criterio completo aceptado explícitamente; `NOT RUN`/`BLOCKED` hasta entonces.

Cada prueba genera: identificador `R6-TC-<RF>-<NN>`, precondiciones, actor, fixture, versión/commit, procedimiento, resultado esperado, resultado real, status, log/captura sin credenciales, CA asociada, issue si falla. Nunca utilizar datos reales identificables en screenshots o archivos del repositorio.

## 2. Fixtures sintéticos

| Actor | Rol de prueba | Datos/autorización |
| --- | --- | --- |
| A | Organiza eventos E1, E2 y E4 (E4 oculto) | Acceso owner a sus datos; perfil con demografía opcional |
| B | Confirmado en E1, seguidor de A | Puede participar; **sin** autorización al panel analítico de A |
| C | Cancelado/removido en E1; tiene enlace de E4 | Link-only **no** autoriza estadísticas |
| D | Organiza E3; no es dueño de E1/E2/E4 | Intentará mezclar E3 con E1 en comparación y CSV |
| anon | Sin sesión | No recibe filas/funciones privilegiadas |

Eventos base: E1 cupo=10, 4 confirmed, 2 cancelled, 1 removed → 6 disponibles, 40%; E2 cupo=20, 15 confirmed → 5 disponibles, 75%; E3 de D capacidad=3; E4 de A oculto y archivado, filas históricas preservadas; E5 de A cupo 1 y cero confirmados para carreras. Se registran eventos cancelados, cerrados y archivados según restricciones reales de las RPC. Uso de nulos/0 de capacidad: fixture legado adversarial preparado a nivel función de lectura, no romper constraint real `capacity > 0` en tabla sólo para probar UI.

Demografía sintética: cohortes 0, 1, 4, 5, 10, 20; `birth_date=NULL`, `sex=NULL`, `female`, `male`, `other`; cumpleaños de hoy, 29/02, cumpleaños futuro inválido y edad extrema; combinaciones de 1 persona visible y 4 sin informar para verificar supresión complementaria. Crear datos exclusivamente local o en entorno remoto de pruebas con autorización previa.

Historia: P1 primera confirmación día 1, baja día 2, reconfirmación día 4, removed día 6, approved rejoin día 8; P2 registro día 3; cortes por medianoche, mes, lunes y año; controlar time zone `America/Argentina/Buenos_Aires` de todas las columnas propias.

## 3. Casos por RF

### RF-R6-01 — Ocupación y lugares

1. **R6-TC-01-01**: A abre E1. Comprobar capacity=10, confirmed=4, available=6, pct=40; comparación con `event_participations` confirmed, no con total histórico.
2. **R6-TC-01-02**: E5 sin confirmed → 0%; capacidad 1 y 1 confirmado → 100%; 10 cancelados/removed → no alteran count.
3. **R6-TC-01-03**: B sale, D no autorizado, remove organizer y rejoin aprobado → refresh cambia contador exactamente; no asumir sincronización en vivo salvo D11.
4. **R6-TC-01-04**: B/C/D/anon acceso directo a `/events/E1/analytics`, RPC, SELECT protegido. No filtrar título de E1 ni existencia por excepción.
5. **R6-TC-01-05**: E4 oculto/archivado consultable por A, con rótulo «inscripciones confirmadas actualmente»; no acceso link-only.

### RF-R6-02 — Demográficos y ventana inicial

1. **R6-TC-02-01**: Dado `k` acordado, grupos mayores umbral suman total de cohorte con unknown explícito; eventos pequeños se suprimen sin cifras que identifiquen a individuo.
2. **R6-TC-02-02**: Cumpleaños 29/02 / hoy y sexo `other`/NULL → edad y categorías correctas, no inferidas; no mostrar edad individual ni `birth_date`/`sex` en payload JSON.
3. **R6-TC-02-03**: Historial de una reincorporación en la ventana inicial → nuevas confirmaciones tal como D02 aprobada, no atribuir la misma primera inscripción dos veces.
4. **R6-TC-02-04**: Comparar dos consultas con una sola incorporación que alteraría grupo pequeño; impedir inferir el atributo por diferencias, especialmente en CSV.
5. **R6-TC-02-05**: B confirmed y D ajeno invocan RPC y SELECT perfiles directos: denegación; pantalla informa si faltan datos, error diferenciado, no gráficos inventados.

### RF-R6-03 — Período, granularidad y series

1. **R6-TC-03-01**: presets y rango manual aceptados; `[desde,hasta)` incluye primer instante y excluye `hasta`.
2. **R6-TC-03-02**: día 1 alta, día 2 cancelado, día 4 reconfirmado: serie de **flujos** separa clases; si se aprobó ocupación histórica reconstruir estado al cierre, sin usar último estado retroactivamente.
3. **R6-TC-03-03**: `desde>hasta`, `desde=hasta`, bucket desconocido, rango excesivo o con fecha inválida: error seguro con mensaje UI no ambiguo.
4. **R6-TC-03-04**: alternar filtros 90→7→30 rápidamente con red lenta: sólo se muestran resultados del último contexto, sin mezcla entre A y D ni entre eventos.
5. **R6-TC-03-05**: límites de lunes, fin de mes, fin de año, cambios de reloj del cliente, valores `timestamp without time zone`; comportamiento es-AR coherente con backend.

### RF-R6-04 — CSV

1. **R6-TC-04-01**: A exporta E1, columnas del contrato D05/D06; CSV abre en lector externo, encabezados correctos, datos completos y filtro activo.
2. **R6-TC-04-02**: parser round-trip de acentos, emoji, `;`, `,`, `"`, tabs, CR/LF, varios delimitadores según acuerdo, celda vacía; UTF-8/BOM y fechas documentados.
3. **R6-TC-04-03**: fórmula `=SUM(1,1)`, prefijo `+`, `-`, `@`, espacios, tab o salto antes de fórmula: no ejecutable. No exponer `birth_date`, `sex`, email, bio ni atributos restringidos.
4. **R6-TC-04-04**: D intenta `event_id` ajeno, C con link-only, B participante, anon: denegación REST/función; modificar cursor no salta permiso.
5. **R6-TC-04-05**: 1.001 filas por lotes, duplicados entre páginas, red cae en página N, usuario cambia filtro/sesión: no éxito ni descarga parcial.
6. **R6-TC-04-06**: dataset vacío → mensaje de falta de datos/resultado acordado, no éxito falso; CSV estadístico coincide numéricamente con gráfica filtrada.

### RF-R6-05 — Cupo completo

1. **R6-TC-05-01**: evento cupo=2 con uno confirmado, última inscripción → exactamente un `notifications` tipo `event_full` con recipient=A, event_id, título seguro y destino autorizado.
2. **R6-TC-05-02**: cupo con plazas libres, rejected/removal/cancelled/duplicate confirmed: no aviso inventado.
3. **R6-TC-05-03**: repetir confirmación, timeout después de commit y corrida concurrente por última plaza → un único aviso por episodio aprobado, sin divergencias.
4. **R6-TC-05-04**: salir libera cupo y reingresar llena: respetar D07 aprobada (avisos por episodio); aprobar rejoin y ocultos; editar capacity sin inscripción NO debe avisar salvo aprobación expresa.
5. **R6-TC-05-05**: forzar excepción en inserción de aviso → rollback completo; ningún participante confirmado sin su aviso requerido ni aviso huérfano.
6. **R6-TC-05-06**: A recibe Realtime/campana/bandeja; B/C/D/anon no pueden SELECT/REST/SUBSCRIBE; read_at y target protegido; regresión avisos de R5.

### RF-R6-06 — Comparación

1. **R6-TC-06-01**: A selecciona E1 y E2, confirma 40% y 75%; ambas cifras idénticas a panel individual.
2. **R6-TC-06-02**: multiselector rechaza 1, 0, duplicados o >máximo; orden y rótulos estables, tabla legible en móvil.
3. **R6-TC-06-03**: E1 de A + E3 de D → RPC rechaza conjunto completo y no divulga título/ocupación de E3. Usuario con enlace E4 sin propiedad sigue sin panel.
4. **R6-TC-06-04**: archived/ended, resultados sin cupo utilizable de fixture adversarial → `N/D`, nunca NaN/Infinity; cambiar selección limpia resultados previos.

## 4. Matriz transversal de riesgos

| Riesgo | Prueba obligatoria | Gate |
| --- | --- | --- |
| BOLA/IDOR en owner analytics | RPC/REST/URL con actor ajeno; lista mixta comparativa | Cualquier fuga => NO-GO |
| PII por agregación/CSV | Supresión grupos pequeños, diferencias/sumas/unknown, DTO y DOM/console/log | Cualquier inferencia individual => NO-GO |
| Inyección CSV | entradas formula y tabs/espacios, round-trip Excel/CSV reader | Fórmula ejecutable => NO-GO |
| Contador inconsistente | R1/R3 multiestado, rejoin, update capacity y concurrencia | Conteo incorrecto => NO-GO |
| Avisos duplicados/ausentes | race, reintento, rollback, full→free→full | D07 infringida => NO-GO |
| Datos históricos falsos | hist.first status/recon, buckets fecha y stock vs flujo | Métrica mal rotulada => NO-GO |
| Pérdida de contexto UI | cambio de sesión/evento/período, abort, cache PWA | Fuga de otra sesión => NO-GO |
| R5 GO humano; verificar integración y DDL pendiente | catálogo, PR integradas y evidencias remotas, QA humana | Bloqueos de dependencias => NO-GO |

## 5. Diseño, accesibilidad y regresiones

- UI PlanIt dirección B · Amanecer; mobile-first 320/360/375/390/768/1280, zoom 200%, sin scrollers que oculten KPIs, barras con texto/tabla equivalente, foco visible, navegación con teclado, safe-areas y `prefers-reduced-motion`.
- Comparar con `DESIGN.md`, `docs/design/DESIGN_SYSTEM.md` y `docs/design/UI_WORKFLOW.md`; mockup `release-6.png` histórico. Screenshots sólo de app ejecutada, con datos sintéticos y estado de integración aclarado.
- `npm run build`, `npm run lint`, suites scripts `check:r5:*` y históricas relevantes realmente ejecutadas; tests de nuevas rutas/regresiones R1–R5. Registrar comandos que no pudieron ejecutarse y motivo.
- Supabase: CLI `--version`, `migration list`, `db push --dry-run`, replay local, revisión de ACL/SECURITY DEFINER y consultas `EXPLAIN`; cualquier SQL remoto o fixture persistido necesita aprobación explícita.
- PWA/Realtime real con sesiones y móvil físico requieren contexto/acceso; si no están disponibles, `NOT RUN` sin simular cumplimiento.

## 6. Formato de cierre

Generar `docs/qa/RELEASE_6_TEST_REPORT.md`: resumen ejecutivo GO/NO-GO, snapshot commit+fecha, estado de PR/migraciones local/remoto, matriz 24 CA por capa, casos/capturas/logs, autorización, demografía, CSV, avisos, rendimiento, accesibilidad, bloqueos y aceptación humana. **Ningún checkbox administrativo transforma `NOT RUN` en PASS.**
