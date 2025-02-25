<script setup>
import { ref, watch } from 'vue';

definePageMeta({
  layout: "admin",
});

// Dynamic year selection
const currentYear = ref(new Date().getFullYear());
const previousYear = ref(currentYear.value - 1);

// Function to format currency
const formatCurrency = (value) => {
  if (value === '-' || !value) return '-';
  return parseFloat(value).toLocaleString('ms-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Updated trading account data structure
const tradingData = ref({
  title: 'AKAUN PERDAGANGAN',
  sections: [
    {
      rows: [
        { name: 'Jualan', link: 'T1', previousYear: '-', currentYear: '-' },
        { name: 'TOLAK: KOS JUALAN', subheader: true },
        { name: 'Stok Awal', link: 'T2', previousYear: '-', currentYear: '-' },
        { name: 'Tambah: Belian', link: 'T3', previousYear: '-', currentYear: '-' },
        { name: 'Tolak: Stok Akhir', link: 'T4', previousYear: '-', currentYear: '-' },
        { name: 'Kos Jualan', total: true, previousYear: '-', currentYear: '-' },
        { name: 'Keuntungan/(Kerugian) Kasar', total: true, previousYear: '-', currentYear: '-' },
        { name: 'Tambah: Pendapatan Lain', link: 'T5', previousYear: '-', currentYear: '-' },
        { name: 'Tolak: Perbelanjaan Lain', link: 'T6', previousYear: '-', currentYear: '-' },
        { name: 'Keuntungan/(Kerugian) Aktiviti', total: true, previousYear: '-', currentYear: '-' }
      ]
    }
  ]
});

// Function to handle KKA link click
const handleKKAClick = (kka) => {
  if (!kka) return;
  navigateTo(`/ahli-kooperasi/index-review/kunci-kira-kira/${kka}`);
};

// Function to calculate totals
const calculateTotals = () => {
  const rows = tradingData.value.sections[0].rows;
  
  // Calculate Kos Jualan (Cost of Sales)
  const calculateKosJualan = (year) => {
    const stokAwal = parseFloat(rows[2][year]) || 0;
    const belian = parseFloat(rows[3][year]) || 0;
    const stokAkhir = parseFloat(rows[4][year]) || 0;
    return stokAwal + belian - stokAkhir;
  };

  // Calculate for both years
  ['previousYear', 'currentYear'].forEach(year => {
    // Kos Jualan
    const kosJualan = calculateKosJualan(year);
    rows[5][year] = kosJualan === 0 ? '-' : formatCurrency(kosJualan);

    // Keuntungan/(Kerugian) Kasar
    const jualan = parseFloat(rows[0][year]) || 0;
    const keuntunganKasar = jualan - kosJualan;
    rows[6][year] = keuntunganKasar === 0 ? '-' : formatCurrency(keuntunganKasar);

    // Keuntungan/(Kerugian) Aktiviti
    const pendapatanLain = parseFloat(rows[7][year]) || 0;
    const perbelanjaanLain = parseFloat(rows[8][year]) || 0;
    const keuntunganAktiviti = keuntunganKasar + pendapatanLain - perbelanjaanLain;
    rows[9][year] = keuntunganAktiviti === 0 ? '-' : formatCurrency(keuntunganAktiviti);
  });
};

// Modify validateInput to trigger calculations
const validateInput = (event, item, field) => {
  const value = event.target.value;
  if (value === '' || value === '-') {
    item[field] = '-';
  } else {
    const numericValue = value.replace(/[^0-9.-]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      event.target.value = item[field];
      return;
    }
    item[field] = numericValue;
  }
  calculateTotals();
};

// Watch for changes in input values
watch(() => tradingData.value.sections[0].rows, calculateTotals, { deep: true });
</script>

<template>
  <div class="min-h-screen bg-white p-6">
    <!-- Title Section -->
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800">INDEKS</h1>
      <h2 class="text-xl font-bold text-gray-800 mt-2">{{ tradingData.title }}</h2>
      <h3 class="text-lg text-gray-600 mt-1">PADA 31 DISEMBER {{ currentYear }}</h3>
    </div>

    <!-- Main Table -->
    <div class="max-w-4xl mx-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-y-2 border-black">
            <th class="w-[45%] py-3 px-4 text-left font-bold">BUTIRAN</th>
            <th class="w-[15%] py-3 px-4 text-center font-bold">LINK</th>
            <th class="w-[20%] py-3 px-4 text-right font-bold">{{ previousYear }} (RM)</th>
            <th class="w-[20%] py-3 px-4 text-right font-bold">{{ currentYear }} (RM)</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="section in tradingData.sections" :key="section.title">
            <!-- Section Rows -->
            <tr v-for="row in section.rows" :key="row.name" 
                :class="{
                  'font-bold': row.subheader || row.total,
                  'hover:bg-gray-50': !row.subheader && !row.total,
                  'border-t border-black': row.total
                }">
              <td class="py-2 px-4" :class="{'pl-8': !row.subheader && !row.total}">{{ row.name }}</td>
              <td class="py-2 px-4 text-center">
                <button 
                  v-if="row.link && !row.subheader && !row.total"
                  @click="handleKKAClick(row.link)"
                  class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  {{ row.link }}
                </button>
              </td>
              <td class="py-2 px-4">
                <input
                  v-if="!row.subheader"
                  type="text"
                  v-model="row.previousYear"
                  @input="(e) => validateInput(e, row, 'previousYear')"
                  :readonly="row.total"
                  :class="[
                    'w-full text-right bg-transparent focus:ring-0',
                    row.total ? 'font-bold border-t border-black cursor-not-allowed' : 'border-b border-gray-200 focus:border-blue-500'
                  ]"
                  placeholder="-"
                />
              </td>
              <td class="py-2 px-4">
                <input
                  v-if="!row.subheader"
                  type="text"
                  v-model="row.currentYear"
                  @input="(e) => validateInput(e, row, 'currentYear')"
                  :readonly="row.total"
                  :class="[
                    'w-full text-right bg-transparent focus:ring-0',
                    row.total ? 'font-bold border-t border-black cursor-not-allowed' : 'border-b border-gray-200 focus:border-blue-500'
                  ]"
                  placeholder="-"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
input {
  outline: none;
  color: #1f2937;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

@media print {
  .bg-white {
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  input {
    border: none !important;
  }
  
  button {
    display: none;
  }
}

/* Consistent styling with Kunci Kira-kira */
.border-y-2 {
  border-top-width: 2px;
  border-bottom-width: 2px;
}

.border-black {
  border-color: #000000;
}

/* Improve input interaction */
input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.1);
}

input:hover {
  background-color: #eff6ff;
}

/* Add styles for readonly inputs */
input[readonly] {
  background-color: transparent;
  cursor: not-allowed;
}
</style>

