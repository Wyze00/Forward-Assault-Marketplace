<script setup lang="ts">
import { ref } from 'vue'

const isMobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Latest', path: '/latest' },
  { name: 'Weapon', path: '/weapon' },
  { name: 'Favorite', path: '/favorite' },
  { name: 'Change', path: '/change' },
  { name: 'Weapon Type', path: '/weapon/type' },
  { name: 'Camo', path: '/camo' },
  { name: 'Skin', path: '/skin' },
]

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

</script>

<template>
  <header class="sticky top-0 z-50 bg-[#F4F4F0] border-b-4 border-black relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        
        <!-- Left: Brand / Logo -->
        <NuxtLink 
          to="/" 
          class="text-xl md:text-2xl font-black text-black bg-[#FFD23F] border-2 border-black px-4 py-2 shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 tracking-wider uppercase z-50"
          @click="closeMobileMenu"
        >
          Marketplace
        </NuxtLink>

        <!-- Center: Desktop Links -->
        <nav class="hidden lg:flex items-center space-x-3 flex-wrap justify-end">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="px-3 py-2 font-bold text-black bg-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 uppercase text-sm"
            active-class="bg-[#FF5757] text-white"
          >
            {{ link.name }}
          </NuxtLink>
        </nav>

        <!-- Mobile: Hamburger Button -->
        <div class="flex lg:hidden z-50">
          <button
            type="button"
            class="p-2 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 focus:outline-none"
            aria-label="Toggle Navigation Menu"
            @click="toggleMobileMenu"
          >
            <svg v-if="!isMobileMenuOpen" class="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <Teleport to="body">
      <div 
        v-if="isMobileMenuOpen"
        class="fixed inset-0 top-20 z-40 bg-[#FFD23F] border-t-4 border-black lg:hidden flex flex-col items-center justify-start pt-8 pb-20 px-6 space-y-4 overflow-y-auto"
      >
        <NuxtLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="w-full text-center text-xl font-bold text-black bg-white border-4 border-black px-6 py-4 shadow-[6px_6px_0px_#000000] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none transition-all duration-75 uppercase"
          active-class="bg-[#FF5757] text-white"
          @click="closeMobileMenu"
        >
          {{ link.name }}
        </NuxtLink>
      </div>
    </Teleport>
  </header>
</template>