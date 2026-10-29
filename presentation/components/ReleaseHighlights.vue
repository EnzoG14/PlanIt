<script setup>
import { computed } from 'vue'
import { releaseContent } from '../data/release-content.mjs'
const props = defineProps({ releaseNumber: Number })
const content = computed(() => releaseContent.find(item => item.release === props.releaseNumber))
</script>
<template>
  <div class="release-review">
    <section><h2>Incremento</h2><p>{{ content.increment }}</p></section>
    <section><h2>Dificultad observada</h2><p>{{ content.difficulty }}</p></section>
    <section><h2>Acuerdo de mejora</h2><p>{{ content.agreement }}</p></section>
  </div>
</template>
