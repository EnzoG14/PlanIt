# R5 B1 — Aplicación remota autorizada

14/10/2026, Argentina. Autorización directa posterior del responsable: «hace las migraciones a la base remota». Único destino `planit-v2` (`iepeqmvzjguwlhnecsdq`), código `951dd47818cabc13703e9bd5de73bce1d5a0e53f` en rama `codex/r5-block-1`, PR #51 abierta. Ningún cambio en proyecto histórico, main, frontend, Edge deploy ni secretos.

**Las tres migraciones están creadas, probadas localmente, aplicadas remotamente y verificadas remotamente.** [Acta estructurada](remote-migration-summary.json). Esto no valida los 33 CA ni autoriza B2.

| Paso | Resultado | Evidencia |
| --- | --- | --- |
| Historial previo / dry-run | 25 versiones históricas sincronizadas, sólo tres pendientes B1 | Salida CLI de esta sesión; lista exacta en acta |
| Guard avatar | 0 referencias antiguas incompatibles, ninguna reparación de datos necesaria | [SQL READ ONLY](remote-preflight.sql), [resultado](remote-preflight.json) |
| Aplicación | PASS `20261014133225`, `20261014133547`, `20261014133847` | [db push](remote-push.txt) |
| Dry-run posterior | PASS, remoto al día, 0 pendientes/seeds/roles | [resultado](remote-dry-run-after.txt) |
| Catálogo | 28 versiones; 16 tablas públicas con RLS; bucket avatars privado 5MiB/MIME aprobado | [snapshot sin filas de usuarios](remote/catalog.json) |
| Funciones | 79 cuerpos/ACL/config iguales a replay de las 28 migraciones; sólo normalización CRLF/LF | [comparación](remote/comparison.json), excluye scaffold rls_auto_enable |
| Smoke | 7 RPC niegan authenticated sin identidad bajo READ ONLY; PATCH visibility/avatar negado, signing service-only | [SQL](remote-smoke.sql), [resultados](remote-smoke.json) |
| Asesores seguridad | 0 errores; 16 nuevos WARN de DEFINER autenticado intencional | Objetos y justificación en acta; advertencia previa de protección de contraseñas sin cambios |

Los avisos nuevos corresponden a las proyecciones mínimas y mutaciones transaccionales R5: sin SELECT general profiles ni escrituras genéricas, auth.uid/owner/membership, bloqueo bilateral, locks, allowlists y search_path fijado. No se silencian ni se cambia a INVOKER artificialmente para ocultarlos. La función de firma sólo tiene EXECUTE service_role, no authenticated/anon. RLS completa desde creación; publicación Realtime de mensajes y chat grupal conservados.

CLI usó `--linked --project-ref iepeqmvzjguwlhnecsdq --skip-vault --yes`, sin include-seed/include-roles. Las migraciones conservan transacciones propias y fueron registradas por el CLI. No se generaron contraseñas, cuentas, mensajes ni fixtures remotos. El smoke se ejecutó con BEGIN READ ONLY/ROLLBACK y sin identidad; no equivale a JWT real A/B.

## Reproducción de la verificación

```powershell
supabase migration list --linked --project-ref iepeqmvzjguwlhnecsdq
supabase db push --linked --project-ref iepeqmvzjguwlhnecsdq --skip-vault --dry-run
supabase db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r5-block-0/catalog-readonly.sql --output json > .r5-remote-catalog.local
supabase db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r5-block-1/remote-smoke.sql --output json
supabase db advisors --linked --project-ref iepeqmvzjguwlhnecsdq --type security --output json
```

Para comparación local se reutilizó `docs/qa/r5-block-0/audit-catalog.mjs` con catálogo nuevo, salida `docs/qa/r5-block-1/remote` y expectativa16 tablas (en lugar de14). PostgreSQL efímero18.4 frente a remoto17.11, 28 archivos SQL y 79 funciones; se detuvo el servidor al terminar. No se reejecutaron suites UI/build porque sólo se aplicó el SQL ya probado y se actualizó documentación.

Pendientes: Edge social-avatar **no desplegada** (requiere autorización separada), HTTP JWT funcional, Storage/CDN/TTL reales, Realtime y aceptación humana. Frontend social aún no habilitado; integración de avatar B4. B2 no iniciado. Estado **Implementado; QA pendiente**.
