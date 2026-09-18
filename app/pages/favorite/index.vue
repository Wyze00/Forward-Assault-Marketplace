<template>
  <Layout>
    <div class="min-h-screen bg-[#F4F4F0] p-6 font-grotesk text-black">
      <div class="container mx-auto max-w-7xl">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4 border-b-4 border-black pb-6">
          <div>
            <h1 class="text-4xl font-black uppercase tracking-tight">My Favorites ♥</h1>
            <p class="mt-2 text-lg font-bold">{{ skins.length }} skin tersimpan</p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Item Type Filter -->
            <select
              v-model="filterType"
              class="px-5 py-3 border-4 border-black bg-white text-black font-bold uppercase shadow-[4px_4px_0px_#000000] focus:outline-none appearance-none rounded-none cursor-pointer hover:bg-[#FFD23F] transition-colors"
            >
              <option value="all">Semua Tipe</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
              <option value="weapon">Weapon</option>
            </select>

            <!-- Price Sort -->
            <select
              v-model="sortOrder"
              class="px-5 py-3 border-4 border-black bg-[#FF5757] text-white font-bold uppercase shadow-[4px_4px_0px_#000000] focus:outline-none appearance-none rounded-none cursor-pointer hover:bg-[#4D96FF] transition-colors"
            >
              <option value="asc">Harga Terendah</option>
              <option value="desc">Harga Tertinggi</option>
            </select>
          </div>
        </div>

        <div v-if="pending" class="text-center py-16">
          <span class="text-2xl font-black uppercase tracking-widest animate-pulse">Loading favorites...</span>
        </div>
        <div v-else-if="error" class="text-center py-16 bg-[#FF5757] border-4 border-black shadow-[8px_8px_0px_#000000] text-white">
          <span class="text-2xl font-black uppercase">Error loading data: {{ error.message }}</span>
        </div>
        <div v-else-if="skins.length === 0" class="text-center py-16 bg-white border-4 border-black shadow-[8px_8px_0px_#000000]">
          <p class="text-6xl mb-6">♡</p>
          <p class="text-2xl font-black uppercase">Belum ada skin yang difavoritkan.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div
            v-for="skin in skins"
            :key="skin.id"
            class="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] relative cursor-pointer hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_#000000] transition-all duration-75 flex flex-col justify-between"
            @click="goToDetail(skin)"
          >
            <!-- Favorite Button -->
            <button
              class="absolute top-4 right-4 text-3xl leading-none hover:text-[#FF5757] hover:scale-110 transition-transform z-10"
              title="Remove from favorite"
              @click="removeFavorite($event, skin)"
            >
              ♥
            </button>

            <div>
              <!-- Item Type Badge -->
              <span
                class="inline-block px-3 py-1 border-2 border-black text-xs font-black uppercase mb-4 shadow-[2px_2px_0px_#000000]"
                :class="getTypeBadgeClass(skin.itemType)"
              >
                {{ skin.itemType }}
              </span>

              <h2 class="text-2xl font-black mb-4 pr-8 uppercase tracking-tight leading-tight">{{ skin.name }}</h2>
            </div>
            
            <div class="text-sm flex flex-col gap-3 mt-4 border-t-4 border-black pt-4">
              <p>
                <span class="font-black uppercase">Last Capture:</span><br>
                <span class="font-bold text-lg">{{ formatDate(skin.lastCaptureDate) }}</span>
              </p>
              <p>
                <span class="font-black uppercase">Lowest Price:</span><br>
                <span class="font-black text-3xl block text-[#FF5757]">{{ skin.lowestPrice }} G</span>
              </p>
              <button
                class="mt-4 w-full py-3 border-4 border-black font-black uppercase tracking-wider text-black bg-[#FFD23F] shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#000000]"
                :disabled="capturingIds.has(skin.id)"
                @click="captureNow($event, skin)"
              >
                {{ capturingIds.has(skin.id) ? 'Capturing...' : '📸 Capture' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const sortOrder = ref('asc')
const filterType = ref('all')
const capturingIds = reactive(new Set())

const { data: response, pending, error, refresh } = await useFetch('/api/skin/favorite')

const skins = computed(() => {
  const data = response.value?.data || []
  return [...data]
    .filter(skin => filterType.value === 'all' || skin.itemType === filterType.value)
    .sort((a, b) => {
      if (sortOrder.value === 'asc') return a.lowestPrice - b.lowestPrice
      return b.lowestPrice - a.lowestPrice
    })
})

const goToDetail = (skin) => {
  const type = skin.itemType || 'weapon'
  router.push(`/weapon/${type}/${skin.id}`)
}

const removeFavorite = async (event, skin) => {
  event.stopPropagation()
  await $fetch('/api/skin/favorite', {
    method: 'POST',
    body: { skinUuid: skin.id }
  })
  await refresh()
}

const captureNow = async (event, skin) => {
  event.stopPropagation()
  if (capturingIds.has(skin.id)) return
  capturingIds.add(skin.id)
  try {
    await $fetch('/api/skin/capture', {
      method: 'POST',
      body: { skinUuid: skin.id }
    })
    await refresh()
  } catch (err) {
    alert('Gagal capture: ' + (err.data?.msg || err.message))
  } finally {
    capturingIds.delete(skin.id)
  }
}

const formatDate = (dateStr) => {
  if (dateStr === '-') return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypeBadgeClass = (itemType) => {
  if (itemType === 'glove') return 'bg-[#FFD23F] text-black'
  if (itemType === 'character') return 'bg-[#4D96FF] text-white'
  return 'bg-[#FF5757] text-white'
}
</script>
