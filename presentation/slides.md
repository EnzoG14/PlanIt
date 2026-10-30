---
theme: default
title: PlanIt — Proyecto Final
author: Grupo N.º 1 · UTN FRRe
info: Presentación completa de PlanIt, releases R1–R7 y cierre. 54 diapositivas. Ingeniería en Sistemas de Información, 2026.
aspectRatio: 16/9
canvasWidth: 1280
colorSchema: light
wakeLock: false
layout: planit
transition: fade
fonts:
  sans: Bricolage Grotesque
  provider: none
  local: Bricolage Grotesque
drawings:
  enabled: false
mdc: true
exportFilename: planit-completa
name: cover
---

<div class="cover-top"><strong>Proyecto Final</strong><span>Ingeniería en Sistemas de Información · 2026</span></div>

<div class="cover-brand"><img src="/assets/logos/planit.svg" alt="Logotipo de PlanIt" /><h1>Plan<span>It</span></h1></div>

<p class="cover-purpose">Descubrí, organizá y participá<br />en eventos y actividades sociales</p>

<div class="cover-bottom">
  <div class="institution"><strong>UTN</strong>Facultad Regional Resistencia</div>
  <div class="team"><strong>Grupo N.º 1</strong>Carlos Federico Almirón · Rodrigo Córdoba · Enzo Joaquin González Urbieta<br />Rafael Lezcano · Joaquín González Zago</div>
</div>

<!--
Propósito: Planificación Oficial, cabecera y §3. Equipo: §2.2. Institución y ciclo: portada oficial. La grafía de los integrantes se actualiza según la tabla de responsabilidades, conservando Enzo Joaquin tal como consta allí.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: team
title: Equipo de proyecto
---

# Equipo de proyecto

<TeamRoster />

<p class="team-note"><strong>Product Owner compartido.</strong> Las responsabilidades pueden combinarse y rotar.</p>

<SlideFooter />

<!--
Planificación Oficial §2.2: funciones y responsabilidades del equipo. Nombres con grafías de la tabla oficial; los roles se resumen sin asignar funciones nuevas. Enzo Joaquin conserva la grafía de la fuente.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: agenda
title: Agenda
---

# Agenda

<ol class="agenda-list">
<li>Situación problemática</li><li>Solución propuesta</li><li>Requisitos y usuarios</li><li>Tecnología y arquitectura</li><li>Enfoque de trabajo</li><li>Planificación y releases</li>
</ol>

<p class="closing-agenda-note">Al final: demo, evolución del producto y conclusiones.</p>

<SlideFooter />

<!--
Secuencia editorial adaptada de Proyecto Final — Equipo 6 y del modelo SysAssign (páginas 5–12). Ajuste autorizado el 29/10/2026: problema, solución, funcionalidades, oportunidades por usuario, beneficios y alcance. El contenido corresponde a PlanIt. Se conserva demo, evolución, conclusiones y agradecimiento después de R7.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: problem
title: Situación problemática
---

# Situación problemática

<p class="slide-lead">Encontrar y dar a conocer actividades sociales cercanas.</p>
<div class="problem-rows content-section">
<div><h2>Distintos medios</h2><p>Las propuestas se reparten entre plataformas.</p></div>
<div><h2>Descubrimiento difícil</h2><p>Cuesta encontrar actividades por ubicación e intereses.</p></div>
<div><h2>Difusión de iniciativas</h2><p>Quienes organizan necesitan dar a conocer sus propuestas.</p></div>
</div>

<SlideFooter />

<!--
ERS Oficial §2.1: PlanIt surge ante la dificultad de encontrar y dar a conocer actividades cuya información se encuentra dispersa. Esta síntesis no atribuye estadísticas ni resultados de entrevistas no documentadas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r
-->

---
layout: planit
name: product
title: Solución propuesta
---

<div class="product-heading"><h1>Solución propuesta</h1><p>Una PWA, dos formas de usarla</p></div>

<div class="product-gallery">
  <PhoneCapture src="/assets/screenshots/discover.png" alt="Inicio real de PlanIt con eventos de prueba y filtros" label="Descubrir" detail="Explorar eventos y actividades" />
  <PhoneCapture src="/assets/screenshots/organize.png" alt="Formulario real de creación de eventos en PlanIt" label="Organizar" detail="Crear un evento completo" />
  <PhoneCapture src="/assets/screenshots/participate.png" alt="Detalle real de un evento de prueba con cupos y acción Unirme" label="Participar" detail="Consultar cupos e inscribirse" />
</div>

<div class="slide-footer"><span>Capturas de la app local con datos de prueba</span><span class="mini-brand">PlanIt</span></div>



<!--
Planificación Oficial §§5–11 y ERS Oficial §2.2. Reutiliza las capturas aprobadas de la app React real en localhost con fixtures interceptados. La aclaración visible permanece: no son datos productivos ni aceptación remota. Organizar y participar son formas de uso no excluyentes.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: features
title: Funcionalidades principales
---

# Funcionalidades principales

