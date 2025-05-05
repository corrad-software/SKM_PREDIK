<script setup>
import { useRouter } from 'vue-router';

definePageMeta({
  layout: "admin",
});

// Add to the data structure at the top, after definePageMeta
const showKuiriPopup = ref(false);
const kuiriData = ref({
  question: '',
  response: '',
  status: 'pending'
});

// Update ledger data structure
const ledgerData = ref({
  title: 'SURUHANJAYA KOPERASI MALAYSIA',
  subtitle: 'BAHAGIAN AUDIT KOPERASI',
  koperasi: '0',
  perkara: 'TANAH',
  diauditOleh: '0',
  disemakOleh: '0',
  tarikhAudit: '',
  tarikhSemak: '',
  columns: [
    { name: 'PERKARA', width: '300px' },
    { name: 'REF', width: '80px' },
    { 
      name: 'DRAF KOPERASI',
      subColumns: ['RM', 'RM']
    },
    { 
      name: 'PELARASAN',
      subColumns: ['RM', 'RM']
    },
    { 
      name: 'TAHUN SEMAKAN',
      subColumns: ['RM', 'RM']
    }
  ],
  rows: [
    {
      perkara: '',
      ref: '',
      values: {}
    }
  ],
  auditCodes: [
    { code: 'θ', desc: 'seperti akaun teraudit' },
    { code: 'lg', desc: 'seperti dengan lejar' },
    { code: '^', desc: 'semak pengiraan' },
    { code: 'C', desc: 'pengesahan dihantar' },
    { code: 'CB', desc: 'baki disahkan' },
    { code: 'P', desc: 'pindahan' },
    { code: 'pv', desc: 'disemak dengan baucer bayaran' },
    { code: 'R', desc: 'disemak dengan resit' },
    { code: 'i', desc: 'disemak dengan inbois' },
    { code: 'BS', desc: 'disemak dengan penyata bank' },
    { code: 'Ag', desc: 'disemak dengan perjanjian' }
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

const activeTab = ref('kerjaAudit'); // Default tab

const tabs = [
  { id: 'kerjaAudit', label: 'Kerja Audit' },
  { id: 'pelarasanAudit', label: 'Pelarasan Audit' }
];

// Update pelarasanData structure to match kerja audit style
const pelarasanData = ref({
  rows: [
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
    { tarikh: '', pendapatan: '', dt: '', kt: '' },
  ]
});

// Update ledger data with more comprehensive values
ledgerData.value = {
  title: 'SURUHANJAYA KOPERASI MALAYSIA',
  subtitle: 'BAHAGIAN AUDIT KOPERASI',
  koperasi: 'KOPERASI ABC BERHAD',
  perkara: 'TANAH',
  diauditOleh: 'AHMAD BIN ABDULLAH',
  disemakOleh: 'SARAH BINTI IBRAHIM',
  tarikhAudit: '2024-03-15',
  tarikhSemak: '2024-03-20',
  columns: [
    { name: 'PERKARA', width: '300px' },
    { name: 'REF', width: '80px' },
    { 
      name: 'DRAF KOPERASI',
      subColumns: ['RM', 'RM']
    },
    { 
      name: 'PELARASAN',
      subColumns: ['RM', 'RM']
    },
    { 
      name: 'TAHUN SEMAKAN',
      subColumns: ['RM', 'RM']
    }
  ],
  rows: [
    {
      code: 'T1',
      name: 'Tanah Lot 123, Mukim Kajang',
      pic: 'Ahmad',
      type: 'item',
      values: {
        'PERKARA': { value: 'Tanah Lot 123, Mukim Kajang' },
        'REF': { value: 'HM123456' },
        'DRAF KOPERASI': { debit: '250000.00', kredit: '0.00', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '0.00', kredit: '50000.00', debitBg: false, kreditBg: true },
        'TAHUN SEMAKAN': { debit: '200000.00', kredit: '0.00', debitBg: true, kreditBg: false }
      }
    },
    {
      code: 'T2',
      name: 'Tanah Lot 456, Mukim Semenyih',
      pic: 'Sarah',
      type: 'item',
      values: {
        'PERKARA': { value: 'Tanah Lot 456, Mukim Semenyih' },
        'REF': { value: 'HM789012' },
        'DRAF KOPERASI': { debit: '180000.00', kredit: '0.00', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '20000.00', kredit: '0.00', debitBg: true, kreditBg: false },
        'TAHUN SEMAKAN': { debit: '200000.00', kredit: '0.00', debitBg: true, kreditBg: false }
      }
    },
    {
      code: 'T3',
      name: 'Tanah Lot 789, Mukim Cheras',
      pic: 'Ahmad',
      type: 'item',
      values: {
        'PERKARA': { value: 'Tanah Lot 789, Mukim Cheras' },
        'REF': { value: 'HM345678' },
        'DRAF KOPERASI': { debit: '300000.00', kredit: '0.00', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '0.00', kredit: '25000.00', debitBg: false, kreditBg: true },
        'TAHUN SEMAKAN': { debit: '275000.00', kredit: '0.00', debitBg: true, kreditBg: false }
      }
    },
    {
      code: 'T4',
      name: 'Tanah Lot 321, Mukim Ampang',
      pic: 'Sarah',
      type: 'item',
      values: {
        'PERKARA': { value: 'Tanah Lot 321, Mukim Ampang' },
        'REF': { value: 'HM901234' },
        'DRAF KOPERASI': { debit: '420000.00', kredit: '0.00', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '30000.00', kredit: '0.00', debitBg: true, kreditBg: false },
        'TAHUN SEMAKAN': { debit: '450000.00', kredit: '0.00', debitBg: true, kreditBg: false }
      }
    },
    {
      code: 'TJ',
      name: 'JUMLAH',
      pic: '',
      type: 'header',
      values: {
        'PERKARA': { value: 'JUMLAH' },
        'REF': { value: '' },
        'DRAF KOPERASI': { debit: '1150000.00', kredit: '0.00', debitBg: true, kreditBg: false },
        'PELARASAN': { debit: '50000.00', kredit: '75000.00', debitBg: true, kreditBg: true },
        'TAHUN SEMAKAN': { debit: '1125000.00', kredit: '0.00', debitBg: true, kreditBg: false }
      }
    }
  ],
  auditCodes: [
    { code: 'θ', desc: 'seperti akaun teraudit' },
    { code: 'lg', desc: 'seperti dengan lejar' },
    { code: '^', desc: 'semak pengiraan' },
    { code: 'C', desc: 'pengesahan dihantar' },
    { code: 'CB', desc: 'baki disahkan' },
    { code: 'P', desc: 'pindahan' },
    { code: 'pv', desc: 'disemak dengan baucer bayaran' },
    { code: 'R', desc: 'disemak dengan resit' },
    { code: 'i', desc: 'disemak dengan inbois' },
    { code: 'BS', desc: 'disemak dengan penyata bank' },
    { code: 'Ag', desc: 'disemak dengan perjanjian' }
  ]
};

// Update pelarasan data with corresponding adjustments
pelarasanData.value = {
  rows: [
    { 
      tarikh: '2024-03-01', 
      pendapatan: 'Pelarasan nilai tanah Lot 123 berdasarkan penilaian terkini oleh jurunilai bertauliah', 
      dt: '', 
      kt: '50000.00' 
    },
    { 
      tarikh: '2024-03-01', 
      pendapatan: 'Pelarasan nilai tanah Lot 456 - Kos tambahan pembangunan infrastruktur', 
      dt: '20000.00', 
      kt: '' 
    },
    { 
      tarikh: '2024-03-02', 
      pendapatan: 'Pelarasan nilai tanah Lot 789 berdasarkan nilai pasaran semasa', 
      dt: '', 
      kt: '25000.00' 
    },
    { 
      tarikh: '2024-03-02', 
      pendapatan: 'Pelarasan nilai tanah Lot 321 - Penambahbaikan kemudahan', 
      dt: '30000.00', 
      kt: '' 
    },
    // ... remaining empty rows ...
  ]
};

// Add at the top of the script section, after definePageMeta
const router = useRouter();

// Update the buttons array with navigation actions
const buttons = [
  { 
    label: 'MPKA', 
    action: () => router.push('/auditor-skm/index-review/mpka')
  },
  { 
    label: 'KUIRI', 
    action: () => showKuiriPopup.value = true 
  }
];
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-full mx-auto p-4">
      <!-- Main Header -->
      <div class="bg-gray-200 rounded-t-lg shadow">
        <div class="relative flex items-center justify-center p-2 border-b border-gray-300">
          <h1 class="text-xl font-bold">SURUHANJAYA KOPERASI MALAYSIA</h1>
          <!-- Page Number -->
          <div class="absolute right-4 top-2 border border-black p-2">
            <span class="font-bold">1</span>
          </div>
        </div>
        <div class="text-center p-2 border-b border-gray-300">
          <h2 class="text-lg font-bold">BAHAGIAN AUDIT KOPERASI</h2>
        </div>
      </div>

      <!-- Form Header Section -->
      <div class="bg-gray-200 rounded-b-lg shadow mb-4">
        <div class="grid grid-cols-2 gap-4 p-4">
          <!-- Left Column -->
          <div class="space-y-4">
            <div class="flex items-center">
              <label class="w-24 font-bold">KOPERASI:</label>
              <input v-model="ledgerData.koperasi" class="flex-1 border p-1 bg-white">
            </div>
            <div class="flex items-center">
              <label class="w-24 font-bold">PERKARA:</label>
              <input v-model="ledgerData.perkara" class="flex-1 border p-1 bg-white">
            </div>
            <!-- Button Row -->
            <div class="flex gap-2">
              <button 
                v-for="btn in buttons" 
                :key="btn.label"
                class="px-4 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                @click="btn.action"
              >
                {{ btn.label }}
              </button>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <div class="flex items-center">
              <label class="w-32 font-bold">DIAUDIT OLEH:</label>
              <input v-model="ledgerData.diauditOleh" class="flex-1 border p-1 bg-white">
            </div>
            <div class="flex items-center">
              <label class="w-32 font-bold">TARIKH:</label>
              <input v-model="ledgerData.tarikhAudit" class="flex-1 border p-1 bg-white" type="date">
            </div>
            <div class="flex items-center">
              <label class="w-32 font-bold">DISEMAK OLEH:</label>
              <input v-model="ledgerData.disemakOleh" class="flex-1 border p-1 bg-white">
            </div>
            <div class="flex items-center">
              <label class="w-32 font-bold">TARIKH:</label>
              <input v-model="ledgerData.tarikhSemak" class="flex-1 border p-1 bg-white" type="date">
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-white rounded-lg shadow mb-4">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-6 py-3 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'kerjaAudit'">
        <!-- Main Table -->
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

        <!-- Audit Codes Legend -->
        <div class="bg-white rounded-lg shadow mt-4 p-4">
          <h3 class="font-bold mb-2">KERJA AUDIT</h3>
          <div class="grid grid-cols-2 gap-x-8">
            <!-- Left column -->
            <div class="space-y-2">
              <div v-for="code in ledgerData.auditCodes.slice(0, 6)" :key="code.code" class="flex gap-4">
                <span class="w-8 font-bold">{{ code.code }}</span>
                <span>{{ code.desc }}</span>
              </div>
            </div>
            <!-- Right column -->
            <div class="space-y-2">
              <div v-for="code in ledgerData.auditCodes.slice(6)" :key="code.code" class="flex gap-4">
                <span class="w-8 font-bold">{{ code.code }}</span>
                <span>{{ code.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'pelarasanAudit'">
        <!-- Pelarasan Audit Table -->
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-bold mb-4">PELARASAN AUDIT</h3>
          <div class="overflow-x-auto">
            <table class="w-full border">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border p-2 text-left" style="width: 15%">TARIKH</th>
                  <th class="border p-2 text-left" style="width: 55%">PENDAPATAN</th>
                  <th class="border p-2 text-left" style="width: 15%">DT</th>
                  <th class="border p-2 text-left" style="width: 15%">KT</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in pelarasanData.rows" :key="index" 
                    class="hover:bg-gray-50">
                  <td class="border">
                    <input 
                      v-model="row.tarikh" 
                      type="date"
                      class="w-full px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                  </td>
                  <td class="border">
                    <input 
                      v-model="row.pendapatan"
                      class="w-full px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                  </td>
                  <td class="border">
                    <input 
                      v-model="row.dt"
                      class="w-full px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      type="number"
                    >
                  </td>
                  <td class="border">
                    <input 
                      v-model="row.kt"
                      class="w-full px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      type="number"
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>


    <div class="flex justify-end">
      <button
        class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
        title="Simpan maklumat"
      >
        <span class="mr-1">💾</span> Simpan
      </button>
    </div>

    <!-- Add the Kuiri popup just before the closing </div> of the main container -->
    <div v-if="showKuiriPopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">Kuiri Audit</h3>
          <button @click="showKuiriPopup = false" class="text-gray-500 hover:text-gray-700">
            <span class="text-2xl">&times;</span>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rujukan</label>
            <input
              type="text"
              class="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: T1/2024/01"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Soalan Kuiri</label>
            <textarea
              v-model="kuiriData.question"
              rows="4"
              class="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan soalan kuiri di sini..."
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Maklum Balas</label>
            <textarea
              v-model="kuiriData.response"
              rows="4"
              class="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Maklum balas akan diisi oleh koperasi..."
              disabled
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dokumen Sokongan</label>
            <input
              type="file"
              class="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              multiple
            />
          </div>
          
          <div class="flex justify-end gap-2">
            <button
              @click="showKuiriPopup = false"
              class="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              @click="showKuiriPopup = false"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Hantar Kuiri
            </button>
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

/* Add styles for form inputs */
input {
  @apply rounded px-2 py-1;
}

/* Add styles for the audit codes section */
.audit-codes {
  @apply border border-gray-200;
}

/* Update existing styles */
.bg-gray-200 {
  background-color: #e5e7eb;
}

button {
  @apply transition-colors duration-200;
}

/* Add styles for the page number box */
.page-number {
  @apply border border-black p-2 font-bold;
  min-width: 2rem;
  text-align: center;
}

/* Add styles for tabs */
.tab-active {
  @apply border-b-2 border-blue-500 text-blue-600;
}

/* Add styles for table inputs */
table input {
  @apply border-0 p-1 w-full focus:ring-1 focus:ring-blue-500 focus:outline-none;
}

/* Add styles specific to pelarasan audit table */
.pelarasan-table input {
  @apply border-0 bg-transparent;
}

.pelarasan-table tr:hover input {
  @apply bg-gray-50;
}

/* Make number inputs not show spinner arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

/* Add styles for the popup */
.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* Add styles for file input */
input[type="file"] {
  @apply text-sm text-gray-500 
    file:mr-4 file:py-2 file:px-4
    file:rounded-md file:border-0
    file:text-sm file:font-semibold
    file:bg-blue-50 file:text-blue-700
    hover:file:bg-blue-100;
}
</style>