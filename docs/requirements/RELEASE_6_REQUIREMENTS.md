# PlanIt — Contrato funcional Release 6 · Gestión avanzada y analítica

**Fuente normativa:** [Google Doc «Planificación»](https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit), pestañas «Nueva planificación — RF R1 a R7», «Criterios de aceptación — R1 a R7» y «Especificación técnica — R1 a R7», leídas el 14/10/2026.  
**Alcance:** **6 RF y 24 CA oficiales**. **Estado:** contrato documental, **NO** constancia de implementación ni aprobación QA. Sprint 1: RF-R6-01..03; Sprint 2: RF-R6-04..06.

**Regla de transcripción:** las descripciones y los 24 CA que siguen son reproducción literal de las pestañas vigentes, sin agregar condiciones técnicas dentro del texto oficial. Propuestas y asuntos abiertos se documentan por separado en `../implementation/RELEASE_6_DECISIONS_PROPOSED.md` y `RELEASE_6_PLAN.md`.

## Catálogo oficial

| RF | Funcionalidad | Prioridad | Actor | CA | Sprint |
| --- | --- | --- | --- | ---: | --- |
| RF-R6-01 | Consultar ocupación y lugares disponibles | Alta | Organizadores de eventos | 4 | 1 |
| RF-R6-02 | Consultar métricas básicas de asistencia | Alta | Organizadores de eventos | 4 | 1 |
| RF-R6-03 | Analizar asistencia por período | Media | Organizadores de eventos | 4 | 1 |
| RF-R6-04 | Exportar reportes en CSV | Media | Organizadores de eventos | 4 | 2 |
| RF-R6-05 | Recibir aviso cuando un evento complete su cupo | Alta | Organizadores de eventos | 4 | 2 |
| RF-R6-06 | Comparar desempeño entre eventos organizados | Media | Organizadores de eventos | 4 | 2 |

## Requisitos y criterios de aceptación oficiales

### RF-R6-01 — Consultar ocupación y lugares disponibles

**Prioridad:** Alta. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador visualizar el cupo total, la cantidad de inscriptos, los lugares disponibles y el porcentaje de ocupación de sus eventos, a partir de las inscripciones vigentes.

- **RF-R6-01.CA-01:** El organizador puede ver para uno de sus eventos el cupo configurado, inscripciones vigentes, lugares disponibles y porcentaje de ocupación.
- **RF-R6-01.CA-02:** Los lugares disponibles corresponden al cupo menos las inscripciones vigentes, sin mostrar valores negativos; el porcentaje es consistente con esos datos.
- **RF-R6-01.CA-03:** Las altas y bajas de participantes modifican los indicadores después de actualizar los datos.
- **RF-R6-01.CA-04:** El usuario no puede consultar el panel de gestión de eventos ajenos mediante acceso directo.

### RF-R6-02 — Consultar métricas básicas de asistencia

**Prioridad:** Alta. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador consultar estadísticas de asistentes de sus eventos, incluyendo distribuciones por edad y sexo y tendencias de nuevas inscripciones dentro de una ventana inicial.

- **RF-R6-02.CA-01:** El organizador puede acceder a estadísticas de uno de sus eventos y visualizar distribuciones de asistentes por edad y sexo cuando existan datos autorizados.
- **RF-R6-02.CA-02:** El panel permite consultar la evolución de nuevas inscripciones dentro de una ventana inicial definida, de forma coherente con los registros del evento.
- **RF-R6-02.CA-03:** Las cantidades y agrupaciones son consistentes con el conjunto de asistentes considerado; se especifica cuándo faltan datos para algún grupo.
- **RF-R6-02.CA-04:** Si no hay suficientes datos se muestran indicadores vacíos o informativos, sin gráficos con valores inventados.

### RF-R6-03 — Analizar asistencia por período

**Prioridad:** Media. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador cambiar el período de análisis y consultar la evolución de las inscripciones o asistencias de sus eventos en el intervalo elegido.

