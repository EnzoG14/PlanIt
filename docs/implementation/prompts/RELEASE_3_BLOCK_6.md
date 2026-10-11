# Codex — R3, BLOQUE 6: reincorporaciones

**RF:** R3-08 y R3-09 (9 CA). Leé requisitos R3, `RELEASE_3_PLAN.md` (**D/BLOQUE 6**), STATUS, agentes y referencias de solicitudes/estados.

Crear flujo para usuario `removed`: solicitar primera vez inmediatamente si evento vigente/accesible, una pendiente por inscripción, rechazos imponen 7 días desde resolución. Mostrar estado y próxima elegibilidad. Organizador consulta pendientes, aprueba o rechaza con confirmación. Aprobar vuelve a `confirmed` y registra historial sólo si evento vigente y hay cupo bajo transacción/bloqueo. Sin cupo deja pending, no reserva ni autoaprueba; prohibir operaciones sobre evento finalizado/cancelado/archivado. `pending` pertenece sólo a solicitudes, NO a `event_participations`. No asumir columnas de mensaje del mockup.

Inspeccioná modelo real antes de migrar; testear dos usuarios, última plaza concurrente, duplicados/cooldown, acceso directo, fallo/reintento. 9 CA, build/lint y STATUS, PR individual. No SQL remoto ni merge sin aprobación.