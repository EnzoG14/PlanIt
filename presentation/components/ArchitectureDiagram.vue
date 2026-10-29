<template>
  <div class="architecture" role="img" aria-label="La PWA React se conecta por HTTPS a Supabase Auth, API y RPC de PostgreSQL con RLS, y Storage privado. Realtime envía señales por WebSocket para reconsultar datos autorizados. Mapbox provee mapas y búsqueda geográfica. Edge Functions resuelven operaciones de servidor.">
    <section class="client-node">
      <h2>PWA</h2><p class="node-lead">Interfaz y navegación</p>
      <p>React 19 · TypeScript<br />React Router</p><div class="node-rule"></div>
      <p>Vite 8<br />Manifest + Service Worker</p><small>Instalable desde el navegador</small>
    </section>
    <div class="transport">
      <div><span>HTTPS</span><FlowConnector class="transport-arrow" /><small>supabase-js</small></div>
      <div class="realtime-path" v-click="1"><span>WebSocket</span><FlowConnector class="transport-arrow" :both="false" reverse /><small>Señal y reconsulta</small></div>
    </div>
    <section class="backend-node">
      <h2>Supabase</h2>
      <div class="backend-services">
        <div><h3>Auth</h3><p>Identidad y sesión</p></div>
        <div><h3>PostgreSQL</h3><p>API + RPC transaccionales</p><strong>RLS y permisos</strong></div>
        <div><h3>Storage</h3><p>Archivos privados</p></div>
      </div>
      <div class="realtime-node" v-click="1"><strong>Realtime</strong><span>Chat y notificaciones</span></div>
    </section>
    <div class="supporting-services" v-click="2">
      <div><strong>Mapbox</strong><span>PWA <FlowConnector class="inline-connector" /> mapas y geocodificación</span></div>
      <div><strong>Edge Functions</strong><span>PWA <FlowConnector class="inline-connector" /> operaciones de servidor y medios</span></div>
    </div>
  </div>
</template>
