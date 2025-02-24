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
      pic: '',
      values: {}
    },
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

const toggleRiskPanel = () => {
  isRiskPanelOpen.value = !isRiskPanelOpen.value;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Add toggle button in the main content -->
    <div class="fixed top-20 right-4 z-10">
      <button @click="toggleRiskPanel" 
              class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200">
        <span class="sr-only">Toggle Risk Assessment</span>
        <Icon name="material-symbols:planner-review" class="w-6 h-6" />
      </button>
    </div>

    <!-- Slide-out Risk Assessment Panel -->
    <div class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
         :class="isRiskPanelOpen ? 'translate-x-0' : 'translate-x-full'">
      <!-- Panel Header -->
      <div class="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 class="text-lg font-semibold">Risk Assessment Review</h2>
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
            <span class="text-gray-600">Overall Risk Level:</span>
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
                <h4 class="font-medium mb-1">Recommendations:</h4>
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
    <div v-if="isRiskPanelOpen" 
         @click="toggleRiskPanel"
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
                  placeholder="Code"
                />
              </td>
              <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border w-[600px]">
                <input
                  type="text"
                  v-model="row.name"
                  class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                  placeholder="Description"
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
            + Add New Row
          </button>
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

