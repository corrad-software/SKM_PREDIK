<script setup>
definePageMeta({
  layout: "admin",
});

const searchQuery = ref('');
const isParentOrganization = ref(true);
const selectedKoperasi = ref(null);
const selectedAnakSyarikat = ref(null);
const subsidiaries = ref([]);
const loading = ref(false);
const error = ref(null);
const financialGroups = ref([]);

// Constants
const PARENT_ORGANIZATION_ID = '62986bb9-b23c-4226-93c9-be523adabf77'; // Hardcoded parent organization ID

// Organization type options
const organizationTypeOptions = [
  { label: 'Koperasi Induk', value: true },
  { label: 'Anak Syarikat', value: false }
];

// Add expanded state tracking
const expandedGroups = ref(new Set());

const toggleGroup = (groupId) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId);
  } else {
    expandedGroups.value.add(groupId);
  }
};

// Fetch financial statement groups
const fetchFinancialGroups = async (organizationId) => {
  try {
    loading.value = true;
    error.value = null;
    const response = await $fetch('/api/financial-statement/group/list', {
      method: 'GET',
      params: {
        organization_id: organizationId
      }
    });
    
    if (response.status === 'success') {
      financialGroups.value = response.data.groups;
      showIndex.value = true;
    } else {
      throw new Error(response.message || 'Failed to fetch financial groups');
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching financial groups:', err);
    showIndex.value = false;
  } finally {
    loading.value = false;
  }
};

// Fetch subsidiaries for selected parent
const fetchSubsidiaries = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await $fetch(`/api/organization/${PARENT_ORGANIZATION_ID}`, {
      method: 'GET'
    });
    if (response.status === 'success' && response.data.children) {
      subsidiaries.value = response.data.children;
    } else {
      throw new Error(response.message || 'Failed to fetch subsidiaries');
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching subsidiaries:', err);
  } finally {
    loading.value = false;
  }
};

// Watch for changes in organization type
watch(isParentOrganization, (newValue) => {
  selectedKoperasi.value = newValue ? PARENT_ORGANIZATION_ID : null;
  selectedAnakSyarikat.value = null;
  showIndex.value = false;
  financialGroups.value = [];
  
  // Fetch subsidiaries when switching to Anak Syarikat
  if (!newValue) {
    fetchSubsidiaries();
  }
});

const showIndex = ref(false);

const handleSearch = async () => {
  const organizationId = isParentOrganization.value ? PARENT_ORGANIZATION_ID : selectedKoperasi.value;
  
  if (organizationId) {
    await fetchFinancialGroups(organizationId);
  }
};

// Set initial parent organization ID on mount
onMounted(() => {
  if (isParentOrganization.value) {
    selectedKoperasi.value = PARENT_ORGANIZATION_ID;
  }
});

// Update the filteredGroups computed property
const filteredGroups = computed(() => {
  if (!searchQuery.value) return financialGroups.value;
  
  const query = searchQuery.value.toLowerCase();
  return financialGroups.value.filter(group => {
    const matchesName = group.name.toLowerCase().includes(query);
    const hasMatchingItems = group.items.some(item => 
      item.type.toLowerCase().includes(query)
    );
    return matchesName || hasMatchingItems;
  });
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
            path: computed(() => `/ahli-kooperasi/index-review/kunci-kira-kira?organization_id=${isParentOrganization.value ? PARENT_ORGANIZATION_ID : selectedKoperasi.value || ''}`)
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
              { name: 'Pemborong / Peruncitan', path: '/akaun-perdagangan/pemborong-peruncitan', disabled: true },
              { name: 'Stesen Minyak', path: '/akaun-perdagangan/stesen-minyak', disabled: true },
              { name: 'Ternakan', path: '/akaun-perdagangan/ternakan', disabled: true },
              { name: 'Pembangunan Hartanah', path: '/akaun-perdagangan/pembangunan-hartanah', disabled: true },
              { name: 'Pertanian', path: '/akaun-perdagangan/pertanian', disabled: true },
              { name: 'Lain-Lain Akt. Pengguna', path: '/akaun-perdagangan/lain-lain', disabled: true }
            ]
          },
          { 
            name: 'Akaun Perkilangan',
            icon: 'ic:round-factory',
            path: '/akaun-perkilangan',
            disabled: true
          },
          { 
            name: 'Aliran Tunai',
            icon: 'ic:round-payments',
            path: '/aliran-tunai',
            disabled: true
          }
        ]
      },
      { 
        name: 'Dasar Perakaunan', 
        icon: 'ic:round-policy', 
        path: '/ahli-kooperasi/index-review/dasar-perakaunan',
        isExpanded: false,
        subItems: [
          { name: 'Nota Aset Tetap', icon: 'ic:round-domain', path: '/nota-aset-tetap', disabled: true },
          { name: 'Nota Lain-Lain', icon: 'ic:round-notes', path: '/nota-lain', disabled: true }
        ]
      },
      { name: 'Memo Panduan Kerja Audit (MPKA)', icon: 'ic:round-work', path: '/ahli-kooperasi/index-review/mpka' },
      { name: 'Jurnal Pelarasan Audit (JPA)', icon: 'ic:round-edit-note', path: '/jpa', disabled: true },
      { name: 'Laporan Juruaudit', icon: 'ic:round-assessment', path: '/laporan-juruaudit', disabled: true },
      { name: 'Laporan Pengurusan', icon: 'ic:round-manage-accounts', path: '/laporan-pengurusan', disabled: true },
      { name: 'Surat-Surat Pengesahan', icon: 'ic:round-mark-email-read', path: '/surat-pengesahan', disabled: true },
      { name: 'Dokumen ISO', icon: 'ic:round-verified', path: '/dokumen-iso', disabled: true },
      { name: 'Lain-Lain', icon: 'ic:round-more-horiz', path: '/lain-lain', disabled: true },
      { name: 'Data Kewangan', icon: 'ic:round-data-usage', path: '/data-kewangan', disabled: true }
    ]
  }
]);

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

