<template>
  <div class="entity-management">
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

        <!-- Document Upload Section -->
        <div>
          <div class="flex items-center mb-4">
            <Icon name="material-symbols:description" class="w-4 h-4 mr-2 text-gray-400" />
            <span class="text-sm font-medium text-gray-600">Dokumen Diperlukan</span>
          </div>
          <div class="space-y-2">
            <div v-for="docType in documentTypes" :key="docType.id" 
                 class="flex items-center bg-gray-50 p-2 rounded-lg">
              <input 
                type="checkbox" 
                :checked="!!parentCompany.files.find(f => f.type === docType.id)"
                class="h-4 w-4 text-blue-500 rounded border-gray-300 mr-3"
                disabled
              />
              <span class="text-sm text-gray-700 mr-3">{{ docType.name }}</span>
              
              <!-- If file is uploaded -->
              <div v-if="parentCompany.files.find(f => f.type === docType.id)" 
                   class="ml-auto flex items-center">
                <span class="text-xs text-gray-500 mr-3">
                  {{ parentCompany.files.find(f => f.type === docType.id).name }}
                </span>
                <button 
                  @click="removeParentFile(docType.id)"
                  class="text-red-500 hover:text-red-600 text-sm"
                >
                  <Icon name="material-symbols:delete" class="w-4 h-4" />
                </button>
              </div>
              
              <!-- If no file uploaded -->
              <button 
                v-else
                @click="navigateToUpload(docType.id)" 
                class="text-blue-500 hover:text-blue-600 text-sm ml-auto flex items-center"
              >
                <Icon name="material-symbols:upload" class="w-4 h-4 mr-1" />
                Muat Naik
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subsidiary Companies Section -->
    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-8 border-b border-gray-100">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <div class="bg-blue-50 p-3 rounded-lg mr-4">
              <Icon name="ic:baseline-store" class="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 class="text-2xl font-semibold text-gray-800">Anak Syarikat</h2>
              <p class="text-gray-500 mt-2">Senarai syarikat subsidiari berdaftar</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button 
              class="px-6 py-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all flex items-center"
              @click="showDocumentsModal = true"
            >
              <Icon name="material-symbols:description" class="w-5 h-5 mr-2" />
              Dokumen Diperlukan
            </button>
            <button 
              @click="addSubsidiary" 
              class="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center"
            >
              <Icon name="material-symbols:add-circle" class="w-5 h-5 mr-2" />
              Tambah Anak Syarikat
            </button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
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
                <div class="space-y-3">
                  <div v-for="docType in documentTypes" :key="docType.id" class="mb-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div class="flex items-center">
                          <input
                            type="checkbox"
                            :checked="subsidiary.files.some(f => f.type === docType.id)"
                            disabled
                            class="w-4 h-4 mr-3"
                          />
                          <span class="font-medium">{{ docType.name }}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">{{ docType.description }}</p>
                      </div>
                      <div class="flex items-center">
                        <div v-if="subsidiary.files.find(f => f.type === docType.id)" class="mr-4">
                          <div class="flex items-center text-sm text-gray-600">
                            <span>{{ formatFileSize(subsidiary.files.find(f => f.type === docType.id).size) }}</span>
                            <button 
                              @click="removeSubsidiaryFile(index, docType.id)"
                              class="ml-2 text-red-500 hover:text-red-600"
                            >
                              <Icon name="delete" class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button 
                          @click="navigateToUpload(docType.id, true, index)"
                          class="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                        >
                          <Icon name="upload" class="w-4 h-4 mr-2" />
                          Muat Naik
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-4">
                <button 
                  @click="removeSubsidiary(index)" 
                  class="text-red-500 hover:text-red-600 flex items-center px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
                >
                  <Icon name="delete" class="w-4 h-4 mr-2" />
                  Buang
                </button>
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
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "admin",
});

import { ref, computed } from 'vue'

const router = useRouter()

const parentCompany = ref({
  name: '',
  bankAccount: '',
  files: []
})

const subsidiaries = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

// Map document types to their corresponding section numbers in the upload page
const documentSectionMap = {
  'kunci_kira': 1,      // Section index for 'Kunci Kira Kira'
  'imbangan_duga': 2,   // Section index for 'Imbangan Duga'
  'ledger': 3,          // Section index for 'Ledger'
  'bank_reconciliation': 4  // Section index for 'Bank Reconciliation'
}

const documentTypes = [
  { 
    id: 'kunci_kira', 
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
    id: 'bank_reconciliation', 
    name: 'Bank Reconciliation', 
    required: true,
    description: 'Penyesuaian penyata bank',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
]

const navigateToUpload = (docType, isSubsidiary, subsidiaryIndex) => {
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

const addSubsidiary = () => {
  subsidiaries.value.push({
    name: '',
    bankAccount: '',
    files: []
  })
}

const removeSubsidiary = (index) => {
  subsidiaries.value.splice(index, 1)
}

const handleSubsidiaryFileUpload = async (event, subsidiaryIndex, type) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // Get document type configuration
    const docType = documentTypes.find(d => d.id === type)
    validateFile(file, docType.allowedTypes)

    const subsidiary = subsidiaries.value[subsidiaryIndex]
    // Remove existing file of the same type if it exists
    const existingIndex = subsidiary.files.findIndex(f => f.type === type)
    if (existingIndex !== -1) {
      subsidiary.files.splice(existingIndex, 1)
    }

    // Add new file with additional metadata
    subsidiary.files.push({
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

const removeSubsidiaryFile = (subsidiaryIndex, type) => {
  const subsidiary = subsidiaries.value[subsidiaryIndex]
  const fileIndex = subsidiary.files.findIndex(f => f.type === type)
  if (fileIndex !== -1) {
    subsidiary.files.splice(fileIndex, 1)
  }
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
</style>