<div class="feature-list content-section">
<div><h2>Descubrimiento</h2><p>Mapa, búsqueda, filtros y sugerencias.</p></div>
<div><h2>Organización</h2><p>Eventos, imágenes, asistentes y accesos.</p></div>
<div><h2>Participación</h2><p>Inscripción, retiro y Mis eventos.</p></div>
<div><h2>Comunicación</h2><p>Chat del evento y mensajes privados.</p></div>
<div><h2>Comunidad</h2><p>Perfiles, seguimientos e historias.</p></div>
<div><h2>Gestión e integraciones</h2><p>Analítica, reportes, calendario y avisos.</p></div>
</div>

<SlideFooter />

<!--
Planificación Oficial §3.2 y objetivos de R1–R7, §§5–11. Son capacidades del alcance funcional; su agrupación es una síntesis editorial. La existencia de código y las capturas no certifican aceptación integral, despliegue de workers ni pruebas en dispositivos.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: participant-opportunity
title: Oportunidad de mejora — Participantes
---

# Oportunidad de mejora

<div class="opportunity-layout content-section">
<div class="opportunity-user"><h2>Participantes</h2><p>Encontrar un plan<br />y ser parte.</p></div>
<div class="opportunity-needs">
<div><h3>Encontrar actividades afines</h3><p>Descubrir propuestas cercanas según sus intereses, entre información dispersa.</p></div>
<div><h3>Gestionar la participación</h3><p>Consultar detalles y cupos, inscribirse o retirarse de una actividad.</p></div>
<div><h3>Seguir sus actividades</h3><p>Reunir sus planes en Mis eventos y comunicarse con otras personas.</p></div>
</div>
</div>

<SlideFooter />

<!--
ERS Oficial §§2.1–2.3: información dispersa, descubrimiento por ubicación e intereses, participación, Mis eventos y comunicación según permisos. Son necesidades atendidas por el alcance, no resultados medidos ni entrevistas. Participar y organizar son formas de uso no excluyentes. Referencia editorial: modelo SysAssign, página 8; se conserva la identidad Amanecer y no se reutilizan fotos ni afirmaciones de ese proyecto.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r
-->

---
layout: planit
name: organizer-opportunity
title: Oportunidad de mejora — Organizadores
---

# Oportunidad de mejora

<div class="opportunity-layout content-section">
<div class="opportunity-user"><h2>Organizadores</h2><p>Dar a conocer<br />y gestionar un plan.</p></div>
<div class="opportunity-needs">
<div><h3>Dar a conocer propuestas</h3><p>Publicar actividades y facilitar que otras personas las descubran.</p></div>
<div><h3>Centralizar la organización</h3><p>Mantener la información del evento, los cupos y la gestión de asistentes.</p></div>
<div><h3>Acompañar cada actividad</h3><p>Comunicarse con participantes y consultar estadísticas para orientar la organización.</p></div>
</div>
</div>

<SlideFooter />

<!--
ERS Oficial §§2.1–2.3: difusión de iniciativas, creación y actualización de eventos, capacidad y asistentes, comunicación, estadísticas y reportes. Síntesis de necesidades atendidas, sin atribuir eficiencia, adopción o impacto medido. Participar y organizar no son roles excluyentes. Referencia editorial: modelo SysAssign, página 9; sin copiar contenido ni recursos.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r
-->

---
layout: planit
name: benefits
title: Beneficios esperados
---

# Beneficios esperados

<p class="slide-lead">Objetivos que orientan la propuesta de PlanIt.</p>
<div class="benefit-list content-section">
<div><h2>Reunir las propuestas</h2><p>Centralizar la información de actividades sociales.</p></div>
<div><h2>Facilitar el descubrimiento</h2><p>Explorar por cercanía e intereses compartidos.</p></div>
<div><h2>Simplificar la organización y la participación</h2><p>Acompañar el recorrido del evento desde un mismo espacio.</p></div>
</div>
<SlideFooter />

<!--
ERS Oficial §§1.1–1.2 y 2.1. Beneficios esperados derivados del propósito y de la perspectiva del producto. No se presentan como mejoras medidas, validación de mercado ni impacto demostrado.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r
-->

---
layout: planit
name: scope
title: Alcance
---

# Alcance

<div class="scope-grid scope-separated content-section">
<div><h2>Descubrimiento y participación</h2><p>Explorar eventos por ubicación e intereses y gestionar la participación.</p></div>
<div><h2>Organización y comunidad</h2><p>Administrar eventos y asistentes, comunicarse y consultar estadísticas.</p></div>
</div>

<SlideFooter />

<!--
ERS Oficial §§1.2 y 2.2: alcance funcional de PlanIt para participantes y organizadores. La página de alcance se separa de limitaciones por pedido del usuario. Referencia editorial: Tatool, página 10; no se copian funciones ni responsabilidades de ese proyecto.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r
-->

---
layout: planit
name: limitations
title: Limitaciones
---

# Limitaciones

<div class="scope-grid scope-separated content-section">
<div><h2>Conectividad y servicios</h2><p>Requiere Internet y disponibilidad de los servicios de autenticación, almacenamiento y mapas.</p></div>
<div><h2>Compatibilidad y permisos</h2><p>Ubicación, notificaciones e integraciones dependen del navegador, dispositivo y permisos otorgados.</p></div>
</div>

<SlideFooter />

