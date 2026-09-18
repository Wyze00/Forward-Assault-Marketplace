<template>
  <Layout>
    <div class="min-h-screen bg-[#F4F4F0] p-6 font-grotesk text-black">
      <div class="container mx-auto max-w-7xl">
        <div class="mb-12">
          <button @click="router.back()" class="px-6 py-3 border-4 border-black bg-white font-black uppercase shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 mb-6">
            &larr; Back
          </button>
          
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 gap-4 border-b-4 border-black pb-6">
            <div>
              <h1 class="text-5xl font-black uppercase tracking-tight">
                {{ skinInfo ? skinInfo.name : 'Loading...' }}
              </h1>
              <p class="text-black font-bold mt-3 text-xl uppercase">History of the last 5 captures</p>
              
              <!-- INFO HARGA -->
              <div class="flex flex-wrap items-center gap-4 mt-6">
                <div class="px-5 py-3 border-4 border-black bg-white flex items-center gap-3 shadow-[4px_4px_0px_#000000]">
                  <span class="text-black font-bold uppercase tracking-wide">Ideal Price</span>
                  <span class="font-black text-2xl text-[#FF5757]">{{ currentPrices.idealPrice !== null && currentPrices.idealPrice !== undefined ? currentPrices.idealPrice + ' G' : '-' }}</span>
                </div>
                <div class="px-5 py-3 border-4 border-black bg-white flex items-center gap-3 shadow-[4px_4px_0px_#000000]">
                  <span class="text-black font-bold uppercase tracking-wide">Shop Price</span>
                  <span class="font-black text-2xl text-[#4D96FF]">{{ currentPrices.shopPrice !== null && currentPrices.shopPrice !== undefined ? currentPrices.shopPrice + ' G' : '-' }}</span>
                </div>
                <button 
                  @click="openPriceModal"
                  class="px-5 py-3 border-4 border-black font-black uppercase text-white bg-[#4D96FF] shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 flex items-center gap-2"
                >
                  ✏️ Update Price
                </button>
              </div>
            </div>
            
            <div class="flex gap-4">
              <button 
                @click="toggleFavorite" 
                :disabled="isFavoriteLoading"
                class="px-6 py-4 border-4 border-black font-black text-3xl leading-none shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="isFavorite ? 'bg-[#FF5757] text-white' : 'bg-white text-gray-300'"
                :title="isFavorite ? 'Remove from favorite' : 'Add to favorite'"
              >
                ♥
              </button>
  
              <button 
                @click="captureData" 
                :disabled="isCapturing" 
                class="px-6 py-4 border-4 border-black font-black uppercase text-black bg-[#FFD23F] shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isCapturing ? 'Capturing...' : '📸 Capture Now' }}
              </button>
            </div>
          </div>
        </div>
  
        <div v-if="pending" class="text-center py-16">
          <span class="text-2xl font-black uppercase tracking-widest animate-pulse">Loading history...</span>
        </div>
        <div v-else-if="error" class="text-center py-16 bg-[#FF5757] border-4 border-black shadow-[8px_8px_0px_#000000] text-white">
          <span class="text-2xl font-black uppercase">Error loading data: {{ error.message }}</span>
        </div>
        <div v-else-if="captures.length === 0" class="text-center py-16 bg-white border-4 border-black shadow-[8px_8px_0px_#000000]">
          <span class="text-2xl font-black uppercase">Tidak ada data history untuk skin ini.</span>
        </div>
        
        <div v-else class="flex flex-col gap-12">
          <div 
            v-for="(capture, index) in captures" 
            :key="capture.uuid"
            class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] p-8"
          >
            <div class="border-b-4 border-black pb-4 mb-6 flex justify-between items-center">
              <h2 class="text-3xl font-black uppercase">
                Capture: {{ formatDate(capture.createdAt) }}
              </h2>
              <span v-if="index === 0" class="px-4 py-2 border-4 border-black font-black uppercase bg-[#FFD23F]">
                Latest
              </span>
            </div>
            
            <div v-if="capture.entries.length === 0" class="text-center py-10">
              <span class="text-xl font-bold uppercase">Tidak ada listing pada saat ini.</span>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr class="bg-black text-white">
                    <th class="py-4 px-6 font-black uppercase border-r-4 border-black border-b-4">Seller</th>
                    <th class="py-4 px-6 font-black uppercase border-r-4 border-black border-b-4">Condition</th>
                    <th class="py-4 px-6 font-black uppercase border-b-4 border-black">Price</th>
                  </tr>
                </thead>
                <tbody class="divide-y-4 divide-black">
                  <tr 
                    v-for="entry in capture.entries" 
                    :key="entry.uuid"
                    class="transition-colors cursor-pointer hover:opacity-90"
                    :class="getRowBgClass(entry.status)"
                  >
                    <td class="py-4 px-6 font-bold border-r-4 border-black">{{ entry.sellerName || entry.sellerID }}</td>
                    <td class="py-4 px-6 border-r-4 border-black">
                      <span 
                        class="px-3 py-1 border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000] whitespace-nowrap"
                        :class="getConditionClass(entry.condition)"
                      >
                        {{ getConditionName(entry.condition) }} ({{ entry.condition }})
                      </span>
                    </td>
                    <td class="py-4 px-6 font-black text-2xl whitespace-nowrap">
                      {{ entry.price }} G
                      <span v-if="entry.status === 'changed'" class="text-sm ml-2 font-bold opacity-75">
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

      <!-- MODAL UPDATE PRICE -->
      <div v-if="isPriceModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-white border-4 border-black shadow-[12px_12px_0px_#000000] p-8 w-full max-w-sm">
          <h2 class="text-3xl font-black mb-6 uppercase">Update Prices</h2>
          
          <div class="mb-6">
            <label class="block text-black font-bold mb-2 uppercase tracking-wide">Ideal Price (G)</label>
            <input 
              type="number" 
              v-model="editIdealPrice" 
              placeholder="e.g. 50"
              class="w-full px-5 py-4 border-4 border-black text-black font-black uppercase shadow-[4px_4px_0px_#000000] focus:outline-none focus:ring-0 rounded-none"
            >
          </div>

          <div class="mb-8">
            <label class="block text-black font-bold mb-2 uppercase tracking-wide">Shop Price (G)</label>
            <input 
              type="number" 
              v-model="editShopPrice" 
              placeholder="e.g. 60"
              class="w-full px-5 py-4 border-4 border-black text-black font-black uppercase shadow-[4px_4px_0px_#000000] focus:outline-none focus:ring-0 rounded-none"
            >
          </div>

          <div class="flex justify-end gap-4">
            <button 
              @click="isPriceModalOpen = false" 
              class="px-6 py-3 border-4 border-black font-black uppercase bg-white shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75"
            >
              Cancel
            </button>
            <button 
              @click="savePrice" 
              :disabled="isPriceUpdating"
              class="px-6 py-3 border-4 border-black font-black uppercase text-white bg-[#4D96FF] shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPriceUpdating ? 'Saving...' : 'Save Changes' }}
            </button>
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

