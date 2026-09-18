<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <Layout>
    <div class="min-h-screen bg-[#F4F4F0] p-6 md:p-12 font-grotesk text-black flex flex-col items-center justify-center">
      
      <!-- Hero Section -->
      <div class="max-w-5xl w-full bg-white border-4 border-black shadow-[16px_16px_0px_#000000] p-8 md:p-16 mb-16 text-center relative overflow-hidden">
        <!-- Decorative elements -->
        <div class="absolute -top-10 -left-10 w-32 h-32 bg-[#FFD23F] rounded-full border-4 border-black shadow-[4px_4px_0px_#000000] z-0 hidden md:block"></div>
        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-[#4D96FF] border-4 border-black shadow-[4px_4px_0px_#000000] rotate-12 z-0 hidden md:block"></div>
        
        <div class="relative z-10">
          <span class="inline-block px-4 py-2 bg-[#FF5757] text-white border-4 border-black font-black uppercase text-sm md:text-base tracking-widest shadow-[4px_4px_0px_#000000] mb-8">
            FA Marketplace Tracker
          </span>
          <h1 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
            Track <br class="md:hidden"/> Everything. <br/> <span class="text-[#FF5757]">Miss Nothing.</span>
          </h1>
          <p class="text-xl md:text-2xl font-bold max-w-2xl mx-auto mb-12 leading-snug">
            The ultimate companion tool for monitoring Forward Assault marketplace prices, skin histories, and condition changes.
          </p>
          
          <div class="flex flex-col sm:flex-row justify-center gap-6">
            <button 
              @click="router.push('/test')" 
              class="px-8 py-4 bg-[#FFD23F] text-black border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_#000000] transition-all duration-75"
            >
              Browse Skins
            </button>
            <button 
              @click="router.push('/change')" 
              class="px-8 py-4 bg-[#4D96FF] text-white border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_#000000] transition-all duration-75"
            >
              View Changes
            </button>
          </div>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Card 1 -->
        <div class="bg-[#FFD23F] border-4 border-black p-8 shadow-[8px_8px_0px_#000000] hover:-translate-y-2 transition-transform duration-200 flex flex-col h-full">
          <div class="text-5xl mb-6 font-black">🔍</div>
          <h2 class="text-2xl font-black uppercase mb-4 leading-tight">Price Monitoring</h2>
          <p class="font-bold text-lg leading-relaxed flex-grow">
            Catat dan pantau harga skin terendah dari seluruh kategori (Weapon, Glove, Character) secara real-time.
          </p>
        </div>

        <!-- Card 2 -->
        <div class="bg-[#FF5757] text-white border-4 border-black p-8 shadow-[8px_8px_0px_#000000] hover:-translate-y-2 transition-transform duration-200 flex flex-col h-full">
          <div class="text-5xl mb-6 font-black">♥</div>
          <h2 class="text-2xl font-black uppercase mb-4 leading-tight">Favorite Items</h2>
          <p class="font-bold text-lg leading-relaxed flex-grow">
            Simpan item impianmu. Dapatkan akses cepat untuk mengecek fluktuasi harga tanpa harus mencari ulang.
          </p>
        </div>

        <!-- Card 3 -->
        <div class="bg-[#4D96FF] text-white border-4 border-black p-8 shadow-[8px_8px_0px_#000000] hover:-translate-y-2 transition-transform duration-200 flex flex-col h-full">
          <div class="text-5xl mb-6 font-black">🔔</div>
          <h2 class="text-2xl font-black uppercase mb-4 leading-tight">Live Market Changes</h2>
          <p class="font-bold text-lg leading-relaxed flex-grow">
            Deteksi otomatis saat ada listing baru, item yang terjual/dihapus, atau jika penjual mengubah harga.
          </p>
        </div>
      </div>

      <!-- Stats / CTA Banner -->
      <div class="max-w-6xl w-full mt-16 bg-black text-white border-4 border-black p-10 flex flex-col md:flex-row justify-between items-center shadow-[12px_12px_0px_#FFD23F]">
        <div class="mb-8 md:mb-0 text-center md:text-left">
          <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tight">Siap untuk memburu skin?</h2>
          <p class="text-xl mt-3 font-bold text-gray-300">Mulai tangkap data harga terbaru sekarang.</p>
        </div>
        <button 
          @click="router.push('/latest')" 
          class="w-full md:w-auto px-10 py-5 bg-white text-black border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_#FF5757] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_#FF5757] transition-all duration-75"
        >
          Latest Offers 🚀
        </button>
      </div>

    </div>
  </Layout>
</template>