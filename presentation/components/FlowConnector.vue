<script setup>
import { useId } from 'vue'

defineProps({ both: { type: Boolean, default: true }, reverse: Boolean })
const markerId = `arrow-${useId()}`
</script>

<template>
  <svg viewBox="0 0 120 24" aria-hidden="true" focusable="false">
    <defs>
      <marker :id="markerId" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
        <path d="M0 0 L6 3 L0 6" fill="currentColor" />
      </marker>
    </defs>
    <line :x1="reverse ? 110 : 10" y1="12" :x2="reverse ? 10 : 110" y2="12" stroke="currentColor" stroke-width="2" :marker-start="both ? `url(#${markerId})` : undefined" :marker-end="`url(#${markerId})`" />
  </svg>
</template>