<!--
ERS Oficial §2.5: conexión a Internet, disponibilidad de servicios, capacidades del dispositivo y permisos. §2.4 no define restricciones adicionales: se presentan dependencias documentadas, sin inventar restricciones de edad, mercado o uso offline. Las posibilidades futuras de §2.6 se mantienen en Evolución del producto. Referencia editorial: Tatool, página 11; no se copian sus limitaciones legales ni comerciales.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r
-->

---
layout: planit
name: requirements
title: Especificación de requisitos
---

# Especificación de requisitos

<div class="requirements-counts content-section"><div><strong>53</strong><p>requisitos funcionales</p></div><div><strong>218</strong><p>criterios de aceptación</p></div></div>
<div class="traceability"><div><h2>Requisito</h2><p>Qué necesita el producto</p></div><FlowConnector :both="false" /><div><h2>Historia de usuario</h2><p>Quién, qué y para qué</p></div><FlowConnector :both="false" /><div><h2>Criterio de aceptación</h2><p>Cómo comprobar el resultado</p></div></div>
<SlideFooter />

<!--
Planificación Oficial §§2.5 y 3.2: 53 historias vinculadas a requisitos y 218 CA en las siete releases funcionales. Las cuatro historias técnicas de R0 no se suman a este total. La ERS Oficial §1.5 cita IEEE 830-1998 como referencia estructural histórica, no como certificación de cumplimiento.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: domains
title: Agrupación funcional y módulos
---

# Agrupación funcional y módulos

<p class="slide-lead">Siete áreas que amplían un mismo producto.</p>
<FunctionalGroups />
<SlideFooter label="Vista conceptual del alcance funcional" />

<!--
Planificación Oficial §3.2: las áreas y cantidades de RF coinciden con las siete releases funcionales. El esquema agrupa capacidades de negocio; no describe servicios desplegados, límites de paquetes ni componentes físicos del código.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: users
title: Usuarios del sistema
---

# Dos formas de usar PlanIt

<div class="users-split content-section">
<section><h2>Participante</h2><ul><li>Descubre y consulta eventos.</li><li>Se inscribe o se retira.</li><li>Interactúa según sus permisos.</li></ul></section>
<section><h2>Organizador</h2><ul><li>Crea y administra eventos.</li><li>Gestiona asistentes y accesos.</li><li>Consulta métricas y reportes.</li></ul></section>
</div>
<p class="users-note">La misma persona puede organizar y participar en eventos ajenos.</p>
<SlideFooter />

<!--
ERS Oficial §§1.4 y 2.3; Planificación Oficial objetivos R1, R3, R5 y R6. No son roles excluyentes ni se introduce un administrador global. El organizador no ocupa cupo en su propio evento.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r
-->

---
layout: planit
name: stack
title: Stack tecnológico
---

# Stack tecnológico

<div class="stack-list content-section">
<div><h2>Interfaz</h2><div class="stack-detail"><img class="stack-brand-image" src="/assets/tools/typescript.png" alt="TypeScript" /><p>React 19 y TypeScript</p></div></div>
<div><h2>Navegación y PWA</h2><div class="stack-detail"><img class="stack-brand-image" src="/assets/tools/pwa.png" alt="PWA" /><p>React Router, Vite 8, Manifest y Service Worker</p></div></div>
<div><h2>Datos y servicios</h2><div class="stack-detail"><img class="stack-brand-image" src="/assets/tools/supabase.png" alt="Supabase" /><p>Supabase: Auth, PostgreSQL, RLS, Storage y Realtime</p></div></div>
<div><h2>Mapas y ubicación</h2><div class="stack-detail"><img class="stack-brand-image" src="/assets/tools/mapbox.png" alt="Mapbox" /><p>Mapbox y capacidades de geolocalización del navegador</p></div></div>
</div>
<SlideFooter label="Tecnologías verificadas en la documentación y el repositorio" />

<!--
Planificación Oficial §2.6, ERS Oficial §2.1, package.json y vite.config.ts. Las versiones mayores React 19 y Vite 8 proceden del código local. No agregar proveedor de hosting, Expo ni React Native. La PWA no garantiza acceso offline a los datos privados. Logos TypeScript, PWA, Supabase y Mapbox proporcionados por el usuario, sin modificación de los archivos originales; procedencia en public/assets/tools/provenance.json.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: architecture
title: Arquitectura tecnológica
clicks: 2
---

# Arquitectura tecnológica

<p class="architecture-note">La interfaz guía. La base de datos autoriza.</p>

<ArchitectureDiagram />

<div class="slide-footer"><span>Vista lógica del código actual</span><span class="mini-brand">PlanIt</span></div>



<!--
Planificación Oficial §2.6 y ERS Oficial §2.1, contrastadas con src/lib/supabase.ts, vite.config.ts y docs/architecture.md. RLS y RPC autorizan y resuelven operaciones transaccionales en datos. [click] Realtime señala cambios y el cliente reconsulta datos autorizados. [click] Mapbox provee mapas y Edge Functions separa operaciones de servidor y medios. Este esquema no certifica el despliegue de cada función ni la aceptación operativa integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: method
title: Enfoque de trabajo
---

# Scrum adaptado al contexto universitario

