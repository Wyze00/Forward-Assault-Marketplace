<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Weapon } from '~~/prisma/generated/client'
import type { GetSkinResponse, GetWeaponResponse } from '~~/server/types'

const weapons = ref<Weapon[]>([])

// Init states
const initWeaponType = ref('')
const initWeaponMessage = ref('')
const initGloveMessage = ref('')
const initCharacterMessage = ref('')

// Add manual skin states
const newItemType = ref('weapon')
const newWeaponType = ref('')
const newCamoID = ref('')
const insertMessage = ref('')

// Skin list states
const filterItemType = ref('weapon')
const filterWeaponType = ref('')
const skins = ref<any[]>([])
const isLoadingSkins = ref(false)

const fetchWeapons = async () => {
  try {
    const res = await $fetch<GetWeaponResponse>('/api/weapon');

    if (res.data) {

      weapons.value = res.data
      if (weapons.value.length > 0) {
        initWeaponType.value = String(weapons.value[0]?.weaponType)
        newWeaponType.value = String(weapons.value[0]?.weaponType)
        filterWeaponType.value = String(weapons.value[0]?.weaponType)
      }
    }

  } catch (err) {
    console.error(err)
  }
}

const fetchSkins = async () => {
  if (filterItemType.value === 'weapon' && !filterWeaponType.value) return

  isLoadingSkins.value = true
  try {
    const query = new URLSearchParams()
    query.append('itemType', filterItemType.value)
    if (filterItemType.value === 'weapon') {
      query.append('weaponType', filterWeaponType.value)
    }

    const res = await $fetch<GetSkinResponse>(`/api/skin?${query.toString()}`)

    if (res.data) {
      skins.value = res.data
    }
    
  } catch (err) {
    console.error(err)
    skins.value = []
  } finally {
    isLoadingSkins.value = false
  }
}

watch([filterItemType, filterWeaponType], () => {
  fetchSkins()
})

const initGlove = async () => {
  initGloveMessage.value = 'Initializing...'
  try {
    await $fetch('/api/skin/init', { 
      method: 'POST',
      body: {
        itemType: 'glove',
        weaponType: 0
      }
     })
    initGloveMessage.value = 'Success!'
    if (filterItemType.value === 'glove') fetchSkins()
  } catch (err: any) {
    initGloveMessage.value = 'Failed: ' + (err.message || 'Unknown error')
  }
}

const initCharacter = async () => {
  initCharacterMessage.value = 'Initializing...'
  try {
    await $fetch('/api/skin/init', { 
      method: 'POST',
      body: {
        itemType: 'character',
        weaponType: 0
      }
     })
    initCharacterMessage.value = 'Success!'
    if (filterItemType.value === 'character') fetchSkins()
  } catch (err: any) {
    initCharacterMessage.value = 'Failed: ' + (err.message || 'Unknown error')
  }
}

const initWeapon = async () => {
  if (!initWeaponType.value) return
  initWeaponMessage.value = 'Initializing...'
  try {
    await $fetch('/api/skin/init', {
      method: 'POST',
      body: { 
        itemType: 'weapon',
        weaponType: initWeaponType.value
       }
    })
    initWeaponMessage.value = 'Success!'
    if (filterItemType.value === 'weapon' && filterWeaponType.value === initWeaponType.value) {
      fetchSkins()
    }
  } catch (err: any) {
    initWeaponMessage.value = 'Failed: ' + (err.message || 'Unknown error')
  }
}

const submitManualSkin = async () => {
  insertMessage.value = 'Submitting...'
  try {
    await $fetch('/api/skin', {
      method: 'POST',
      body: {
        itemType: newItemType.value,
        weaponType: newItemType.value === 'weapon' ? Number(newWeaponType.value) : 0,
        camoID: Number(newCamoID.value)
      }
    })
    insertMessage.value = 'Success!'
    newCamoID.value = ''
    fetchSkins()
  } catch (err: any) {
    insertMessage.value = 'Failed: ' + (err.message || 'Unknown error')
  }
}

onMounted(async () => {
  await fetchWeapons()
  fetchSkins()
})
</script>

