# Reproducción B7

Requisitos: Node 24, dependencias del lockfile instaladas (`npm ci`), Edge Chromium y Playwright disponible en el runtime indicado o `PLANIT_PLAYWRIGHT_PATH` absoluto. No usa cuentas ni Supabase. La prueba Google transmite exclusivamente un evento ficticio y no guarda nada.

```powershell
npm install --prefix .r7-calendar.local --no-save --no-package-lock --ignore-scripts ical.js@2.2.1
node scripts/check-r7-calendar.mjs
node scripts/check-r7-calendar-ui.mjs
node scripts/check-r7-calendar-google.mjs
npm run build
npm run lint
node scripts/check-events.mjs
node scripts/check-realtime.mjs
```

`PLANIT_ICAL_PATH` permite indicar otro path al parser ical.js 2.2.1. La instalación temporal, el arnés Vite generado y `.env.local` están ignorados; ningún paquete agregado a package.json/lockfile. UI abre sólo el componente real con DTO sintético, sin modificar rutas/config de producto. Las capturas before representan el arnés sin componente, **no** el detalle integrado actual.

El arnés comprueba window.open con instrumentación para evitar navegación externa durante la batería. El script Google separado intenta la URL real: revisar `google/attempt.json`, no convertir un HTTP 200 o una redirección en evidencia de precarga. Se requiere prueba manual con cuenta apropiada para precarga/importación; no registrar credenciales en evidencia.

Fuentes: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), prompt R7 B7, contratos B0 sección 8, D06 confirmada y autorización específica del responsable para exportar ocultos con aviso. No se utiliza Google events.insert, OAuth ni sincronización.
