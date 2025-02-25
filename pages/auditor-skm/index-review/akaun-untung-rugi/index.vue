<script setup>
import { ref } from 'vue';

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

// Updated profit and loss data structure
const profitData = ref({
  title: 'AKAUN UNTUNG RUGI',
  sections: [
    {
      title: 'PENDAPATAN',
      rows: [
        { name: 'Kredit', link: 'A1', previousYear: '-', currentYear: '-' },
        { name: 'Pembiayaan/Perwakilan', link: 'A2', previousYear: '-', currentYear: '-' },
        { name: 'Sewaan/Sewa', link: 'A3', previousYear: '-', currentYear: '-' },
        { name: 'Perusahaan', link: 'A4', previousYear: '-', currentYear: '-' },
        { name: 'Ternakan', link: 'A5', previousYear: '-', currentYear: '-' },
        { name: 'Pembangunan Hartanah', link: 'A6', previousYear: '-', currentYear: '-' },
        { name: 'Kontrak', link: 'A7', previousYear: '-', currentYear: '-' },
        { name: 'Penggudangan', link: 'A8', previousYear: '-', currentYear: '-' },
        { name: 'Akuakultur', link: 'A9', previousYear: '-', currentYear: '-' },
        { name: 'Perkhidmatan', link: 'A10', previousYear: '-', currentYear: '-' },
        { name: 'Pertanian', link: 'A11', previousYear: '-', currentYear: '-' },
        { name: 'Upah/Guna', link: 'A12', previousYear: '-', currentYear: '-' },
        { name: 'Perikanan', link: 'A13', previousYear: '-', currentYear: '-' },
        { name: 'Lain-lain Aktiviti Perniagaan', link: 'A14', previousYear: '-', currentYear: '-' },
        { name: 'Al-Rahnu/Pajak Gadai', link: 'A15', previousYear: '-', currentYear: '-' },
        { name: 'Pelancongan', link: 'A16', previousYear: '-', currentYear: '-' },
        { name: 'Kesihatan', link: 'A17', previousYear: '-', currentYear: '-' },
        { name: 'Lain-lain Aktiviti', link: 'A18', previousYear: '-', currentYear: '-' },
        { name: 'Pendapatan Dan Syarikat Bersekutu', link: 'A19', previousYear: '-', currentYear: '-' },
        { name: 'Pendapatan Am - Seperti Senarai Dilampiran', link: 'A20', previousYear: '-', currentYear: '-' }
      ]
    },
    {
      title: 'PERBELANJAAN',
      rows: [
        { name: 'Kos Jualan/Kos Aktiviti:', subheader: true },
        { name: 'Kredit', link: 'L1', previousYear: '-', currentYear: '-' },
        { name: 'Pembiayaan/Perwakilan', link: 'L2', previousYear: '-', currentYear: '-' },
        { name: 'Sewaan/Sewa', link: 'L3', previousYear: '-', currentYear: '-' },
        { name: 'Perusahaan', link: 'L4', previousYear: '-', currentYear: '-' },
        { name: 'Ternakan', link: 'L5', previousYear: '-', currentYear: '-' },
        { name: 'Pembangunan Hartanah', link: 'L6', previousYear: '-', currentYear: '-' },
        { name: 'Kontrak', link: 'L7', previousYear: '-', currentYear: '-' },
        { name: 'Penggudangan', link: 'L8', previousYear: '-', currentYear: '-' },
        { name: 'Akuakultur', link: 'L9', previousYear: '-', currentYear: '-' },
        { name: 'Perkhidmatan', link: 'L10', previousYear: '-', currentYear: '-' },
        { name: 'Pertanian', link: 'L11', previousYear: '-', currentYear: '-' },
        { name: 'Upah/Guna', link: 'L12', previousYear: '-', currentYear: '-' },
        { name: 'Perikanan', link: 'L13', previousYear: '-', currentYear: '-' },
        { name: 'Lain-lain Aktiviti Perniagaan', link: 'L14', previousYear: '-', currentYear: '-' },
        { name: 'Al-Rahnu/Pajak Gadai', link: 'L15', previousYear: '-', currentYear: '-' },
        { name: 'Pelancongan', link: 'L16', previousYear: '-', currentYear: '-' },
        { name: 'Kesihatan', link: 'L17', previousYear: '-', currentYear: '-' },
        { name: 'Lain-lain Aktiviti', link: 'L18', previousYear: '-', currentYear: '-' },
        
        { name: 'Perbelanjaan Pentadbiran:', subheader: true },
        { name: 'Gaji, Elaun dan Bonus', link: 'L19', previousYear: '-', currentYear: '-' },
        { name: 'KWSP dan PERKESO', link: 'L20', previousYear: '-', currentYear: '-' },
        { name: 'Insurans', link: 'L21', previousYear: '-', currentYear: '-' },
        { name: 'Perubatan', link: 'L22', previousYear: '-', currentYear: '-' },
        { name: 'Utiliti', link: 'L23', previousYear: '-', currentYear: '-' },
        { name: 'Telefon dan Internet', link: 'L24', previousYear: '-', currentYear: '-' },
        { name: 'Percetakan dan Alatulis', link: 'L25', previousYear: '-', currentYear: '-' },
        { name: 'Penyelenggaraan Pejabat', link: 'L26', previousYear: '-', currentYear: '-' },
        { name: 'Penyelenggaraan Kenderaan', link: 'L27', previousYear: '-', currentYear: '-' },
        { name: 'Perjalanan dan Pengangkutan', link: 'L28', previousYear: '-', currentYear: '-' },
        { name: 'Sewa Pejabat', link: 'L29', previousYear: '-', currentYear: '-' },
        { name: 'Yuran Professional', link: 'L30', previousYear: '-', currentYear: '-' },
        { name: 'Susut Nilai', link: 'L31', previousYear: '-', currentYear: '-' },
        { name: 'Pelunasan', link: 'L32', previousYear: '-', currentYear: '-' },
        { name: 'Peruntukan Hutang Ragu', link: 'L33', previousYear: '-', currentYear: '-' },
        { name: 'Faedah/Keuntungan Pinjaman', link: 'L34', previousYear: '-', currentYear: '-' },
        { name: 'Cukai', link: 'L35', previousYear: '-', currentYear: '-' },
        { name: 'Perbelanjaan Mesyuarat', link: 'L36', previousYear: '-', currentYear: '-' },
        { name: 'Perbelanjaan Latihan', link: 'L37', previousYear: '-', currentYear: '-' },
        { name: 'Perbelanjaan Kebajikan', link: 'L38', previousYear: '-', currentYear: '-' },
        { name: 'Perbelanjaan Pemasaran', link: 'L39', previousYear: '-', currentYear: '-' },
        { name: 'Lain-lain Perbelanjaan', link: 'L40', previousYear: '-', currentYear: '-' }
      ]
    }
  ]
});