<p class="slide-lead">Backlog priorizado, entregas incrementales y responsabilidades compartidas.</p>
<p class="scrum-cadence">Sprints de 2 semanas</p>
<div class="scrum-process content-section">
<div><h2>Planificación</h2><p>Seleccionar historias y acordar el objetivo.</p></div><div><h2>Seguimiento</h2><p>Reunión semanal para avances e impedimentos.</p></div><div><h2>Review</h2><p>Revisar el incremento y recibir devoluciones.</p></div><div><h2>Retrospectiva</h2><p>Acordar mejoras para la siguiente iteración.</p></div>
</div>
<div class="method-flow"><div class="artifacts-line"><span>Product Backlog</span><FlowConnector :both="false" /><span>Sprint Backlog</span><FlowConnector :both="false" /><strong>Incremento</strong></div><div class="scrum-image-frame"><img src="/assets/tools/scrum-transparent.png" alt="Diagrama del ciclo Scrum: backlog, iteraciones e incremento" /></div></div>
<SlideFooter label="Definition of Done: funcionalidad, errores, seguridad y verificaciones" />

<!--
Planificación Oficial §§2.1–2.4. Scrum está adaptado a disponibilidad y contexto académico. El seguimiento es semanal: no afirmar Daily Scrum diario. La duración de los sprints de 2 semanas fue indicada expresamente por el usuario para esta presentación el 29/10/2026 y sustituye la cautela editorial anterior. Se conservan los períodos de referencia y fechas de releases sin recalcularlos a partir de esta cadencia. Diagrama Scrum proporcionado por el usuario; fondo blanco retirado con ImageGen por pedido expreso. Original conservado en assets/originals/scrum.png y derivado transparente en public/assets/tools/scrum-transparent.png; procedencia en provenance.json.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: estimation
title: Priorización y estimación
---

# Priorizar y estimar en equipo

<div class="estimation-split content-section">
<section><div class="estimation-heading"><h2>MoSCoW</h2></div><dl class="moscow"><div><dt>Must</dt><dd>Imprescindible</dd></div><div><dt>Should</dt><dd>Importante</dd></div><div><dt>Could</dt><dd>Deseable</dd></div><div><dt>Won’t</dt><dd>Fuera del alcance</dd></div></dl><img class="moscow-image" src="/assets/tools/moscow.png" alt="Modelo MoSCoW: Must Have, Should Have, Could Have y Won’t Have" /></section>
<section><div class="estimation-heading"><h2>Planning Poker</h2><img class="poker-image" src="/assets/tools/planning-poker.png" alt="Cartas de Planning Poker" /></div><p>Considerar esfuerzo, dependencias e incertidumbre.</p><EffortLegend /><p class="emphasis">Los puntos expresan esfuerzo relativo, no horas.</p><p class="effort-explanation">Puntos propuestos para esta presentación; no son estimaciones históricas del equipo.</p></section>
</div>
<SlideFooter />

<!--
Planificación Oficial §2.5. La escala es 1, 2, 3, 5, 8 y 13 puntos. Se estima colaborativamente y se dividen historias demasiado grandes. Por autorización expresa del usuario del 29/10/2026 se asignan estimaciones propuestas a las 53 historias. No representan estimaciones históricas del equipo ni horas. Por corrección posterior del usuario se quitan las tallas de esta página y se conservan los números y colores de Planning Poker. Asignaciones y colores: data/story-effort.mjs. Imágenes MoSCoW y Planning Poker proporcionadas por el usuario; originales y procedencia en public/assets/tools/.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: tools
title: Herramientas de colaboración
---

# Herramientas de colaboración

<div class="tools-list tools-with-images content-section">
<div><div class="tool-logo-frame jira-logo"><img src="/assets/tools/jira.png" alt="Jira" /></div><h2>Jira</h2><p>Backlog, historias y tareas de cada sprint.</p></div>
<div><div class="tool-logo-frame"><img src="/assets/tools/github.png" alt="GitHub" /></div><h2>GitHub</h2><p>Código, ramas y Pull Requests.</p></div>
<div><div class="tool-logo-frame"><img src="/assets/tools/google-docs.png" alt="Google Docs" /></div><h2>Google Docs</h2><p>Documentación compartida del proyecto.</p></div>
<div><div class="tool-logo-frame"><img src="/assets/tools/whatsapp.png" alt="WhatsApp" /></div><h2>WhatsApp</h2><p>Comunicación cotidiana del equipo.</p></div>
<div><div class="tool-logo-frame"><img src="/assets/tools/discord.png" alt="Discord" /></div><h2>Discord</h2><p>Reuniones de planificación y coordinación.</p></div>
</div>
<SlideFooter />

<!--
Planificación Oficial §2.6. Se describen únicamente herramientas y usos declarados por el equipo, sin simular tableros o conversaciones. Los cinco logos fueron proporcionados por el usuario para esta presentación y se conservan sin modificar sus archivos; el viewport CSS de Jira excluye únicamente el margen transparente. Procedencia y SHA-256: public/assets/tools/provenance.json.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: planning
title: Planificación general
---

# Planificación general

<div class="planning-summary content-section"><div><strong>7</strong><h2>releases funcionales</h2></div><div><strong>13</strong><h2>sprints funcionales</h2></div><div><strong>53</strong><h2>historias vinculadas<br />a requisitos</h2></div></div>
<div class="foundation-note"><strong>Además, R0</strong><p>Un sprint de fundamentos: aprender las tecnologías,<br />organizar el trabajo y preparar el entorno.</p></div>
<SlideFooter label="R1–R7: 218 criterios de aceptación · R0 se contabiliza por separado" />

