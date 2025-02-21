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
</script>

<template>
  <div class="min-h-screen bg-gray-50">
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
</style>

