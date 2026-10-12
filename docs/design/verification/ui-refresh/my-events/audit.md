# Audit final — Mis eventos

12/10/2026. Auditoría acotada al piloto, con evidencia Edge/fixtures y código; no reemplaza el audit histórico ni certifica toda la PWA.

| Dimensión | /4 | Evidencia y límite |
| --- | --- | --- |
| Accesibilidad | 3 | Semántica/foco preservados, contraste medido, targets comprobados y textos accesibles; lector de pantalla/dispositivo pendiente |
| Performance | 3 | Miniaturas lazy, sin fuentes/dependencias nuevas ni efectos costosos; sin mediciones de latencia real |
| Theming | 3 | Sistema aprobado aplicado y CSS acotado; UI de diálogos/global aún no migrada |
| Responsive | 3 | Seis tamaños, poca altura, texto duplicado, largas listas/textos y menú; emulación no acredita gestos físicos |
| Integridad | 3 | Reutilización, contratos intactos y regresiones; fotografías reales/E2E pendiente |
| Total | **15/20** | Buena base para revisión humana; sin P0/P1 nuevos confirmados en el piloto |

Integridad: conforme al sistema marino/sólido de gestión y al contrato actual. Detector TSX cero hallazgos; revisión visual y pruebas aportan evidencia independiente. Todos los P2 de la primera versión se corrigieron en el alcance descrito en [critique](critique.md). La prueba final no es una auditoría integral R1–R3.

## Contraste

Ratios de luminancia calculados por Assessment B: blanco/primary **5,69:1**; muted/bg **9,72:1**, muted/elevated **8,87:1**, muted/field **8,25:1**; success/elevated **8,40:1**, success/field **7,82:1**; danger/elevated **5,61:1**, danger/field **5,23:1**. Borde de control contra bg/elevated/field **4,19/3,82/3,56:1**. Azul del indicador de pestaña/bg **3,40:1**. Divisor/elevated **1,70:1**, decorativo y sin responsabilidad de identificar un control.

## Responsive y recuperación

Sin overflow horizontal en los casos del runner. Creación, pestañas, filtros, acciones de menú y navegación mantienen áreas mínimas. Menú dentro de viewport y último comando alcanzable por foco a 360 px de altura; aviso textual de continuación sin degradado decorativo. El runner de layout comprueba page buttons/create/nav; no acredita automáticamente el header de cuenta. La lista enlazada conserva textos completos en el árbol accesible a pesar del clamp visual. Sin imágenes ficticias presentadas como contenido real.

Tab switching por flechas y regresiones Home/End, Escape y regreso se conservan. Error/reintento, carga adicional fallida, filtros, precedencia, sesión/cuenta y respuestas tardías cubiertos por los checks existentes. Cargas y errores no se sustituyen por simulaciones de éxito.

Pendientes concretos: lector de pantalla, zoom nativo/400%, tacto/safe areas físicos, fotos reales claras/oscuras, E2E remoto. A1, A3 global y A8 históricos no se cierran con esta pantalla. El aviso de peso Mapbox y warnings locales de Impeccable no fueron causados por el rediseño. Próximo paso: revisión visual/funcional de la PR draft; no requiere otra dirección visual.
