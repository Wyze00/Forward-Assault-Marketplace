<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ItemType } from '~~/prisma/generated/enums'
import type { GetSkinResponse, GetWeaponResponse, SkinWithWeaponAndCamo } from '~~/server/types'

type SkinOption = SkinWithWeaponAndCamo

interface SkinSetting {
  condition: string
  offset: string
}

interface GeneratorCard {
  id: number
  itemType: ItemType
  weaponType: number | null
  skins: SkinOption[]
  selectedSkinUuids: string[]
  settings: Record<string, SkinSetting>
  isLoading: boolean
  error: string
}

const itemTypes: { value: ItemType; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'glove', label: 'Glove' },
  { value: 'weapon', label: 'Weapon' },
]

const weapons = ref<NonNullable<Awaited<ReturnType<typeof $fetch<GetWeaponResponse>>>['data']>>([])
const cards = ref<GeneratorCard[]>([])
const nextCardId = ref(1)
const copyMessage = ref('')

const createCard = (): GeneratorCard => ({
  id: nextCardId.value++,
  itemType: 'weapon',
  weaponType: weapons.value[0]?.weaponType ?? null,
  skins: [],
  selectedSkinUuids: [],
  settings: {},
  isLoading: false,
  error: '',
})

const selectedCount = computed(() => cards.value.reduce((count, card) => count + card.selectedSkinUuids.length, 0))

const fetchSkins = async (card: GeneratorCard) => {
  if (card.itemType === 'weapon' && card.weaponType === null) {
    card.skins = []
    return
  }

  card.isLoading = true
  card.error = ''
  try {
    const query = new URLSearchParams({
      itemType: card.itemType,
      ...(card.itemType === 'weapon' ? { weaponType: String(card.weaponType) } : {}),
    })
    const response = await $fetch<GetSkinResponse>(`/api/skin?${query.toString()}`)
    card.skins = response.data ?? []
    card.selectedSkinUuids = card.selectedSkinUuids.filter((uuid) => card.skins.some((skin) => skin.uuid === uuid))
  } catch (error: any) {
    card.skins = []
    card.error = error?.data?.msg || error?.message || 'Unable to load skins.'
  } finally {
    card.isLoading = false
  }
}

const changeItemType = async (card: GeneratorCard) => {
  if (card.itemType !== 'weapon') card.weaponType = null
  else card.weaponType = weapons.value[0]?.weaponType ?? null
  card.selectedSkinUuids = []
  card.settings = {}
  await fetchSkins(card)
}

const changeWeapon = async (card: GeneratorCard) => {
  card.selectedSkinUuids = []
  card.settings = {}
  await fetchSkins(card)
}

const toggleSkin = (card: GeneratorCard, skin: SkinOption) => {
  const index = card.selectedSkinUuids.indexOf(skin.uuid)
  if (index === -1) {
    card.selectedSkinUuids.push(skin.uuid)
    card.settings[skin.uuid] = { condition: '0', offset: '0' }
  } else {
    card.selectedSkinUuids.splice(index, 1)
    delete card.settings[skin.uuid]
  }
}

const settingFor = (card: GeneratorCard, uuid: string) => {
  return card.settings[uuid] ?? (card.settings[uuid] = { condition: '0', offset: '0' })
}

const skinIdFor = (card: GeneratorCard, skin: SkinOption) => {
  const itemTypeID = card.itemType === 'character' ? '1' : card.itemType === 'glove' ? '2' : '3';
  const weaponTypeID = card.itemType === 'weapon' ? `${card.weaponType}` : '0';
  const camoId = skin.camo.camoID

  return Number(`${itemTypeID}${camoId}${weaponTypeID}`);
}

const numberLiteral = (value: string) => {
  const number = Number(value)
  return Number.isFinite(number) && number !== 0 ? number.toFixed(6) : '0'
}

const pythonObject = (card: GeneratorCard, skin: SkinOption) => {
  const setting = card.settings[skin.uuid] ?? { condition: '0', offset: '0' }
  const weaponType = card.itemType === 'weapon' ? card.weaponType : -1
  return `{\"skinID\":${skinIdFor(card, skin)}, \"type\": \"${card.itemType}\", \"camoID\":${skin.camo.camoID}, \"weaponType\": ${weaponType}, \"condition\": ${numberLiteral(setting.condition)}, \"offset\":${numberLiteral(setting.offset)}, \"dateCreated\":\"2025-09-19 17:17:36\", \"source\": \"unknown\"}`
}

