<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sellerID = computed(() => String(route.params.id))
const selectedStatus = ref<'all' | 'active' | 'removed'>('all')

const { data: response, pending, error } = await useFetch(() => `/api/sellers/${sellerID.value}`)

const seller = computed(() => response.value?.data ?? null)
const filteredOffers = computed(() => {
  const offers = seller.value?.offers ?? []
  if (selectedStatus.value === 'all') return offers
  return offers.filter((offer) => offer.status === selectedStatus.value)
})

const statusFilters = computed(() => [
  { value: 'all' as const, label: 'All', count: seller.value?.offers.length ?? 0 },
  { value: 'active' as const, label: 'Active', count: seller.value?.activeCount ?? 0 },
  { value: 'removed' as const, label: 'Removed', count: seller.value?.removedCount ?? 0 },
])

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getConditionName = (condition: number) => {
  if (condition < 0.01) return 'Factory New'
  if (condition < 0.15) return 'Minimal Wear'
  if (condition < 0.35) return 'Field Tested'
  if (condition < 0.45) return 'Well Worn'
  return 'Battle Scarred'
}

const openMarketItem = (itemType: string, skinUuid: string) => {
  router.push(`/market/${itemType}/${skinUuid}`)
}
</script>

<template>
  <Layout>
    <div class="min-h-screen bg-[#F4F4F0] p-6 font-grotesk text-black">
      <div class="container mx-auto max-w-7xl">
        <button
          class="mb-8 border-4 border-black bg-white px-5 py-3 font-black uppercase shadow-[4px_4px_0px_#000000] transition-all duration-75 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          @click="router.back()"
        >
          &larr; Back
        </button>

        <div class="mb-8 flex flex-col gap-6 border-b-4 border-black pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-black/60">Seller Profile</p>
            <h1 class="mt-2 break-all text-4xl font-black uppercase">Seller {{ sellerID }}</h1>
            <div v-if="seller?.names.length" class="mt-4 flex max-w-4xl flex-wrap gap-2">
              <span
                v-for="name in seller.names"
                :key="name"
                class="border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-[2px_2px_0px_#000000]"
              >{{ name }}</span>
            </div>
            <p v-else-if="seller" class="mt-4 text-sm font-bold uppercase text-black/60">No seller names recorded</p>
          </div>

          <div v-if="seller" class="flex flex-wrap gap-3">
            <div class="border-4 border-black bg-[#4D96FF] px-4 py-3 text-white shadow-[4px_4px_0px_#000000]">
              <p class="text-[10px] font-black uppercase">Active</p>
              <p class="text-2xl font-black">{{ seller.activeCount }}</p>
            </div>
            <div class="border-4 border-black bg-[#FF5757] px-4 py-3 text-white shadow-[4px_4px_0px_#000000]">
              <p class="text-[10px] font-black uppercase">Removed</p>
              <p class="text-2xl font-black">{{ seller.removedCount }}</p>
            </div>
          </div>
        </div>

        <div v-if="pending" class="border-4 border-black bg-white py-16 text-center shadow-[8px_8px_0px_#000000]">
          <span class="animate-pulse text-xl font-black uppercase">Loading seller history...</span>
        </div>
        <div v-else-if="error || !seller" class="border-4 border-black bg-[#FF5757] py-12 text-center text-white shadow-[8px_8px_0px_#000000]">
          <p class="text-2xl font-black uppercase">Seller history unavailable</p>
          <p class="mt-2 font-bold">{{ error?.message || response?.msg || 'No listing history found for this seller.' }}</p>
        </div>
        <section v-else class="border-4 border-black bg-white shadow-[8px_8px_0px_#000000]">
          <div class="flex flex-col gap-4 border-b-4 border-black p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-black/60">Listing History</p>
              <h2 class="mt-1 text-2xl font-black uppercase">Skins</h2>
            </div>
            <div class="flex flex-wrap gap-2" role="tablist" aria-label="Filter listings by status">
              <button
                v-for="filter in statusFilters"
                :key="filter.value"
                role="tab"
                :aria-selected="selectedStatus === filter.value"
                class="border-2 border-black px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all duration-75 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                :class="selectedStatus === filter.value ? 'bg-[#FFD23F]' : 'bg-white'"
                @click="selectedStatus = filter.value"
              >{{ filter.label }} <span class="ml-1">{{ filter.count }}</span></button>
            </div>
          </div>

          <div v-if="filteredOffers.length" class="overflow-x-auto">
            <table class="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr class="bg-black text-white">
                  <th class="border-b-4 border-r-2 border-black px-5 py-4 text-xs font-black uppercase">Skin</th>
                  <th class="border-b-4 border-r-2 border-black px-5 py-4 text-xs font-black uppercase">Condition</th>
                  <th class="border-b-4 border-r-2 border-black px-5 py-4 text-xs font-black uppercase">Last Price</th>
                  <th class="border-b-4 border-r-2 border-black px-5 py-4 text-xs font-black uppercase">Listed</th>
                  <th class="border-b-4 border-r-2 border-black px-5 py-4 text-xs font-black uppercase">Last Seen</th>
                  <th class="border-b-4 border-black px-5 py-4 text-xs font-black uppercase">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y-2 divide-black">
                <tr
                  v-for="offer in filteredOffers"
                  :key="`${offer.skinUuid}-${offer.skinID}`"
                  class="cursor-pointer transition-colors hover:bg-[#FFD23F]/30"
                  @click="openMarketItem(offer.itemType, offer.skinUuid)"
                >
                  <td class="border-r-2 border-black px-5 py-4">
                    <NuxtLink
                      :to="`/market/${offer.itemType}/${offer.skinUuid}`"
                      class="font-black decoration-2 underline-offset-4"
                      @click.stop
                    >{{ offer.name }}</NuxtLink>
                    <p class="mt-1 text-xs font-bold text-black/60">Skin ID {{ offer.skinID }}</p>
                  </td>
                  <td class="border-r-2 border-black px-5 py-4">
                    <span class="border-2 border-black bg-[#F4F4F0] px-2 py-1 text-xs font-black uppercase">{{ getConditionName(offer.condition) }}</span>
                  </td>
                  <td class="border-r-2 border-black px-5 py-4 text-lg font-black">{{ offer.price.toLocaleString('id-ID') }} G</td>
                  <td class="border-r-2 border-black px-5 py-4 text-sm font-bold">{{ formatDate(offer.listingDate) }}</td>
                  <td class="border-r-2 border-black px-5 py-4 text-sm font-bold">{{ formatDate(offer.lastSeenAt) }}</td>
                  <td class="px-5 py-4">
                    <span
                      class="inline-block border-2 border-black px-3 py-1 text-xs font-black uppercase"
                      :class="offer.status === 'active' ? 'bg-[#4D96FF] text-white' : 'bg-[#FF5757] text-white'"
                    >{{ offer.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="p-12 text-center">
            <p class="text-lg font-black uppercase">No {{ selectedStatus === 'all' ? '' : selectedStatus }} listings found</p>
          </div>
        </section>
      </div>
    </div>
  </Layout>
</template>
