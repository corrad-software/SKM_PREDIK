<script setup>
definePageMeta({
  layout: "admin",
});

// Add reactive data for the ledger
const ledgerData = ref({
  title: 'KOPERASI XXXXXXXX BERHAD',
  subtitle: 'PENYATA KEWANGAN : 31 DISEMBER 20XX',
  columns: [
    { name: 'AKAUN 20XX', subColumns: ['DEBIT RM', 'KREDIT RM'] },
    { name: 'DRAF 20XX', subColumns: ['DEBIT RM', 'KREDIT RM'] },
    { name: 'PELARASAN', subColumns: ['DEBIT RM', 'KREDIT RM'] },
    { name: 'IMBANGAN DUGA', subColumns: ['DEBIT RM', 'KREDIT RM'] },
    { name: 'AKAUN PERNIAGAAN', subColumns: ['DEBIT RM', 'KREDIT RM'] },
    { name: 'AK UI BUDI', subColumns: ['DEBIT RM', 'KREDIT RM'] },
    { name: 'AK PEMBAHAGIAN', subColumns: ['DEBIT RM', 'KREDIT RM'] },
    { name: 'KUNCI KIRA-KIRA', subColumns: ['DEBIT RM', 'KREDIT RM'] },
  ],
  rows: [
    { 
      code: '11000',
      name: 'Aset Tetap',
      type: 'header',
      pic: '',
      values: {}
    },
    {
      code: '11100',
      name: 'Nilai Buku Bersih - Tanah',
      type: 'item',
      pic: 'Ahmad Zulkifli',
      values: {
        'AKAUN 20XX': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '52000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '2000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '50000', kredit: '', debitBg: false, kreditBg: false }
      }
    },
    {
      code: '11200',
      name: 'Nilai Buku Bersih - Bangunan',
      type: 'item',
      pic: 'Siti Aminah',
      values: {
        'AKAUN 20XX': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '155000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '5000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '150000', kredit: '', debitBg: false, kreditBg: false }
      }
    },
    {
      code: '12000',
      name: 'Aset Semasa',
      type: 'header',
      pic: '',
      values: {}
    },
    {
      code: '12100',
      name: 'Tunai di Bank',
      type: 'item',
      pic: 'Nurul Huda',
      values: {
        'AKAUN 20XX': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '31000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '1000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '30000', kredit: '', debitBg: false, kreditBg: false }
      }
    },
    {
      code: '12200',
      name: 'Penghutang',
      type: 'item',
      pic: 'Mohd Faizal',
      values: {
        'AKAUN 20XX': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '21000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '1000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '20000', kredit: '', debitBg: false, kreditBg: false }
      }
    }
  ]
});

// Initialize empty values for each cell
ledgerData.value.rows.forEach(row => {
  ledgerData.value.columns.forEach(column => {
    if (column.subColumns) {
      row.values[column.name] = {
        debit: '',
        kredit: '',
        debitBg: false,
        kreditBg: false
      };
    }
  });
});

// Handle value changes
const updateValue = (row, column, subColumn, value) => {
  if (column.subColumns) {
    const field = subColumn.toLowerCase();
    row.values[column.name][field] = value;
  }
};

// Add handler for background toggle
const toggleBackground = (row, column, subColumn) => {
  const field = subColumn.toLowerCase() + 'Bg';
  row.values[column.name][field] = !row.values[column.name][field];
};

// Add new row function
const addNewRow = () => {
  const newRow = {
    code: '',
    name: '',
    type: 'item',
    pic: '',
    values: {}
  };

  // Initialize values for the new row
  ledgerData.value.columns.forEach(column => {
    if (column.subColumns) {
      newRow.values[column.name] = {
        debit: '',
        kredit: '',
        debitBg: false,
        kreditBg: false
      };
    }
  });

  ledgerData.value.rows.push(newRow);
};