const pythonCode = computed(() => {
  const blocks = cards.value
    .filter((card) => card.selectedSkinUuids.length > 0)
    .map((card) => {
      const selectedSkins = card.selectedSkinUuids
        .map((uuid) => card.skins.find((skin) => skin.uuid === uuid))
        .filter((skin): skin is SkinOption => Boolean(skin))
      const condition = card.itemType === 'weapon'
        ? `if b\"itemType=weapon\" in req_body and b\"weaponType=${card.weaponType}\" in req_body:`
        : `if b\"itemType=${card.itemType}\" in req_body:`
      const label = card.itemType === 'weapon'
        ? weapons.value.find((weapon) => weapon.weaponType === card.weaponType)?.weaponName || 'Weapon'
        : itemTypes.find((type) => type.value === card.itemType)?.label
      return `            # ${label}\n            ${condition}\n                \n                flow.response.content = __import__('re').sub(\n                    rb'\"ownedSkins\":\\[[^\\]]*\\]',\n                    b'\"ownedSkins\":[${selectedSkins.map((skin) => pythonObject(card, skin)).join(',')}]',\n                    flow.response.content)`
    })

  return `class ModifyHttp:\n    def done(self):\n        pass\n\n    def response(self, flow):\n        if flow.request.pretty_url == \"https://fa.blayzegames.com/OnlineAccountSystem_NewFPS//get_player_skins.php\":\n            req_body = flow.request.content or b\"\"\n\n${blocks.length ? `${blocks.join('\n\n')}\n` : '            # Add a skin selection to generate a response block.\n'}\naddons = [ModifyHttp()]`
})

const addCard = async () => {
  const card = createCard()
  cards.value.push(card)
  await fetchSkins(card)
}

const removeCard = (id: number) => {
  cards.value = cards.value.filter((card) => card.id !== id)
}

const copyCode = async () => {
  await navigator.clipboard.writeText(pythonCode.value)
  copyMessage.value = 'Copied!'
  window.setTimeout(() => { copyMessage.value = '' }, 1500)
}

onMounted(async () => {
  const response = await $fetch<GetWeaponResponse>('/api/weapon')
  weapons.value = response.data ?? []
  await addCard()
})

watch(cards, () => {
  copyMessage.value = ''
}, { deep: true })

</script>

