<template>
  <footer class="bg-bg-light border-t border-primary/20 py-6 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="text-text-sub text-sm">
        &copy; {{ new Date().getFullYear() }} Wyze. All rights reserved.
      </div>
      <div class="flex space-x-4">
        <a href="https://github.com/wyze00" class="text-text-sub hover:text-primary transition-colors text-sm font-medium">Github</a>
      </div>
      <!-- Maskot Chibi / Ikon Tema -->
      <div class="text-primary opacity-70 hover:opacity-100 transition-opacity cursor-pointer font-bold select-none text-lg">
        (🌸◕‿◕)
      </div>
    </div>
  </footer>
</template>