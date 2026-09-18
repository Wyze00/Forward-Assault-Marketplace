<template>
  <footer class="bg-white border-t-4 border-black py-8 mt-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="text-black font-bold text-base border-2 border-black px-4 py-2 bg-[#FFD23F] shadow-[4px_4px_0px_#000000]">
        &copy; {{ new Date().getFullYear() }} Wyze. All rights reserved.
      </div>
      <div class="flex space-x-4">
        <a href="https://github.com/wyze00" class="text-black font-bold border-2 border-black px-6 py-2 bg-white shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 uppercase tracking-wide">
          Github
        </a>
      </div>
      <!-- Maskot Chibi / Ikon Tema -->
      <div class="text-black font-bold text-xl border-2 border-black px-4 py-2 bg-[#4D96FF] shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 cursor-pointer select-none">
        (🌸◕‿◕)
      </div>
    </div>
  </footer>
</template>