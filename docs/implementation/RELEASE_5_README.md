# Paquete de planificación PlanIt R5

**Entrega B7 — 14/10/2026:** solicitudes privadas con resolución versionada, confirmación, protección de doble envío y conciliación de respuesta perdida. [Evidencia](../qa/r5-block-7/README.md), [estado](RELEASE_5_STATUS.md). **Implementado; QA pendiente**, B0–B6 integrados. Sin SQL nuevo ni deploy; detenerse para revisión de PR. B8 requiere instrucción independiente. Los cortes siguientes son históricos.

**Entrega B6 — 14/10/2026:** follow/unfollow, pending cancelable, contadores y listas autorizadas implementados sobre B1. [Evidencia](../qa/r5-block-6/README.md), [estado](RELEASE_5_STATUS.md). **Implementado; QA pendiente**; detenerse para revisión de PR. B7 requiere aprobación independiente. Cortes anteriores conservados como historia.

**Entrega B4 — 14/10/2026:** B0–B3 integrados (#50–#53). B4 autorizado e **Implementado; QA pendiente**, base `286d38ecf7e461ebd9218a6f71e8ff10a41e0bae`, rama `codex/r5-block-4`. `/me/edit`, datos/privacidad por RPC B1 y avatar independiente con reconciliación/limpieza; sin migración nueva ni deploy. [Entrega, pruebas y límites](../qa/r5-block-4/README.md). Las referencias siguientes a B4 no autorizado describen cortes históricos. Detenerse para revisión de PR; B5 no autorizado.

**Entrega B3 — 14/10/2026:** B0–B2 integrados; B3 autorizado e Implementado; QA pendiente. Perfil/bio autorizada y lista paginada de eventos públicos vigentes sobre RPC B1, sin SQL nuevo/deploy. [Evidencia](../qa/r5-block-3/README.md), [estado](RELEASE_5_STATUS.md). Detenerse para revisión de PR; B4 requiere autorización. Los cortes siguientes se conservan como antecedentes.

**Es la R5 vigente «Comunidad y relaciones sociales»** (8 RF, 33 CA), no la antigua R5 de descubrimiento que pasó a R4.

Archivos: `RELEASE_5_PLAN.md` (arquitectura, alcance, seguridad, secuencia, DoD), `RELEASE_5_DECISIONS_PROPOSED.md` (D01–D05 aprobadas, D06–D08 pendientes técnicos), `RELEASE_5_ACCEPTANCE.md` (matriz de 33 CA), `RELEASE_5_STATUS.md` (tracking) y 11 prompts autocontenidos `prompts/RELEASE_5_BLOCK_0.md` a `BLOCK_10.md`.

**Versión 1.1 (14/10/2026):** cinco decisiones de producto confirmadas: perfil no disponible por bloqueo; bio + eventos públicos a seguidores aceptados; DM entre autenticados sin seguimiento; bandeja desde perfil; autoaceptación atómica de pendientes al pasar private→public. Esta última decisión es posterior al Google Doc vigente y requiere actualización normativa explícita.

**Uso:** revisar decisiones aprobadas y los contratos de datos entregados; ejecutar un bloque por PR, respetando autorización antes de cambios en Supabase remoto y antes de continuar el siguiente bloque. El historial de cada entrega está en STATUS; publicar PR no equivale a aplicar SQL. Fuente normativa: [Google Doc](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), nueva planificación, criterios de aceptación y especificación técnica. Referencias: [`RELEASE_4_PLAN.md`](https://github.com/EnzoG14/PlanIt/blob/main/docs/implementation/RELEASE_4_PLAN.md) y [`RELEASE_4_STATUS.md`](https://github.com/EnzoG14/PlanIt/blob/main/docs/implementation/RELEASE_4_STATUS.md).

**Ejecución (14/10/2026):** B1 integrado por PR #51, [contrato](RELEASE_5_BLOCK_1_CONTRACT.md) y migraciones aplicadas/verificadas por autorización previa ([acta](../qa/r5-block-1/REMOTE_MIGRATION.md)). B2 autorizado e implementado: [participantes sociales, pruebas y límites](../qa/r5-block-2/README.md), [estado](RELEASE_5_STATUS.md). Sin migraciones nuevas; gateway avatar aún no desplegado, fallback disponible. C02/C03 vigentes. QA integral pendiente; detenerse antes de B3.