// Add reactive data for risk assessment
const riskAssessment = ref({
  overallRisk: 'MEDIUM',
  categories: [
    {
      name: 'Financial Risk',
      level: 'HIGH',
      status: 'NEED ATTENTION',
      description: 'High debt-to-equity ratio and declining liquidity metrics',
      recommendations: [
        'Review current debt structure',
        'Implement stricter cash flow management',
        'Consider debt consolidation options'
      ],
      isOpen: false
    },
    {
      name: 'Operational Risk',
      level: 'LOW',
      status: 'ACCEPTABLE',
      description: 'Strong internal controls and documented procedures',
      recommendations: [
        'Continue monitoring operational metrics',
        'Regular staff training updates'
      ],
      isOpen: false
    },
    {
      name: 'Compliance Risk',
      level: 'MEDIUM',
      status: 'MONITORING',
      description: 'Recent regulatory changes require attention',
      recommendations: [
        'Update compliance documentation',
        'Schedule regulatory review meeting'
      ],
      isOpen: false
    }
  ]
});

// Toggle category expansion
const toggleCategory = (category) => {
  category.isOpen = !category.isOpen;
};

// Add state for panel visibility
const isRiskPanelOpen = ref(false);
const isMaterialityPanelOpen = ref(false);
const isAuditSamplingPanelOpen = ref(false);

const toggleRiskPanel = () => {
  isRiskPanelOpen.value = !isRiskPanelOpen.value;
};

const toggleMaterialityPanel = () => {
  isMaterialityPanelOpen.value = !isMaterialityPanelOpen.value;
};

const toggleAuditSamplingPanel = () => {
  isAuditSamplingPanelOpen.value = !isAuditSamplingPanelOpen.value;
};

// Add reactive data for cooperative and ledger selection
const selectedCooperative = ref('');
const selectedLedger = ref('');
const showAnakSyarikat = ref(false);
const showLedger = ref(false);

const janaLejar = () => {
  showLedger.value = true;
};

// Sample data for cooperatives and ledgers
const koperasiList = ref([
  { name: 'Koperasi A', anakSyarikat: ['Anak Syarikat A1', 'Anak Syarikat A2'] },
  { name: 'Koperasi B', anakSyarikat: [] },
  { name: 'Koperasi C', anakSyarikat: ['Anak Syarikat C1'] }
]);

const ledgers = ref([
  { id: 1, name: 'PENYATA KEWANGAN : 31 DISEMBER 20XX' },
  { id: 2, name: 'PENYATA KEWANGAN : 31 DISEMBER 20YY' }
]);

// Function to handle cooperative selection
const selectCooperative = (event) => {
  selectedCooperative.value = event.target.value;
  showAnakSyarikat.value = selectedCooperative.value !== '';
};

// Function to handle ledger selection
const selectLedger = (event) => {
  selectedLedger.value = event.target.value;
};

// Add sample data for Materiality and Audit Sampling
const materialityData = ref({
  overallLevel: 'MEDIUM',
  categories: [
    {
      name: 'Financial Materiality',
      level: 'HIGH',
      description: 'Significant financial impact due to material misstatements.',
      recommendations: [
        'Review financial statements for accuracy.',
        'Ensure compliance with accounting standards.'
      ],
      isOpen: false
    },
    {
      name: 'Operational Materiality',
      level: 'MEDIUM',
      description: 'Moderate operational impact due to inefficiencies.',
      recommendations: [
        'Optimize operational processes.',
        'Conduct regular performance reviews.'
      ],
      isOpen: false
    }
  ]
});

