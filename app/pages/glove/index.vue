<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const { data: response, pending, error } = await useFetch('/api/skin/info', {
  query: {
    itemType: 'glove',
    weaponType: 0
  }
})

const skins = computed(() => response.value?.data || [])

const goToDetail = (id) => {
  router.push(`/glove/${id}`)
}

const formatDate = (dateStr) => {
  if (dateStr === '-') return '-'
  return new Date(dateStr).toLocaleString()
}
</script>

<template>
  <Layout>
    <div class="min-h-screen p-6 font-quicksand" style="background-color: #fff5f7; color: #4a4a4a;">
    <div class="container mx-auto">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 class="text-3xl font-bold" style="color: #4a4a4a;">Glove Skins</h1>
        
        <select 
          v-model="sortOrder" 
          class="px-5 py-2.5 rounded-2xl border-none outline-none cursor-pointer transition-all font-semibold" 
          style="background-color: #ffc5d3; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
        >
          <option value="asc">Harga Terendah</option>
          <option value="desc">Harga Tertinggi</option>
        </select>
      </div>
      
      <div v-if="pending" class="text-center py-10" style="color: #8e8e8e;">
        <span class="text-xl font-medium animate-pulse">Loading skins ✨...</span>
      </div>
      <div v-else-if="error" class="text-center py-10 font-medium" style="color: #ffb3b3;">
        Error loading data: {{ error.message }}
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div 
          v-for="skin in skins" 
          :key="skin.id" 
          class="rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 card-hover"
          style="background-color: #fefefe; box-shadow: 0 8px 24px rgba(255, 197, 211, 0.4);"
          @click="goToDetail(skin.id)"
        >
          <h2 class="text-xl font-bold mb-4" style="color: #4a4a4a;">{{ skin.name }}</h2>
          <div class="text-sm flex flex-col gap-2" style="color: #8e8e8e;">
            <p>
              <span class="font-semibold" style="color: #4a4a4a;">Last Capture:</span><br>
              {{ formatDate(skin.lastCaptureDate) }}
            </p>
            <p>
              <span class="font-semibold" style="color: #4a4a4a;">Lowest Price:</span><br>
              <span class="font-bold text-xl mt-1 block" style="color: #ffb0c2;">{{ skin.lowestPrice }} G</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  </Layout>
</template>