<template>
  <Layout>
    <div class="min-h-screen bg-[#F4F4F0] p-6 font-grotesk text-black">
      <div class="container mx-auto max-w-7xl">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4 border-b-4 border-black pb-6">
          <h1 class="text-4xl font-black uppercase tracking-tight">Skins Browse</h1>
          
          <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <!-- Search Input -->
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search skins..."
              class="px-5 py-3 border-4 border-black text-black font-bold uppercase shadow-[4px_4px_0px_#000000] focus:outline-none focus:ring-0 rounded-none w-full sm:w-auto"
            />

            <!-- Category Selector -->
            <select 
              v-model="selectedValue" 
              class="px-5 py-3 border-4 border-black bg-white text-black font-bold uppercase shadow-[4px_4px_0px_#000000] focus:outline-none appearance-none rounded-none cursor-pointer hover:bg-[#FFD23F] transition-colors w-full sm:w-auto"
              :disabled="weaponsPending"
            >
              <option v-if="weaponsPending" value="">Loading categories...</option>
              <option v-for="opt in weaponOptions" :key="opt.value" :value="opt.value">
                {{ opt.name }}
              </option>
            </select>

            <!-- Price Sort Selector -->
            <select 
              v-model="sortOrder" 
              class="px-5 py-3 border-4 border-black bg-[#FF5757] text-white font-bold uppercase shadow-[4px_4px_0px_#000000] focus:outline-none appearance-none rounded-none cursor-pointer hover:bg-[#4D96FF] transition-colors w-full sm:w-auto" 
            >
              <option value="asc">Harga Terendah</option>
              <option value="desc">Harga Tertinggi</option>
            </select>
          </div>
        </div>
        
        <div v-if="skinsPending || weaponsPending" class="text-center py-16">
          <span class="text-2xl font-black uppercase tracking-widest animate-pulse">Loading skins...</span>
        </div>
        <div v-else-if="skinsError || weaponsError" class="text-center py-16 bg-[#FF5757] border-4 border-black shadow-[8px_8px_0px_#000000] text-white">
          <span class="text-2xl font-black uppercase">Error loading data: {{ skinsError?.message || weaponsError?.message }}</span>
        </div>
        <div v-else-if="!selectedValue" class="text-center py-16 bg-white border-4 border-black shadow-[8px_8px_0px_#000000]">
          <span class="text-2xl font-black uppercase">Silakan pilih kategori terlebih dahulu</span>
        </div>
        <div v-else-if="skins.length === 0" class="text-center py-16 bg-white border-4 border-black shadow-[8px_8px_0px_#000000]">
          <span class="text-2xl font-black uppercase">Tidak ada skin ditemukan untuk kategori ini.</span>
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
              class="absolute top-4 right-4 text-3xl leading-none hover:scale-110 transition-transform z-10"
              :class="skin.isFavorite ? 'text-[#FF5757]' : 'text-gray-300 hover:text-black'"
              :title="skin.isFavorite ? 'Remove from favorite' : 'Add to favorite'"
              @click="toggleFavorite($event, skin)"
            >
              {{ skin.isFavorite ? '♥' : '♥' }}
            </button>

            <div>
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
                {{ capturingIds.has(skin.id) ? 'Capturing...' : 'Capture' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { computed, ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const sortOrder = ref('asc')
const searchQuery = ref('')
const capturingIds = reactive(new Set())
const selectedValue = ref('glove')

const { data: weaponsResponse, pending: weaponsPending, error: weaponsError } = await useFetch('/api/weapon')

const weaponOptions = computed(() => {
  const list = [
    { name: 'Glove', value: 'glove' },
    { name: 'Character', value: 'character' },
  ]
  if (weaponsResponse.value?.data) {
    weaponsResponse.value.data.forEach(w => {
      list.push({ name: w.weaponName, value: w.weaponType })
    })
  }
  return list
})

const currentItemType = computed(() => {
  if (selectedValue.value === 'glove' || selectedValue.value === 'character') return selectedValue.value
  return 'weapon'
})

const currentWeaponType = computed(() => {
  if (selectedValue.value === 'glove' || selectedValue.value === 'character') return 0
  return selectedValue.value
})

const { data: skinsResponse, pending: skinsPending, error: skinsError, refresh } = await useFetch('/api/skin/info', {
  query: computed(() => ({
    itemType: currentItemType.value,
    weaponType: currentWeaponType.value
  }))
})

// watch selectedValue and reset searchQuery
watch(selectedValue, () => {
  searchQuery.value = ''
})

const skins = computed(() => {
  let data = skinsResponse.value?.data || []
  if (searchQuery.value) {
    const lower = searchQuery.value.toLowerCase()
    data = data.filter(s => s.name.toLowerCase().includes(lower))
  }
  return [...data].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    if (sortOrder.value === 'asc') return a.lowestPrice - b.lowestPrice
    return b.lowestPrice - a.lowestPrice
  })
})

const goToDetail = (skin) => {
  const itemType = skin.itemType || currentItemType.value
  router.push(`/weapon/${itemType}/${skin.id}`)
}

const toggleFavorite = async (event, skin) => {
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
</script>
