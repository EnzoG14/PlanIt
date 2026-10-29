<script setup>
import { effortScale } from '../data/story-effort.mjs'
</script>
<template>
  <div class="effort-legend" aria-label="Equivalencia propuesta de puntos y tallas de camiseta">
    <div v-for="effort in effortScale" :key="effort.points"><EffortCircle :points="effort.points" /><span>{{ effort.size }}</span></div>
  </div>
</template>