<!--
Planificación Oficial §§3.1–3.2 y 4. R1 suma un sprint y R2–R7 dos cada una: 13 funcionales; R0 agrega un sprint técnico. Son siete releases funcionales más R0, no ocho releases funcionales ni 13 sprints totales con preparación. Los 53 RF/historias y 218 CA no incluyen las cuatro historias técnicas de fundamentos.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: roadmap
title: Roadmap
---

# Roadmap

<p class="slide-lead">Períodos de referencia de la planificación oficial.</p>
<ReleaseRoadmap />
<SlideFooter label="Sin escala proporcional de duración. No certifica aceptación técnica integral." />

<!--
Planificación Oficial §3.1: reproducir los ocho intervalos exactamente. 2025 reúne R0–R3 y 2026 R4–R7. El intervalo entre R3 y R4 no implica una fase adicional: no rellenarlo con actividades inventadas. No añadir versiones v1.0 u otras tomadas del PDF de referencia. El documento oficial registra releases finalizadas, pero la entrega de código y la aceptación operativa son capas distintas. Este roadmap presenta la secuencia que se desarrolla a continuación.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: releases
title: Releases
---

# Releases

<div class="releases-opening"><h2>Del primer evento<br /><span class="emphasis">a las integraciones</span></h2><p>Siete incrementos funcionales que amplían PlanIt.</p></div>
<SlideFooter label="R1–R7 · 13 sprints funcionales · 53 historias" />

<!--
Separador editorial inspirado en la estructura del PDF Equipo 6, página 22. Contenido de PlanIt: siete releases funcionales; R0 permanece en planificación y roadmap. No se agregan demo ni conclusiones.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §3.2.
-->

---
layout: planit
name: r1-cover
title: Release 1
---

# Release 1

<ReleaseCover :release-number="1" />
<SlideFooter label="Planificación oficial · Período de referencia de la release" />

<!--
Nombre, objetivo y fechas de R1: calendario oficial §3.1 y capítulo 5. No se deducen versiones ni fechas de sprint. El período de referencia no certifica aceptación técnica integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r1-stories-1
title: R1 · Sprint 1
---

# R1 · Sprint 1

<StoryBoard :release-number="1" :part="1" />
<SlideFooter label="Historias oficiales completas · 4 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R1-01, RF-R1-02, RF-R1-03, RF-R1-04. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente explicita el sprint del 08/09/2025 al 23/09/2025. Las dos páginas pertenecen al único sprint funcional de R1.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §5.1.
-->

---
layout: planit
name: r1-stories-2
title: R1 · Sprint 1 · continuación
---

# R1 · Sprint 1 · continuación

<StoryBoard :release-number="1" :part="2" />
<SlideFooter label="Continuación del mismo sprint · Historias oficiales completas · 3 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R1-05, RF-R1-06, RF-R1-07. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente explicita el sprint del 08/09/2025 al 23/09/2025. Las dos páginas pertenecen al único sprint funcional de R1.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §5.1.
-->

---
layout: planit
name: r1-highlights
title: R1 · Aspectos destacados
---

# R1 · Aspectos destacados

<ReleaseHighlights :release-number="1" />
<SlideFooter label="Revisión y retrospectiva oficiales · Los acuerdos no acreditan soluciones ya aplicadas" />

<!--
Síntesis editorial del incremento (§5.3) y la retrospectiva (§5.4). La dificultad y el acuerdo se distinguen: no se convierte una propuesta futura en una solución aplicada ni se atribuyen resultados técnicos no medidos. No se reconstruyen burn-up charts sin datos verificables.

Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r2-cover
title: Release 2
---

# Release 2

<ReleaseCover :release-number="2" />
<SlideFooter label="Planificación oficial · Período de referencia de la release" />

<!--
Nombre, objetivo y fechas de R2: calendario oficial §3.1 y capítulo 6. No se deducen versiones ni fechas de sprint. El período de referencia no certifica aceptación técnica integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r2-stories-1
title: R2 · Sprint 1
---

# R2 · Sprint 1

<StoryBoard :release-number="2" :part="1" />
<SlideFooter label="Historias oficiales completas · 3 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R2-01, RF-R2-02, RF-R2-03. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §6.1.
-->

---
layout: planit
name: r2-stories-2
title: R2 · Sprint 2
---

# R2 · Sprint 2

<StoryBoard :release-number="2" :part="2" />
<SlideFooter label="Historias oficiales completas · 4 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R2-04, RF-R2-05, RF-R2-06, RF-R2-07. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §6.2.
-->

---
layout: planit
name: r2-highlights
title: R2 · Aspectos destacados
---

# R2 · Aspectos destacados

<ReleaseHighlights :release-number="2" />
<SlideFooter label="Revisión y retrospectiva oficiales · Los acuerdos no acreditan soluciones ya aplicadas" />

<!--
Síntesis editorial del incremento (§6.4) y la retrospectiva (§6.5). La dificultad y el acuerdo se distinguen: no se convierte una propuesta futura en una solución aplicada ni se atribuyen resultados técnicos no medidos. No se reconstruyen burn-up charts sin datos verificables.

Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r3-cover
title: Release 3
---

