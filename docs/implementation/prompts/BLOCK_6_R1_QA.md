# Codex — BLOQUE 6: QA integral y cierre de Release 1

## Precondiciones

Bloques 0–5 integrados en `main` y migraciones correspondientes aplicadas a `planit-v2` con autorización. Trabajá en rama de QA/ajustes acotados. Leer las reglas AGENTS, documentación de diseño, plan técnico R1 y `docs/implementation/RELEASE_1_STATUS.md`. Consultar el contenido REAL de los 28 criterios de aceptación (RF-R1-01..07, CA-01..04) en `Planificación`; no inventarlos ni modificar su redacción.

## Objetivo

Determinar, con evidencias reproducibles, si PlanIt cumple los 7 RF y 28 CA de R1. Corregir únicamente problemas detectados sin agregar alcance de releases futuras. Nunca declarar aprobado un caso que no fue probado.

## Auditoría de implementación

1. Reconciliar ramas, migraciones versionadas, historial remoto y estructura actual. Asegurar que el destino es `planit-v2` (`iepeqmvzjguwlhnecsdq`), nunca el proyecto histórico.
2. Ejecutar `npm ci`, `npm run build`, `npm run lint` y scripts de validación existentes (`check:foundation`, `check:auth`, `check:events`, `check:discovery`, pruebas de participación/mi-eventos si existen). Registrar comandos, salidas relevantes, limitaciones, entorno y fecha. Probar también fallos reales.
3. Elaborar matriz de trazabilidad **28 CA exactos** con columnas: RF/CA, requerimiento, archivo/componente, prueba, evidencia, resultado (`Aprobado`, `Fallido`, `No probado`) y acción pendiente.
4. Prueba E2E con **dos sesiones/usuarios diferentes**: registro y confirmación → login → crear evento con fotografía real en Storage → verlo en mapa OSM con tiles reales → abrir detalle → inscribirse desde segunda cuenta → actualizar ocupación → retirarse → reinscribirse → comprobar Mis eventos en ambos usuarios.
5. Probar cupo 1 con dos solicitudes simultáneas (conexiones independientes), bloqueo de inscripciones duplicadas, retirada ajena, organizador excluido y registro de historial consistente.
6. Validar RLS/grants/Storage desde `anon` y usuarios A/B: no leer/alterar perfiles privados ajenos; no suplantar organizer_id/user_id; no manipular participaciones/historial mediante REST directo; no acceder a imágenes privadas no autorizadas. Revisar RPC SECURITY DEFINER/INVOKER y permisos EXECUTE.
7. Revisar Security y Performance Advisors de Supabase; distinguir WARN real de INFO de índices recién creados. Documentar advertencia de leaked-password protection y acción recomendada; no cambiar configuración de Auth sin autorización.
8. Comprobar PWA instalable en HTTPS, service worker/manifest/iconos, rutas directas tras refrescar, caché de datos privados, conectividad, reanudación de sesión y uso desde un celular físico si hay acceso. Si no se puede probar, marcar `No probado`.
9. Validar fechas en horario Argentina desde un cliente con otra zona horaria, geolocalización denegada, carga/errores/empty states, navegación con teclado, focus, viewport 375×812 y desktop, safe-area y ausencia de overflow.
10. Comparar capturas reales de login, registro, creación, mapa, detalle y Mis eventos contra mockup R1, sin exigir funcionalidades visuales de R2–R7. Registrar diferencias legítimas por accesibilidad/requisitos.
11. Revisar logs y errores sin exponer secretos. No usar credenciales privadas en commits, capturas o informes. Datos de prueba controlados; limpiar únicamente lo que se creó explícitamente y con autorización.

## Entregables

- `docs/qa/RELEASE_1_ACCEPTANCE.md`: matriz real de 28 criterios, evidencia por fila y resultado.
- `docs/qa/RELEASE_1_TEST_REPORT.md`: comandos, cobertura de E2E, seguridad, rendimiento básico, PWA, visual y reproducibilidad.
- Screenshots de móvil y escritorio, evitando PII y secretos.
- PR con correcciones puntuales e informes, sin features fuera de R1.
- Lista priorizada de defectos por severidad; propuesta de go/no-go con criterios objetivos.
- Actualizar `docs/implementation/RELEASE_1_STATUS.md`: cada bloque puede marcarse `Validado` **únicamente** tras revisión del usuario y evidencia de aceptación. Si falta una prueba, conservar pendiente explícito.

## Prohibiciones

No fusionar automáticamente ni aplicar SQL remoto sin autorización. No inferir que pasar build equivale a validar la release. No declarar pruebas E2E si usaste fixtures, PGlite o SQL Editor en lugar de un navegador autenticado. Detenerse y entregar informe para revisión humana.
