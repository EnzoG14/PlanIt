<script setup>
import { computed } from 'vue'
import { stories } from '../data/release-stories.mjs'
import { releaseContent } from '../data/release-content.mjs'
import { storyEffort } from '../data/story-effort.mjs'
const props = defineProps({ releaseNumber: Number, part: Number })
const page = computed(() => releaseContent.find(item => item.release === props.releaseNumber).pages.find(item => item.part === props.part))
const items = computed(() => page.value.ids.map(id => stories.find(story => story.id === id)))
function parts(text) {
  const match = text.match(/^(.*?)(quiero .*?)( para .*)$/)
  return match ? { role: match[1], action: match[2], benefit: match[3] } : { role: '', action: text, benefit: '' }
}
</script>
<template>
  <div class="story-board" :class="`story-board-${items.length}`" :aria-label="`Historias de R${releaseNumber}, sprint ${page.sprint}`">
    <article v-for="(story,index) in items" :key="story.id" class="story-note" :class="`story-note-${index+1}`" :data-story-id="story.id">
      <div class="story-header"><h2 class="story-id">{{ story.id }}</h2><EffortCircle class="story-effort" :points="storyEffort[story.id]" /></div>
      <p class="story-copy"><span>{{ parts(story.text).role }}</span><strong>{{ parts(story.text).action }}</strong><span>{{ parts(story.text).benefit }}</span></p>
    </article>
  </div>
  <p v-if="page.period" class="story-period">Período del sprint: {{ page.period }}</p>
  <p class="story-effort-notice">Esfuerzo relativo propuesto para esta presentación</p>
</template>
