# Evidencia · R5 Bloque 0

**Fecha:** 14/10/2026 Argentina. **Base:** `1b77b377e0a335f70bb7458be74122e1de70b43f`. **Rama:** `codex/r5-block-0`. [Informe y contratos](../../implementation/RELEASE_5_BLOCK_0_DECISIONS.md). Auditoría exclusivamente: ningún CA R5 aprobado, ningún cambio funcional/migración/deploy/merge. D01–D05 aprobadas previamente; D06–D08 y conflictos C01–C03 listos para revisión humana antes de B1.

**PR:** [#50, borrador para revisión](https://github.com/EnzoG14/PlanIt/pull/50). No continuar con otro bloque sin aprobación del responsable.

## Artefactos y alcance

| Archivo | Contenido | Resultado |
| --- | --- | --- |
| [source.json](source.json) | Fuente Google Docs, hash de lectura normalizada LF, 33 textos CA literales, IDs presentes en matriz operativa | PASS lectura/IDs; todos los CA NOT RUN |
| [catalog-readonly.sql](catalog-readonly.sql) | Consulta de catálogo exclusivamente, BEGIN READ ONLY/ROLLBACK; no SQL de negocio | Ejecutada únicamente en planit-v2 |
| [catalog.json](catalog.json) | 25 migraciones, 14 tablas RLS, columnas/políticas/grants/constraints/índices/triggers/firmas/defaults/resultados/hash de funciones, Storage/Realtime; no filas de usuarios/eventos/mensajes | PASS inventario; no follows/blocks/DM |
| [comparison.json](comparison.json) | Replay de las 25 migraciones existentes en PostgreSQL local **18.4**, remoto **17.11**; 55 funciones iguales por definición LF, ACL y configuración | PASS; rls_auto_enable excluido como scaffold; no negocio ni JWT |
| [http-anon.json](http-anon.json) | Cinco lecturas HTTP directas sin sesión: profiles/conversations/messages/get_event_attendees/get_event_chat | 5/5 denegadas 401/42501; sin JWT usuario |
| [authorization-matrix.csv](authorization-matrix.csv) | 96 cruces de actor/privacidad/follow/bloqueo +4 propios +2 anon | 102 contratos objetivo, todos NOT RUN |
| [audit-catalog.mjs](audit-catalog.mjs), [http-anon.mjs](http-anon.mjs) | Runners reproducibles de inventario/replay y denegación anon; no implementación de producto | Sintaxis y ejecución verificadas |
| [editorial.json](editorial.json) | Diff, enlaces locales nuevos, JSON, integridad de 33 CA y casos adicionales, env ignorado/igual a main, alcance documental y hash de mockup original | Verificación editorial; no test funcional |

Google Drive se usó sólo para leer las secciones Nueva planificación, Criterios de aceptación y Especificación técnica vigentes del documento. No se archivó el documento completo ni se editó la fuente; snapshot versionado limitado a 33 CA. D04 no está expresada en la especificación original: pendiente edición normativa con autorización separada. IDs coinciden, pero no se comparan literalmente los resúmenes de aceptación del repositorio.

El catálogo proviene de **lectura nueva B0**, no reutiliza como resultado el snapshot B9. El replay construye scaffold mínimo Auth/Storage/roles, sin stack Supabase completo ni nuevas migraciones R5. No se crearon datos de negocio locales/remotos. La diferencia de versión mayor18/17 queda explícita; no afirma compatibilidad de funciones R5 aún inexistentes.

## Comandos reproducibles

Ejecutar desde la raíz del worktree, con CLI Supabase autenticado y herramientas locales PostgreSQL disponibles. El runner no instala dependencias. `PLANIT_TEST_TOOLS_DIR` debe apuntar al directorio node_modules que contenga `pg` y `@embedded-postgres/windows-x64`; en esta sesión se reutilizó la instalación local existente. No guardar credenciales en comandos ni evidencias.

```powershell
supabase db query --help
supabase db query --linked --project-ref iepeqmvzjguwlhnecsdq --file docs/qa/r5-block-0/catalog-readonly.sql --output json > .r5-catalog.local
node docs/qa/r5-block-0/audit-catalog.mjs
node docs/qa/r5-block-0/http-anon.mjs
node --check docs/qa/r5-block-0/audit-catalog.mjs
node --check docs/qa/r5-block-0/http-anon.mjs
git diff --check
git check-ignore .env.local
```

`http-anon.mjs` lee exclusivamente URL/clave pública de `.env.local`, comprueba host exacto planit-v2, usa API key sin sesión y registra sólo HTTP/error_code/conteo de filas. No usa tokens de cuentas ni registra payloads sensibles. POST en este runner invoca únicamente funciones de **lectura** con UUID inexistente fijo; no intenta mutaciones, canjes ni creación de DM. PASS esperado:401 y42501. Eso no prueba RLS de usuarios autenticados.

## Intentos y resultados de esta sesión

- `git fetch origin` inicial: FAIL por escritura restringida en FETCH_HEAD; repetido con permiso de sandbox: PASS. Worktree/branch nuevos creados desde origin/main. El checkout inicial con cambios ajenos y el checkout main permanecieron intactos.
- CLI `--help` inicial: FAIL por archivo local de telemetría fuera del sandbox; consulta permitida después: PASS. Primer `db query --project-ref` sin `--linked`: FAIL por sintaxis requerida del CLI; corregido antes de ejecutar SQL. Las dos lecturas read-only posteriores: PASS (segunda agrega índices/triggers/schema_usage).
- Replay inicial: FAIL por conexión localhost EACCES del sandbox; helper se detuvo en finally. Repetición permitida y ejecución del runner final versionable: PASS 25 versiones/55 funciones. PostgreSQL efímero se detuvo al terminar; no se aplicó SQL a datos remotos.
- HTTP anon inicial: FAIL por resolución DNS dentro del sandbox; repetición permitida y runner final: PASS 5/5. No se interpretan los fallos de entorno como defectos del producto ni como PASS hasta retest.
- `git diff --check` inicial: FAIL por dos espacios finales en cabecera editada del plan; corregidos y repetido al cierre. [Resultado final](editorial.json).
- Verificador editorial inicial: faltaba su propio archivo de salida y luego el buffer por defecto no admitía el PNG completo; se creó la salida y amplió el buffer antes del retest PASS. No se modificó el mockup para verificarlo.

**No ejecutado:** npm ci/build/lint y suites funcionales, fixtures/JWT A/B/C/D, escenarios R5 positivos/negativos/concurrencia, Storage/Realtime end-to-end, UI/PWA responsive, lector de pantalla y dispositivos físicos. No se cambió frontend ni esquema, por lo que no se amplía QA funcional de R1–R4 por esta documentación. Referencias B9 son antecedentes, nunca resultados nuevos B0.

## Diseño y autorización de cambios

Se abrió visualmente el PNG original R5 y se revisó DESIGN Amanecer; hash original en editorial.json. No hubo edición de mockups, CSS/componentes, capturas de app ni claim de accesibilidad/responsive PASS. La correspondencia de los cinco paneles y las diferencias contractuales están en el informe; audio/llamadas/fotos DM/presencia/toggles no se incorporan por aparecer dibujados.

Autorizado ahora: auditoría de sólo lectura, documentación, rama y PR. Propuesto para bloques futuros: extensión de conversations/messages, tablas follows/blocks y RPC/RLS/avatar, ruta social y formulario/DM; requiere aprobación del bloque consumidor. C01–C03 requieren revisión expresa por impacto en APIs R3/R4 y revocación de URLs. **Migración R5 creada: ninguna; probada local: ninguna; aplicada remota: ninguna/no autorizada; verificada remota: ninguna.** Los 25 archivos reejecutados son históricos. No escribir Google Docs por D04 sin autorización separada. Detenerse tras preparar la PR; no iniciar B1.