const auditSamplingData = ref({
  overallLevel: 'MEDIUM',
  categories: [
    {
      name: 'Random Sampling',
      level: 'LOW',
      description: 'Low risk of sampling errors due to random selection.',
      recommendations: [
        'Ensure randomness in sample selection.',
        'Review sampling methodology.'
      ],
      isOpen: false
    },
    {
      name: 'Stratified Sampling',
      level: 'MEDIUM',
      description: 'Moderate risk due to stratification of data.',
      recommendations: [
        'Validate stratification criteria.',
        'Review stratified sample results.'
      ],
      isOpen: false
    }
  ]
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Add dropdowns for selecting cooperative and ledger -->
    <div class="p-4 bg-white shadow mb-4">
      <div class="flex space-x-4">
        <div>
          <label for="cooperative" class="block text-sm font-medium text-gray-700">Koperasi</label>
          <select id="cooperative" v-model="selectedCooperative" @change="selectCooperative" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="">Pilih Koperasi</option>
            <option v-for="koperasi in koperasiList" :key="koperasi.name" :value="koperasi.name">{{ koperasi.name }}</option>
          </select>
        </div>
        <div v-if="showAnakSyarikat">
          <label for="anak-syarikat" class="block text-sm font-medium text-gray-700">Anak Syarikat</label>
          <select id="anak-syarikat" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="">Pilih Anak Syarikat</option>
            <option v-for="anakSyarikat in koperasiList.find(k => k.name === selectedCooperative)?.anakSyarikat || []" :key="anakSyarikat" :value="anakSyarikat">{{ anakSyarikat }}</option>
          </select>
        </div>
        <div>
          <label for="ledger" class="block text-sm font-medium text-gray-700">Lejar</label>
          <select id="ledger" v-model="selectedLedger" @change="selectLedger" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="">Pilih Lejar</option>
            <option v-for="ledger in ledgers" :key="ledger.id" :value="ledger.name">{{ ledger.name }}</option>
          </select>
        </div>
        <div>
          <button @click="janaLejar" class="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Jana Lejar</button>
        </div>
      </div>
    </div>
    <div v-if="showLedger">
      <!-- Display ledger and review only if both cooperative and ledger are selected -->
      <div v-if="selectedCooperative && selectedLedger">
        <!-- Add toggle buttons in the main content -->
        <div class="fixed top-20 right-4 z-10 flex space-x-2">
          <button @click="toggleRiskPanel" class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200">
            <span class="sr-only">Tukar Penilaian Risiko</span>
            <Icon name="material-symbols:planner-review" class="w-6 h-6" />
          </button>
          <button @click="toggleMaterialityPanel" class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200">
            <span class="sr-only">Tukar Materialiti</span>
            <Icon name="material-symbols:balance" class="w-6 h-6" />
          </button>
          <button @click="toggleAuditSamplingPanel" class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200">
            <span class="sr-only">Tukar Persampelan Audit</span>
            <Icon name="material-symbols:checklist" class="w-6 h-6" />
          </button>
        </div>

        <!-- Slide-out Risk Assessment Panel -->
        <div class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
            :class="isRiskPanelOpen ? 'translate-x-0' : 'translate-x-full'">
          <!-- Panel Header -->
          <div class="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-semibold">Semakan Penilaian Risiko</h2>
            <button @click="toggleRiskPanel" class="p-2 hover:bg-gray-200 rounded-full">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- Overall Risk Level -->
            <div class="mb-6">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Tahap Risiko Keseluruhan:</span>
                <span :class="[
                  'px-3 py-1 rounded-full text-white font-medium text-sm',
                  riskAssessment.overallRisk === 'HIGH' ? 'bg-red-500' : '',
                  riskAssessment.overallRisk === 'MEDIUM' ? 'bg-yellow-500' : '',
                  riskAssessment.overallRisk === 'LOW' ? 'bg-green-500' : ''
                ]">
                  {{ riskAssessment.overallRisk }}
                </span>
              </div>
            </div>

            <!-- Risk Categories -->
            <div class="space-y-4">
              <div v-for="category in riskAssessment.categories" 
                  :key="category.name" 
                  class="border rounded-lg">
                <div @click="toggleCategory(category)"
                    class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                  <div class="flex flex-col space-y-2">
                    <span class="font-medium">{{ category.name }}</span>
                    <div class="flex space-x-2">
                      <span :class="[
                        'px-2 py-1 rounded-full text-white text-sm',
                        category.level === 'HIGH' ? 'bg-red-500' : '',
                        category.level === 'MEDIUM' ? 'bg-yellow-500' : '',
                        category.level === 'LOW' ? 'bg-green-500' : ''
                      ]">
                        {{ category.level }}
                      </span>
                      <span :class="[
                        'px-2 py-1 rounded-full text-sm',
                        category.status === 'NEED ATTENTION' ? 'bg-red-100 text-red-800' : '',
                        category.status === 'MONITORING' ? 'bg-yellow-100 text-yellow-800' : '',
                        category.status === 'ACCEPTABLE' ? 'bg-green-100 text-green-800' : ''
                      ]">
                        {{ category.status }}
                      </span>
                    </div>
                  </div>
                  <svg class="w-5 h-5 transform transition-transform" 
                      :class="{ 'rotate-180': category.isOpen }"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24">
                    <path stroke-linecap="round" 
                          stroke-linejoin="round" 
                          stroke-width="2" 
                          d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <div v-show="category.isOpen" 
                    class="p-3 border-t bg-gray-50">
                  <p class="text-gray-600 mb-2">{{ category.description }}</p>
                  <div class="mt-2">
                    <h4 class="font-medium mb-1">Cadangan:</h4>
                    <ul class="list-disc list-inside text-gray-600">
                      <li v-for="rec in category.recommendations" 
                          :key="rec" 
                          class="ml-2">
                        {{ rec }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slide-out Materiality Panel -->
        <div class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
            :class="isMaterialityPanelOpen ? 'translate-x-0' : 'translate-x-full'">
          <!-- Panel Header -->
          <div class="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-semibold">Semakan Materialiti</h2>
            <button @click="toggleMaterialityPanel" class="p-2 hover:bg-gray-200 rounded-full">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- Materiality Level -->
            <div class="mb-6">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Tahap Materialiti Keseluruhan:</span>
                <span class="px-3 py-1 rounded-full text-white font-medium text-sm bg-yellow-500">
                  {{ materialityData.overallLevel }}
                </span>
              </div>
            </div>

            <!-- Materiality Categories -->
            <div class="space-y-4">
              <div v-for="category in materialityData.categories" 
                  :key="category.name" 
                  class="border rounded-lg">
                <div class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                  <div class="flex flex-col space-y-2">
                    <span class="font-medium">{{ category.name }}</span>
                    <div class="flex space-x-2">
                      <span class="px-2 py-1 rounded-full text-white text-sm bg-yellow-500">
                        {{ category.level }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="p-3 border-t bg-gray-50">
                  <p class="text-gray-600 mb-2">{{ category.description }}</p>
                  <div class="mt-2">
                    <h4 class="font-medium mb-1">Cadangan:</h4>
                    <ul class="list-disc list-inside text-gray-600">
                      <li v-for="rec in category.recommendations" 
                          :key="rec" 
                          class="ml-2">
                        {{ rec }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slide-out Audit Sampling Panel -->
        <div class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
            :class="isAuditSamplingPanelOpen ? 'translate-x-0' : 'translate-x-full'">
          <!-- Panel Header -->
          <div class="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-semibold">Semakan Persampelan Audit</h2>
            <button @click="toggleAuditSamplingPanel" class="p-2 hover:bg-gray-200 rounded-full">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- Audit Sampling Level -->
            <div class="mb-6">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Tahap Persampelan Audit Keseluruhan:</span>
                <span class="px-3 py-1 rounded-full text-white font-medium text-sm bg-yellow-500">
                  {{ auditSamplingData.overallLevel }}
                </span>
              </div>
            </div>

            <!-- Audit Sampling Categories -->
            <div class="space-y-4">
              <div v-for="category in auditSamplingData.categories" 
                  :key="category.name" 
                  class="border rounded-lg">
                <div class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                  <div class="flex flex-col space-y-2">
                    <span class="font-medium">{{ category.name }}</span>
                    <div class="flex space-x-2">
                      <span class="px-2 py-1 rounded-full text-white text-sm bg-yellow-500">
                        {{ category.level }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="p-3 border-t bg-gray-50">
                  <p class="text-gray-600 mb-2">{{ category.description }}</p>
                  <div class="mt-2">
                    <h4 class="font-medium mb-1">Cadangan:</h4>
                    <ul class="list-disc list-inside text-gray-600">
                      <li v-for="rec in category.recommendations" 
                          :key="rec" 
                          class="ml-2">
                        {{ rec }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Backdrop -->
        <div v-if="isRiskPanelOpen || isMaterialityPanelOpen || isAuditSamplingPanelOpen" 
            @click="toggleRiskPanel(); toggleMaterialityPanel(); toggleAuditSamplingPanel()"
            class="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-in-out z-40">
        </div>

        <div class="max-w-full mx-auto p-4">
          <!-- Header -->
          <div class="bg-white rounded-lg shadow mb-4">
            <div class="p-4 text-center">
              <h1 class="text-xl font-bold">{{ ledgerData.title }}</h1>
              <h2 class="text-lg">{{ ledgerData.subtitle }}</h2>
            </div>
          </div>

          <!-- Ledger Table -->
          <div class="bg-white rounded-lg shadow overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <!-- Table Header -->
              <thead>
                <tr>
                  <th class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                    JENIS AKAUN
                  </th>
                  <th class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border w-[600px]">
                    BUTIRAN
                  </th>
                  <th class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border w-[150px]">
                    PIC
                  </th>
                  <!-- Dynamic Columns -->
                  <template v-for="column in ledgerData.columns" :key="column.name">
                    <th :colspan="column.subColumns ? 2 : 1" class="px-3 py-2 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">
                      {{ column.name }}
                    </th>
                  </template>
                </tr>
                <!-- Sub-headers for Debit/Kredit -->
                <tr>
                  <th class="border" colspan="3"></th>
                  <template v-for="column in ledgerData.columns" :key="`sub-${column.name}`">
                    <template v-if="column.subColumns">
                      <th v-for="subCol in column.subColumns" :key="subCol" 
                          class="px-3 py-2 bg-gray-100 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">
                        {{ subCol }}
                      </th>
                    </template>
                  </template>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="row in ledgerData.rows" :key="row.code"
                    :class="{'bg-yellow-50': row.type === 'header'}">
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border">
                    <input
                      type="text"
                      v-model="row.code"
                      class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                      placeholder="Kod"
                    />
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border w-[600px]">
                    <input
                      type="text"
                      v-model="row.name"
                      class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                      placeholder="Butiran"
                    />
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border w-[150px]">
                    <input
                      type="text"
                      v-model="row.pic"
                      class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                    />
                  </td>
                  <!-- Dynamic value cells -->
                  <template v-for="column in ledgerData.columns" :key="`values-${column.name}`">
                    <td v-for="subCol in column.subColumns" :key="`${column.name}-${subCol}`" 
                        class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border number-column"
                        :class="{
                          'bg-yellow-50': row.values[column.name][subCol.toLowerCase().split(' ')[0] + 'Bg']
                        }"
                        @dblclick="toggleBackground(row, column, subCol.split(' ')[0])">
                      <input
                        type="number"
                        step="0.01"
                        :value="row.values[column.name][subCol.toLowerCase().split(' ')[0]]"
                        @input="(e) => updateValue(row, column, subCol.split(' ')[0], e.target.value)"
                        class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1 text-right"
                        placeholder="0.00"
                      />
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>

            <!-- Add Row Button -->
            <div class="border-t">
              <button @click="addNewRow" 
                      class="w-full py-3 px-4 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                + Tambah Baris Baru
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.min-w-full {
  min-width: 100%;
}

/* Add styles for input focus state */
input:focus {
  outline: none;
}

/* Hide number input spinners */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
  min-width: 100px;
  font-variant-numeric: tabular-nums;
  font-family: monospace;
}

/* Add padding for the numbers */
td {
  padding: 0.5rem 0.75rem;
}

/* Ensure consistent width for number columns */
.number-column {
  width: 120px;
  min-width: 120px;
}

/* Ensure inputs take full width of their columns */
td:nth-child(2) input {
  width: 100%;
  min-width: 580px;
}

td:nth-child(3) input {
  width: 100%;
  min-width: 130px;
}

/* Ensure inputs in header rows are visible */
.bg-yellow-50 input {
  background-color: transparent;
}

/* Add hover effect for better UX */
input:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Add transition for smoother highlighting */
td {
  transition: background-color 0.2s ease;
}

/* Add smooth transitions for risk assessment panels */
.transform {
  transition: all 0.2s ease;
}

/* Add styles for the slide-out panel */
.h-full {
  height: calc(100vh - 4rem);
}

/* Ensure the panel scrolls properly */
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
