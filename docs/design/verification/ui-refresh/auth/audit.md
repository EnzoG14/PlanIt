# Login y Registro — audit final

12/10/2026. Auditoría de código, capturas reales de Edge y fixtures interceptados. No es una certificación WCAG, aceptación humana ni prueba de Supabase real.

**Integridad:** coherente con Amanecer. Una fuente/paleta central, composición local `auth.css`, Foundation reutilizada. Sin nueva dependencia, métodos de acceso, modelos, SQL, configuración de auth ni cambio de lógica.

| Dimensión | Score / 4 | Evidencia y límite |
| --- | --- | --- |
| Accesibilidad | 3 | Labels, descripciones/errores, orden de tabulación, foco violeta 3 px, targets ≥44; lector real pendiente |
| Rendimiento | 3 | Misma fuente autoalojada, mancha estática, sin nueva dependencia; rendimiento físico no medido |
| Theming | 4 | Tokens centrales, scope de rutas, color-scheme claro; no hay tema oscuro en el sistema aprobado |
| Responsive | 3 | Seis tamaños, texto 200%, altura 240, sin overflow, controles alcanzables; teclado/safe areas reales pendientes |
| Integridad | 4 | Detector de B y hooks sin hallazgos; contrato de auth y piloto preservados |
| **Total** | **17/20** | Buena base; límites de entorno explícitos |

## Comprobaciones finales

- Login/Registro: 320×800, 360×800, 375×812, 390×844, 768×1024, 1280×900. 156 PNG finales: inicial, vacíos/errores, contraseña visible/oculta, envío retenido, error Auth, nombre/email/contraseña inválidos, duplicado, confirmación, sesión en comprobación/error, texto al 200% y altura 240, fuente bloqueada, transparencia reducida.
- Teclado: tab desde main a campos → mostrar contraseña → submit; Enter valida; foco al primer inválido y al feedback. Cada error usa aria-invalid/aria-describedby. Password toggle conserva nombre/aria-pressed. Targets medidos de submit, toggle, enlaces de cambio/brand/volver ≥44×44. La ayuda de registro permanece visible.
- Bloqueo de doble envío: dos requestSubmit adicionales durante el fixture retenido no generan otra solicitud. Inputs, toggle y submit deshabilitados; feedback de carga existente. Fixtures prueban error y datos conservados, cuenta sin identidades como duplicada y confirmación sin sesión; payload y emailRedirectTo originales verificados.
- Auth runner intercepta todas las solicitudes no locales y bloquea service workers. No usa route.fetch/continue para URLs remotas. Requests no esperados y errores JS vacíos. Fuente autoalojada cargada y fallback sin woff2 comprobados.
- Reduced-motion: contexto de navegador reduce; mancha sin animación. Foco se mide después de estabilizar la transición compartida. Reduced-transparency: emulación de media de Chromium verifica glass opaque .96 y blur none. No se atribuye prueba de navegador sin soporte backdrop-filter; el fallback compartido permanece intacto.
- [Contrastes](contrast.json): 11 pares cumplen sus umbrales. Texto secundario/cristal 4,88:1 sobre el límite conservador de la mancha real (tres gradientes a alfa máximo antes de su máscara); descripción/mancha 4,524:1; placeholder/blanco 4,628:1; borde/blanco 3,759:1; error/pastel 7,816:1. No se usa el violeta sólido como fondo de formulario.
- Mis eventos: 36 registros comunes de geometría/estilos idénticos; seis PNG Organizo idénticos. 34/42 PNG comunes idénticos; ocho diferencias de estados dinámicos registradas en [comparación](my-events-comparison.json), sin diferencias de estilos/geometría. Fuentes del piloto intactas.
- PASS regresiones funcionales con fixtures: Mis eventos (375/1280), Inicio/detalle, Mapa/descubrimiento y Chat. La ruta no opt-in del runner conserva el shell oscuro tras salir de Auth.
- PASS build, lint, tokens (83 valores), validación Auth/safeReturnPath, Foundation/config/manifest/SW. [Logs y resultados](checks.json). Warning previo de tamaño del módulo Mapbox conservado.

## Hallazgos y alcance pendiente

Sin nuevo P0/P1 ni P2 de presentación confirmado tras polish/harden. No se ejecutó backend remoto, SQL local, lector de pantalla real, zoom nativo 200/400%, teclado iOS/Android, safe areas físicas o rendimiento móvil. Texto 200% es fixture de tamaños calculados, no zoom del navegador. Placeholders largos pueden desplazarse/truncarse dentro del input; labels y ayuda permanente siguen disponibles. No se cambiaron reglas de validación ni mensajes heredados por estética.

El sidecar de Impeccable es anterior a DESIGN.md; se usó DESIGN.md como norma y no se ejecutó document/init/shape.
