# Release 4 — Registro de decisiones: aprobadas y propuestas pendientes

**Estado:** versión 1.1, 12/10/2026. **Siete decisiones de producto confirmadas por el responsable** (A01–A07); el resto sigue siendo propuesta técnica, no aprobación implícita. Este archivo NO es una auditoría de Bloque 0 ejecutada. Las alternativas se deducen de RF/CA/especificación y del código visible de `main` el 12/10/2026. No se han probado permisos reales con JWT ni consultado el remoto Supabase para confirmar el esquema efectivo de R4.

## Hechos respaldados por fuentes

- La nueva R4 tiene 9 RF y 39 CA en dos sprints. La R4 histórica de comunidad se movió a R5.
- Stack, fechas sin zona, ausencia de borradores, interés múltiple y evento de una sola categoría: `AGENTS.md`, `docs/architecture.md`, `docs/database.md`, Docs Planificación.
- Tablas modelo: `event_access_links`, `event_access_grants`, `user_category_interests` (con campos exactos en Docs: «Diseño de base de datos — PlanIt v1.0»). Son diseño; confirmar si existen antes de migrar.
- Base R1–R3: `events.visibility` con `'public'|'unlisted'`, pero el INSERT de cliente y publicación vigente restringen `public`. `events_select_participating` abre lectura por cualquier participación histórica sin condición de grant: brecha a reparar antes de R4 oculta.
- `discover_public_events` filtra bounds, no radio; `get_home_events` consulta próximos eventos; `get_event_participation_summary` permite lectura por participación previa, de modo que R4 requiere auditar más que `events`.
- El responsable confirma que **R3 está integrada y validada** (12/10/2026). La copia de `RELEASE_3_STATUS.md` consultada antes del acuerdo podía indicar QA pendiente; se considera desactualizada para el gate de producto, sin omitir la comprobación técnica de migraciones y firmas que R4 reutiliza.

## Acta de decisiones de producto confirmadas — 12/10/2026

Estas opciones se consideran **CERRADAS** y son vinculantes para Codex. No reabrirlas en Bloque 0 salvo contradicción demostrable entre seguridad y RF/CA; cualquier cambio de producto requiere nueva aprobación.

| Acuerdo | Decisión aprobada | Implicación verificable |
| --- | --- | --- |
| **A01 / D01** | **Usar el centro del mapa como alternativa al GPS.** | Ante denegación/timeout/no disponibilidad de geolocalización, permitir radio desde el centro del mapa y **etiquetar explícitamente «Centro del mapa»**; nunca presentarlo como «Mi ubicación». Si el mapa se inicia en Buenos Aires, explicitarlo; al mover el mapa recalcular resultados bajo la política de interacción definida. |
| **A02 / D03** | **Fecha por inicio del evento.** | Filtrar `starts_at` en `[00:00 día inicial AR, 00:00 día posterior al final AR)`; no incluir por solapamiento eventos que comenzaron antes del rango. |
| **A03 / D04** | **Buscar y filtrar dentro de Inicio y Mapa.** | Mantener `/home` y `/map`, filtros combinables y sincronizados; no crear `/search` ni una navegación global adicional. |
| **A04 / D08** | **Public→unlisted conserva confirmados.** | Crear `event_access_grants.active` para participantes `confirmed` existentes **en la misma transacción del cambio**, sin activar grants previamente `revoked`. Si hubiera un `confirmed` con grant revocado (posible al volver de oculto a público), **bloquear la transición y requerir resolución explícita del organizador** para no removerlo ni reactivarlo silenciosamente. |
| **A05 / D09** | **Unlisted→public vuelve el evento visible para todos.** | El modo público prevalece para lectura según reglas públicas, incluso si existen grants `revoked`; esas filas se preservan, y al volver a `unlisted` vuelven a bloquear el acceso. `removed` sigue siendo estado de participación y no se reingresa automáticamente. |
| **A06 / D10–D11** | **Almacenar únicamente hash de token; priorizar seguridad.** | CSPRNG en servidor, hash persistido y secreto entregado sólo al generar/rotar. No recuperable; si se pierde, regenerar. Un solo enlace activo. Formato `/invite#token=` es **propuesta técnica**, no una nueva decisión expresa de producto. |
| **A07 / dependencia R3** | **R3 integrada y validada.** | Tratar R3 como gate funcional satisfecho por confirmación del responsable; al comenzar Bloque 0 comprobar en `main` las firmas/RPC y migraciones requeridas sin rehacer QA de R3 ni condicionar R4 a una aceptación ya confirmada. |

