<template>
  <Layout>
    <div class="min-h-screen p-6 font-quicksand" style="background-color: #fff5f7; color: #4a4a4a;">
    <div class="container mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 class="text-3xl font-bold" style="color: #4a4a4a;">Weapon Skins</h1>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <!-- Weapon Type Selector -->
          <select 
            v-model="selectedWeapon" 
            class="px-5 py-2.5 rounded-2xl border-none outline-none cursor-pointer transition-all font-semibold w-full sm:w-auto" 
            style="background-color: #fefefe; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
            :disabled="weaponsPending"
          >
            <option v-if="weaponsPending" value="">Loading weapons...</option>
            <option v-for="weapon in weaponsData" :key="weapon.weaponType" :value="weapon.weaponType">
              {{ weapon.weaponName }}
            </option>
          </select>

          <!-- Price Sort Selector -->
          <select 
            v-model="sortOrder" 
            class="px-5 py-2.5 rounded-2xl border-none outline-none cursor-pointer transition-all font-semibold w-full sm:w-auto" 
            style="background-color: #ffc5d3; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
          >
            <option value="asc">Harga Terendah</option>
            <option value="desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>
      
      <div v-if="skinsPending || weaponsPending" class="text-center py-10" style="color: #8e8e8e;">
        <span class="text-xl font-medium animate-pulse">Loading skins ✨...</span>
      </div>
      <div v-else-if="skinsError || weaponsError" class="text-center py-10 font-medium" style="color: #ffb3b3;">
        Error loading data: {{ skinsError?.message || weaponsError?.message }}
      </div>
      <div v-else-if="!selectedWeapon" class="text-center py-10 font-medium" style="color: #8e8e8e;">
        Silakan pilih weapon terlebih dahulu ✨
      </div>
      <div v-else-if="skins.length === 0" class="text-center py-10 font-medium" style="color: #8e8e8e;">
        Tidak ada skin ditemukan untuk weapon ini.
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div 
          v-for="skin in skins" 
          :key="skin.id" 
          class="rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 card-hover relative"
          :style="`background-color: #fefefe; box-shadow: 0 8px 24px rgba(255, 197, 211, 0.4); ${skin.isFavorite ? 'border: 2px solid #ffc5d3;' : ''}`"
          @click="goToDetail(skin.id)"
        >
          <!-- Favorite Button -->
          <button
            class="absolute top-4 right-4 text-2xl leading-none transition-transform hover:scale-125"
            :title="skin.isFavorite ? 'Remove from favorite' : 'Add to favorite'"
            @click="toggleFavorite($event, skin)"
          >
            {{ skin.isFavorite ? '♥' : '♡' }}
          </button>

          <h2 class="text-xl font-bold mb-4 pr-8" style="color: #4a4a4a;">{{ skin.name }}</h2>
          <div class="text-sm flex flex-col gap-2" style="color: #8e8e8e;">
            <p>
              <span class="font-semibold" style="color: #4a4a4a;">Last Capture:</span><br>
              {{ formatDate(skin.lastCaptureDate) }}
            </p>
            <p>
              <span class="font-semibold" style="color: #4a4a4a;">Lowest Price:</span><br>
              <span class="font-bold text-xl mt-1 block" style="color: #ffb0c2;">{{ skin.lowestPrice }} G</span>
            </p>
            <button
              class="mt-3 w-full py-2 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style="background-color: #ffb0c2; color: #fefefe; box-shadow: 0 4px 10px rgba(255, 176, 194, 0.4);"
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
const capturingIds = reactive(new Set())

// Fetch weapons list
const { data: weaponsResponse, pending: weaponsPending, error: weaponsError } = await useFetch('/api/weapon')
const weaponsData = computed(() => weaponsResponse.value?.data || [])

// Set default weapon based on fetched data
const selectedWeapon = ref(weaponsData.value.length > 0 ? weaponsData.value[0].weaponType : '')

// Reactive query for skins API
const { data: skinsResponse, pending: skinsPending, error: skinsError, refresh } = await useFetch('/api/skin/info', {
  query: computed(() => ({
    itemType: 'weapon',
    weaponType: selectedWeapon.value
  }))
})

const skins = computed(() => {
  const data = skinsResponse.value?.data || []
  return [...data].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    if (sortOrder.value === 'asc') return a.lowestPrice - b.lowestPrice
    return b.lowestPrice - a.lowestPrice
  })
})

const goToDetail = (id) => {
  router.push(`/weapon/${id}`)
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');

.font-quicksand {
  font-family: 'Quicksand', sans-serif;
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234a4a4a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1.25rem center;
  background-size: 1.2em;
  padding-right: 3rem;
}

select:hover {
  background-color: #ffb0c2 !important;
}

select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

select[style*="background-color: #fefefe"]:hover {
  background-color: #fff0f3 !important;
}

.card-hover:hover {
  box-shadow: 0 12px 32px rgba(255, 176, 194, 0.6) !important;
}
</style>