// Function to handle KKA link click
const handleKKAClick = (kka) => {
  if (!kka) return;
  navigateTo(`/ahli-kooperasi/index-review/kunci-kira-kira/${kka}`);
};

// Function to validate number input
const validateInput = (event, item, field) => {
  const value = event.target.value;
  if (value === '' || value === '-') {
    item[field] = '-';
    return;
  }
  
  const numericValue = value.replace(/[^0-9.]/g, '');
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    event.target.value = item[field];
    return;
  }
  
  item[field] = numericValue;
};
</script>

<template>
  <div class="min-h-screen bg-white p-6">
    <!-- Title Section -->
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800">INDEKS</h1>
      <h2 class="text-xl font-bold text-gray-800 mt-2">{{ profitData.title }}</h2>
      <h3 class="text-lg text-gray-600 mt-1">PADA 31 DISEMBER {{ currentYear }}</h3>
    </div>

    <!-- Main Table -->
    <div class="max-w-7xl mx-auto">
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
          <template v-for="section in profitData.sections" :key="section.title">
            <!-- Section Header -->
            <tr class="font-bold bg-gray-100">
              <td colspan="4" class="py-2 px-4">{{ section.title }}</td>
            </tr>
            
            <!-- Section Rows -->
            <tr v-for="row in section.rows" :key="row.name" 
                :class="{'font-bold': row.subheader, 'hover:bg-gray-50': !row.subheader}">
              <td class="py-2 px-4" :class="{'pl-8': !row.subheader}">{{ row.name }}</td>
              <td class="py-2 px-4 text-center">
                <button 
                  v-if="row.link && !row.subheader"
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
                  class="w-full text-right bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0"
                  placeholder="-"
                />
              </td>
              <td class="py-2 px-4">
                <input
                  v-if="!row.subheader"
                  type="text"
                  v-model="row.currentYear"
                  @input="(e) => validateInput(e, row, 'currentYear')"
                  class="w-full text-right bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0"
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
</style>