**Alcance del acuerdo:** no se aprobaron expresamente radios predeterminados, pesos del ranking, formato exacto de URL, persistencia de filtros en query string ni revocación automática del enlace en unlisted→public. Esos son *defaults técnicos recomendados*, sujetos a revisión del Bloque 0, y no deben confundirse con los siete acuerdos.

## Matriz de decisiones: aprobadas y técnicas aún sujetas a revisión

| ID | Asunto | Propuesta conservadora | Alternativas / impacto | Estado |
| --- | --- | --- | --- | --- |
| D01 | Ubicación | GPS consentido si está disponible; si no, centro del mapa como origen visible, incluso centro inicial explícitamente identificado | GPS obligatorio haría fallar CA-04 sin permiso | **Aprobada** |
| D02 | Radios | `5/10/25/50/100 km` + «Sin límite»; validar server-side | Slider continuo o valores distintos | Pendiente |
| D03 | Fecha | Filtrar `starts_at` por día/rango AR con fin exclusivo | Eventos que **solapan** intervalo | **Aprobada** |
| D04 | Navegación | Buscar/Filtros compartidos en `/home` y `/map`, sin nueva ruta `/search` | Nueva ruta `/search` independiente | **Aprobada** |
| D05 | Estado filtros | Query params sólo no sensibles; URL/cuentas saneadas | Mantener sólo estado React local | Pendiente |
| D06 | Intereses | Sección `/me/interests`, guardar selección atómicamente con RPC | Modal dentro `/me` o onboarding | Pendiente |
| D07 | Sugerencias | Scoring 100 afinidad + 30 cercanía + 20 fecha; sin preferencias, generales próximos informados | Otros pesos y exclusión de inscritos | Pendiente |
| D08 | Evento public→unlisted | Crear grants para confirmed existentes en misma transacción; no reactivar revoked; conflicto confirmed+revoked debe resolverse explícitamente antes | Requerir invitación explícita a cada uno: rompe el acceso previamente confirmado | **Aprobada** |
| D09 | Evento unlisted→public | Al regresar a public, visible a todos por regla pública; revocados preservados para el próximo estado oculto | Prohibir conversión a público si existe revocado | **Aprobada** |
| D10 | Link de invitación | **Aprobado:** secreto aleatorio de 256 bits, hash persistido, no recuperable. **Propuesto:** URL con fragmento y retención efímera durante login | `/invite/:token` más sencillo, pero aparece en logs/referrers | **Hash aprobado; formato propuesto** |
| D11 | Link perdido | Mostrarlo en generación/rotación solamente; regenerar si se pierde, invalidando el anterior | Guardarlo descifrable requeriría custodia de clave adicional | **Aprobada** |
| D12 | Al volver a `public` | **Propuesta:** revocar enlace activo atómicamente, conservar grants, exigir nuevo enlace al reocultar | Si no se revoca, podría reaparecer tras reocultar | **Propuesta crítica** |
| D13 | Eventos propios / inscritos en sugerencias | Por defecto no excluir participantes (no exigido), pero marcar «Ya participás» si la tarjeta ya lo soporta | Excluir evento propio o confirmed para mejorar UX | Pendiente |
| D14 | Multimedia tras revocación | Reducir TTL de signed URLs privadas de 300 s a 60–120 s cuando sea viable y limpiar caché; documentar ventana residual | Mantener 300 s es más eficiente pero expone material ya firmado | **Crítica** |
| D15 | Cadencia de trabajo | Un bloque/PR, bloque 5 seguridad antes del 6–8; R3 aceptada como dependencia funcional, auditar únicamente sus contratos técnicos | Saltarse seguridad aumenta riesgos | Propuesta técnica |

## Contratos técnicos propuestos a confirmar mediante Bloque 0

1. **Funciones existentes:** `create_event`, `update_event`, `get_home_events`, `discover_public_events`, `get_event_participation_summary`, `register_for_event`, `get_event_organizer`, `get_my_events`, `get_my_organized_events`, `get_event_duplicate_source`, funciones de reincorporación, chat y manejo de media. Enumerar firma, dependencia, ejecutor, RLS y actor.
2. **Superficies nuevas sugeridas:** `search_public_events`, `set_my_category_interests`, `get_suggested_events` (o ranking acotado), `create_event` evolución segura o `create_event_v2`, `set_event_visibility`, `create_or_rotate_event_link`, `redeem_event_link`, `get_event_access_grants`, `revoke_event_access`, `restore_event_access`.
3. **Diseño de tablas:** respetar campos del modelo lógico. Nombres específicos de RPC son propuestas hasta implementar, no contratos de servicio existentes.
4. **Políticas:** toda lectura debe derivar un predicado de evento público autorizado, organizador o grant oculto activo. Evitar que `event_participations` anterior o un `SECURITY DEFINER` antiguo abra acceso oculto revocado.
5. **Reglas persistentes:** token rotado = sin nuevos canjes; grant previo activo = sigue válido; grant revoked = no se activa por canje; restituir no registra participación confirmed; sin cupo no inscribir.
6. **Diseño visual:** abrir realmente `release-4.png` y comparar contra `SCREENS.md`; excluir favoritos, gratuidad, pagos y ratings no aprobados. No declarar una imagen validada por la sola existencia del archivo.

