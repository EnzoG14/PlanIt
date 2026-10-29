# R6 B3 — Decisiones aprobadas y contrato de demografía

**Actualización 29/10/2026:** el responsable aprobó retirar la supresión y mostrar grupos desde una persona. El contrato vigente se describe en [la adenda de estadísticas y CSV](STATISTICS_DEMOGRAPHICS_CSV.md); el texto siguiente es el antecedente del 15/10.

15/10/2026. Adenda posterior al contrato B0; conserva los RF/CA oficiales sin editar su texto. Sólo autoriza B3, no B4, DDL remoto, deploy o merge.

## D04 — Exactitud actual y riesgo residual aceptado

En este chat se explicó el ejemplo «5 mujeres y 5 varones → entra una persona → 6 mujeres y 5 varones»: comparar consultas permite deducir el atributo de la persona nueva aunque cada celda tenga cinco o más personas. Se ofrecieron cifras exactas con riesgo residual frente a publicación limitada/aproximación. El responsable eligió expresamente: **«vamos con Estadísticas exactas y actualizadas»**.

Esta decisión reemplaza la exigencia anterior de impedir toda inferencia temporal o entre eventos del plan/prompt B3 y el gate D04 de B0. **No se promete anonimato ni protección frente a conocimiento auxiliar, cohortes homogéneas, cruces entre dimensiones o conjuntos solapados.** El test SQL reproduce 5/5→6/5 temporal y multievento como límite conocido, no como garantía superada.

Política técnica adoptada para materializar agrupación y protección de grupos pequeños:

- Sólo participantes `confirmed` actuales; el organizador queda fuera.
- `k=5`, conservando el umbral propuesto en B0. Si **cualquier** categoría de una dimensión tiene entre 1 y 4 personas, se suprime **toda** esa dimensión, incluyendo ceros, porcentajes y «Sin informar». No se envían conteos ocultos, subtotales ni totales por dimensión. Es una supresión complementaria conservadora, sin elegir celdas adicionales que puedan variar entre consultas.
- Con población cero: `empty`, sin grupos. Con población no vacía y celdas positivas ≥5: `available`, categorías fijas y conteos exactos; cero es un cero real. Con alguna celda 1..4: `suppressed`, sin grupos. Edad y sexo se evalúan separadamente; no hay cruces ni filtros demográficos.
- La ocupación B1 conserva su total autorizado. La supresión completa evita la resta dentro de una distribución; no elimina las inferencias entre consultas expresamente aceptadas.
- B5 deberá reutilizar esta política antes de exportar demografía; B3 no incorpora exportación ni emite autorización de acceso individual a sexo/fecha de nacimiento.

## D08 y dependencias D05/D06

El responsable contestó **«Si»** a la pregunta de aprobación de D08, que también señalaba las propuestas D05/D06 del contrato B0 como dependencias del prompt y su implementación exclusiva en B5. Se registra esa respuesta conjunta; B3 no define nuevas columnas ni formatos CSV.

D08: edad al día local de consulta en Argentina; años cumplidos con `age(fecha_local,birth_date)`. Rangos `<18`, `18–24`, `25–34`, `35–44`, `45–54`, `55+`, `Sin informar`. Para nacimiento 29/02, `age` cumple el año el 01/03 en año no bisiesto (28/02 aún conserva el anterior); pruebas SQL explícitas. La fecha de referencia viaja en `age_as_of`. Sexo declarado `female/male/other/NULL` → Femenino/Masculino/Otro/Sin informar.

## Contrato y autorización

`public.get_my_event_demographics(p_event_id uuid) → jsonb`, STABLE SECURITY DEFINER, `search_path=''`, EXECUTE sólo `authenticated`. `auth.uid()` y ownership verificados **antes** de leer perfiles/participaciones. El DEFINER es necesario por RLS owner-only; no se cambian grants de tablas, políticas, triggers ni la proyección social R5.

DTO allowlist: `event_id`, `as_of` (timestamp local sin zona), `age_as_of` (date), `age`, `sex`. Cada dimensión contiene exclusivamente `state` y `groups`; cada grupo `key` y `count`. Sin UUID de personas/participaciones, cumpleaños, edades exactas, correo ni atributos individuales. Errores genéricos `authentication_required` / `event_unavailable` (42501); anon sin EXECUTE. Mismo rechazo para ID ajeno/inexistente/NULL. Sin tablas nuevas ni contadores persistidos.

La interfaz valida la forma completa, umbral, categorías, sumas y estados antes de renderizar; mantiene el ciclo de identidad/token/evento, abort, timeout, limpieza offline/ocultamiento/logout y actualización manual de B2. Fallar demografía conserva KPI válidos y ofrece reintento; nunca presenta una falla como cero.