// --- State History & Action ---
const isCapturing = ref(false)
const isFavoriteLoading = ref(false)

// --- State Price Modal ---
const isPriceModalOpen = ref(false)
const isPriceUpdating = ref(false)
const editIdealPrice = ref(null)
const editShopPrice = ref(null)

// --- Fetch Data ---
const { data: response, pending, error, refresh } = await useFetch('/api/skin/history', {
  query: { skinUuid }
})

// --- Computed ---
const isFavorite = computed(() => response.value?.skinInfo.isFavorite ?? false)
const captures = computed(() => response.value?.data || [])
const skinInfo = computed(() => response.value?.skinInfo || null)
const currentPrices = computed(() => ({ idealPrice: response.value?.skinInfo.idealPrice, shopPrice: response.value?.skinInfo.shopPrice}))

// --- Functions ---
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

// Dummy refreshFavorite (since it's not defined in the original but called, we map it to refresh)
const refreshFavorite = async () => {
  await refresh()
}

// Same for refreshPrice
const refreshPrice = async () => {
  await refresh()
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

// Buka Modal & Set Initial Value
const openPriceModal = () => {
  editIdealPrice.value = currentPrices.value.idealPrice
  editShopPrice.value = currentPrices.value.shopPrice
  isPriceModalOpen.value = true
}

// Simpan Harga ke API
const savePrice = async () => {
  if (isPriceUpdating.value) return
  isPriceUpdating.value = true
  try {
    await $fetch('/api/skin/price', {
      method: 'POST',
      body: { 
        skinUuid,
        idealPrice: editIdealPrice.value === '' || editIdealPrice.value === null ? null : Number(editIdealPrice.value),
        shopPrice: editShopPrice.value === '' || editShopPrice.value === null ? null : Number(editShopPrice.value)
      }
    })
    await refreshPrice()
    isPriceModalOpen.value = false
  } catch (err) {
    alert('Gagal update price: ' + (err.data?.msg || err.message))
  } finally {
    isPriceUpdating.value = false
  }
}

// --- Utils ---
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
  if (cond == 0) return { name: 'Factory New', color: 'bg-[#4D96FF]', text: 'text-white' }
  if (cond < 0.15) return { name: 'Minimal Wear', color: 'bg-[#FFD23F]', text: 'text-black' }
  if (cond < 0.35) return { name: 'Field Tested', color: 'bg-white', text: 'text-black' }
  if (cond < 0.45) return { name: 'Well Worn', color: 'bg-[#FF5757]', text: 'text-white' }
  return { name: 'Battle Scarred', color: 'bg-black', text: 'text-white' }
}

const getConditionName = (cond) => getConditionData(cond).name
const getConditionClass = (cond) => {
  const data = getConditionData(cond)
  return `${data.color} ${data.text}`
}

const getRowBgClass = (status) => {
  if (status === 'new') return 'bg-[#4D96FF] text-white'
  if (status === 'removed') return 'bg-[#FF5757] text-white'
  if (status === 'changed') return 'bg-[#FFD23F] text-black'
  return 'bg-white text-black'
}
</script>