## Aspectos técnicos no resueltos por los siete acuerdos

- **D02:** radios concretos y radio inicial. Propuesta UI 5/10/25/50/100 km y «Sin límite», sin seleccionar radio de manera engañosa al abrir Inicio.
- **D05:** conservar filtros entre Inicio/Mapa. Propuesta URL sólo con parámetros no secretos y saneamiento, sin guardar información sensible ni tokens.
- **D06:** ruta de intereses propuesta `/me/interests`; ajustar al patrón de navegación validado en Bloque 0.
- **D07:** scoring y pesos 100/30/20 sólo propuesta, documentar elección reproducible antes de programar.
- **D10 (parte URL):** fragmento `#token=` sugerido para reducir exposición en logs/referrers; asegurar que el flujo real de Auth conserva el secreto sin `localStorage` y sin registrarlo en telemetría.
- **D12:** propuesta segura: al pasar `unlisted→public`, revocar automáticamente el enlace activo para que no resucite tras una nueva transición a oculto; **no** revocar grants activos ni borrar grants revocados. En el próximo cambio a oculto, crear otro enlace. Revisar UX de confirmación antes de implementar.
- **D13:** mantener por defecto el universo de sugerencias general público; si se excluyen propios/inscritos, documentar nuevo criterio antes de codificar.
- **D14:** TTL de URLs firmadas actuales y política de Storage. Proponer 60–120 s para media de ocultos, según factibilidad, dejando constancia de la ventana residual que RLS no puede invalidar.

### Invariante especial al alternar visibilidad repetidamente

Secuencia crítica: evento `unlisted`, usuario C con grant `revoked`, evento pasa a `public`, C se inscribe por el flujo permitido (si su estado de participación lo permite), organizador intenta volver a `unlisted`. **No convertir automáticamente su grant a `active` ni revocar su participación a escondidas.** `set_event_visibility` debe detectar cualquier `confirmed` con grant `revoked`, rechazar atomicamente el cambio con error entendible y guiar al organizador a resolverlo expresamente. En una conversión sin conflicto, todos los confirmed conservan acceso mediante grants, incluidos los ya activos, sin modificar el histórico. Probarlo con concurrencia frente a `register_for_event` mediante bloqueo del evento.

## Criterio de resolución

En Bloque 0, **aplicar directamente A01–A07**, registrar la aprobación del 12/10/2026 y verificar su viabilidad técnica, sin volver a pedir opciones ya respondidas. Revisar D02/D05/D06/D07/D12/D13/D14 por ser decisiones técnicas no confirmadas. Si alguna propuesta afectara RF/CA, seguridad o derechos de participantes, elevarla antes de ejecutar DDL remoto. Toda aprobación nueva se registra con fecha/PR.

## Actualización visual R4 v1.2 — 13/10/2026 (sin nuevas decisiones funcionales)

**Confirmación:** A01–A07 continúan aprobadas, sin reabrir opciones. **Cambio de diseño:** B · Amanecer v3.0 desplaza la apariencia marina oscura. `PRODUCT.md` → `DESIGN.md` → `DESIGN_SYSTEM.md` → código/patrones Amanecer → lab `/b` → mockup R4 histórico. No dar por aprobados filtros adicionales por aparecer en el lab; la tira de días es sólo una opción compositiva que debe ajustarse estrictamente a RF-R4-03.

**D06 / D10 / rutas a revisar:** `/me/interests`, `/invite`, `/events/:id/access` siguen siendo propuestas de implementación; si se adoptan, actualizar clasificación de rutas en `AppLayout.tsx`, scopes `.amanecer-shell` y navegación/retorno/foco; sin quinta pestaña.

**D02 / D05 / D07 / D12 / D13 / D14** permanecen en estado anterior (propuestas técnicas pendientes); este documento no convierte sus defaults en decisiones del usuario. Al comenzar bloque 0 resolverlas documentadamente si no alteran RF/CA; consultar al responsable si cambian política sensible.

**Desfase de evidencias R3:** responsable declara R3 integrada y validada (A07), `RELEASE_3_TEST_REPORT.md` persiste `NO-GO` por E2E JWT reales y aceptación humana no documentada. Codex debe registrar esa divergencia, verificar dependencias R4 y nunca afirmar que pruebas remotas no documentadas fueron ejecutadas.
