<script setup>
import { releases } from '../data/deck.mjs'
</script>
<template>
  <div class="functional-groups" aria-label="Siete áreas funcionales de PlanIt">
    <div v-for="release in releases.slice(1)" :key="release.id" class="functional-group">
      <span>{{ release.id }}</span><h2>{{ release.name }}</h2><p>{{ release.rf }} requisitos funcionales</p>
    </div>
  </div>
</template>
