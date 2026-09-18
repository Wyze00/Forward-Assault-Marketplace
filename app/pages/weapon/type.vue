<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Weapon } from '~~/prisma/generated/client'
import type { GetWeaponResponse } from '~~/server/types'

const weapons = ref<Weapon[]>([])
const newWeapon = ref({ weaponType: '', weaponName: '' })
const fileInput = ref<HTMLInputElement | null>(null)
const uploadMessage = ref('')
const isUploading = ref(false)
const insertMessage = ref('')

const fetchWeapons = async () => {
  try {
    const res = await $fetch<GetWeaponResponse>('/api/weapon');

    if (res.data) {
      weapons.value = res.data;
    }

  } catch (err) {
    console.error(err)
  }
}

const submitWeapon = async () => {
  try {
    insertMessage.value = 'Submitting...'
    await $fetch('/api/weapon', {
      method: 'POST',
      body: {
        weaponType: Number(newWeapon.value.weaponType),
        weaponName: newWeapon.value.weaponName
      }
    })
    insertMessage.value = 'Success!'
    newWeapon.value = { weaponType: '', weaponName: '' }
    fetchWeapons()
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

  try {
    isUploading.value = true
    uploadMessage.value = 'Uploading...'
    await $fetch('/api/weapon/upload', {
      method: 'POST',
      body: formData
    })
    uploadMessage.value = 'Upload success!'
    fetchWeapons()
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
  fetchWeapons()
})
</script>

<template>
  <Layout>
    <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-4xl font-black text-black mb-8 uppercase tracking-tight">Weapons</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <!-- Insert Form -->
      <div class="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_#000000]">
        <h2 class="text-2xl font-bold text-black mb-6 uppercase">Add Single Weapon</h2>
        <form @submit.prevent="submitWeapon" class="space-y-5">
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Weapon Type (ID)</label>
            <input v-model="newWeapon.weaponType" type="number" required
              class="w-full px-4 py-3 border-4 border-black text-black font-bold focus:outline-none focus:ring-0 focus:border-black shadow-[4px_4px_0px_#000000] transition-all rounded-none" />
          </div>
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Weapon Name</label>
            <input v-model="newWeapon.weaponName" type="text" required
              class="w-full px-4 py-3 border-4 border-black text-black font-bold focus:outline-none focus:ring-0 focus:border-black shadow-[4px_4px_0px_#000000] transition-all rounded-none" />
          </div>
          <button type="submit" class="w-full py-3 px-4 bg-[#FFD23F] text-black border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 rounded-none">
            Add Weapon
          </button>
          <p v-if="insertMessage" class="text-sm mt-2 font-bold uppercase" :class="insertMessage.startsWith('Failed') ? 'text-[#FF5757]' : 'text-black'">{{ insertMessage }}</p>
        </form>
      </div>

      <!-- Upload Form -->
      <div class="bg-[#4D96FF] p-6 border-4 border-black shadow-[8px_8px_0px_#000000]">
        <h2 class="text-2xl font-bold text-black mb-6 uppercase">Bulk Upload CSV</h2>
        <div class="space-y-5">
          <p class="text-sm font-bold text-black uppercase">Format CSV: <code>weaponType,weaponName</code> (No Headers)</p>
          <input type="file" accept=".csv" @change="handleFileUpload" ref="fileInput"
            class="block w-full text-black font-bold border-4 border-black bg-white shadow-[4px_4px_0px_#000000] cursor-pointer rounded-none
              file:mr-4 file:py-3 file:px-4
              file:border-r-4 file:border-black file:border-y-0 file:border-l-0
              file:font-bold file:uppercase
              file:bg-[#FFD23F] file:text-black
              hover:file:bg-[#FF5757] transition-all" />
          <p v-if="uploadMessage" class="text-sm mt-2 font-bold uppercase" :class="uploadMessage.startsWith('Upload failed') ? 'text-white' : 'text-black'">{{ uploadMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] overflow-hidden">
      <div class="p-6 border-b-4 border-black bg-[#FFD23F]">
        <h2 class="text-2xl font-black text-black uppercase tracking-tight">Weapon List</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white border-b-4 border-black">
              <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">UUID</th>
              <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">Type</th>
              <th class="px-6 py-4 font-black text-black uppercase">Name</th>
            </tr>
          </thead>
          <tbody class="divide-y-4 divide-black">
            <tr v-for="w in weapons" :key="w.uuid" class="hover:bg-[#F4F4F0] transition-colors">
              <td class="px-6 py-4 text-sm font-bold text-black border-r-4 border-black break-all">{{ w.uuid }}</td>
              <td class="px-6 py-4 font-black text-black border-r-4 border-black">{{ w.weaponType }}</td>
              <td class="px-6 py-4 font-black text-black">{{ w.weaponName }}</td>
            </tr>
            <tr v-if="weapons.length === 0">
              <td colspan="3" class="px-6 py-8 text-center font-bold text-black uppercase">No weapons found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </Layout>
</template>
