<template>
  <Layout>
    <div class="min-h-screen bg-[#F4F4F0] p-6 font-grotesk text-black">
      <div class="container mx-auto max-w-7xl">
        <!-- Header & Action Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4 border-b-4 border-black pb-6">
          <div>
            <h1 class="text-4xl font-black uppercase tracking-tight">Latest Marketplace Skins</h1>
            <p class="mt-2 text-lg font-bold">Halaman {{ currentPage + 1 }}</p>
          </div>

          <div class="flex items-center gap-4">
            <button
              class="px-6 py-3 border-4 border-black bg-[#FF5757] text-white font-black uppercase shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
              :disabled="isCapturing"
              @click="handleCaptureAll"
            >
              {{ isCapturing ? '📸 Capturing All...' : '📸 Capture All Page' }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="text-center py-16">
          <span class="text-2xl font-black uppercase tracking-widest animate-pulse">Memuat data skin... 🌸</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-16 bg-[#FF5757] border-4 border-black shadow-[8px_8px_0px_#000000] text-white">
          <span class="text-2xl font-black uppercase">Terjadi kesalahan saat memuat data: {{ error.message }}</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="!skins || skins.length === 0" class="text-center py-16 bg-white border-4 border-black shadow-[8px_8px_0px_#000000]">
          <p class="text-6xl mb-6">(⁠´⁠∩⁠｡⁠•⁠ ⁠ᵕ⁠ ⁠•⁠｡⁠∩⁠`⁠)</p>
          <p class="text-2xl font-black uppercase">Tidak ada skin ditemukan pada halaman ini.</p>
        </div>

        <!-- Skins Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div
            v-for="skin in skins"
            :key="skin.id"
            class="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000] relative cursor-pointer hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_#000000] transition-all duration-75 flex flex-col justify-between"
            @click="goToDetail(skin)"
          >
            <!-- Favorite Tag -->
            <span v-if="skin.isFavorite" class="absolute top-4 right-4 text-3xl z-10 text-[#FF5757]" title="Favorit">
              ♥
            </span>

            <div>
              <span
                class="inline-block px-3 py-1 border-2 border-black text-xs font-black uppercase mb-4 shadow-[2px_2px_0px_#000000]"
                :class="getTypeBadgeClass(skin.itemType)"
              >
                {{ skin.itemType ? skin.itemType : 'SKIN' }}
              </span>

              <h2 class="text-2xl font-black mb-4 pr-8 uppercase tracking-tight leading-tight">{{ skin.name }}</h2>
            </div>

            <div class="text-sm flex flex-col gap-3 mt-4 border-t-4 border-black pt-4">
              <p>
                <span class="font-black uppercase">Last Capture:</span><br>
                <span class="font-bold text-lg">{{ formatDate(skin.lastCaptureDate) }}</span>
              </p>
              
              <div class="grid grid-cols-2 gap-4 mt-2 pt-4 border-t-4 border-black">
                <div>
                  <span class="text-xs font-black uppercase">Last Lowest:</span>
                  <span class="font-black text-2xl block text-[#FF5757] mt-1">
                    {{ skin.lowestPrice ? `${skin.lowestPrice} G` : '-' }}
                  </span>
                </div>
                <div>
                  <span class="text-xs font-black uppercase">Latest Fetch:</span>
                  <span class="font-black text-2xl block mt-1">
                    {{ skin.latestFetchLowestPrice }} G
                  </span>
                </div>
              </div>

              <!-- Single Capture Button -->
              <button
                class="mt-4 w-full py-3 border-4 border-black font-black uppercase tracking-wider text-black bg-[#FFD23F] shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#000000]"
                :disabled="capturingIds.has(skin.id)"
                @click.stop="captureSingle($event, skin)"
              >
                {{ capturingIds.has(skin.id) ? 'Capturing...' : '📸 Capture' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="flex justify-center items-center gap-6 mt-16 mb-8">
          <button
            class="px-6 py-3 border-4 border-black bg-white text-black font-black uppercase shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-[#FFD23F] transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
            :disabled="currentPage === 0 || pending"
            @click="prevPage"
          >
            ← Prev
          </button>

          <span class="font-black text-xl uppercase bg-black text-white px-6 py-3 border-4 border-black">
            Page {{ currentPage + 1 }}
          </span>

          <button
            class="px-6 py-3 border-4 border-black bg-white text-black font-black uppercase shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-[#FFD23F] transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
            :disabled="!hasMore || pending"
            @click="nextPage"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentPage = ref(0)
const isCapturing = ref(false)
const capturingIds = reactive(new Set())

const { data: response, pending, error, refresh } = await useFetch('/api/skin/latest', {
  query: computed(() => ({
    page: currentPage.value,
    capture: false
  }))
})

const skins = computed(() => response.value?.data || [])
const hasMore = computed(() => !!response.value?.hasMore)

const nextPage = () => {
  if (hasMore.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 0) currentPage.value--
}

const handleCaptureAll = async () => {
  if (isCapturing.value) return
  isCapturing.value = true
  try {
    await $fetch('/api/skin/latest', {
      query: {
        page: currentPage.value,
        capture: true
      }
    })
    await refresh()
    alert('Capture selesai! Data perubahan telah dicatat.')
  } catch (err) {
    alert('Gagal mengambil capture: ' + (err.data?.msg || err.message))
  } finally {
    isCapturing.value = false
  }
}

const captureSingle = async (event, skin) => {
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

const goToDetail = (skin) => {
  const type = skin.itemType || 'weapon'
  router.push(`/weapon/${type}/${skin.id}`)
}

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-'
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