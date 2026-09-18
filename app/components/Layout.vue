<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-[#F4F4F0] text-black flex flex-col font-grotesk">
    <Nav />
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
    <Footer />
  </div>
</template>