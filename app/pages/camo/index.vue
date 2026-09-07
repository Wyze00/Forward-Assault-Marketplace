<script setup lang="ts">
import { ref, onMounted } from 'vue'

const camos = ref<{ uuid: string, itemType: string, camoID: number, camoName: string }[]>([])
const newCamo = ref({ camoID: '', camoName: '', itemType: 'weapon' })
const fileInput = ref<HTMLInputElement | null>(null)
const uploadItemType = ref('weapon')
const uploadMessage = ref('')
const isUploading = ref(false)
const insertMessage = ref('')

const fetchCamos = async () => {
  try {
    const res = await $fetch<{ msg: string, data: any[] }>('/api/camo')
    camos.value = res.data
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
        camoID: Number(newCamo.value.camoID),
        camoName: newCamo.value.camoName,
        itemType: newCamo.value.itemType
      }
    })
    insertMessage.value = 'Success!'
    newCamo.value = { camoID: '', camoName: '', itemType: 'weapon' }
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
    <h1 class="text-3xl font-bold text-text-main mb-8">Camos</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <!-- Insert Form -->
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)]">
        <h2 class="text-xl font-semibold text-text-main mb-4">Add Single Camo</h2>
        <form @submit.prevent="submitCamo" class="space-y-4">
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Item Type</label>
            <select v-model="newCamo.itemType" class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main bg-white">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Camo ID</label>
            <input v-model="newCamo.camoID" type="number" required
              class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main" />
          </div>
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Camo Name</label>
            <input v-model="newCamo.camoName" type="text" required
              class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main" />
          </div>
          <button type="submit" class="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors">
            Add Camo
          </button>
          <p v-if="insertMessage" class="text-sm mt-2 font-medium" :class="insertMessage.startsWith('Failed') ? 'text-danger' : 'text-primary'">{{ insertMessage }}</p>
        </form>
      </div>

      <!-- Upload Form -->
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)]">
        <h2 class="text-xl font-semibold text-text-main mb-4">Bulk Upload CSV</h2>
        <div class="space-y-4">
          <p class="text-sm text-text-secondary">Format CSV: <code>camoID,camoName</code> (No Headers)</p>
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Item Type for this CSV</label>
            <select v-model="uploadItemType" class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main bg-white">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <input type="file" accept=".csv" @change="handleFileUpload" ref="fileInput"
            class="block w-full text-sm text-text-secondary
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-text-main
              hover:file:bg-primary/20 cursor-pointer mt-2" />
          <p v-if="uploadMessage" class="text-sm mt-2 font-medium" :class="uploadMessage.startsWith('Upload failed') ? 'text-danger' : 'text-primary'">{{ uploadMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)] overflow-hidden">
      <div class="p-6 border-b border-primary/20">
        <h2 class="text-xl font-semibold text-text-main">Camo List</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-primary/5 border-b border-primary/20">
              <th class="px-6 py-4 font-medium text-text-secondary">UUID</th>
              <th class="px-6 py-4 font-medium text-text-secondary">Item Type</th>
              <th class="px-6 py-4 font-medium text-text-secondary">Camo ID</th>
              <th class="px-6 py-4 font-medium text-text-secondary">Camo Name</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-primary/10">
            <tr v-for="c in camos" :key="c.uuid" class="hover:bg-primary/5 transition-colors">
              <td class="px-6 py-4 text-sm text-text-secondary font-mono">{{ c.uuid }}</td>
              <td class="px-6 py-4 text-text-main font-medium capitalize">{{ c.itemType }}</td>
              <td class="px-6 py-4 text-text-main font-medium">{{ c.camoID }}</td>
              <td class="px-6 py-4 text-text-main">{{ c.camoName }}</td>
            </tr>
            <tr v-if="camos.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-text-secondary">No camos found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </Layout>
</template>
