<script setup>
import { releases } from '../data/deck.mjs'
const rows = [{ year: '2025', items: releases.slice(0, 4) }, { year: '2026', items: releases.slice(4) }]
</script>
<template>
  <div class="release-roadmap">
    <section v-for="row in rows" :key="row.year" class="roadmap-year" :aria-label="`Releases de ${row.year}`">
      <h2>{{ row.year }}</h2>
      <div class="roadmap-track">
        <svg class="roadmap-line" viewBox="0 0 1000 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 12H1000" fill="none" stroke="currentColor" stroke-width="2" />
          <circle v-for="x in [12, 262, 512, 762]" :key="x" :cx="x" cy="12" r="7" fill="currentColor" />
        </svg>
        <ol>
          <li v-for="release in row.items" :key="release.id">
            <strong>{{ release.id }}</strong><h3>{{ release.name }}</h3>
            <p><time>{{ release.start }}</time><span>al {{ release.end }}</span></p>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>
