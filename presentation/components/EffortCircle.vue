<script setup>
import { computed } from 'vue'
import { effortScale } from '../data/story-effort.mjs'
const props = defineProps({ points: { type: Number, required: true }, showSizeLabel: { type: Boolean, default: true } })
const effort = computed(() => effortScale.find(item => item.points === props.points))
</script>
<template>
  <span class="effort-circle" :data-points="points" :data-size="effort.size" :style="{ '--effort-bg': effort.background, '--effort-ink': effort.foreground }" :aria-label="`${points} puntos de esfuerzo relativo propuesto${showSizeLabel ? `, talla ${effort.size}` : ''}`">{{ points }}</span>
</template>