- **RF-R6-03.CA-01:** El organizador puede elegir entre períodos disponibles o un intervalo válido de análisis para su evento.
- **RF-R6-03.CA-02:** Al cambiar el período, se recalculan y actualizan los indicadores temporales utilizando sólo datos comprendidos en el intervalo seleccionado.
- **RF-R6-03.CA-03:** El sistema rechaza fechas de inicio posteriores a la fecha final y presenta un mensaje claro.
- **RF-R6-03.CA-04:** Los resultados de un período distinto no permanecen visibles como si correspondieran al nuevo filtro, y la consulta sólo considera eventos autorizados.

### RF-R6-04 — Exportar reportes en CSV

**Prioridad:** Media. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador exportar en formato CSV los datos de asistentes y estadísticas autorizadas de sus eventos para su análisis externo.

- **RF-R6-04.CA-01:** El organizador puede solicitar un archivo CSV de asistentes y estadísticas de uno de sus eventos.
- **RF-R6-04.CA-02:** El archivo generado contiene encabezados identificables y valores consistentes con los datos autorizados y los filtros aplicados.
- **RF-R6-04.CA-03:** El archivo puede abrirse con herramientas de lectura CSV y no incluye información privada que el organizador no tenga autorización para exportar.
- **RF-R6-04.CA-04:** Si no existen datos o la exportación falla, el sistema lo informa y no presenta una exportación incompleta como exitosa.

### RF-R6-05 — Recibir aviso cuando un evento complete su cupo

**Prioridad:** Alta. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador recibir un aviso dentro de la aplicación cuando un evento de su autoría alcance la capacidad máxima configurada.

- **RF-R6-05.CA-01:** Cuando un evento alcanza su cupo máximo mediante una inscripción confirmada, se registra un aviso dirigido al organizador.
- **RF-R6-05.CA-02:** El aviso identifica el evento que alcanzó su capacidad y está disponible en la bandeja de notificaciones de la cuenta correspondiente.
- **RF-R6-05.CA-03:** No se genera un aviso de cupo completo mientras queden lugares disponibles.
- **RF-R6-05.CA-04:** El evento no genera avisos duplicados por reintentos del mismo cambio de estado y otras cuentas no pueden consultar el aviso privado.

### RF-R6-06 — Comparar desempeño entre eventos organizados

**Prioridad:** Media. **Actor:** Organizadores de eventos.

**Descripción:** El sistema permitirá al organizador seleccionar dos o más eventos de su autoría y comparar en una misma vista la cantidad de inscriptos y el porcentaje de ocupación de cada uno, para identificar diferencias de desempeño.

- **RF-R6-06.CA-01:** El organizador puede seleccionar al menos dos eventos de su autoría para incluirlos en una comparación.
- **RF-R6-06.CA-02:** La comparación muestra, para cada evento seleccionado, la cantidad de inscriptos y el porcentaje de ocupación utilizando el mismo criterio de cálculo.
- **RF-R6-06.CA-03:** Al cambiar los eventos seleccionados, la vista se actualiza y permite identificar las diferencias entre sus valores.
- **RF-R6-06.CA-04:** No se permite incluir eventos ajenos ni presentar un porcentaje inválido cuando un evento no tiene un cupo utilizable; se informa esa situación.

## Límites documentales y trazabilidad

- R6 **no** implementa creación de cupo o inscripción (R1), edición de cupo ni gestión de asistentes (R3).
- «Criterios de aceptación» define objetivos de verificación, **no** resultados. No marcar ninguno como PASS por haberlo copiado.
- «Especificación técnica» requiere consultas agregadas y autorización por propiedad del evento, demografía sin divulgar datos individuales, CSV seguros y avisos **in-app**. Son obligaciones de implementación, no cambios de redacción de los CA anteriores.
- En especial, «asistencia» no equivale necesariamente a asistencia física: el esquema disponible registra inscripciones, no control de entrada. La decisión de rotulado debe aprobarse antes del panel.
- Matriz de ejecución y evidencia: `../qa/RELEASE_6_ACCEPTANCE.md`. Contratos propuestos: `../implementation/RELEASE_6_PLAN.md`.
