<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-bg-main text-text-main flex flex-col font-sans">
    <Nav />
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>
    <Footer />
    <ToastList />
  </div>
</template>