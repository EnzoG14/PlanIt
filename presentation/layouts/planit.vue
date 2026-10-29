<template>
  <main class="slidev-layout planit-slide">
    <div class="deck-background" aria-hidden="true">
      <div class="background-light"></div>
      <svg class="background-contours" viewBox="0 0 1280 720" fill="none" focusable="false">
        <rect class="contour-outer" x="1224" y="-190" width="360" height="470" rx="76" />
        <rect class="contour-inner" x="1246" y="-168" width="316" height="426" rx="56" />
        <path class="contour-bottom" d="M-100 530H-20a64 64 0 0 1 64 64v190" />
      </svg>
    </div>
    <slot />
  </main>
</template>
