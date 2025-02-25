<template>
  <div class="entity-management">
    <!-- Header Section -->
    <div class="mb-10 flex items-center">
      <div class="bg-blue-50 p-3 rounded-xl mr-4">
        <Icon name="apartment" class="w-8 h-8 text-blue-500" />
      </div>
      <div>
        <h1 class="text-3xl font-semibold text-gray-800">Senarai Koperasi</h1>
        <p class="text-gray-500 mt-2 text-lg">Semakan maklumat koperasi dan anak syarikat</p>
      </div>
    </div>

    <!-- Cooperatives Table Section -->
    <div class="bg-white rounded-xl shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="w-10 px-8 py-4"></th>
              <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">
                <span class="flex items-center">
                  <Icon name="mdi:office-building" class="w-4 h-4 mr-2" />
                  Nama Koperasi
                </span>
              </th>
              <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">
                <span class="flex items-center">
                  <Icon name="material-symbols:credit-card" class="w-4 h-4 mr-2" />
                  Nombor Pendaftaran
                </span>
              </th>
              <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">
                <span class="flex items-center">
                  <Icon name="material-symbols:description" class="w-4 h-4 mr-2" />
                  Dokumen
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(coop, index) in cooperatives" :key="coop.id">
              <!-- Cooperative Row -->
              <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-8 py-4">
                  <button @click="toggleSubsidiaries(index)" class="text-gray-500">
                    <Icon 
                      :name="expandedCoops[index] ? 'material-symbols:expand-less' : 'material-symbols:expand-more'" 
                      class="w-6 h-6"
                    />
                  </button>
                </td>
                <td class="px-8 py-4">{{ coop.name }}</td>
                <td class="px-8 py-4">{{ coop.regNo }}</td>
                <td class="px-8 py-4">
                  <div class="flex justify-between items-start">
                    <div class="space-y-2">
                      <div v-for="doc in coop.documents" :key="doc.type" class="flex items-center">
                        <Icon 
                          :name="doc.uploaded ? 'material-symbols:check-circle' : 'material-symbols:error'" 
                          :class="doc.uploaded ? 'text-green-500' : 'text-red-500'"
                          class="w-5 h-5 mr-2" 
                        />
                        <span class="text-sm">{{ doc.name }}</span>
                        <button 
                          v-if="doc.uploaded"
                          @click="viewDocument(doc)"
                          class="ml-2 text-blue-500 hover:text-blue-600 text-sm"
                        >
                          Lihat
                        </button>
                      </div>
                    </div>
                    <button 
                      v-if="hasIncompleteDocuments(coop.documents)"
                      @click="sendReminder(coop)"
                      class="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center hover:bg-yellow-200 transition-colors whitespace-nowrap ml-4"
                    >
                      <Icon name="material-symbols:notifications" class="w-4 h-4 mr-1" />
                      Hantar Peringatan
                    </button>
                  </div>
                </td>

              </tr>
              <!-- Subsidiaries Section (Expandable) -->
              <tr v-if="expandedCoops[index]">
                <td colspan="5" class="px-8 py-4 bg-gray-50">
                  <div class="ml-8">
                    <table class="w-full bg-white rounded-lg overflow-hidden">
                      <thead>
                        <tr class="border-b border-gray-100 bg-gray-100">
                          <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">Anak Syarikat</th>
                          <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">No. SSM</th>
                          <th class="px-8 py-4 text-left text-sm font-medium text-gray-600">Dokumen</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="subsidiary in coop.subsidiaries" :key="subsidiary.name" 
                            class="border-b border-gray-50">
                          <td class="px-8 py-4">{{ subsidiary.name }}</td>
                          <td class="px-8 py-4">{{ subsidiary.ssmNo }}</td>
                          <td class="px-8 py-4">
                            <div class="flex justify-between items-start">
                              <div class="space-y-2">
                                <div v-for="doc in subsidiary.documents" :key="doc.type" 
                                     class="flex items-center">
                                  <Icon 
                                    :name="doc.uploaded ? 'material-symbols:check-circle' : 'material-symbols:error'" 
                                    :class="doc.uploaded ? 'text-green-500' : 'text-red-500'"
                                    class="w-5 h-5 mr-2" 
                                  />
                                  <span class="text-sm">{{ doc.name }}</span>
                                  <button 
                                    v-if="doc.uploaded"
                                    @click="viewDocument(doc)"
                                    class="ml-2 text-blue-500 hover:text-blue-600 text-sm"
                                  >
                                    Lihat
                                  </button>
                                </div>
                              </div>
                              <!-- Moved notification button to the right -->
                              <button 
                                v-if="hasIncompleteDocuments(subsidiary.documents)"
                                @click="sendReminder(subsidiary)"
                                class="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center hover:bg-yellow-200 transition-colors whitespace-nowrap ml-4"
                              >
                                <Icon name="material-symbols:notification-add" class="w-4 h-4 mr-2" />
                                Hantar Peringatan
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
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

