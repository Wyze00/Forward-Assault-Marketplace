<template>
  <Layout>
    <div class="min-h-screen p-6 font-quicksand" style="background-color: #fff5f7; color: #4a4a4a;">
      <div class="container mx-auto">
        <!-- Header & Action Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-bold" style="color: #4a4a4a;">Latest Marketplace Skins ✨</h1>
            <p class="mt-1 text-sm font-medium" style="color: #8e8e8e;">Halaman {{ currentPage + 1 }}</p>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="px-6 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style="background-color: #ffc5d3; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
              :disabled="isCapturing"
              @click="handleCaptureAll"
            >
              {{ isCapturing ? '📸 Capturing All...' : '📸 Capture All Page' }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="text-center py-16" style="color: #8e8e8e;">
          <span class="text-xl font-medium animate-pulse">Memuat data skin... 🌸</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-16 font-medium" style="color: #ffb3b3;">
          Terjadi kesalahan saat memuat data: {{ error.message }}
        </div>

        <!-- Empty State -->
        <div v-else-if="!skins || skins.length === 0" class="text-center py-16 font-medium" style="color: #8e8e8e;">
          <p class="text-5xl mb-4">(⁠´⁠∩⁠｡⁠•⁠ ⁠ᵕ⁠ ⁠•⁠｡⁠∩⁠`⁠)</p>
          <p class="text-xl">Tidak ada skin ditemukan pada halaman ini.</p>
        </div>

        <!-- Skins Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div
            v-for="skin in skins"
            :key="skin.id"
            class="rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 card-hover relative"
            style="background-color: #fefefe; box-shadow: 0 8px 24px rgba(255, 197, 211, 0.4); border: 2px solid #ffc5d3;"
            @click="goToDetail(skin)"
          >
            <!-- Favorite Tag -->
            <span v-if="skin.isFavorite" class="absolute top-4 right-4 text-xl" title="Favorit">
              ♥
            </span>

            <span
              class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-3"
              :style="getTypeBadgeStyle(skin.itemType)"
            >
              {{ skin.itemType ? skin.itemType.toUpperCase() : 'SKIN' }}
            </span>

            <h2 class="text-xl font-bold mb-4 pr-6" style="color: #4a4a4a;">{{ skin.name }}</h2>

            <div class="text-sm flex flex-col gap-2" style="color: #8e8e8e;">
              <p>
                <span class="font-semibold" style="color: #4a4a4a;">Last Capture:</span><br>
                {{ formatDate(skin.lastCaptureDate) }}
              </p>
              
              <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-pink-100">
                <div>
                  <span class="text-xs font-semibold" style="color: #8e8e8e;">Last Lowest:</span>
                  <span class="font-bold text-base block" style="color: #ffb0c2;">
                    {{ skin.lowestPrice ? `${skin.lowestPrice} G` : '-' }}
                  </span>
                </div>
                <div>
                  <span class="text-xs font-semibold" style="color: #8e8e8e;">Latest Fetch:</span>
                  <span class="font-bold text-base block" style="color: #4a4a4a;">
                    {{ skin.latestFetchLowestPrice }} G
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="flex justify-center items-center gap-4 mt-12 mb-6">
          <button
            class="px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style="background-color: #fefefe; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
            :disabled="currentPage === 0 || pending"
            @click="prevPage"
          >
            ← Prev
          </button>

          <span class="font-bold text-sm px-3" style="color: #4a4a4a;">
            Page {{ currentPage + 1 }}
          </span>

          <button
            class="px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style="background-color: #fefefe; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentPage = ref(0)
const isCapturing = ref(false)

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

const goToDetail = (skin) => {
  router.push(`/${skin.itemType || 'skin'}/${skin.id}`)
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

const getTypeBadgeStyle = (itemType) => {
  if (itemType === 'glove') return 'background-color: #e2d9f3; color: #5e35b1;'
  if (itemType === 'character') return 'background-color: #d1ecf1; color: #0c5460;'
  return 'background-color: #fff3cd; color: #856404;'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');

.font-quicksand {
  font-family: 'Quicksand', sans-serif;
}

.card-hover:hover {
  box-shadow: 0 12px 32px rgba(255, 197, 211, 0.6) !important;
}
</style>