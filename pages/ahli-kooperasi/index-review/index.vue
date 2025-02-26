<script setup>
definePageMeta({
  layout: "admin",
});

const searchQuery = ref('');

const selectedKoperasi = ref(null);
const selectedAnakSyarikat = ref(null);

const koperasiOptions = [
  { value: 'koperasi1', label: 'Koperasi 1' },
  { value: 'koperasi2', label: 'Koperasi 2' }
];

const anakSyarikatOptions = computed(() => {
  if (!selectedKoperasi.value) return [];
  return [
    { value: 'anak1', label: 'Anak Syarikat 1' },
    { value: 'anak2', label: 'Anak Syarikat 2' }
  ];
});

const documentSections = ref([
  {
    title: 'Indeks Dokumen Koperasi',
    items: [
      { name: 'Indeks Kertas Kerja', icon: 'ic:round-article', path: '/ahli-kooperasi/index-review/kertas-kerja' },
      { 
        name: 'Penyata Kewangan Teraudit Koperasi', 
        icon: 'ic:round-description', 
        path: '/penyata-kewangan',
        isExpanded: false,
        subItems: [
          { 
            name: 'Kunci Kira-Kira',
            icon: 'ic:round-account-balance',
            path: '/ahli-kooperasi/index-review/kunci-kira-kira'
          },
          { 
            name: 'Akaun Pembahagian Keuntungan',
            path: '/ahli-kooperasi/index-review/akaun-pembahagian-keuntungan'
          },
          { 
            name: 'Akaun Untung Rugi',
            path: '/ahli-kooperasi/index-review/akaun-untung-rugi'
          },
          { 
            name: 'Akaun Perdagangan',
            path: '/ahli-kooperasi/index-review/akaun-perdagangan',
            isExpanded: false,
            subItems: [
              { name: 'Pemborong / Peruncitan', path: '/akaun-perdagangan/pemborong-peruncitan' },
              { name: 'Stesen Minyak', path: '/akaun-perdagangan/stesen-minyak' },
              { name: 'Ternakan', path: '/akaun-perdagangan/ternakan' },
              { name: 'Pembangunan Hartanah', path: '/akaun-perdagangan/pembangunan-hartanah' },
              { name: 'Pertanian', path: '/akaun-perdagangan/pertanian' },
              { name: 'Lain-Lain Akt. Pengguna', path: '/akaun-perdagangan/lain-lain' }
            ]
          },
          { 
            name: 'Akaun Perkilangan',
            icon: 'ic:round-factory',
            path: '/akaun-perkilangan'
          },
          { 
            name: 'Aliran Tunai',
            icon: 'ic:round-payments',
            path: '/aliran-tunai'
          }
        ]
      },
      { 
        name: 'Dasar Perakaunan', 
        icon: 'ic:round-policy', 
        path: '/ahli-kooperasi/index-review/dasar-perakaunan',
        isExpanded: false,
        subItems: [
          { name: 'Nota Aset Tetap', icon: 'ic:round-domain', path: '/nota-aset-tetap' },
          { name: 'Nota Lain-Lain', icon: 'ic:round-notes', path: '/nota-lain' }
        ]
      },
      { name: 'Memo Panduan Kerja Audit (MPKA)', icon: 'ic:round-work', path: '/mpka' },
      { name: 'Jurnal Pelarasan Audit (JPA)', icon: 'ic:round-edit-note', path: '/jpa' },
      { name: 'Laporan Juruaudit', icon: 'ic:round-assessment', path: '/laporan-juruaudit' },
      { name: 'Laporan Pengurusan', icon: 'ic:round-manage-accounts', path: '/laporan-pengurusan' },
      { name: 'Kuiri', icon: 'ic:round-help', path: '/kuiri' },
      { name: 'Surat-Surat Pengesahan', icon: 'ic:round-mark-email-read', path: '/surat-pengesahan' },
      { name: 'Dokumen ISO', icon: 'ic:round-verified', path: '/dokumen-iso' },
      { name: 'Lain-Lain', icon: 'ic:round-more-horiz', path: '/lain-lain' },
      { name: 'Data Kewangan', icon: 'ic:round-data-usage', path: '/data-kewangan' }
    ]
  }
]);

const showIndex = ref(false);

const handleSearch = () => {
  if (selectedKoperasi.value && selectedAnakSyarikat.value) {
    showIndex.value = true;
  }
};

