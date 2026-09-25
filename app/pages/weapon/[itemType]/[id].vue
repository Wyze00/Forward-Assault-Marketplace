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
                  Update Price
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
                {{ isCapturing ? 'Capturing...' : 'Capture Now' }}
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
          <div class="grid grid-cols-1  gap-8">
            <div class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] p-6">
              <div class="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-black/70">Trend</p>
                  <h3 class="text-2xl font-black uppercase mt-2">Floor Price Movement</h3>
                </div>
                <select
                  v-if="availableConditions.length"
                  v-model="selectedCondition"
                  class="border-4 border-black bg-[#FFD23F] px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_#000000]"
                  aria-label="Pilih kondisi skin"
                >
                  <option v-for="condition in availableConditions" :key="condition.conditionGroup" :value="condition.conditionGroup">
                    {{ condition.conditionName }}
                  </option>
                </select>
                <span :class="trendBadgeClass" class="inline-flex items-center border-4 border-black px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_#000000]">
                  {{ trendLabel }}
                </span>
              </div>

              <div v-if="trendLoading" class="text-sm font-bold uppercase">Loading trend...</div>
              <div v-else-if="trendError" class="text-sm font-bold uppercase text-[#FF5757]">Trend unavailable</div>
              <div v-else>
                <div class="mb-3 flex items-center justify-between gap-3 border-4 border-black bg-[#F4F4F0] p-3 shadow-[3px_3px_0px_#000000] transition-transform duration-200 hover:-translate-y-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-black/70">Market Direction</span>
                  <span :class="trendBadgeClass" class="border-2 border-black px-2 py-1 text-[10px] font-black uppercase transition-all duration-200 hover:scale-105 hover:shadow-[3px_3px_0px_#000000]">
                    {{ marketDirectionText }}
                  </span>
                </div>

                <div class="h-72 rounded-none border-4 border-black bg-[#F4F4F0] p-3">
                  <svg viewBox="0 0 620 220" class="w-full h-full" role="img" aria-label="Price trend chart">
                    <defs>
                      <linearGradient id="floorGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#FF5757" stop-opacity="0.35" />
                        <stop offset="100%" stop-color="#FF5757" stop-opacity="0.05" />
                      </linearGradient>
                    </defs>
                    <g v-for="tick in 5" :key="tick">
                      <line
                        :x1="20"
                        :x2="600"
                        :y1="20 + ((tick - 1) * 40)"
                        :y2="20 + ((tick - 1) * 40)"
                        stroke="#000"
                        stroke-width="1"
                        stroke-dasharray="4 6"
                        opacity="0.25"
                      />
                    </g>
                    <path d="M 20 180 L 600 180" stroke="#000" stroke-width="3" fill="none" />
                    <path d="M 20 20 L 20 180" stroke="#000" stroke-width="3" fill="none" />
                    <path
                      :d="floorAreaPath"
                      fill="url(#floorGradient)"
                      opacity="0.9"
                    />
                    <path
                      :d="trendPath" 
                      fill="none"
                      stroke="#FF5757"
                      stroke-width="4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      :d="avgTrendPath"
                      fill="none"
                      stroke="#4D96FF"
                      stroke-width="4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray="8 8"
                    />
                    <g v-for="(point, index) in trendPoints" :key="index" @mouseenter="hoveredPointIndex = index" @mouseleave="hoveredPointIndex = null">
                    <circle
                      :cx="point.x"
                      :cy="point.y"
                      r="14"
                      fill="transparent"
                      class="cursor-pointer"
                    />
                    <circle
                      :cx="point.x"
                      :cy="point.y"
                      :r="hoveredPointIndex === index ? 7 : 5"
                      fill="#000"
                      class="transition-all duration-200 ease-out"
                    />
                    <circle
                      :cx="point.avgX"
                      :cy="point.avgY"
                      :r="hoveredPointIndex === index ? 7 : 5"
                      fill="#4D96FF"
                      class="transition-all duration-200 ease-out"
                    />
                    </g>
                    <g v-if="hoveredTrendPoint" class="pointer-events-none">
                      <rect
                        :x="tooltipX"
                        y="28"
                        width="170"
                        height="72"
                        fill="#FFFFFF"
                        stroke="#000000"
                        stroke-width="3"
                        class="drop-shadow-[3px_3px_0px_#000000]"
                      />
                      <text :x="tooltipX + 10" y="45" font-size="10" font-weight="900" fill="#000000">{{ formatDate(hoveredTrendPoint.capturedAt) }}</text>
                      <text :x="tooltipX + 10" y="63" font-size="11" font-weight="900" fill="#FF5757">Floor {{ formatPrice(hoveredTrendPoint.floorPrice) }}</text>
                      <text :x="tooltipX + 10" y="81" font-size="11" font-weight="900" fill="#4D96FF">Avg {{ formatPrice(hoveredTrendPoint.avgPrice) }}</text>
                    </g>
                    <text v-if="lastTrendPoint" :x="lastTrendPoint.x + 10" :y="lastTrendPoint.y - 10" font-size="12" font-weight="900" fill="#000">Floor {{ formatPrice(lastTrendPoint.floorPrice) }}</text>
                    <text v-if="lastAveragePoint" :x="lastAveragePoint.avgX + 10" :y="lastAveragePoint.avgY - 12" font-size="12" font-weight="900" fill="#4D96FF">Avg {{ formatPrice(lastAveragePoint.avgPrice) }}</text>
                  </svg>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-3">
                  <div class="inline-flex items-center gap-2 border-4 border-black bg-[#FF5757] px-3 py-2 shadow-[3px_3px_0px_#000000] text-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000000]" title="Harga terendah pada setiap capture">
                    <span class="inline-block w-3 h-3 border-2 border-black bg-[#FF5757]"></span>
                    <span class="text-[10px] font-black uppercase">Floor</span>
                  </div>
                  <div class="inline-flex items-center gap-2 border-4 border-black bg-[#4D96FF] px-3 py-2 shadow-[3px_3px_0px_#000000] text-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000000]" title="Rata-rata harga yang masuk pada rentang data">
                    <span class="inline-block w-3 h-3 border-2 border-black bg-[#4D96FF]"></span>
                    <span class="text-[10px] font-black uppercase">Average</span>
                  </div>
                </div>

                <div class="mt-5 border-4 border-black bg-[#FFD23F] p-4 shadow-[4px_4px_0px_#000000]">
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.2em]">Inferred Sales</p>
                      <p class="mt-1 text-xs font-bold uppercase">Offer hilang pada capture berikutnya</p>
                    </div>
                    <span class="border-2 border-black bg-white px-2 py-1 text-xs font-black uppercase">
                      {{ trendSummary.inferredSoldCount ?? 0 }} detected
                    </span>
                  </div>
                  <div class="flex items-end justify-between gap-3">
                    <span class="text-sm font-black uppercase">Estimated Avg Sold</span>
                    <span class="text-2xl font-black">{{ formatPrice(trendSummary.estimatedSoldAverage) }}</span>
                  </div>
                  <p class="mt-2 text-[10px] font-bold uppercase leading-tight">
                    Estimasi memakai harga terakhir sebelum offer menghilang; bisa berarti terjual atau dihapus penjual.
                  </p>
                  <div v-if="inferredSoldOffers.length" class="mt-4 space-y-2 border-t-2 border-black pt-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.15em]">Latest detected offers</p>
                    <div
                      v-for="offer in inferredSoldOffers.slice(0, 3)"
                      :key="`${offer.sellerID}-${offer.skinID}-${offer.detectedAt}`"
                      class="flex items-center justify-between gap-3 border-2 border-black bg-white px-3 py-2 text-xs"
                    >
                      <span class="truncate font-bold uppercase">{{ offer.sellerName || offer.sellerID }}</span>
                      <span class="shrink-0 font-black">{{ formatPrice(offer.estimatedPrice) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] p-6">
              <div class="mb-4">
                <p class="text-xs font-black uppercase tracking-[0.2em] text-black/70">Sales Velocity</p>
                <h3 class="text-2xl font-black uppercase mt-2">Time On Market</h3>
              </div>

              <div v-if="velocityLoading" class="text-sm font-bold uppercase">Loading velocity...</div>
              <div v-else-if="velocityError" class="text-sm font-bold uppercase text-[#FF5757]">Velocity unavailable</div>
              <div v-else class="space-y-4">
                <div class="flex items-center justify-between border-4 border-black p-4 bg-[#FFD23F] shadow-[4px_4px_0px_#000000]">
                  <span class="font-black uppercase">Avg. Sold Time</span>
                  <span class="text-2xl font-black">{{ velocityData?.averageHours != null ? velocityData.averageHours + ' h' : 'N/A' }}</span>
                </div>
                <div class="flex items-center justify-between border-4 border-black p-4 bg-white shadow-[4px_4px_0px_#000000]">
                  <span class="font-black uppercase">Avg. Minutes</span>
                  <span class="text-2xl font-black">{{ velocityData?.averageMinutes != null ? velocityData.averageMinutes + ' min' : 'N/A' }}</span>
                </div>
                <div class="flex items-center justify-between border-4 border-black p-4 bg-[#4D96FF] text-white shadow-[4px_4px_0px_#000000]">
                  <span class="font-black uppercase">Detected Events</span>
                  <span class="text-2xl font-black">{{ velocityData?.count ?? 0 }}</span>
                </div>
              </div>
            </div>
          </div>

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
const hoveredPointIndex = ref(null)

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

const { data: trendResponse, pending: trendLoading, error: trendError } = await useFetch('/api/skin/trend', {
  query: { skinUuid }
})

const { data: velocityResponse, pending: velocityLoading, error: velocityError } = await useFetch('/api/skin/velocity', {
  query: { skinUuid }
})

// --- Computed ---
const isFavorite = computed(() => response.value?.skinInfo.isFavorite ?? false)
const captures = computed(() => response.value?.data || [])
const skinInfo = computed(() => response.value?.skinInfo || null)
const currentPrices = computed(() => ({ idealPrice: response.value?.skinInfo.idealPrice, shopPrice: response.value?.skinInfo.shopPrice}))
const selectedCondition = ref(null)
const availableConditions = computed(() => trendResponse.value?.conditions || [])
const selectedConditionTrend = computed(() => {
  if (!availableConditions.value.length) {
    return {
      data: trendResponse.value?.data || [],
      summary: trendResponse.value?.summary || { label: 'sideways', deltaPrice: 0, changePercent: 0 },
    }
  }

  return availableConditions.value.find((condition) => condition.conditionGroup === selectedCondition.value)
    || availableConditions.value[0]
})
const trendData = computed(() => selectedConditionTrend.value.data || [])
const velocityData = computed(() => velocityResponse.value?.data || null)
const trendSummary = computed(() => selectedConditionTrend.value.summary || { label: 'sideways', deltaPrice: 0, changePercent: 0 })
const inferredSoldOffers = computed(() => trendData.value
  .flatMap((capture) => (capture.inferredSoldOffers || []).map((offer) => ({
    ...offer,
    detectedAt: capture.soldDetectedAt || capture.capturedAt,
  })))
  .sort((first, second) => new Date(second.detectedAt).getTime() - new Date(first.detectedAt).getTime()))
const trendLabel = computed(() => trendSummary.value.label || 'sideways')
const marketDirectionText = computed(() => {
  if (trendLabel.value === 'uptrend') return 'Uptrend'
  if (trendLabel.value === 'downtrend') return 'Downtrend'
  return 'Sideways'
})
const trendBadgeClass = computed(() => {
  if (trendLabel.value === 'uptrend') return 'bg-[#4D96FF] text-white'
  if (trendLabel.value === 'downtrend') return 'bg-[#FF5757] text-white'
  return 'bg-[#FFD23F] text-black'
})

const trendPoints = computed(() => {
  const values = trendData.value.filter((item) => item.floorPrice !== null && item.avgPrice !== null)
  if (!values.length) return []

  const minPrice = Math.min(...values.flatMap((item) => [item.floorPrice, item.avgPrice]))
  const maxPrice = Math.max(...values.flatMap((item) => [item.floorPrice, item.avgPrice]))
  const minMaxRange = maxPrice - minPrice || 1

  return values.map((item, index) => {
    const x = 20 + (index * (560 / Math.max(1, values.length - 1)))
    const floorY = 180 - ((item.floorPrice - minPrice) / minMaxRange) * 140
    const avgY = 180 - ((item.avgPrice - minPrice) / minMaxRange) * 140

    return {
      ...item,
      x,
      y: floorY,
      avgX: x,
      avgY,
    }
  })
})

const lastTrendPoint = computed(() => trendPoints.value[trendPoints.value.length - 1] || null)
const lastAveragePoint = computed(() => trendPoints.value[trendPoints.value.length - 1] || null)
const hoveredTrendPoint = computed(() => {
  if (hoveredPointIndex.value === null) return null
  return trendPoints.value[hoveredPointIndex.value] || null
})
const tooltipX = computed(() => {
  if (!hoveredTrendPoint.value) return 20
  return Math.min(Math.max(20, hoveredTrendPoint.value.x - 85), 430)
})

const trendPath = computed(() => {
  return trendPoints.value.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
})

const avgTrendPath = computed(() => {
  return trendPoints.value.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.avgX} ${point.avgY}`).join(' ')
})

const floorAreaPath = computed(() => {
  if (!trendPoints.value.length) return ''

  const line = trendPath.value
  const last = trendPoints.value[trendPoints.value.length - 1]
  return `${line} L ${last.x} 180 L 20 180 Z`
})

const formatPrice = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A'
  return `${Number(value).toLocaleString('id-ID')} G`
}

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
  if (cond < 0.01) return { name: 'Factory New', color: 'bg-[#4D96FF]', text: 'text-white' }
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
