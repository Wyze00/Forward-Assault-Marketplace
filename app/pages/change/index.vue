<template>
  <Layout>
    <div class="min-h-screen bg-[#F4F4F0] p-6 font-grotesk text-black">
      <div class="container mx-auto max-w-7xl">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4 border-b-4 border-black pb-6">
          <div>
            <h1 class="text-4xl font-black uppercase tracking-tight">Skin Offer Changes</h1>
            <p class="mt-2 text-lg font-bold">
              {{ filteredChanges.length }} perubahan tercatat
            </p>
          </div>

          <!-- Filter Controls -->
          <div class="flex flex-wrap gap-4">
            <select
              v-model="filterSeen"
              class="px-5 py-3 border-4 border-black bg-white text-black font-bold uppercase shadow-[4px_4px_0px_#000000] focus:outline-none appearance-none rounded-none cursor-pointer hover:bg-[#FFD23F] transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="unseen">Belum Dilihat (Unseen)</option>
              <option value="seen">Sudah Dilihat (Seen)</option>
            </select>

            <select
              v-model="filterType"
              class="px-5 py-3 border-4 border-black bg-[#4D96FF] text-white font-bold uppercase shadow-[4px_4px_0px_#000000] focus:outline-none appearance-none rounded-none cursor-pointer hover:bg-[#FFD23F] hover:text-black transition-colors"
            >
              <option value="all">Semua Perubahan</option>
              <option value="add">Added (+)</option>
              <option value="remove">Removed (-)</option>
              <option value="change">Price/Condition Changed (✎)</option>
            </select>
          </div>
        </div>

        <!-- State Handling -->
        <div v-if="pending" class="text-center py-16">
          <span class="text-2xl font-black uppercase tracking-widest animate-pulse">Memuat data perubahan...</span>
        </div>
        <div v-else-if="error" class="text-center py-16 bg-[#FF5757] border-4 border-black shadow-[8px_8px_0px_#000000] text-white">
          <span class="text-2xl font-black uppercase">Gagal memuat data: {{ error.message }}</span>
        </div>
        <div v-else-if="filteredChanges.length === 0" class="text-center py-16 bg-white border-4 border-black shadow-[8px_8px_0px_#000000]">
          <p class="text-6xl mb-6">(=^・^=)</p>
          <p class="text-2xl font-black uppercase">Tidak ada data perubahan ditemukan.</p>
        </div>

        <!-- Table Container -->
        <div
          v-else
          class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-black text-white">
                  <th class="py-4 px-6 font-black uppercase border-r-4 border-black border-b-4">Item Skin</th>
                  <th class="py-4 px-6 font-black uppercase border-r-4 border-black border-b-4">Penjual</th>
                  <th class="py-4 px-6 font-black uppercase border-r-4 border-black border-b-4">Kondisi</th>
                  <th class="py-4 px-6 font-black uppercase border-r-4 border-black border-b-4">Harga</th>
                  <th class="py-4 px-6 font-black uppercase border-r-4 border-black border-b-4">Tanggal</th>
                  <th class="py-4 px-6 font-black uppercase text-center border-b-4 border-black">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y-4 divide-black">
                <tr
                  v-for="item in filteredChanges"
                  :key="item.uuid"
                  class="transition-colors cursor-pointer hover:opacity-90"
                  :class="getRowBgClass(item)"
                  @click="goToDetail(item)"
                >
                  <!-- Skin Info -->
                  <td class="py-4 px-6 border-r-4 border-black">
                    <span
                      class="inline-block px-2 py-1 border-2 border-black text-[10px] font-black uppercase mb-2 shadow-[2px_2px_0px_#000000] bg-white text-black"
                    >
                      {{ item.itemType }}
                    </span>
                    <p class="font-black text-lg uppercase leading-tight">{{ item.name }}</p>
                  </td>

                  <!-- Seller -->
                  <td class="py-4 px-6 font-bold border-r-4 border-black">{{ item.sellerName }}</td>

                  <!-- Condition -->
                  <td class="py-4 px-6 border-r-4 border-black">
                    <span
                      class="inline-block px-3 py-1 border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000] whitespace-nowrap"
                      :class="getConditionClass(item.condition)"
                    >
                      {{ item.condition }}
                    </span>
                  </td>

                  <!-- Price -->
                  <td class="py-4 px-6 font-black text-2xl whitespace-nowrap border-r-4 border-black">
                    {{ item.price }} G
                  </td>

                  <!-- Date -->
                  <td class="py-4 px-6 text-sm font-bold border-r-4 border-black">
                    {{ formatDate(item.createdAt) }}
                  </td>

                  <!-- Action Toggle Seen -->
                  <td class="py-4 px-6 text-center">
                    <button
                      class="w-full px-4 py-3 border-4 border-black font-black uppercase text-xs tracking-wider transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
                      :class="item.seen 
                        ? 'bg-gray-300 text-black shadow-none translate-x-[4px] translate-y-[4px]' 
                        : 'bg-[#FFD23F] text-black shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none'"
                      :disabled="updatingUuids.has(item.uuid)"
                      @click.stop="toggleSeen(item)"
                    >
                      {{ updatingUuids.has(item.uuid) ? '...' : (item.seen ? '✓ Seen' : 'Mark Seen') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const filterSeen = ref('all')
const filterType = ref('all')
const updatingUuids = reactive(new Set())

const { data: response, pending, error, refresh } = await useFetch('/api/skin/change');

let intervalId = null;

onMounted(() => {
  // Jalankan interval hanya di browser (client-side)
  intervalId = setInterval(() => {
    refresh();
  }, 60 * 1000);
});

onUnmounted(() => {
  // Bersihkan interval saat komponen dihancurkan atau pindah halaman
  if (intervalId) clearInterval(intervalId);
});

const changes = computed(() => response.value?.data || [])

const filteredChanges = computed(() => {
  return changes.value.filter(item => {
    const matchSeen = filterSeen.value === 'all' 
      ? true 
      : filterSeen.value === 'seen' ? item.seen : !item.seen
    const matchType = filterType.value === 'all' 
      ? true 
      : item.type === filterType.value

    return matchSeen && matchType
  })
})

const goToDetail = (item) => {
  const type = item.itemType || 'weapon'
  router.push(`/weapon/${type}/${item.skinUuid}`)
}

const toggleSeen = async (item) => {
  if (updatingUuids.has(item.uuid)) return
  updatingUuids.add(item.uuid)

  try {
    await $fetch('/api/skin/change', {
      method: 'PUT',
      body: {
        uuid: item.uuid,
        seen: !item.seen
      }
    })
    await refresh()
  } catch (err) {
    alert('Gagal mengupdate status: ' + (err.data?.msg || err.message))
  } finally {
    updatingUuids.delete(item.uuid)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Mengatur warna background baris tabel berdasarkan tipe perubahan
const getRowBgClass = (item) => {
  if (item.type === 'add') return 'bg-[#4D96FF] text-white' // Blue for add
  else if (item.type === 'remove') return 'bg-[#FF5757] text-white' // Red for remove
  else if (item.type === 'change') return 'bg-[#FFD23F] text-black' // Yellow for change

  return 'bg-white text-black'
}

const getConditionClass = (cond) => {
  if (cond == 0) return 'bg-[#4D96FF] text-white'
  if (cond < 0.15) return 'bg-[#FFD23F] text-black'
  if (cond < 0.35) return 'bg-white text-black'
  return 'bg-[#FF5757] text-white'
}
</script>