# Release 6 · Bloque 0 — Auditoría y congelación de contratos [PLANTILLA]

> Archivo para COMPLETAR tras ejecutar B0. Los renglones marcados `[PENDIENTE]` no son pruebas ni decisiones actuales. No declarar este bloque PASS sin evidencia.

## 1. Entorno y fuentes

- Fecha/hora: [PENDIENTE]; rama/HEAD/estado Git: [PENDIENTE]; `main` remoto: [PENDIENTE].
- R5 **GO humano / Validado** confirmado en `main` SHA `66e24d85f32123ecd70f457f8381c68ae5af1603` el 14/10/2026; verificación de PR #60 y dependencias integradas en el corte efectivo de B0: [PENDIENTE].
- Google Doc vigente (tres pestañas) y diferencias R6: [PENDIENTE].
- Supabase `planit-v2` (read-only): tabla funciones, RLS, EXECUTE, migraciones vigentes, advisors: [PENDIENTE]. Nunca escribir sobre legado.

## 2. Mapa de tablas y datos

- `events` / `event_participations` / `participation_history` / `profiles`: columnas, tipos, estadísticas, constraints, triggers y FKs: [PENDIENTE].
- Trazabilidad de altas, reingresos, remociones, estado lleno para **todas** las RPC (incluyendo unlisted/rejoin): [PENDIENTE].
- `notifications` + cambios recientes DM/follow + definición actual de `get_notification_target`: [PENDIENTE].
- Volumen, nulos demográficos y tamaño por evento con datos **sintéticos o totales no sensibles**: [PENDIENTE].

## 3. Matriz de permisos por actor

| Operación | Organizador A | Confirmado B | Link-only C | Ajeno D | Anon | Evidencia SQL/JWT |
| --- | --- | --- | --- | --- | --- | --- |
| Lectura ocupación | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Demográficos agregados | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Serie | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| CSV | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Comparación mixta | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Notificación `event_full` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## 4. Decisiones y contradicciones

Copiar D01–D12 de `RELEASE_6_DECISIONS_PROPOSED.md`, **conservar acuerdos A01–A07 del responsable del 14/10/2026**; completar precisión de D03/D04/D05/D06/D08/D11. Si falta decisión técnica bloqueante, STOP sólo antes del bloque consumidor, **no volver a preguntar las siete respuestas ya dadas**. Registrar conflictos con RF/CA sin editar el texto original.

## 5. Diseño de contratos y SQL a ejecutar en B1/B3/B4/B6/B8

- Nombres/firma exacta y tipos reales; scope de SQL; security definer/invoker; grants; protección de grupos pequeños: [PENDIENTE].
- Estrategia de idempotencia/episodios para `event_full` y pruebas de concurrencia: [PENDIENTE].
- Política de paginación CSV y columnas permitidas: [PENDIENTE].
- Índices necesarios con EXPLAIN y medidas replicables: [PENDIENTE].
- Esquema de responsabilidades frontend / SQL, archivos estimados y plan rollback: [PENDIENTE].

## 6. Diseño visual y QA

- Referencia Amanecer vigente, pantallas candidatas, navegación y ausencia de quinto dock: [PENDIENTE].
- Runners existentes reaprovechables y gaps SQL/JWT/UI/Realtime reales: [PENDIENTE].
- Autorización remota, cuentas de prueba y constraints de CI: [PENDIENTE].

## 7. Gate

**B0:** [NO GO por defecto / GO con evidencia]. Aprobaciones: [PENDIENTE]. Siguiente bloque **no autorizado automáticamente**.
