# PlanIt — instrucciones para agentes de IA

## Propósito y alcance
PlanIt es un proyecto universitario: PWA de descubrimiento, organización y participación en eventos. Priorizar una solución clara, mantenible y verificable por encima de la complejidad empresarial. No recrear la app anterior en Expo/React Native.

## Stack vigente
- Frontend: React 19, TypeScript, Vite 8, React Router.
- PWA: `vite-plugin-pwa` con Web App Manifest y Service Worker.
- Backend: Supabase Auth, PostgreSQL, Row Level Security (RLS), Storage y Realtime. Edge Functions sólo cuando se requieran secretos o lógica de servidor.
- Convención de código y SQL: nombres en inglés, `snake_case` en base, componentes React en `PascalCase`.

## Fuentes de verdad

### Funcionalidad

1. Requisitos funcionales R1–R7 y criterios de aceptación aprobados.
2. Especificación técnica y decisiones de negocio aprobadas; `docs/architecture.md` y `docs/database.md` como resumen técnico.
3. Contratos de datos, migraciones versionadas en `supabase/migrations/` (fuente ejecutable del esquema) y autorizaciones vigentes.

### Diseño

1. [PRODUCT.md](PRODUCT.md), cuando exista, para contexto y principios de producto.
2. [DESIGN.md](DESIGN.md) aprobado, fuente normativa de tokens y patrones visuales. Dirección vigente: **B · Amanecer** (claro, tinta marina, mancha difusa), registrada en [docs/design/proposals/amanecer-direction.md](docs/design/proposals/amanecer-direction.md).
3. [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md), aplicación del sistema.
4. Componentes y patrones aprobados de la aplicación, distinguiendo el objetivo aprobado del código aún sin migrar.
5. Prototipo [design-lab](design-lab/README.md) (`/b`) como ilustración de composición y estados, y mockups anteriores R1–R3 como referencias históricas de contexto; no objetivos de fidelidad pixel-perfect.

El diseño no redefine la funcionalidad. Los mockups y prompts históricos no prevalecen sobre el sistema visual consolidado con Impeccable. Para UI, aplicar [las reglas de diseño](docs/design/AGENTS.md). El refresh se sigue por separado en [su plan](docs/implementation/UI_REFRESH_R1_R3_PLAN.md) y [estado](docs/implementation/UI_REFRESH_R1_R3_STATUS.md); no constituye nuevas releases funcionales.

Si existe una discrepancia entre requisitos y código, informar y proponer la corrección. No inventar requisitos nuevos.

## Reglas obligatorias
- Trabajar en una rama de Git; **no** aplicar migraciones ni fusionar a `main` sin autorización.
- La base de datos nueva es Supabase `planit-v2` (ref `iepeqmvzjguwlhnecsdq`). La antigua `fmqzokxvpqxfzvcnzvjm` es **sólo referencia**, nunca modificarla.
- **No hay borradores persistidos**. El formulario de creación/duplicación vive en React; una fila de `events` es un evento completo.
- No añadir columna `timezone` a eventos. Según decisión del proyecto, columnas fecha-hora propias usan `timestamp without time zone` y se interpretan consistentemente como hora de Argentina (`America/Argentina/Buenos_Aires`); las tablas internas de Supabase conservan sus tipos.
- No exponer secretos, claves `service_role`, tokens VAPID privados ni credenciales en `VITE_*`, el repositorio o el navegador.
- Activar RLS desde la creación de cada tabla `public`. No confiar en filtros sólo del frontend ni en IDs proporcionados por el navegador para autorización.
- Mantener separados los datos sociales de los privados aunque `profiles` sea una única tabla: lectura íntegra sólo para el propietario; vistas/RPC para datos visibles a terceros.
- Las invariantes locales se imponen con PK/FK/UNIQUE/CHECK; cupos, pertenencia, autorización y operaciones de varios pasos requieren transacciones verificables.
- Evitar cascadas que destruyan eventos, participantes, mensajes o historiales. Archivar uno vigente implica cancelarlo primero. Por decisión del 24/10/2026, el organizador puede eliminar definitivamente un evento cancelado o finalizado mediante RPC transaccional explícita, incluida su información asociada y limpieza de Storage con reintentos. Desarchivar requiere reprogramar y reactivar; las confirmaciones previas pasan a cancelled y las expulsiones se conservan.
- Antes de modificar SQL: inspeccionar dependencias y migraciones existentes. No editar una migración ya aplicada; crear otra.
- Respetar contratos y estructura existente, no agregar dependencias innecesarias. Nunca ejecutar comandos destructivos sin autorización explícita.

## Flujo de trabajo
1. Leer este archivo y el `AGENTS.md` más cercano a los archivos afectados.
2. Identificar requisitos, alcance, riesgos y dependencias.
3. Hacer el cambio mínimo, usando convenciones existentes.
4. Verificar: `npm run build`, `npm run lint` si cambia frontend; revisar migraciones y permisos si cambia la BD.
5. Informar qué se cambió, pruebas realizadas y pendientes. No declarar pruebas ejecutadas si no lo fueron.

## Documentos relacionados
- [Arquitectura](docs/architecture.md)
- [Modelo y reglas de datos](docs/database.md)
- [Guía de frontend](src/AGENTS.md)
- [Guía de migraciones](supabase/AGENTS.md)