<template>
  <Layout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-text-main mb-8">Skins Management</h1>
  
      <!-- Init Cards -->
      <h2 class="text-2xl font-bold text-text-main mb-4">Initialize Skins</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <!-- Init Glove -->
        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)] flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-semibold text-text-main mb-2">Init Gloves</h3>
            <p class="text-sm text-text-secondary mb-4">Fetch and initialize all glove skins from marketplace.</p>
          </div>
          <div>
            <button @click="initGlove" class="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors">
              Init Gloves
            </button>
            <p v-if="initGloveMessage" class="text-sm mt-2 font-medium text-center" :class="initGloveMessage.startsWith('Failed') ? 'text-danger' : 'text-primary'">{{ initGloveMessage }}</p>
          </div>
        </div>
  
        <!-- Init Character -->
        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)] flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-semibold text-text-main mb-2">Init Characters</h3>
            <p class="text-sm text-text-secondary mb-4">Fetch and initialize all character skins from marketplace.</p>
          </div>
          <div>
            <button @click="initCharacter" class="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors">
              Init Characters
            </button>
            <p v-if="initCharacterMessage" class="text-sm mt-2 font-medium text-center" :class="initCharacterMessage.startsWith('Failed') ? 'text-danger' : 'text-primary'">{{ initCharacterMessage }}</p>
          </div>
        </div>
  
        <!-- Init Weapon -->
        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)] flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-semibold text-text-main mb-2">Init Weapons</h3>
            <p class="text-sm text-text-secondary mb-4">Select a weapon to initialize its skins.</p>
            <div class="mb-4">
              <select v-model="initWeaponType" class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main bg-white">
                <option value="" disabled>Select a weapon</option>
                <option v-for="w in weapons" :key="w.uuid" :value="w.weaponType">{{ w.weaponName }}</option>
              </select>
            </div>
          </div>
          <div>
            <button @click="initWeapon" :disabled="!initWeaponType" class="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Init Weapon
            </button>
            <p v-if="initWeaponMessage" class="text-sm mt-2 font-medium text-center" :class="initWeaponMessage.startsWith('Failed') ? 'text-danger' : 'text-primary'">{{ initWeaponMessage }}</p>
          </div>
        </div>
      </div>
  
      <!-- Add Manual Skin -->
      <h2 class="text-2xl font-bold text-text-main mb-4">Add Manual Skin</h2>
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)] mb-12">
        <form @submit.prevent="submitManualSkin" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Item Type</label>
            <select v-model="newItemType" class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main bg-white">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <div v-if="newItemType === 'weapon'">
            <label class="block text-text-secondary text-sm font-medium mb-1">Weapon</label>
            <select v-model="newWeaponType" class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main bg-white" required>
              <option value="" disabled>Select a weapon</option>
              <option v-for="w in weapons" :key="w.uuid" :value="w.weaponType">{{ w.weaponName }}</option>
            </select>
          </div>
          <div>
            <label class="block text-text-secondary text-sm font-medium mb-1">Camo ID</label>
            <input v-model="newCamoID" type="number" required
              class="w-full px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main" />
          </div>
          <div>
            <button type="submit" class="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors">
              Add Skin
            </button>
          </div>
        </form>
        <p v-if="insertMessage" class="text-sm mt-4 font-medium" :class="insertMessage.startsWith('Failed') ? 'text-danger' : 'text-primary'">{{ insertMessage }}</p>
      </div>
  
      <!-- Data Table -->
      <h2 class="text-2xl font-bold text-text-main mb-4">Skin List</h2>
      <div class="bg-white rounded-2xl shadow-[0_8px_24px_rgba(255,197,211,0.4)] overflow-hidden">
        <div class="p-6 border-b border-primary/20 flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1">
            <label class="block text-text-secondary text-sm font-medium mb-1">Filter by Item Type</label>
            <select v-model="filterItemType" class="w-full max-w-xs px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main bg-white">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <div class="flex-1" v-if="filterItemType === 'weapon'">
            <label class="block text-text-secondary text-sm font-medium mb-1">Filter by Weapon</label>
            <select v-model="filterWeaponType" class="w-full max-w-xs px-4 py-2 rounded-xl border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main bg-white">
              <option value="" disabled>Select a weapon</option>
              <option v-for="w in weapons" :key="w.uuid" :value="w.weaponType">{{ w.weaponName }}</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-primary/5 border-b border-primary/20">
                <th class="px-6 py-4 font-medium text-text-secondary">UUID</th>
                <th class="px-6 py-4 font-medium text-text-secondary">Camo ID</th>
                <th class="px-6 py-4 font-medium text-text-secondary">Camo Name</th>
                <th v-if="filterItemType === 'weapon'" class="px-6 py-4 font-medium text-text-secondary">Weapon</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-primary/10">
              <tr v-if="isLoadingSkins">
                <td colspan="4" class="px-6 py-8 text-center text-text-secondary">Loading...</td>
              </tr>
              <template v-else>
                <tr v-for="s in skins" :key="s.uuid" class="hover:bg-primary/5 transition-colors">
                  <td class="px-6 py-4 text-sm text-text-secondary font-mono">{{ s.uuid }}</td>
                  <td class="px-6 py-4 text-text-main font-medium">{{ s.camo?.camoID }}</td>
                  <td class="px-6 py-4 text-text-main">{{ s.camo?.camoName }}</td>
                  <td v-if="filterItemType === 'weapon'" class="px-6 py-4 text-text-main">{{ s.weapon?.weaponName }}</td>
                </tr>
                <tr v-if="skins.length === 0">
                  <td colspan="4" class="px-6 py-8 text-center text-text-secondary">No skins found.</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>
