<template>
  <div class="entity-management">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg flex items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
        <span class="text-gray-700">Memproses...</span>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccessMessage" 
         class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
      {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" 
         class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
      {{ errorMessage }}
      <button @click="errorMessage = ''" class="ml-2 text-white hover:text-gray-200">&times;</button>
    </div>

    <!-- Header Section -->
    <div class="mb-10 flex items-center">
      <div class="bg-blue-50 p-3 rounded-xl mr-4">
        <Icon name="apartment" class="w-8 h-8 text-blue-500" />
      </div>
      <div>
        <h1 class="text-3xl font-semibold text-gray-800">Pengurusan Entiti</h1>
        <p class="text-gray-500 mt-2 text-lg">Urus Koperasi dan syarikat-syarikat subsidiari anda</p>
      </div>
    </div>

    <!-- Parent Company (Kooperasi) Section -->
    <div class="bg-white rounded-xl shadow-sm mb-10 transition-all hover:shadow-md">
      <div class="p-8">
        <div class="flex items-center mb-6">
          <div class="bg-blue-50 p-3 rounded-lg mr-4">
            <Icon name="material-symbols:business-center" class="w-6 h-6 text-blue-500" />
          </div>
          <h2 class="text-2xl font-semibold text-gray-800">Maklumat Koperasi</h2>
        </div>
      
        <div class="grid grid-cols-2 gap-8 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              <Icon name="streamline:business-profession-home-office" class="w-4 h-4 mr-2 text-gray-400" />
              Nama Syarikat
            </label>
            <input 
              v-model="parentCompany.name" 
              type="text" 
              class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
              placeholder="Masukkan nama syarikat"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2 flex items-center">
              <Icon name="material-symbols:article-person" class="w-4 h-4 mr-2 text-gray-400" />
              Nombor Akaun Bank
            </label>
            <input 
              v-model="parentCompany.bankAccount" 
              type="text" 
              class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
              placeholder="Masukkan nombor akaun bank"
            />
          </div>
        </div>

        <!-- Save Button for Parent Company -->
        <div class="flex justify-end mb-6">
          <button 
            @click="saveParentCompany"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center"
            :disabled="!parentCompany.name"
          >
            <Icon name="material-symbols:save" class="w-5 h-5 mr-2" />
            Simpan Maklumat
          </button>
        </div>

        <!-- Document Upload Section -->
        <div>
          <div class="flex items-center mb-4">
            <Icon name="material-symbols:description" class="w-4 h-4 mr-2 text-gray-400" />
            <span class="text-sm font-medium text-gray-600">Dokumen Diperlukan</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="docType in documentTypes" :key="docType.id" 
                 class="bg-gray-50 p-3 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <input 
                    type="checkbox" 
                    :checked="parentCompany.uploadedDocuments[docType.id]"
                    class="h-4 w-4 text-blue-500 rounded border-gray-300 mr-2"
                    disabled
                  />
                  <span class="text-sm font-medium text-gray-700">{{ docType.name }}</span>
                </div>
              </div>
              
              <div class="flex items-center justify-between">
                <!-- If file is uploaded -->
                <div v-if="parentCompany.uploadedDocuments[docType.id]" 
                     class="flex items-center">
                  <span class="text-xs text-gray-500">
                    {{ parentCompany.files.find(f => f.statement_type === docType.id)?.file_name }}
                  </span>
                </div>
                
                <!-- If no file uploaded -->
                <button 
                  v-else
                  @click="navigateToUpload(docType.id)" 
                  class="w-28 h-8 flex items-center justify-center px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
                >
                  <Icon name="material-symbols:upload" class="w-3 h-3 mr-1" />
                  Muat Naik
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subsidiary Companies Section -->
    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-8 border-b border-gray-100">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div class="flex items-center">
            <div class="bg-blue-50 p-3 rounded-lg mr-4">
              <Icon name="ic:baseline-store" class="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 class="text-2xl font-semibold text-gray-800">Anak Syarikat</h2>
              <p class="text-gray-500 mt-2">Senarai syarikat subsidiari berdaftar</p>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <button 
              class="px-6 py-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all flex items-center justify-center"
              @click="showDocumentsModal = true"
            >
              <Icon name="material-symbols:description" class="w-5 h-5 mr-2" />
              Dokumen Diperlukan
            </button>
            <button 
              @click="addSubsidiary" 
              class="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center justify-center"
            >
              <Icon name="material-symbols:add-circle" class="w-5 h-5 mr-2" />
              Tambah Anak Syarikat
            </button>
          </div>
        </div>
      </div>

      <!-- Table/Card View Container -->
      <div class="w-full">
        <!-- Desktop Table View (hidden on mobile) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">
                  <span class="flex items-center">
                    <Icon name="mdi:office-building" class="w-4 h-4 mr-2" />
                    Nama Syarikat
                  </span>
                </th>
                <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">
                  <span class="flex items-center">
                    <Icon name="material-symbols:credit-card" class="w-4 h-4 mr-2" />
                    Akaun Bank
                  </span>
                </th>
                <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">
                  <span class="flex items-center">
                    <Icon name="material-symbols:description" class="w-4 h-4 mr-2" />
                    Dokumen Diperlukan
                  </span>
                </th>
                <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">
                  <span class="flex items-center">
                    <Icon name="material-symbols:settings-rounded" class="w-4 h-4 mr-2" />
                    Tindakan
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(subsidiary, index) in subsidiaries" :key="index" 
                  class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-8 py-4">
                  <input 
                    v-model="subsidiary.name" 
                    type="text" 
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                    placeholder="Masukkan nama syarikat"
                  />
                </td>
                <td class="px-8 py-4">
                  <input 
                    v-model="subsidiary.bankAccount" 
                    type="text" 
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                    placeholder="Masukkan nombor akaun"
                  />
                </td>
                <td class="px-8 py-4">
                  <div class="grid grid-cols-2 gap-3">
                    <div v-for="docType in documentTypes" :key="docType.id" 
                         class="bg-gray-50 rounded-lg p-3">
                      <div class="flex items-center mb-2">
                        <input
                          type="checkbox"
                          :checked="subsidiary.uploadedDocuments[docType.id]"
                          disabled
                          class="w-4 h-4 mr-2"
                        />
                        <span class="text-sm font-medium">{{ docType.name }}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <div v-if="subsidiary.uploadedDocuments[docType.id]" class="text-xs text-gray-600">
                          {{ subsidiary.files.find(f => f.statement_type === docType.id)?.file_name }}
                        </div>
                        <button 
                          @click="navigateToUpload(docType.id, true, index)"
                          class="w-28 h-8 flex items-center justify-center px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
                          :class="{ 'opacity-50 cursor-not-allowed': !subsidiary.id }"
                          :disabled="!subsidiary.id"
                        >
                          <Icon name="material-symbols:upload" class="w-3 h-3 mr-1" />
                          {{ subsidiary.id ? 'Muat Naik' : 'Simpan' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-4">
                  <div class="flex items-center space-x-2">
                    <button 
                      @click="saveSubsidiary(subsidiary, index)"
                      class="text-blue-500 hover:text-blue-600 flex items-center px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
                      :disabled="!subsidiary.name"
                    >
                      <Icon name="material-symbols:save" class="w-4 h-4 mr-2" />
                      Simpan
                    </button>
                    <button 
                      @click="removeSubsidiary(index)" 
                      class="text-red-500 hover:text-red-600 flex items-center px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <Icon name="delete" class="w-4 h-4 mr-2" />
                      Buang
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="subsidiaries.length === 0">
                <td colspan="4" class="px-8 py-12 text-center text-gray-500">
                  <div class="flex flex-col items-center">
                    <Icon name="add" class="w-8 h-8 mb-3 text-gray-400" />
                    <p>Tiada anak syarikat ditambah lagi.</p>
                    <p class="text-sm">Klik "Tambah Anak Syarikat" untuk memulakan.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View (shown only on mobile) -->
        <div class="md:hidden">
          <div v-if="subsidiaries.length === 0" class="p-8 text-center text-gray-500">
            <div class="flex flex-col items-center">
              <Icon name="add" class="w-8 h-8 mb-3 text-gray-400" />
              <p>Tiada anak syarikat ditambah lagi.</p>
              <p class="text-sm">Klik "Tambah Anak Syarikat" untuk memulakan.</p>
            </div>
          </div>
          
          <div v-else class="space-y-4 p-4">
            <div v-for="(subsidiary, index) in subsidiaries" :key="index" 
                 class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <!-- Company Name -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-600 mb-2">
                  <Icon name="mdi:office-building" class="w-4 h-4 inline mr-2" />
                  Nama Syarikat
                </label>
                <input 
                  v-model="subsidiary.name" 
                  type="text" 
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                  placeholder="Masukkan nama syarikat"
                />
              </div>

              <!-- Bank Account -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-600 mb-2">
                  <Icon name="material-symbols:credit-card" class="w-4 h-4 inline mr-2" />
                  Akaun Bank
                </label>
                <input 
                  v-model="subsidiary.bankAccount" 
                  type="text" 
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                  placeholder="Masukkan nombor akaun"
                />
              </div>

              <!-- Documents Section for Mobile -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-600 mb-2">
                  <Icon name="material-symbols:description" class="w-4 h-4 inline mr-2" />
                  Dokumen Diperlukan
                </label>
                <div class="grid grid-cols-1 gap-3">
                  <div v-for="docType in documentTypes" :key="docType.id" 
                       class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center">
                        <input
                          type="checkbox"
                          :checked="subsidiary.uploadedDocuments[docType.id]"
                          disabled
                          class="w-4 h-4 mr-2"
                        />
                        <span class="text-sm font-medium">{{ docType.name }}</span>
                      </div>
                      <div v-if="subsidiary.uploadedDocuments[docType.id]" class="text-xs text-gray-600">
                        {{ subsidiary.files.find(f => f.statement_type === docType.id)?.file_name }}
                      </div>
                    </div>
                    <button 
                      @click="navigateToUpload(docType.id, true, index)"
                      class="w-full h-8 flex items-center justify-center px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
                      :class="{ 'opacity-50 cursor-not-allowed': !subsidiary.id }"
                      :disabled="!subsidiary.id"
                    >
                      <Icon name="material-symbols:upload" class="w-3 h-3 mr-1" />
                      {{ subsidiary.id ? 'Muat Naik' : 'Simpan dahulu' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end space-x-2 border-t pt-4">
                <button 
                  @click="saveSubsidiary(subsidiary, index)"
                  class="flex-1 text-blue-500 hover:text-blue-600 flex items-center justify-center px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
                  :disabled="!subsidiary.name"
                >
                  <Icon name="material-symbols:save" class="w-4 h-4 mr-2" />
                  Simpan
                </button>
                <button 
                  @click="removeSubsidiary(index)" 
                  class="flex-1 text-red-500 hover:text-red-600 flex items-center justify-center px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
                >
                  <Icon name="delete" class="w-4 h-4 mr-2" />
                  Buang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "admin",
});

import { ref, computed, onMounted } from 'vue'

const router = useRouter()

const PARENT_ORGANIZATION_ID = '3df46589-5c74-45d2-a436-4291ddc6fdde'

const parentCompany = ref({
  id: PARENT_ORGANIZATION_ID,
  name: '',
  bankAccount: '',
  files: [],
  uploadedDocuments: {}
})

const subsidiaries = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const showSuccessMessage = ref(false)
const successMessage = ref('')

// Map document types to their corresponding section numbers in the upload page
const documentSectionMap = {
  'kunci_kira_kira': 1,      // Section index for 'Kunci Kira Kira'
  'imbangan_duga': 2,   // Section index for 'Imbangan Duga'
  'ledger': 3,          // Section index for 'Ledger'
  'bank_recon': 4  // Section index for 'Bank Reconciliation'
}

const documentTypes = [
  { 
    id: 'kunci_kira_kira', 
    name: 'Kunci Kira-Kira', 
    required: true,
    description: 'Dokumen kewangan yang menunjukkan kedudukan kewangan koperasi',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  { 
    id: 'imbangan_duga', 
    name: 'Imbangan Duga', 
    required: true,
    description: 'Dokumen yang menunjukkan baki akaun',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  { 
    id: 'ledger', 
    name: 'Ledger', 
    required: true,
    description: 'Rekod transaksi kewangan',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  { 
    id: 'bank_recon', 
    name: 'Bank Reconciliation', 
    required: true,
    description: 'Penyesuaian penyata bank',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
]

const navigateToUpload = (docType, isSubsidiary = false, subsidiaryIndex = null) => {
  // For subsidiaries, only allow navigation if the subsidiary has an ID (has been saved)
  if (isSubsidiary && subsidiaryIndex !== null) {
    const subsidiary = subsidiaries.value[subsidiaryIndex]
    if (!subsidiary?.id) {
      errorMessage.value = 'Sila simpan maklumat anak syarikat terlebih dahulu sebelum memuat naik dokumen'
      return
    }
  }

  const sectionIndex = documentSectionMap[docType]
  // Navigate to upload page with the section query parameter
  router.push({
    path: '/ahli-kooperasi/upload',
    query: { section: sectionIndex, isSubsidiary, subsidiaryIndex }
  })
}

// Computed properties for progress tracking
const parentCompanyProgress = computed(() => {
  const totalRequired = documentTypes.filter(doc => doc.required).length
  const uploaded = parentCompany.value.files.length
  return Math.round((uploaded / totalRequired) * 100)
})

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const validateFile = (file, allowedTypes) => {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Jenis fail tidak disokong. Sila muat naik fail dalam format yang dibenarkan.`)
  }
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Saiz fail terlalu besar. Had maksimum adalah 10MB')
  }
  return true
}

const handleParentFileUpload = async (event, type) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // Get document type configuration
    const docType = documentTypes.find(d => d.id === type)
    validateFile(file, docType.allowedTypes)

    // Remove existing file of the same type if it exists
    const existingIndex = parentCompany.value.files.findIndex(f => f.type === type)
    if (existingIndex !== -1) {
      parentCompany.value.files.splice(existingIndex, 1)
    }

    // Add new file with additional metadata
    parentCompany.value.files.push({
      name: file.name,
      file: file,
      type: type,
      size: formatFileSize(file.size),
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

const removeParentFile = (type) => {
  const index = parentCompany.value.files.findIndex(f => f.type === type)
  if (index !== -1) {
    parentCompany.value.files.splice(index, 1)
  }
}

// Fetch parent and child organizations on component mount
onMounted(async () => {
  await fetchOrganizations()
})

// Fetch all organizations
const fetchOrganizations = async () => {
  try {
    isLoading.value = true
    
    // Fetch parent organization and its children using the [id].get.js endpoint
    const response = await $fetch(`/api/organization/${PARENT_ORGANIZATION_ID}`)
    
    if (response?.status === 'success' && response?.data) {
      // Set parent company data
      parentCompany.value = {
        id: PARENT_ORGANIZATION_ID,
        name: response.data.name,
        bankAccount: response.data.bank_account || '',
        files: response.data.statements?.items || [],
        uploadedDocuments: response.data.statements?.uploaded_documents || {}
      }

      // Set subsidiaries from the children array
      if (response.data.children && Array.isArray(response.data.children)) {
        subsidiaries.value = await Promise.all(response.data.children.map(async child => {
          // Fetch each subsidiary's details to get their document status
          const childResponse = await $fetch(`/api/organization/${child.id}`)
          return {
            id: child.id,
            name: child.name,
            bankAccount: child.bank_account || '',
            files: childResponse.data?.statements?.items || [],
            uploadedDocuments: childResponse.data?.statements?.uploaded_documents || {}
          }
        }))
      }
    }
  } catch (error) {
    errorMessage.value = 'Gagal memuat data organisasi'
    console.error('Error fetching organizations:', error)
  } finally {
    isLoading.value = false
  }
}

// Save or update parent company
const saveParentCompany = async () => {
  if (!parentCompany.value.name) {
    errorMessage.value = 'Nama syarikat diperlukan'
    return
  }

  try {
    isLoading.value = true
    const payload = {
      name: parentCompany.value.name,
      bank_account: parentCompany.value.bankAccount,
      organization_type: 'parent'
    }

    // Always update since we have a hardcoded ID
    const response = await $fetch(`/api/organization/${PARENT_ORGANIZATION_ID}`, {
      method: 'PUT',
      body: payload
    })
    
    if (response) {
      parentCompany.value = {
        ...parentCompany.value,
        ...response.data
      }
      showSuccessToast('Maklumat koperasi berjaya disimpan')
    }
  } catch (error) {
    errorMessage.value = 'Gagal menyimpan maklumat koperasi'
    console.error('Error saving parent company:', error)
  } finally {
    isLoading.value = false
  }
}

// Add new subsidiary
const addSubsidiary = () => {
  subsidiaries.value.push({
    name: '',
    bankAccount: '',
    files: [],
    uploadedDocuments: {}
  })
}

// Save subsidiary
const saveSubsidiary = async (subsidiary, index) => {
  if (!subsidiary.name) {
    errorMessage.value = 'Nama anak syarikat diperlukan'
    return
  }

  try {
    isLoading.value = true
    const payload = {
      name: subsidiary.name,
      bank_account: subsidiary.bankAccount,
      organization_type: 'child',
      parent_id: PARENT_ORGANIZATION_ID // Add parent_id for creating child organization
    }

    if (subsidiary.id) {
      // Update existing subsidiary
      const response = await $fetch(`/api/organization/${subsidiary.id}`, {
        method: 'PUT',
        body: payload
      })
      
      if (response) {
        subsidiaries.value[index] = {
          ...subsidiaries.value[index],
          ...response.data
        }
      }
    } else {
      // Create new subsidiary with parent_id
      const response = await $fetch('/api/organization/create', {
        method: 'POST',
        body: payload
      })
      
      if (response?.status === 'success' && response?.data) {
        subsidiaries.value[index] = {
          ...subsidiaries.value[index],
          ...response.data
        }
      }
    }
    showSuccessToast('Anak syarikat berjaya disimpan')
  } catch (error) {
    errorMessage.value = error?.data?.message || 'Gagal menyimpan anak syarikat'
    console.error('Error saving subsidiary:', error)
  } finally {
    isLoading.value = false
  }
}

// Remove subsidiary
const removeSubsidiary = async (index) => {
  const subsidiary = subsidiaries.value[index]
  if (subsidiary.id) {
    try {
      isLoading.value = true
      await $fetch(`/api/organization/${subsidiary.id}`, {
        method: 'DELETE'
      })
      subsidiaries.value.splice(index, 1)
      showSuccessToast('Anak syarikat berjaya dibuang')
    } catch (error) {
      errorMessage.value = 'Gagal membuang anak syarikat'
      console.error('Error removing subsidiary:', error)
    } finally {
      isLoading.value = false
    }
  } else {
    subsidiaries.value.splice(index, 1)
  }
}

// Show success toast
const showSuccessToast = (message) => {
  successMessage.value = message
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}
</script>

<style scoped>
.entity-management {
  padding: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  background-color: #f8fafc;
  min-height: 100vh;
}

@keyframes fade-in-out {
  0% { opacity: 0; transform: translateY(-1rem); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-1rem); }
}

.animate-fade-in-out {
  animation: fade-in-out 3s ease-in-out;
}
</style>
