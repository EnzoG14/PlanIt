<script setup>
import { team } from '../data/deck.mjs'
</script>
<template>
  <dl class="team-roster">
    <div v-for="person in team" :key="person.name">
      <dt>{{ person.name }}</dt><dd>{{ person.role }}</dd>
    </div>
  </dl>
</template>
