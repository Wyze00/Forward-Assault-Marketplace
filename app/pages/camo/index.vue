<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Camo } from '~~/prisma/generated/client'
import type { GetCamoResponse } from '~~/server/types'

const camos = ref<Camo[]>([])
const newCamo = ref<Omit<Camo,'uuid'>>({ camoID: 0, camoName: '', itemType: 'weapon' })
const fileInput = ref<HTMLInputElement | null>(null)
const uploadItemType = ref('weapon')
const uploadMessage = ref('')
const isUploading = ref(false)
const insertMessage = ref('')

const fetchCamos = async () => {
  try {
    const res = await $fetch<GetCamoResponse>('/api/camo')
    if (res.data) {
      camos.value = res.data
    }
  } catch (err) {
    console.error(err)
  }
}

const submitCamo = async () => {
  try {
    insertMessage.value = 'Submitting...'
    await $fetch('/api/camo', {
      method: 'POST',
      body: {
        camoID: newCamo.value.camoID,
        camoName: newCamo.value.camoName,
        itemType: newCamo.value.itemType
      }
    })
    insertMessage.value = 'Success!'
    newCamo.value = { camoID: 0, camoName: '', itemType: 'weapon' }
    fetchCamos()
  } catch (err: any) {
    insertMessage.value = 'Failed: ' + (err.message || 'Unknown error')
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  formData.append('itemType', uploadItemType.value)

  try {
    isUploading.value = true
    uploadMessage.value = 'Uploading...'
    await $fetch('/api/camo/upload', {
      method: 'POST',
      body: formData
    })
    uploadMessage.value = 'Upload success!'
    fetchCamos()
  } catch (err: any) {
    uploadMessage.value = 'Upload failed: ' + (err.message || 'Unknown error')
  } finally {
    isUploading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

onMounted(() => {
  fetchCamos()
})
</script>

<template>
  <Layout>
    <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-4xl font-black text-black mb-8 uppercase tracking-tight">Camos</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <!-- Insert Form -->
      <div class="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_#000000]">
        <h2 class="text-2xl font-bold text-black mb-6 uppercase">Add Single Camo</h2>
        <form @submit.prevent="submitCamo" class="space-y-5">
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Item Type</label>
            <select v-model="newCamo.itemType" class="w-full px-4 py-3 border-4 border-black text-black font-bold bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] appearance-none rounded-none">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Camo ID</label>
            <input v-model="newCamo.camoID" type="number" required
              class="w-full px-4 py-3 border-4 border-black text-black font-bold focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] rounded-none" />
          </div>
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Camo Name</label>
            <input v-model="newCamo.camoName" type="text" required
              class="w-full px-4 py-3 border-4 border-black text-black font-bold focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] rounded-none" />
          </div>
          <button type="submit" class="w-full py-3 px-4 bg-[#FF5757] text-white border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 rounded-none">
            Add Camo
          </button>
          <p v-if="insertMessage" class="text-sm mt-2 font-bold uppercase" :class="insertMessage.startsWith('Failed') ? 'text-[#FF5757]' : 'text-black'">{{ insertMessage }}</p>
        </form>
      </div>

      <!-- Upload Form -->
      <div class="bg-[#FFD23F] p-6 border-4 border-black shadow-[8px_8px_0px_#000000]">
        <h2 class="text-2xl font-bold text-black mb-6 uppercase">Bulk Upload CSV</h2>
        <div class="space-y-5">
          <p class="text-sm font-bold text-black uppercase">Format CSV: <code>camoID,camoName</code> (No Headers)</p>
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Item Type for this CSV</label>
            <select v-model="uploadItemType" class="w-full px-4 py-3 border-4 border-black text-black font-bold bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] appearance-none rounded-none">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <input type="file" accept=".csv" @change="handleFileUpload" ref="fileInput"
            class="block w-full text-black font-bold border-4 border-black bg-white shadow-[4px_4px_0px_#000000] cursor-pointer mt-4 rounded-none
              file:mr-4 file:py-3 file:px-4
              file:border-r-4 file:border-black file:border-y-0 file:border-l-0
              file:font-bold file:uppercase
              file:bg-[#4D96FF] file:text-black
              hover:file:bg-white transition-all" />
          <p v-if="uploadMessage" class="text-sm mt-2 font-bold uppercase" :class="uploadMessage.startsWith('Upload failed') ? 'text-[#FF5757]' : 'text-black'">{{ uploadMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] overflow-hidden">
      <div class="p-6 border-b-4 border-black bg-[#4D96FF]">
        <h2 class="text-2xl font-black text-black uppercase tracking-tight">Camo List</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white border-b-4 border-black">
              <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">UUID</th>
              <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">Item Type</th>
              <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">Camo ID</th>
              <th class="px-6 py-4 font-black text-black uppercase">Camo Name</th>
            </tr>
          </thead>
          <tbody class="divide-y-4 divide-black">
            <tr v-for="c in camos" :key="c.uuid" class="hover:bg-[#F4F4F0] transition-colors">
              <td class="px-6 py-4 text-sm font-bold text-black border-r-4 border-black break-all">{{ c.uuid }}</td>
              <td class="px-6 py-4 font-black text-black border-r-4 border-black uppercase">{{ c.itemType }}</td>
              <td class="px-6 py-4 font-black text-black border-r-4 border-black">{{ c.camoID }}</td>
              <td class="px-6 py-4 font-black text-black">{{ c.camoName }}</td>
            </tr>
            <tr v-if="camos.length === 0">
              <td colspan="4" class="px-6 py-8 text-center font-bold text-black uppercase">No camos found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </Layout>
</template>
