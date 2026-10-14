# Paquete de planificación PlanIt R5

**Es la R5 vigente «Comunidad y relaciones sociales»** (8 RF, 33 CA), no la antigua R5 de descubrimiento que pasó a R4.

Archivos: `RELEASE_5_PLAN.md` (arquitectura, alcance, seguridad, secuencia, DoD), `RELEASE_5_DECISIONS_PROPOSED.md` (D01–D05 aprobadas, D06–D08 pendientes técnicos), `RELEASE_5_ACCEPTANCE.md` (matriz de 33 CA), `RELEASE_5_STATUS.md` (tracking) y 11 prompts autocontenidos `prompts/RELEASE_5_BLOCK_0.md` a `BLOCK_10.md`.

**Versión 1.1 (14/10/2026):** cinco decisiones de producto confirmadas: perfil no disponible por bloqueo; bio + eventos públicos a seguidores aceptados; DM entre autenticados sin seguimiento; bandeja desde perfil; autoaceptación atómica de pendientes al pasar private→public. Esta última decisión es posterior al Google Doc vigente y requiere actualización normativa explícita.

**Uso:** revisar decisiones aprobadas y los contratos de datos entregados; ejecutar un bloque por PR, respetando autorización antes de cambios en Supabase remoto y antes de continuar el siguiente bloque. El historial de cada entrega está en STATUS; publicar PR no equivale a aplicar SQL. Fuente normativa: [Google Doc](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), nueva planificación, criterios de aceptación y especificación técnica. Referencias: [`RELEASE_4_PLAN.md`](https://github.com/EnzoG14/PlanIt/blob/main/docs/implementation/RELEASE_4_PLAN.md) y [`RELEASE_4_STATUS.md`](https://github.com/EnzoG14/PlanIt/blob/main/docs/implementation/RELEASE_4_STATUS.md).

**Ejecución (14/10/2026):** B1 integrado por PR #51, [contrato](RELEASE_5_BLOCK_1_CONTRACT.md) y migraciones aplicadas/verificadas por autorización previa ([acta](../qa/r5-block-1/REMOTE_MIGRATION.md)). B2 autorizado e implementado: [participantes sociales, pruebas y límites](../qa/r5-block-2/README.md), [estado](RELEASE_5_STATUS.md). Sin migraciones nuevas; gateway avatar aún no desplegado, fallback disponible. C02/C03 vigentes. QA integral pendiente; detenerse antes de B3.
