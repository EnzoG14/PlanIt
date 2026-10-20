# Precarga inicial de contenido

La sesión autenticada prepara en paralelo la primera página de Inicio, las sugerencias de Para vos, el perfil y avatar propios, ambas listas de Mis eventos (Organizo/Todos y Participo) y las categorías. Antes de habilitar las rutas privadas, inicia la descarga de todas las imágenes incluidas en esas respuestas; cada imagen tiene un límite de espera de 4 segundos. Las consultas de arranque tienen un límite de 12 segundos. Un recurso que falla conserva su error/reintento por pantalla y no bloquea las demás secciones.

Las pantallas comparten resultados y solicitudes en curso, en memoria. Los datos recientes se reutilizan durante 30 segundos; al vencer ese plazo, el resultado anterior permanece disponible para renderizar mientras se consulta su actualización. Las páginas adicionales y los filtros no utilizados se consultan cuando se solicitan: no se descarga la base completa ni historiales ilimitados.

Para vos deja de remontarse por cambios de centro del mapa. Actualiza las sugerencias en segundo plano sin borrar la tarjeta existente. La caché se limpia al cerrar o cambiar de cuenta; respuestas antiguas no pueden repoblarla. Se invalidan los recursos afectados al cambiar intereses, perfil/avatar, participación o publicar/editar/cancelar/archivar eventos. No se persisten datos, coordenadas ni URLs privadas en localStorage o Service Worker. Se conservan los vencimientos de enlaces firmados existentes.

## Verificación

- `npm run build`: correcto, con advertencias existentes de tamaño de bundle y opción de Vite.
- `npm run lint`: correcto, con advertencias preexistentes en otros archivos.
- `node scripts/check-suggestions-cache.mjs`: solicitud compartida, reutilización, snapshot vencido durante refresh, invalidación, reintento y aislamiento de cuentas/respuestas tardías.
- `node scripts/check-signed-images.mjs`: correcto.
- `node scripts/check-startup-content-ui.mjs`: Playwright 375/1280 px. Arranque en Perfil verifica que las otras secciones se consultan en paralelo antes de terminar sugerencias, descarga de avatar/portadas, navegación sin RPC duplicada, cambio de origen con consulta lenta sin loader y regreso a Inicio después de 31 segundos conservando tarjetas durante la actualización.
- Regresión existente `scripts/check-suggestions-ui.mjs` en 375 px: navegación, consulta lenta, deduplicación, estados vacío/error y reintento correctos.

Resultados y capturas junto a este documento. Todas las pruebas de navegador usan datos de ejemplo y servicios simulados, sin escrituras remotas. No se midió la latencia real de Supabase ni se probó un dispositivo físico. No se modificaron archivos de entorno ni la base de datos.