# Release 3

<ReleaseCover :release-number="3" />
<SlideFooter label="Planificación oficial · Período de referencia de la release" />

<!--
Nombre, objetivo y fechas de R3: calendario oficial §3.1 y capítulo 7. No se deducen versiones ni fechas de sprint. El período de referencia no certifica aceptación técnica integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r3-stories-1
title: R3 · Sprint 1
---

# R3 · Sprint 1

<StoryBoard :release-number="3" :part="1" />
<SlideFooter label="Historias oficiales completas · 4 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R3-01, RF-R3-02, RF-R3-03, RF-R3-04. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §7.1.
-->

---
layout: planit
name: r3-stories-2
title: R3 · Sprint 2
---

# R3 · Sprint 2

<StoryBoard :release-number="3" :part="2" />
<SlideFooter label="Historias oficiales completas · 5 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R3-05, RF-R3-06, RF-R3-07, RF-R3-08, RF-R3-09. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §7.2.
-->

---
layout: planit
name: r3-highlights
title: R3 · Aspectos destacados
---

# R3 · Aspectos destacados

<ReleaseHighlights :release-number="3" />
<SlideFooter label="Revisión y retrospectiva oficiales · Los acuerdos no acreditan soluciones ya aplicadas" />

<!--
Síntesis editorial del incremento (§7.4) y la retrospectiva (§7.5). La dificultad y el acuerdo se distinguen: no se convierte una propuesta futura en una solución aplicada ni se atribuyen resultados técnicos no medidos. No se reconstruyen burn-up charts sin datos verificables.

Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r4-cover
title: Release 4
---

# Release 4

<ReleaseCover :release-number="4" />
<SlideFooter label="Planificación oficial · Período de referencia de la release" />

<!--
Nombre, objetivo y fechas de R4: calendario oficial §3.1 y capítulo 8. No se deducen versiones ni fechas de sprint. El período de referencia no certifica aceptación técnica integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r4-stories-1
title: R4 · Sprint 1
---

# R4 · Sprint 1

<StoryBoard :release-number="4" :part="1" />
<SlideFooter label="Historias oficiales completas · 4 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R4-01, RF-R4-02, RF-R4-03, RF-R4-04. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §8.1.
-->

---
layout: planit
name: r4-stories-2
title: R4 · Sprint 2
---

# R4 · Sprint 2

<StoryBoard :release-number="4" :part="2" />
<SlideFooter label="Historias oficiales completas · 5 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R4-05, RF-R4-06, RF-R4-07, RF-R4-08, RF-R4-09. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §8.2.
-->

---
layout: planit
name: r4-highlights
title: R4 · Aspectos destacados
---

# R4 · Aspectos destacados

<ReleaseHighlights :release-number="4" />
<SlideFooter label="Revisión y retrospectiva oficiales · Los acuerdos no acreditan soluciones ya aplicadas" />

<!--
Síntesis editorial del incremento (§8.4) y la retrospectiva (§8.5). La dificultad y el acuerdo se distinguen: no se convierte una propuesta futura en una solución aplicada ni se atribuyen resultados técnicos no medidos. No se reconstruyen burn-up charts sin datos verificables.

Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r5-cover
title: Release 5
---

# Release 5

<ReleaseCover :release-number="5" />
<SlideFooter label="Planificación oficial · Período de referencia de la release" />

<!--
Nombre, objetivo y fechas de R5: calendario oficial §3.1 y capítulo 9. No se deducen versiones ni fechas de sprint. El período de referencia no certifica aceptación técnica integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r5-stories-1
title: R5 · Sprint 1
---

# R5 · Sprint 1

<StoryBoard :release-number="5" :part="1" />
<SlideFooter label="Historias oficiales completas · 4 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R5-01, RF-R5-02, RF-R5-03, RF-R5-04. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §9.1.
-->

---
layout: planit
name: r5-stories-2
title: R5 · Sprint 2
---

# R5 · Sprint 2

<StoryBoard :release-number="5" :part="2" />
<SlideFooter label="Historias oficiales completas · 4 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R5-05, RF-R5-06, RF-R5-07, RF-R5-08. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §9.2.
-->

---
layout: planit
name: r5-highlights
title: R5 · Aspectos destacados
---

# R5 · Aspectos destacados

<ReleaseHighlights :release-number="5" />
<SlideFooter label="Revisión y retrospectiva oficiales · Los acuerdos no acreditan soluciones ya aplicadas" />

<!--
Síntesis editorial del incremento (§8.4) y la retrospectiva (§8.5) de la revisión actual de Planificación Oficial. Repetición de conversaciones sin una decisión registrada: filas Hacer menos y Dejar de hacer de §8.5. El acuerdo sintetiza registrar decisión, motivo y próximo paso. La dificultad y el acuerdo se distinguen: no se convierte una propuesta futura en una solución aplicada ni se atribuyen resultados técnicos no medidos. No se reconstruyen burn-up charts sin datos verificables.

Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r6-cover
title: Release 6
---

# Release 6

<ReleaseCover :release-number="6" />
<SlideFooter label="Planificación oficial · Período de referencia de la release" />

