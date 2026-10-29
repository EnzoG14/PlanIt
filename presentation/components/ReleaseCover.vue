<script setup>
import { computed } from 'vue'
import { releases } from '../data/deck.mjs'
import { releaseContent } from '../data/release-content.mjs'
const props = defineProps({ releaseNumber: Number })
const release = computed(() => releases.find(item => item.id === `R${props.releaseNumber}`))
const content = computed(() => releaseContent.find(item => item.release === props.releaseNumber))
</script>
<template>
  <div class="release-cover">
    <h2>{{ release.name }}</h2>
    <p class="release-objective">{{ content.objective }}</p>
    <p class="release-period">Período de referencia: {{ release.start }} al {{ release.end }}</p>
  </div>
</template>
