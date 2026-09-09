<script setup lang="ts">
import { ref } from 'vue'

const isMobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Latest', path: '/latest' },
  { name: 'Weapon', path: '/weapon' },
  { name: 'Glove', path: '/glove' },
  { name: 'Character', path: '/character' },
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
  <header class="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-primary/20 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Left: Brand / Logo -->
        <NuxtLink 
          to="/" 
          class="text-xl font-bold text-text-main hover:opacity-80 transition-opacity tracking-wide"
          @click="closeMobileMenu"
        >
          Marketplace
        </NuxtLink>

        <!-- Center: Desktop Links -->
        <nav class="hidden md:flex items-center space-x-1 lg:space-x-2">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="px-4 py-2 rounded-full text-sm font-medium text-text-main hover:bg-primary transition-colors duration-200"
            active-class="bg-primary font-semibold"
          >
            {{ link.name }}
          </NuxtLink>
        </nav>

        <!-- Mobile: Hamburger Button -->
        <div class="flex md:hidden">
          <button
            type="button"
            class="p-2 rounded-full text-text-main hover:bg-primary/50 focus:outline-none transition-colors"
            aria-label="Toggle Navigation Menu"
            @click="toggleMobileMenu"
          >
            <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div 
          v-if="isMobileMenuOpen"
          class="fixed inset-0 top-16 z-40 bg-white/60 backdrop-blur-lg md:hidden flex flex-col items-center justify-center p-6 space-y-6"
        >
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="text-2xl font-bold text-text-main hover:opacity-75 transition-opacity px-6 py-2 rounded-full"
            active-class="bg-white/40 shadow-sm"
            @click="closeMobileMenu"
          >
            {{ link.name }}
          </NuxtLink>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>