<!--
Nombre, objetivo y fechas de R6: calendario oficial §3.1 y capítulo 10. No se deducen versiones ni fechas de sprint. El período de referencia no certifica aceptación técnica integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r6-stories-1
title: R6 · Sprint 1
---

# R6 · Sprint 1

<StoryBoard :release-number="6" :part="1" />
<SlideFooter label="Historias oficiales completas · 3 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R6-01, RF-R6-02, RF-R6-03. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §10.1.
-->

---
layout: planit
name: r6-stories-2
title: R6 · Sprint 2
---

# R6 · Sprint 2

<StoryBoard :release-number="6" :part="2" />
<SlideFooter label="Historias oficiales completas · 3 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R6-04, RF-R6-05, RF-R6-06. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §10.2.
-->

---
layout: planit
name: r6-highlights
title: R6 · Aspectos destacados
---

# R6 · Aspectos destacados

<ReleaseHighlights :release-number="6" />
<SlideFooter label="Revisión y retrospectiva oficiales · Los acuerdos no acreditan soluciones ya aplicadas" />

<!--
Síntesis editorial del incremento (§9.4) y la retrospectiva (§9.5) de la revisión actual de Planificación Oficial. Interrupciones por ajustes menores y pérdida de contexto: fila Hacer menos de §9.5. El acuerdo propone agrupar ajustes y reservar momentos para resolverlos. La dificultad y el acuerdo se distinguen: no se convierte una propuesta futura en una solución aplicada ni se atribuyen resultados técnicos no medidos. No se reconstruyen burn-up charts sin datos verificables.
Las métricas representan inscripciones registradas, no control de ingreso o asistencia física.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r7-cover
title: Release 7
---

# Release 7

<ReleaseCover :release-number="7" />
<SlideFooter label="Planificación oficial · Período de referencia de la release" />

<!--
Nombre, objetivo y fechas de R7: calendario oficial §3.1 y capítulo 11. No se deducen versiones ni fechas de sprint. El período de referencia no certifica aceptación técnica integral.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: r7-stories-1
title: R7 · Sprint 1
---

# R7 · Sprint 1

<StoryBoard :release-number="7" :part="1" />
<SlideFooter label="Historias oficiales completas · 3 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R7-01, RF-R7-02, RF-R7-03. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §11.1.
-->

---
layout: planit
name: r7-stories-2
title: R7 · Sprint 2
---

# R7 · Sprint 2

<StoryBoard :release-number="7" :part="2" />
<SlideFooter label="Historias oficiales completas · 4 requisitos" />

<!--
Esfuerzo relativo: estimaciones propuestas por autorización del usuario el 29/10/2026, no históricas del equipo ni horas. Valores estables y colores en data/story-effort.mjs; equivalencia visual XS–XXL explicada en Priorización y estimación.
Historias: RF-R7-04, RF-R7-05, RF-R7-06, RF-R7-07. Se reproducen literalmente los enunciados oficiales; sólo se destaca la acción. Fuente de transcripción y revisión consultada: references/release-stories.source.json. El texto completo está visible sin clics. No se proyectan los criterios de aceptación completos.
La fuente identifica sprints locales, pero no explicita sus fechas individuales: no dividir el período de la release para inventarlas.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §11.2.
-->

---
layout: planit
name: r7-highlights
title: R7 · Aspectos destacados
---

# R7 · Aspectos destacados

<ReleaseHighlights :release-number="7" />
<SlideFooter label="Revisión y retrospectiva oficiales · Los acuerdos no acreditan soluciones ya aplicadas" />

<!--
Síntesis editorial del incremento (§10.4) y la retrospectiva (§10.5) de la revisión actual de Planificación Oficial. Aprendizajes repartidos entre integrantes al cierre: fila Comenzar a hacer de §10.5. El acuerdo propone una puesta en común y un resumen de decisiones, dificultades y recomendaciones. La dificultad y el acuerdo se distinguen: no se convierte una propuesta futura en una solución aplicada ni se atribuyen resultados técnicos no medidos. No se reconstruyen burn-up charts sin datos verificables.
Las integraciones dependen de permisos, navegador y dispositivo; la bandeja interna sigue disponible sin Push. No se certifican nuevas entregas Push ni limpieza física por esta presentación.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti
-->

---
layout: planit
name: demo
title: Demo
---

# Demo

<div class="demo-stage">
<div class="closing-brand"><img src="/assets/logos/planit.svg" alt="Logotipo de PlanIt" /><h2>Plan<span>It</span></h2></div>
<p class="demo-promise">De encontrar un plan<br />a compartir la experiencia.</p>
<div class="demo-route"><span>Descubrir</span><svg viewBox="0 0 48 18" aria-hidden="true"><path d="M0 9h44m-8-7 8 7-8 7" fill="none" stroke="currentColor" stroke-width="2" /></svg><span>Organizar</span><svg viewBox="0 0 48 18" aria-hidden="true"><path d="M0 9h44m-8-7 8 7-8 7" fill="none" stroke="currentColor" stroke-width="2" /></svg><span>Participar</span></div>
</div>

<SlideFooter label="Demostración de PlanIt" />