// Add this computed property to check if a path exists
const existingPaths = computed(() => [
  '/ahli-kooperasi/index-review/kertas-kerja',
  '/ahli-kooperasi/index-review/kunci-kira-kira',
  '/ahli-kooperasi/index-review/akaun-pembahagian-keuntungan',
  '/ahli-kooperasi/index-review/akaun-untung-rugi',
  '/ahli-kooperasi/index-review/akaun-perdagangan',
  '/ahli-kooperasi/index-review/dasar-perakaunan',
  '/ahli-kooperasi/index-review/mpka'
]);

// Add this method to check if a path exists
const pathExists = (path) => {
  if (typeof path === 'function') {
    // Handle computed paths
    return true;
  }
  return existingPaths.value.some(existingPath => path.startsWith(existingPath));
};
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
          
          <!-- Organization type selection -->
          <div class="p-4 border-b border-gray-200">
            <div class="flex space-x-4">
              <label v-for="option in organizationTypeOptions" :key="option.value" class="flex items-center space-x-2">
                <input
                  type="radio"
                  :value="option.value"
                  v-model="isParentOrganization"
                  class="form-radio text-blue-500 h-4 w-4"
                />
                <span class="text-sm text-gray-700">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <!-- Selection dropdowns and search button -->
          <div class="p-4">
            <div :class="{ 'grid grid-cols-2 gap-4': !isParentOrganization, 'grid grid-cols-1 gap-4': isParentOrganization }">
              <div v-if="!isParentOrganization">
                <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Anak Syarikat</label>
                <select 
                  v-model="selectedKoperasi" 
                  class="w-full p-2 border rounded" 
                  :disabled="loading"
                >
                  <option disabled value="">Sila pilih anak syarikat</option>
                  <option 
                    v-for="sub in subsidiaries" 
                    :key="sub.id" 
                    :value="sub.id"
                  >
                    {{ sub.name }}
                  </option>
                </select>
              </div>
              <div class="self-end">
                <button
                  @click="handleSearch"
                  class="w-full h-[42px] bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                  :disabled="loading || (!isParentOrganization && !selectedKoperasi)"
                >
                  <span v-if="!loading">Cari</span>
                  <span v-else>Loading...</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="error" class="p-4">
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span class="block sm:inline">{{ error }}</span>
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
                    v-show="pathExists(item.path)"
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
                      v-show="pathExists(item.path)"
                      :to="item.path"
                      class="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      Buka
                    </NuxtLink>
                    <Icon :name="item.isExpanded ? 'ic:round-expand-less' : 'ic:round-expand-more'" 
                          class="w-5 h-5 text-gray-400 ml-2" />
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
                            v-show="pathExists(subItem.path)"
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
                            v-show="pathExists(nestedItem.path)"
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

/* Add styles for disabled buttons */
a[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
