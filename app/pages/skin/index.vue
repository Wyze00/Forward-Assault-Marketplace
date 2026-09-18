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
        weaponType: Number(initWeaponType.value)
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
      <h1 class="text-4xl font-black text-black mb-8 uppercase tracking-tight">Skins Management</h1>
  
      <!-- Init Cards -->
      <h2 class="text-2xl font-black text-black mb-6 uppercase border-b-4 border-black inline-block pb-1">Initialize Skins</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <!-- Init Glove -->
        <div class="bg-[#FFD23F] p-6 border-4 border-black shadow-[8px_8px_0px_#000000] flex flex-col justify-between">
          <div>
            <h3 class="text-2xl font-black text-black mb-3 uppercase">Init Gloves</h3>
            <p class="text-black font-bold mb-6">Fetch and initialize all glove skins from marketplace.</p>
          </div>
          <div>
            <button @click="initGlove" class="w-full py-3 px-4 bg-white text-black border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 rounded-none">
              Init Gloves
            </button>
            <p v-if="initGloveMessage" class="text-sm mt-3 font-black text-center uppercase" :class="initGloveMessage.startsWith('Failed') ? 'text-[#FF5757] bg-black px-2 py-1' : 'text-black'">{{ initGloveMessage }}</p>
          </div>
        </div>
  
        <!-- Init Character -->
        <div class="bg-[#4D96FF] p-6 border-4 border-black shadow-[8px_8px_0px_#000000] flex flex-col justify-between">
          <div>
            <h3 class="text-2xl font-black text-black mb-3 uppercase">Init Characters</h3>
            <p class="text-black font-bold mb-6">Fetch and initialize all character skins from marketplace.</p>
          </div>
          <div>
            <button @click="initCharacter" class="w-full py-3 px-4 bg-white text-black border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 rounded-none">
              Init Characters
            </button>
            <p v-if="initCharacterMessage" class="text-sm mt-3 font-black text-center uppercase" :class="initCharacterMessage.startsWith('Failed') ? 'text-[#FF5757] bg-black px-2 py-1' : 'text-black'">{{ initCharacterMessage }}</p>
          </div>
        </div>
  
        <!-- Init Weapon -->
        <div class="bg-[#FF5757] p-6 border-4 border-black shadow-[8px_8px_0px_#000000] flex flex-col justify-between">
          <div>
            <h3 class="text-2xl font-black text-black mb-3 uppercase text-white">Init Weapons</h3>
            <p class="text-white font-bold mb-4">Select a weapon to initialize its skins.</p>
            <div class="mb-6">
              <select v-model="initWeaponType" class="w-full px-4 py-3 border-4 border-black text-black font-bold bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] appearance-none rounded-none">
                <option value="" disabled>Select a weapon</option>
                <option v-for="w in weapons" :key="w.uuid" :value="w.weaponType">{{ w.weaponName }}</option>
              </select>
            </div>
          </div>
          <div>
            <button @click="initWeapon" :disabled="!initWeaponType" class="w-full py-3 px-4 bg-white text-black border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed rounded-none">
              Init Weapon
            </button>
            <p v-if="initWeaponMessage" class="text-sm mt-3 font-black text-center uppercase" :class="initWeaponMessage.startsWith('Failed') ? 'text-black bg-white px-2 py-1' : 'text-white'">{{ initWeaponMessage }}</p>
          </div>
        </div>
      </div>
  
      <!-- Add Manual Skin -->
      <h2 class="text-2xl font-black text-black mb-6 uppercase border-b-4 border-black inline-block pb-1">Add Manual Skin</h2>
      <div class="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_#000000] mb-16">
        <form @submit.prevent="submitManualSkin" class="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Item Type</label>
            <select v-model="newItemType" class="w-full px-4 py-3 border-4 border-black text-black font-bold bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] appearance-none rounded-none">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <div v-if="newItemType === 'weapon'">
            <label class="block text-black font-bold mb-2 uppercase text-sm">Weapon</label>
            <select v-model="newWeaponType" class="w-full px-4 py-3 border-4 border-black text-black font-bold bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] appearance-none rounded-none" required>
              <option value="" disabled>Select a weapon</option>
              <option v-for="w in weapons" :key="w.uuid" :value="w.weaponType">{{ w.weaponName }}</option>
            </select>
          </div>
          <div>
            <label class="block text-black font-bold mb-2 uppercase text-sm">Camo ID</label>
            <input v-model="newCamoID" type="number" required
              class="w-full px-4 py-3 border-4 border-black text-black font-bold focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] rounded-none" />
          </div>
          <div>
            <button type="submit" class="w-full py-3 px-4 bg-black text-white border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-[#FFD23F] hover:text-black transition-all duration-75 rounded-none">
              Add Skin
            </button>
          </div>
        </form>
        <p v-if="insertMessage" class="text-sm mt-6 font-bold uppercase" :class="insertMessage.startsWith('Failed') ? 'text-[#FF5757]' : 'text-[#4D96FF]'">{{ insertMessage }}</p>
      </div>
  
      <!-- Data Table -->
      <h2 class="text-2xl font-black text-black mb-6 uppercase border-b-4 border-black inline-block pb-1">Skin List</h2>
      <div class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] overflow-hidden">
        <div class="p-6 border-b-4 border-black flex flex-col sm:flex-row sm:items-center gap-6 bg-[#F4F4F0]">
          <div class="flex-1">
            <label class="block text-black font-bold mb-2 uppercase text-sm">Filter by Item Type</label>
            <select v-model="filterItemType" class="w-full max-w-xs px-4 py-3 border-4 border-black text-black font-bold bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] appearance-none rounded-none">
              <option value="weapon">Weapon</option>
              <option value="glove">Glove</option>
              <option value="character">Character</option>
            </select>
          </div>
          <div class="flex-1" v-if="filterItemType === 'weapon'">
            <label class="block text-black font-bold mb-2 uppercase text-sm">Filter by Weapon</label>
            <select v-model="filterWeaponType" class="w-full max-w-xs px-4 py-3 border-4 border-black text-black font-bold bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0px_#000000] appearance-none rounded-none">
              <option value="" disabled>Select a weapon</option>
              <option v-for="w in weapons" :key="w.uuid" :value="w.weaponType">{{ w.weaponName }}</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-white border-b-4 border-black">
                <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">UUID</th>
                <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">Camo ID</th>
                <th class="px-6 py-4 font-black text-black uppercase border-r-4 border-black">Camo Name</th>
                <th v-if="filterItemType === 'weapon'" class="px-6 py-4 font-black text-black uppercase">Weapon</th>
              </tr>
            </thead>
            <tbody class="divide-y-4 divide-black">
              <tr v-if="isLoadingSkins">
                <td :colspan="filterItemType === 'weapon' ? 4 : 3" class="px-6 py-8 text-center font-bold text-black uppercase">Loading...</td>
              </tr>
              <template v-else>
                <tr v-for="s in skins" :key="s.uuid" class="hover:bg-[#FFD23F] transition-colors">
                  <td class="px-6 py-4 text-sm font-bold text-black border-r-4 border-black break-all">{{ s.uuid }}</td>
                  <td class="px-6 py-4 font-black text-black border-r-4 border-black">{{ s.camo?.camoID }}</td>
                  <td class="px-6 py-4 font-black text-black border-r-4 border-black">{{ s.camo?.camoName }}</td>
                  <td v-if="filterItemType === 'weapon'" class="px-6 py-4 font-black text-black">{{ s.weapon?.weaponName }}</td>
                </tr>
                <tr v-if="skins.length === 0">
                  <td :colspan="filterItemType === 'weapon' ? 4 : 3" class="px-6 py-8 text-center font-bold text-black uppercase">No skins found.</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>
