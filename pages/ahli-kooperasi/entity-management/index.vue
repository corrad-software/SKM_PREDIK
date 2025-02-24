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
      
        <div class="grid grid-cols-2 gap-8">
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
                  <div v-for="docType in documentTypes" :key="docType.id" 
                       class="flex items-center bg-gray-50 p-2 rounded-lg">
                    <input 
                      type="checkbox" 
                      :checked="!!subsidiary.files.find(f => f.type === docType.id)"
                      class="h-4 w-4 text-blue-500 rounded border-gray-300 mr-3"
                      disabled
                    />
                    <span class="text-sm text-gray-700 mr-3">{{ docType.name }}</span>
                    <button 
                      @click="$refs[`subsidiaryFile_${index}_${docType.id}`][0].click()" 
                      class="text-blue-500 hover:text-blue-600 text-sm ml-auto"
                    >
                      Muat Naik
                    </button>
                    <input 
                      type="file" 
                      @change="(e) => handleSubsidiaryFileUpload(e, index, docType.id)" 
                      class="hidden" 
                      :ref="`subsidiaryFile_${index}_${docType.id}`"
                    />
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

import { ref } from 'vue'

const parentCompany = ref({
  name: '',
  bankAccount: '',
  files: []
})

const subsidiaries = ref([])

const documentTypes = [
  { id: 'kunci_kira', name: 'Kunci Kira-Kira' },
  { id: 'imbangan_duga', name: 'Imbangan Duga' },
  { id: 'ledger', name: 'Ledger' },
  { id: 'bank_reconciliation', name: 'Bank Reconciliation' }
]

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

const handleParentFileUpload = (event, type) => {
  const file = event.target.files[0]
  if (file) {
    // Remove existing file of the same type if it exists
    const existingIndex = parentCompany.value.files.findIndex(f => f.type === type)
    if (existingIndex !== -1) {
      parentCompany.value.files.splice(existingIndex, 1)
    }
    // Add new file with type
    parentCompany.value.files.push({
      name: file.name,
      file: file,
      type: type
    })
  }
}

const removeParentFile = (type) => {
  const index = parentCompany.value.files.findIndex(f => f.type === type)
  if (index !== -1) {
    parentCompany.value.files.splice(index, 1)
  }
}

const handleSubsidiaryFileUpload = (event, subsidiaryIndex, type) => {
  const file = event.target.files[0]
  if (file) {
    const subsidiary = subsidiaries.value[subsidiaryIndex]
    // Remove existing file of the same type if it exists
    const existingIndex = subsidiary.files.findIndex(f => f.type === type)
    if (existingIndex !== -1) {
      subsidiary.files.splice(existingIndex, 1)
    }
    // Add new file with type
    subsidiary.files.push({
      name: file.name,
      file: file,
      type: type
    })
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