<!--
Separador para pasar a la demostración en vivo, equivalente a la página 50 del PDF Equipo 6. Esta página no ejecuta operaciones ni acredita una sesión de prueba.
Recorrido sugerido al expositor: descubrimiento y detalle, publicación de un evento completo, inscripción y comunicación autorizada. Preparar previamente cuentas y datos de demostración; no exponer información privada. No se agregó una URL pública ni un video inexistente.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §§4.1, 4.2 y 5.3 (R1 y R2); ERS §§1.1–1.2 para el propósito.
-->

---
layout: planit
name: evolution
title: Evolución del producto
---

# Evolución del producto

<p class="evolution-intro">Posibles ampliaciones, sujetas a validación de necesidades y viabilidad.</p>
<div class="evolution-grid">
<article><h2>Recomendaciones con IA</h2><p>Sugerencias explicables, con autorización y control de la personalización.</p></article>
<article><h2>Organización colaborativa</h2><p>Coorganizadores con permisos específicos para gestionar el evento.</p></article>
<article><h2>Listas de espera</h2><p>Ofrecer las vacantes a quienes esperan, con un plazo de confirmación.</p></article>
<article><h2>Acreditación digital</h2><p>Códigos QR para registrar el ingreso y distinguir asistencia de inscripción.</p></article>
<article><h2>Planificación del traslado</h2><p>Rutas y tiempos estimados según ubicación autorizada y servicio disponible.</p></article>
<article><h2>Valoraciones posteriores</h2><p>Opiniones de asistentes y controles para prevenir contenido inapropiado.</p></article>
</div>

<SlideFooter label="Propuestas de la ERS · Fuera de los requisitos comprometidos R1–R7" />

<!--
La página 51 del PDF Equipo 6 aporta sólo el lugar de esta sección en la narrativa. Las seis posibilidades proceden de ERS Oficial §2.6, Evolución previsible del sistema; se resumen editorialmente sin convertirlas en entregas o compromisos aprobados.
La propia ERS condiciona su implementación a validar necesidades, viabilidad técnica y actualización de requisitos y criterios de aceptación. La IA propuesta es una ampliación de las sugerencias actuales, no una capacidad que se atribuya a R4. La acreditación digital sería distinta de las métricas actuales de inscripciones. No se asignan fechas, prioridades, nuevas releases ni resultados medidos.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.8kvi3flgq86r §2.6.
-->

---
layout: planit
name: conclusions
title: Conclusiones
---

# Conclusiones

<div class="conclusion-columns">
<section><h2>Como futuros<br />ingenieros</h2><ul>
<li><strong>Trabajar por incrementos</strong> nos permitió revisar el producto y nuestra forma de organizarnos.</li>
<li><strong>Colaborar ante los bloqueos</strong> y recuperar decisiones anteriores fortaleció la autonomía del equipo.</li>
<li><strong>Ver una pantalla funcionar</strong> no reemplaza comprobar sus valores, permisos y condiciones de uso.</li>
</ul></section>
<section><h2>Como equipo<br />de PlanIt</h2><ul>
<li><strong>Conectamos el recorrido</strong> de descubrir, organizar y participar en actividades sociales.</li>
<li><strong>Integramos comunidad y gestión</strong> con comunicación, perfiles y herramientas para organizadores.</li>
<li><strong>Aprendimos a cuidar el contexto:</strong> la experiencia también depende del navegador, los permisos y el dispositivo.</li>
</ul></section>
</div>

<SlideFooter label="Síntesis de las revisiones y retrospectivas del proyecto" />

<!--
Composición en dos perspectivas inspirada en la página 52 del PDF Equipo 6; afirmaciones y aprendizaje son de PlanIt, no de ADE Toolkit. Síntesis editorial de metodología §1.1, revisión/retrospectivas R3 §§6.4–6.5, R6 §§9.4–9.5 y R7 §§10.4–10.5 en la revisión consultada el 27/10/2026.
Las retrospectivas documentan colaboración, autonomía gradual, reutilización de soluciones, comprobación de valores y dependencia de condiciones del entorno. Los acuerdos pendientes no se convierten en resultados. No se afirma adopción, impacto medido, escala en producción ni aceptación técnica integral de R1–R7.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti §§1.1, 6.4–6.5, 9.4–9.5 y 10.4–10.5.
-->

---
layout: planit
name: thanks
title: ¡Muchas gracias!
---

# ¡Muchas gracias!

<div class="thanks-stage">
<div class="closing-brand"><img src="/assets/logos/planit.svg" alt="Logotipo de PlanIt" /><h2>Plan<span>It</span></h2></div>
<p class="thanks-purpose">Descubrí, organizá y participá<br />en eventos y actividades sociales.</p>
<p class="thanks-question">Los escuchamos. ¿Preguntas?</p>
</div>

<SlideFooter label="Grupo N.º 1 · UTN · Facultad Regional Resistencia · 2026" />

<!--
Agradecimiento de cierre y apertura a preguntas, siguiendo el lugar de la página 53 del PDF Equipo 6. Se conserva la identidad original de PlanIt. El propósito y la identificación académica proceden de la documentación oficial; no se agregan canales de contacto ni enlaces no verificados.
Fuente: https://docs.google.com/document/d/1MUKoIG5TWZXwp6e3ZKHgiKtWU7NnwaE3S3PhUcjsPww/edit?tab=t.q5vok7qr5sti cabecera y §1.2; ERS §1.1.
-->
