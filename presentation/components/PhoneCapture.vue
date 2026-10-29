<script setup>
defineProps({ src: String, alt: String, label: String, detail: String })
</script>
<template>
  <figure class="product-capture">
    <figcaption><strong>{{ label }}</strong><span>{{ detail }}</span></figcaption>
    <div class="phone-frame"><img :src="src" :alt="alt" width="390" height="780" /></div>
  </figure>
</template>