const cooperatives = ref([
  {
    id: 1,
    name: 'Koperasi Serbaguna Global Berhad',
    regNo: 'K-1234-1990-M',
    documents: [
      { type: 'kunci_kira', name: 'Kunci Kira-Kira', uploaded: true, url: '/auditor-skm/index-review/kunci-kira-kira' },
      { type: 'imbangan_duga', name: 'Imbangan Duga', uploaded: false },
      { type: 'ledger', name: 'Ledger', uploaded: true, url: '/auditor-skm/index-review/ledger' },
      { type: 'bank_reconciliation', name: 'Bank Reconciliation', uploaded: false }
    ],
    subsidiaries: [
      {
        name: 'Global Trading Sdn Bhd',
        ssmNo: '199301012345',
        documents: [
          { type: 'kunci_kira', name: 'Kunci Kira-Kira', uploaded: true, url: '/auditor-skm/index-review/kunci-kira-kira' },
          { type: 'imbangan_duga', name: 'Imbangan Duga', uploaded: true, url: '/auditor-skm/index-review/imbangan-duga' },
          { type: 'ledger', name: 'Ledger', uploaded: false },
          { type: 'bank_reconciliation', name: 'Bank Reconciliation', uploaded: true, url: '/auditor-skm/index-review/bank-reconciliation' }
        ]
      },
      {
        name: 'Global Mart Enterprise Sdn Bhd',
        ssmNo: '199401012346',
        documents: [
          { type: 'kunci_kira', name: 'Kunci Kira-Kira', uploaded: false },
          { type: 'imbangan_duga', name: 'Imbangan Duga', uploaded: false },
          { type: 'ledger', name: 'Ledger', uploaded: false },
          { type: 'bank_reconciliation', name: 'Bank Reconciliation', uploaded: false }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Kooperasi Rakyat',
    regNo: 'K-2345-1954-M',
    documents: [
      { type: 'kunci_kira', name: 'Kunci Kira-Kira', uploaded: true, url: '/auditor-skm/index-review/kunci-kira-kira' },
      { type: 'imbangan_duga', name: 'Imbangan Duga', uploaded: true, url: '/auditor-skm/index-review/imbangan-duga' },
      { type: 'ledger', name: 'Ledger', uploaded: true, url: '/auditor-skm/index-review/ledger' },
      { type: 'bank_reconciliation', name: 'Bank Reconciliation', uploaded: true, url: '/auditor-skm/index-review/bank-reconciliation' }
    ],
    subsidiaries: [
      {
        name: 'Rakyat Holdings Sdn Bhd',
        ssmNo: '199501012347',
        documents: [
          { type: 'kunci_kira', name: 'Kunci Kira-Kira', uploaded: true, url: '/auditor-skm/index-review/kunci-kira-kira' },
          { type: 'imbangan_duga', name: 'Imbangan Duga', uploaded: false },
          { type: 'ledger', name: 'Ledger', uploaded: true, url: '/auditor-skm/index-review/ledger' },
          { type: 'bank_reconciliation', name: 'Bank Reconciliation', uploaded: true, url: '/auditor-skm/index-review/bank-reconciliation' }
        ]
      }
    ]
  }
])

const expandedCoops = ref({})

const toggleSubsidiaries = (index) => {
  expandedCoops.value[index] = !expandedCoops.value[index]
}

const viewDocument = (doc) => {
  // Implementation for document viewing
  window.open(doc.url, '_blank')
}

const hasIncompleteDocuments = (documents) => {
  return documents.some(doc => !doc.uploaded)
}

const sendReminder = async (coop) => {
  try {
    // Show loading state
    const toast = useToast()
    toast.info('Menghantar peringatan...', { duration: 1000 })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Show success message
    toast.success(`Peringatan telah dihantar kepada ${coop.name}`, {
      duration: 3000,
      description: 'Pihak syarikat akan dimaklumkan mengenai dokumen yang belum lengkap'
    })
  } catch (error) {
    // Show error message
    toast.error('Gagal menghantar peringatan', {
      duration: 3000,
      description: 'Sila cuba lagi sebentar'
    })
  }
}

// Add composable for toast notifications
const useToast = () => {
  return {
    success: (message, options = {}) => {
      // Implementation would depend on your toast library
      console.log('Success:', message, options)
    },
    error: (message, options = {}) => {
      console.log('Error:', message, options)
    },
    info: (message, options = {}) => {
      console.log('Info:', message, options)
    }
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

/* Add these styles for the toast notifications */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
