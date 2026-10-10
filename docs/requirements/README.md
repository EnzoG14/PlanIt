# Requisitos funcionales de PlanIt

Este directorio contiene **contratos funcionales versionados para trabajo local de Codex**. La fuente original sigue siendo el [documento «Planificación»](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit).

## Convención

- `RELEASE_N_REQUIREMENTS.md`: fuente de requisitos funcionales, actores/prioridades y criterios de aceptación de la release; redacción original.
- `../implementation/RELEASE_N_PLAN.md`: cómo, en qué orden y bajo qué restricciones se implementan.
- `../implementation/RELEASE_N_STATUS.md`: avance, PR, migraciones, evidencias y pendientes.
- `../qa/RELEASE_N_ACCEPTANCE.md`: verificación realizada contra cada criterio, sin inventar aprobaciones.
- `../design/mockups/release-N.png`: referencias visuales; **no introducen funcionalidades por sí solas**.

## Fuentes y trazabilidad

Para R2 se realizó extracción el **10/10/2026** de:
- [Nueva planificación — RF R1 a R7](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.6cfgj0znk3o): RF-R2-01 a RF-R2-07 con nombre, descripción, prioridad y actores.
- [Criterios de aceptación — R1 a R7](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.89mq08i5ups2): 28 CA de R2, cuatro por RF.
- [Especificación técnica — R1 a R7](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.58du83a4qpv): referencia complementaria, **no transcrita como mandato paralelo**.

**Archivo disponible:** [RELEASE_2_REQUIREMENTS.md](RELEASE_2_REQUIREMENTS.md).

## Política de cambios

1. Tratar estos RF/CA como **contrato aprobado y estable**, no como un archivo de progreso; Codex debe leerlos pero **no editarlos unilateralmente**.
2. Si cambia un RF o CA en Google Docs, proponer primero una modificación de alcance, consignar fuente/fecha y revisar efectos en plan, status y tests.
3. No copiar la especificación técnica completa ni agregar funciones de un mockup sin RF/CA aprobado. En caso de contradicción, **escalar la diferencia para revisión humana**; no resolverla silenciosamente.
4. No asumir que un requisito existe en el código o la base porque esté escrito aquí. Verificar rama y migraciones reales.
5. Las releases posteriores se incorporan sólo tras reconciliar requisitos entre las pestañas del documento fuente. No inventar ni completar requisitos faltantes.

