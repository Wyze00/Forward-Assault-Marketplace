<template>
  <Layout>
    <div class="min-h-screen p-6 font-quicksand" style="background-color: #fff5f7; color: #4a4a4a;">
      <div class="container mx-auto max-w-6xl">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-bold" style="color: #4a4a4a;">Skin Offer Changes 🔔</h1>
            <p class="mt-1 text-sm font-medium" style="color: #8e8e8e;">
              {{ filteredChanges.length }} perubahan tercatat
            </p>
          </div>

          <!-- Filter Controls -->
          <div class="flex flex-wrap gap-3">
            <select
              v-model="filterSeen"
              class="px-5 py-2.5 rounded-2xl border-none outline-none cursor-pointer font-semibold transition-all"
              style="background-color: #fefefe; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
            >
              <option value="all">Semua Status</option>
              <option value="unseen">Belum Dilihat (Unseen)</option>
              <option value="seen">Sudah Dilihat (Seen)</option>
            </select>

            <select
              v-model="filterType"
              class="px-5 py-2.5 rounded-2xl border-none outline-none cursor-pointer font-semibold transition-all"
              style="background-color: #ffc5d3; color: #4a4a4a; box-shadow: 0 4px 12px rgba(255, 197, 211, 0.4);"
            >
              <option value="all">Semua Perubahan</option>
              <option value="add">Added (+)</option>
              <option value="remove">Removed (-)</option>
              <option value="change">Price/Condition Changed (✎)</option>
            </select>
          </div>
        </div>

        <!-- State Handling -->
        <div v-if="pending" class="text-center py-10" style="color: #8e8e8e;">
          <span class="text-xl font-medium animate-pulse">Memuat data perubahan... ✨</span>
        </div>
        <div v-else-if="error" class="text-center py-10 font-medium" style="color: #ffb3b3;">
          Gagal memuat data: {{ error.message }}
        </div>
        <div v-else-if="filteredChanges.length === 0" class="text-center py-16 font-medium" style="color: #8e8e8e;">
          <p class="text-5xl mb-4">(=^・^=)</p>
          <p class="text-xl">Tidak ada data perubahan ditemukan.</p>
        </div>

        <!-- Table Container -->
        <div
          v-else
          class="rounded-3xl p-6 overflow-hidden"
          style="background-color: #fefefe; box-shadow: 0 8px 24px rgba(255, 197, 211, 0.4);"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr style="color: #8e8e8e; border-bottom: 2px solid #fff5f7;">
                  <th class="py-4 px-4 font-bold">Item Skin</th>
                  <th class="py-4 px-4 font-bold">Penjual</th>
                  <th class="py-4 px-4 font-bold">Kondisi</th>
                  <th class="py-4 px-4 font-bold">Harga</th>
                  <th class="py-4 px-4 font-bold">Tanggal</th>
                  <th class="py-4 px-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredChanges"
                  :key="item.uuid"
                  class="border-b transition-colors cursor-pointer hover:brightness-95"
                  :style="getRowBgStyle(item)"
                  @click="goToDetail(item)"
                >
                  <!-- Skin Info -->
                  <td class="py-4 px-4">
                    <span
                      class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1"
                      :style="getTypeBadgeStyle(item.itemType)"
                    >
                      {{ item.itemType.toUpperCase() }}
                    </span>
                    <p class="font-bold text-base" style="color: #4a4a4a;">{{ item.name }}</p>
                  </td>

                  <!-- Seller -->
                  <td class="py-4 px-4 font-medium">{{ item.sellerName }}</td>

                  <!-- Condition -->
                  <td class="py-4 px-4">
                    <span
                      class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap"
                      :style="getConditionStyle(item.condition)"
                    >
                      {{ item.condition }}
                    </span>
                  </td>

                  <!-- Price -->
                  <td class="py-4 px-4 font-bold text-lg whitespace-nowrap" style="color: #ffb0c2;">
                    {{ item.price }} G
                  </td>

                  <!-- Date -->
                  <td class="py-4 px-4 text-xs font-medium" style="color: #8e8e8e;">
                    {{ formatDate(item.createdAt) }}
                  </td>

                  <!-- Action Toggle Seen -->
                  <td class="py-4 px-4 text-center" @click.stopPropagation>
                    <button
                      class="px-4 py-1.5 rounded-2xl text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      :style="item.seen 
                        ? 'background-color: #fefefe; color: #8e8e8e; border: 1px solid #ffc5d3;' 
                        : 'background-color: #ffc5d3; color: #4a4a4a; box-shadow: 0 4px 10px rgba(255, 197, 211, 0.5);'"
                      :disabled="updatingUuids.has(item.uuid)"
                      @click="toggleSeen(item)"
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
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const filterSeen = ref('all')
const filterType = ref('all')
const updatingUuids = reactive(new Set())

const { data: response, pending, error, refresh } = await useFetch('/api/skin/change')

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
  router.push(`/${item.itemType}/${item.skinUuid}`)
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
const getRowBgStyle = (item) => {
  let bgColor = '#ffffff'
  if (item.type === 'add') bgColor = '#e6f4ea'      // Hijau pastel lembut untuk penambahan
  else if (item.type === 'remove') bgColor = '#fce8e6' // Merah pastel lembut untuk penghapusan
  else if (item.type === 'change') bgColor = '#fef7e0' // Kuning pastel lembut untuk perubahan harga/kondisi

  return `background-color: ${bgColor}; border-bottom: 2px solid #fff5f7;`
}

const getTypeBadgeStyle = (itemType) => {
  if (itemType === 'glove') return 'background-color: #e2d9f3; color: #5e35b1;'
  if (itemType === 'character') return 'background-color: #d1ecf1; color: #0c5460;'
  return 'background-color: #fff3cd; color: #856404;'
}

const getConditionStyle = (cond) => {
  if (cond == 0) return 'background-color: #d1ecf1; color: #0c5460;'
  if (cond < 0.15) return 'background-color: #e2d9f3; color: #5e35b1;'
  if (cond < 0.35) return 'background-color: #fff3cd; color: #856404;'
  return 'background-color: #ffb3b3; color: #900;'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&display=swap');

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
</style>