# PlanIt — Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

PlanIt tiene dos perfiles de uso principales: participante y organizador. Son formas de usar el producto, no roles excluyentes: cualquier usuario puede organizar eventos y participar en eventos de otras personas. No se ha definido un segmento demográfico específico.

## Product Purpose

PWA mobile-first para descubrir, organizar y participar en eventos. Es un proyecto universitario que prioriza una solución clara, mantenible y verificable. El producto debe permitir encontrar un plan, conocer sus detalles, inscribirse y gestionar la participación; al organizar, publicar un evento completo y administrar su información y asistentes.

## Positioning

La diferenciación frente a otras aplicaciones está sin definir. No inventar ventajas competitivas, métricas, testimonios ni promesas comerciales.

## Operating Context

- Uso en Argentina, con interfaz en español rioplatense (`es-AR`). Las fechas y horas propias se interpretan como horario de Argentina (`America/Argentina/Buenos_Aires`).
- Prioridad al uso desde el teléfono, con adaptación responsive a escritorio e instalación como PWA.
- Participante: explorar Inicio y Mapa, consultar el detalle, inscribirse o retirarse, consultar Mis eventos y usar el chat cuando esté autorizado.
- Organizador: crear, editar y duplicar eventos; gestionar galería, asistentes y solicitudes de reincorporación; cancelar o archivar según las reglas vigentes.
- Perfil propio y bandeja interna de notificaciones complementan estos recorridos.

## Capabilities and Constraints

- Conservar el alcance y las decisiones vigentes de [AGENTS.md](AGENTS.md), [requisitos](docs/requirements/README.md), [arquitectura](docs/architecture.md) y [modelo de datos](docs/database.md). Este registro no sustituye esos contratos ni incorpora nuevas funcionalidades.
- Los requisitos y criterios de aceptación aprobados determinan el comportamiento. Las migraciones versionadas son la fuente ejecutable del esquema; la presencia de un requisito o mockup no acredita implementación ni aceptación.
- React, TypeScript, Vite y React Router; Supabase para autenticación, PostgreSQL, RLS, Storage y Realtime. No recrear la aplicación anterior en Expo/React Native.
- No hay borradores persistidos: creación y duplicación mantienen el formulario en React hasta publicar un evento completo.
- El organizador no ocupa cupo en su propio evento. Cupos, pertenencia, autorizaciones y operaciones de varios pasos se resuelven mediante transacciones verificables.
- Eventos públicos y ocultos tienen reglas de acceso distintas. Preservar autorización, privacidad del perfil y separación de datos sociales y privados.
- Cancelar y archivar conservan eventos e historiales; no eliminar físicamente eventos. Archivar un evento vigente requiere cancelarlo primero.
- No agregar `events.timezone`; mantener la convención temporal aprobada. No exponer secretos en el navegador ni en el repositorio.
- La base vigente es Supabase `planit-v2`; la anterior es sólo referencia. Aplicar migraciones o fusionar a `main` requiere autorización.
- Diferenciar funcionalidad implementada, evidencia local, pruebas remotas y aceptación humana usando los documentos de seguimiento y QA vigentes.

## Brand Commitments

- Mantener el nombre PlanIt y el lenguaje existente en español rioplatense.
- Objetivo confirmado: reducir el aspecto genérico sin comprometer las funcionalidades existentes.
- Las referencias y compromisos visuales existentes viven en [docs/design](docs/design/README.md). Consultarlos antes de diseñar; este documento no define una nueva dirección visual ni autoriza reemplazar la identidad vigente.

## Evidence on Hand

- Contratos funcionales versionados en [docs/requirements](docs/requirements/README.md).
- Arquitectura y reglas de datos en [docs/architecture.md](docs/architecture.md) y [docs/database.md](docs/database.md).
- Código de la PWA en `src/` y migraciones en `supabase/migrations/`.
- Mockups originales, sistema visual, brechas y capturas de verificación en [docs/design](docs/design/README.md). Las fotografías de los mockups son ilustrativas, no contenido de eventos reales.
- Estado de implementación en `docs/implementation/` y evidencia de pruebas en `docs/qa/` y `docs/design/verification/`. Consultar el estado actual sin convertir pruebas técnicas en aceptación humana.

## Product Principles

1. Facilitar los recorridos de participante y organizador, preservando su comportamiento y sus reglas de acceso.
2. Priorizar el uso móvil y mantener continuidad funcional en escritorio.
3. Buscar una identidad menos genérica dentro de los compromisos y referencias aprobados.
4. Preferir claridad, mantenibilidad y verificación a complejidad innecesaria.
5. Mantener trazabilidad: requisitos, decisiones, implementación y evidencia deben poder distinguirse.