<template>
  <Layout>
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-10">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.2em] mb-2">Python payload builder</p>
          <h1 class="text-5xl font-black uppercase tracking-tight">Try Skins</h1>
          <p class="mt-3 max-w-2xl font-bold text-[#333333]">Pilih item, skin, condition, dan offset. Blok mitmproxy akan terbentuk otomatis dari konfigurasi ini.</p>
        </div>
        <div class="bg-[#FFD23F] border-4 border-black px-5 py-3 shadow-[6px_6px_0px_#000000] font-black uppercase">
          {{ selectedCount }} selected skin{{ selectedCount === 1 ? '' : 's' }}
        </div>
      </div>

      <section class="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] items-start">
        <div>
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-2xl font-black uppercase border-b-4 border-black pb-1">Skin selections</h2>
            <button type="button" class="bg-[#4D96FF] border-4 border-black px-4 py-2 text-2xl font-black leading-none shadow-[4px_4px_0px_#000000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-75" aria-label="Add skin selection" title="Add skin selection" @click="addCard">+</button>
          </div>

          <div v-if="cards.length === 0" class="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000000] font-black uppercase text-center">Add a selection to begin.</div>
          <div v-for="(card, cardIndex) in cards" :key="card.id" class="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] mb-8">
            <div class="flex items-center justify-between bg-[#FF5757] border-b-4 border-black px-5 py-4">
              <h3 class="font-black uppercase">Loadout {{ cardIndex + 1 }}</h3>
              <button v-if="cards.length > 1" type="button" class="font-black uppercase text-sm underline" @click="removeCard(card.id)">Remove</button>
            </div>
            <div class="p-5 space-y-6">
              <div class="grid gap-5 md:grid-cols-2">
                <label class="block font-black uppercase text-sm">Item type
                  <select v-model="card.itemType" class="mt-2 w-full px-3 py-3 border-4 border-black bg-white font-bold shadow-[4px_4px_0px_#000000] rounded-none" @change="changeItemType(card)">
                    <option v-for="type in itemTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
                  </select>
                </label>
                <label v-if="card.itemType === 'weapon'" class="block font-black uppercase text-sm">Weapon
                  <select v-model="card.weaponType" class="mt-2 w-full px-3 py-3 border-4 border-black bg-white font-bold shadow-[4px_4px_0px_#000000] rounded-none" @change="changeWeapon(card)">
                    <option v-for="weapon in weapons" :key="weapon.uuid" :value="weapon.weaponType">{{ weapon.weaponName }}</option>
                  </select>
                </label>
              </div>

              <div>
                <div class="flex justify-between items-baseline mb-3">
                  <p class="font-black uppercase text-sm">Available skins</p>
                  <span class="text-xs font-black uppercase">{{ card.selectedSkinUuids.length }} chosen</span>
                </div>
                <p v-if="card.isLoading" class="border-4 border-black bg-[#F4F4F0] p-4 font-black uppercase">Loading skins...</p>
                <p v-else-if="card.error" class="border-4 border-black bg-[#FF5757] p-4 font-black uppercase">{{ card.error }}</p>
                <div v-else-if="card.skins.length" class="grid gap-3 sm:grid-cols-2 max-h-72 overflow-y-auto pr-2">
                  <label v-for="skin in card.skins" :key="skin.uuid" class="flex gap-3 border-4 border-black p-3 cursor-pointer hover:bg-[#FFD23F]" :class="card.selectedSkinUuids.includes(skin.uuid) ? 'bg-[#FFD23F]' : 'bg-white'">
                    <input type="checkbox" class="mt-1 h-5 w-5 accent-black" :checked="card.selectedSkinUuids.includes(skin.uuid)" @change="toggleSkin(card, skin)">
                    <span class="min-w-0"><strong class="block truncate">{{ skin.camo.camoName }}</strong><small class="block font-bold">Camo {{ skin.camo.camoID }} · ID {{ skinIdFor(card, skin) }}</small></span>
                  </label>
                </div>
                <p v-else class="border-4 border-black bg-[#F4F4F0] p-4 font-black uppercase">No skins found for this item.</p>
              </div>

              <div v-if="card.selectedSkinUuids.length" class="space-y-3 border-t-4 border-black pt-5">
                <p class="font-black uppercase text-sm">Skin parameters</p>
                <div v-for="uuid in card.selectedSkinUuids" :key="uuid" class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_140px] items-end">
                  <p class="font-black truncate">{{ card.skins.find((skin) => skin.uuid === uuid)?.camo.camoName }}</p>
                  <label class="text-xs font-black uppercase">Condition<input v-model="settingFor(card, uuid).condition" type="number" min="0" max="1" step="0.000001" class="mt-1 w-full border-4 border-black px-2 py-2 font-bold rounded-none"></label>
                  <label class="text-xs font-black uppercase">Offset<input v-model="settingFor(card, uuid).offset" type="number" min="0" step="0.000001" class="mt-1 w-full border-4 border-black px-2 py-2 font-bold rounded-none"></label>
                </div>
              </div>
            </div>
          </div>

          <button type="button" class="w-full bg-black text-white border-4 border-black px-4 py-4 font-black uppercase shadow-[6px_6px_0px_#FF5757] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-75" @click="addCard">+ Add another item group</button>
        </div>

        <aside class="lg:sticky lg:top-28">
          <div class="bg-[#1D1D1D] border-4 border-black shadow-[8px_8px_0px_#4D96FF]">
            <div class="flex items-center justify-between bg-[#4D96FF] border-b-4 border-black px-5 py-4">
              <h2 class="font-black uppercase">Generated Python</h2>
              <button type="button" class="bg-white border-2 border-black px-3 py-1 text-xs font-black uppercase hover:bg-[#FFD23F]" @click="copyCode">{{ copyMessage || 'Copy' }}</button>
            </div>
            <pre class="overflow-x-auto p-5 text-xs leading-6 text-[#F4F4F0] min-h-[420px] whitespace-pre-wrap wrap-break-word"><code>{{ pythonCode }}</code></pre>
          </div>
        </aside>
      </section>
    </div>
  </Layout>
</template>
