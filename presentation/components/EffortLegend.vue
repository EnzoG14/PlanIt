<script setup>
import { effortScale } from '../data/story-effort.mjs'
</script>
<template>
  <div class="effort-legend" aria-label="Escala de puntos de esfuerzo relativo propuesto">
    <div v-for="effort in effortScale" :key="effort.points"><EffortCircle :points="effort.points" :show-size-label="false" /></div>
  </div>
</template>
