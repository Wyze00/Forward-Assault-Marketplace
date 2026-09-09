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
    <h1 class="text-3xl font-bold text-text-main mb-8">Weapons</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <!-- Insert Form -->
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)]">
        <h2 class="text-xl font-semibold text-text-main mb-4">Add Single Weapon</h2>
        <form @submit.prevent="submitWeapon" class="space-y-4">
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Weapon Type (ID)</label>
            <input v-model="newWeapon.weaponType" type="number" required
              class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main" />
          </div>
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Weapon Name</label>
            <input v-model="newWeapon.weaponName" type="text" required
              class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main" />
          </div>
          <button type="submit" class="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors">
            Add Weapon
          </button>
          <p v-if="insertMessage" class="text-sm mt-2 font-medium" :class="insertMessage.startsWith('Failed') ? 'text-danger' : 'text-primary'">{{ insertMessage }}</p>
        </form>
      </div>

      <!-- Upload Form -->
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)]">
        <h2 class="text-xl font-semibold text-text-main mb-4">Bulk Upload CSV</h2>
        <div class="space-y-4">
          <p class="text-sm text-text-secondary">Format CSV: <code>weaponType,weaponName</code> (No Headers)</p>
          <input type="file" accept=".csv" @change="handleFileUpload" ref="fileInput"
            class="block w-full text-sm text-text-secondary
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-text-main
              hover:file:bg-primary/20 cursor-pointer" />
          <p v-if="uploadMessage" class="text-sm mt-2 font-medium" :class="uploadMessage.startsWith('Upload failed') ? 'text-danger' : 'text-primary'">{{ uploadMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)] overflow-hidden">
      <div class="p-6 border-b border-primary/20">
        <h2 class="text-xl font-semibold text-text-main">Weapon List</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-primary/5 border-b border-primary/20">
              <th class="px-6 py-4 font-medium text-text-secondary">UUID</th>
              <th class="px-6 py-4 font-medium text-text-secondary">Type</th>
              <th class="px-6 py-4 font-medium text-text-secondary">Name</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-primary/10">
            <tr v-for="w in weapons" :key="w.uuid" class="hover:bg-primary/5 transition-colors">
              <td class="px-6 py-4 text-sm text-text-secondary font-mono">{{ w.uuid }}</td>
              <td class="px-6 py-4 text-text-main font-medium">{{ w.weaponType }}</td>
              <td class="px-6 py-4 text-text-main">{{ w.weaponName }}</td>
            </tr>
            <tr v-if="weapons.length === 0">
              <td colspan="3" class="px-6 py-8 text-center text-text-secondary">No weapons found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </Layout>
</template>
