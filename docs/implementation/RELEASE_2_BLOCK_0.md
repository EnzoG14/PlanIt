# PlanIt — Release 2, BLOQUE 0

## Propósito

Fijar rutas y contratos visuales mínimos para R2 sin presentar pantallas, contenido de ejemplo ni acciones que todavía no tengan comportamiento real. El bloque no cambia consultas, datos, autenticación ni el esquema de Supabase.

## Rutas y disponibilidad

| Ruta | Estado al cierre del bloque | Destino / regla |
| --- | --- | --- |
| `/` | Existente | Continúa redirigiendo a `/map`. |
| `/home` | Definida; pendiente | Inicio, se habilita con el bloque 1. |
| `/map` | Existente | Mapa R1; se conserva sin cambios. |
| `/my-events` | Existente | Mis eventos R1; se conserva sin cambios. |
| `/events/new` | Existente | Crear evento R1; se conserva sin cambios. |
| `/events/:id` | Existente | Detalle mínimo R1; el bloque 1 lo ampliará sin cambiar el enlace. |
| `/events/:id/chat` | Definida; pendiente | Chat del evento, se habilita con el bloque 2. |
| `/me` | Existente | Perfil propio actual; el bloque 3 lo ampliará. |
| `/notifications` | Definida; pendiente | Bandeja real, se habilita con el bloque 4. |

Las rutas pendientes aún no se registran en React Router y no aparecen en la navegación. La navegación principal actual de R1 permanece intacta; Inicio, Chat y Notificaciones se agregan cuando sus pantallas tengan comportamiento real. Los enlaces R1 a eventos siguen usando `/events/:id`.

## Contratos mínimos de pantalla

- **Inicio:** solo eventos consultados desde datos persistidos y accesibles, agrupados por su categoría real. Una tarjeta reutiliza `EventCard` o `CompactEventCard` si su contenido coincide; abre `/events/:id`. Loading, error y ausencia de resultados usan estados compartidos, sin tarjetas de muestra.
- **Detalle ampliado:** conserva `/events/:id` y las acciones reales de R1. El bloque 1 añade únicamente los datos disponibles del evento, categoría, organizador autorizado e imágenes existentes; campos opcionales ausentes no se rellenan con valores ficticios.
- **Chat:** `/events/:id/chat` se habilita en el bloque 2; requiere autorización real para leer y enviar. Mensajes, emisor y orden provienen del historial persistido. No se representa una conversación de ejemplo.
- **Mi perfil:** `/me` muestra únicamente los datos propios disponibles y autorizados. No adelanta perfiles públicos, edición avanzada ni métricas sociales.
- **Notificaciones:** `/notifications` se habilita en el bloque 4 y consulta avisos reales de la cuenta. Una bandeja vacía es válida; el mockup no autoriza generar recordatorios ni avisos ficticios.

Estos son contratos de presentación, no nuevas interfaces TypeScript ni contratos de API. Los tipos y consultas se definen en los bloques funcionales junto con los datos reales que utilicen.

## Contrato visual y límites

- Preservar la identidad dark-first azul marino, superficies elevadas oscuras, acento azul y gradiente azul-violeta del mockup R2; mantener tipografía sans, jerarquía clara, tarjetas redondeadas e iconografía lineal.
- Diseñar mobile-first, con adaptación de una columna a escritorio, áreas táctiles accesibles, foco visible y espacio inferior seguro para navegación móvil.
- Omitir hasta que tengan requisitos y comportamiento aprobado: búsquedas/filtros avanzados, favoritos, seguimiento, contadores sociales, asistentes identificables, entradas/tickets, recordatorios y controles decorativos del collage.
- No reutilizar fotos, títulos, horarios, nombres ni métricas de ejemplo del mockup como contenido. Los placeholders visuales deben identificarse como tales y no aparentar datos de eventos reales.

## Verificación de BLOQUE 0

El cierre de implementación registra en `RELEASE_2_STATUS.md` los comandos ejecutados, su resultado y los límites de revisión visual. Este bloque no crea migraciones ni modifica recursos remotos. Su estado requiere revisión humana antes de considerarse validado.
