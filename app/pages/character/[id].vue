<template>
  <Layout>
    <div class="min-h-screen p-6 font-quicksand" style="background-color: #fff5f7; color: #4a4a4a;">
    <div class="container mx-auto max-w-6xl">
      <div class="mb-8">
        <button @click="router.back()" class="px-5 py-2 rounded-2xl mb-4 font-bold transition-all hover:-translate-y-1" style="background-color: #ffc5d3; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);">
          &larr; Back
        </button>
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-4">
          <div>
            <h1 class="text-4xl font-bold" style="color: #4a4a4a;">
              {{ skinInfo ? skinInfo.name : 'Loading...' }}
            </h1>
            <p class="text-gray-500 mt-2 font-medium">History of the last 5 captures</p>
          </div>
          
          <div class="flex gap-3">
            <button 
              @click="toggleFavorite" 
              :disabled="isFavoriteLoading"
              class="px-6 py-3 rounded-2xl font-bold text-2xl leading-none transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              :style="isFavorite 
                ? 'background-color: #ffc5d3; color: #c0185a; box-shadow: 0 6px 16px rgba(255, 197, 211, 0.6);' 
                : 'background-color: #fefefe; color: #ffb0c2; box-shadow: 0 6px 16px rgba(255, 197, 211, 0.4);'"
              :title="isFavorite ? 'Remove from favorite' : 'Add to favorite'"
            >
              {{ isFavorite ? '♥' : '♡' }}
            </button>

            <button 
              @click="captureData" 
              :disabled="isCapturing" 
              class="px-6 py-3 rounded-2xl font-bold transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style="background-color: #ffb0c2; color: #fefefe; box-shadow: 0 6px 16px rgba(255, 176, 194, 0.5);"
            >
              {{ isCapturing ? 'Capturing...' : '📸 Capture Now' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="pending" class="text-center py-10" style="color: #8e8e8e;">
        <span class="text-xl font-medium animate-pulse">Loading history ✨...</span>
      </div>
      <div v-else-if="error" class="text-center py-10 font-medium" style="color: #ffb3b3;">
        Error loading data: {{ error.message }}
      </div>
      <div v-else-if="captures.length === 0" class="text-center py-10 font-medium" style="color: #8e8e8e;">
        Tidak ada data history untuk skin ini.
      </div>
      
      <div v-else class="flex flex-col gap-8">
        <div 
          v-for="(capture, index) in captures" 
          :key="capture.uuid"
          class="rounded-3xl p-6 transition-all duration-300"
          style="background-color: #fefefe; box-shadow: 0 8px 24px rgba(255, 197, 211, 0.4);"
        >
          <div class="border-b pb-4 mb-4 flex justify-between items-center" style="border-color: #fff5f7;">
            <h2 class="text-2xl font-bold" style="color: #4a4a4a;">
              Capture: {{ formatDate(capture.createdAt) }}
            </h2>
            <span v-if="index === 0" class="px-3 py-1 rounded-full text-sm font-bold" style="background-color: #ffc5d3; color: #4a4a4a;">
              Latest
            </span>
          </div>
          
          <div v-if="capture.entries.length === 0" class="text-center py-6" style="color: #8e8e8e;">
            Tidak ada listing pada saat ini.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr style="color: #8e8e8e; border-bottom: 2px solid #fff5f7;">
                  <th class="py-4 px-4 font-bold">Seller</th>
                  <th class="py-4 px-4 font-bold">Condition</th>
                  <th class="py-4 px-4 font-bold">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="entry in capture.entries" 
                  :key="entry.uuid"
                  class="border-b transition-colors"
                  :style="getRowStyle(entry.status)"
                >
                  <td class="py-4 px-4 font-medium">{{ entry.sellerName || entry.sellerID }}</td>
                  <td class="py-4 px-4">
                    <span 
                      class="px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap"
                      :style="getConditionStyle(entry.condition)"
                    >
                      {{ getConditionName(entry.condition) }} ({{ entry.condition }})
                    </span>
                  </td>
                  <td class="py-4 px-4 font-bold text-lg whitespace-nowrap">
                    {{ entry.price }} G
                    <span v-if="entry.status === 'changed'" class="text-sm ml-2 font-medium" style="color: #8e8e8e;">
                      <del>{{ entry.prevPrice }} G</del>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  </Layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const skinUuid = route.params.id
const isCapturing = ref(false)
const isFavoriteLoading = ref(false)

const { data: response, pending, error, refresh } = await useFetch('/api/skin/history', {
  query: { skinUuid }
})

const { data: favoriteData, refresh: refreshFavorite } = await useFetch('/api/skin/isfavorite', {
  query: { skinUuid }
})
const isFavorite = computed(() => favoriteData.value?.isFavorite ?? false)

const captures = computed(() => response.value?.data || [])
const skinInfo = computed(() => response.value?.skinInfo || null)

const toggleFavorite = async () => {
  if (isFavoriteLoading.value) return
  isFavoriteLoading.value = true
  try {
    await $fetch('/api/skin/favorite', {
      method: 'POST',
      body: { skinUuid }
    })
    await refreshFavorite()
  } catch (err) {
    alert('Gagal update favorite: ' + (err.data?.msg || err.message))
  } finally {
    isFavoriteLoading.value = false
  }
}

const captureData = async () => {
  if (isCapturing.value) return
  isCapturing.value = true
  try {
    await $fetch('/api/skin/capture', {
      method: 'POST',
      body: { skinUuid }
    })
    await refresh()
  } catch (err) {
    alert('Gagal capture data: ' + (err.data?.msg || err.message))
  } finally {
    isCapturing.value = false
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getConditionData = (cond) => {
  if (cond == 0) return { name: 'Factory New', color: '#d1ecf1', text: '#0c5460' }
  if (cond < 0.15) return { name: 'Minimal Wear', color: '#e2d9f3', text: '#5e35b1' }
  if (cond < 0.35) return { name: 'Field Tested', color: '#fff3cd', text: '#856404' }
  if (cond < 0.45) return { name: 'Well Worn', color: '#F28500', text: '#CC5500' }
  return { name: 'Battle Scarred', color: '#ffb3b3', text: '#900' }
}

const getConditionName = (cond) => getConditionData(cond).name
const getConditionStyle = (cond) => {
  const data = getConditionData(cond)
  return `background-color: ${data.color}; color: ${data.text};`
}

const getRowStyle = (status) => {
  let style = 'border-color: #fff5f7;'
  if (status === 'new') style += ' background-color: #e6f4ea;'
  else if (status === 'removed') style += ' background-color: #fce8e6;'
  else if (status === 'changed') style += ' background-color: #fef7e0;'
  else style += ' background-color: #ffffff;'
  return style
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&display=swap');

.font-quicksand {
  font-family: 'Quicksand', sans-serif;
}

table tr:hover {
  filter: brightness(0.97);
}
</style>