// Add search functionality
const filteredItems = computed(() => {
  if (!searchQuery.value) return documentSections.value[0].items;
  
  const query = searchQuery.value.toLowerCase();
  return documentSections.value[0].items.filter(item => {
    const matchesName = item.name.toLowerCase().includes(query);
    const hasMatchingSubItems = item.subItems?.some(subItem => 
      subItem.name.toLowerCase().includes(query) ||
      subItem.subItems?.some(nestedItem => 
        nestedItem.name.toLowerCase().includes(query)
      )
    );
    return matchesName || hasMatchingSubItems;
  });
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <!-- Sticky header with search -->
      <div class="sticky top-0 bg-gray-50 z-10 py-6 px-4">
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 flex items-center justify-between border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Indeks Dokumen Koperasi</h2>
            <div class="w-64">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <!-- Selection dropdowns and search button -->
          <div class="p-4">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Koperasi</label>
                <select v-model="selectedKoperasi" class="w-full p-2 border rounded">
                  <option disabled value="">Sila pilih koperasi</option>
                  <option v-for="option in koperasiOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Anak Syarikat</label>
                <select v-model="selectedAnakSyarikat" class="w-full p-2 border rounded" :disabled="!selectedKoperasi">
                  <option disabled value="">Sila pilih anak syarikat</option>
                  <option v-for="option in anakSyarikatOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="self-end">
                <button
                  @click="handleSearch"
                  class="w-full h-[42px] bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                  :disabled="!selectedKoperasi || !selectedAnakSyarikat"
                >
                  Cari
                </button>
              </div>
            </div>
          </div>

          <!-- Index sections -->
          <div v-if="showIndex" class="px-4 overflow-y-auto" style="max-height: calc(100vh - 180px);">
            <div class="bg-white rounded-lg shadow">
              <div class="divide-y divide-gray-100">
                <template v-for="(item, itemIndex) in filteredItems" :key="itemIndex">
                  <!-- Parent items -->
                  <div v-if="!item.subItems" 
                       class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center">
                      <span class="w-8 text-gray-500 font-medium">{{ itemIndex + 1 }}.</span>
                      <Icon :name="item.icon || 'ic:round-description'" class="w-5 h-5 text-gray-500 mr-3" />
                      <span class="text-gray-700 flex-grow">{{ item.name }}</span>
                      <NuxtLink 
                        :to="item.path"
                        class="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Buka
                      </NuxtLink>
                    </div>
                  </div>

                  <!-- Items with subitems -->
                  <div v-else class="divide-y divide-gray-100">
                    <div class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                         @click="item.isExpanded = !item.isExpanded">
                      <div class="flex items-center">
                        <span class="w-8 text-gray-500 font-medium">{{ itemIndex + 1 }}.</span>
                        <Icon :name="item.icon || 'ic:round-folder'" class="w-5 h-5 text-gray-500 mr-3" />
                        <span class="text-gray-700 flex-grow">{{ item.name }}</span>
                        <NuxtLink 
                          :to="item.path"
                          class="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                          Buka
                        </NuxtLink>
                        <Icon :name="item.isExpanded ? 'ic:round-expand-less' : 'ic:round-expand-more'" 
                              class="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <!-- Subitems -->
                    <div v-if="item.isExpanded" class="bg-gray-50">
                      <div v-for="(subItem, subIndex) in item.subItems" 
                           :key="subIndex"
                           class="border-t border-gray-100">
                        <div class="p-4 pl-12 hover:bg-gray-100 transition-colors"
                             :class="{ 'cursor-pointer': subItem.subItems }"
                             @click="subItem.subItems && (subItem.isExpanded = !subItem.isExpanded)">
                          <div class="flex items-center">
                            <Icon :name="subItem.icon || 'ic:round-description'" class="w-5 h-5 text-gray-500 mr-3" />
                            <span class="text-gray-700 flex-grow">{{ subItem.name }}</span>
                            <template v-if="subItem.subItems">
                              <Icon :name="subItem.isExpanded ? 'ic:round-expand-less' : 'ic:round-expand-more'"
                                    class="w-5 h-5 text-gray-400" />
                            </template>
                            <template v-else>
                              <NuxtLink 
                                :to="subItem.path"
                                class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                Buka
                              </NuxtLink>
                            </template>
                          </div>
                        </div>

                        <!-- Nested subitems -->
                        <div v-if="subItem.subItems && subItem.isExpanded" class="bg-gray-100">
                          <div v-for="(nestedItem, nestedIndex) in subItem.subItems" 
                               :key="nestedIndex"
                               class="p-4 pl-24 hover:bg-gray-200 transition-colors border-t border-gray-200">
                            <div class="flex items-center">
                              <Icon :name="nestedItem.icon || 'ic:round-description'" class="w-5 h-5 text-gray-500 mr-3" />
                              <span class="text-gray-700 flex-grow">{{ nestedItem.name }}</span>
                              <NuxtLink 
                                :to="nestedItem.path"
                                class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                Buka
                              </NuxtLink>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add smooth scrolling to the content */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 #EDF2F7;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #EDF2F7;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #CBD5E0;
  border-radius: 4px;
}
</style>
