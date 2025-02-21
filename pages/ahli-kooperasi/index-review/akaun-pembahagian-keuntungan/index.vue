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

// Profit distribution data
const profitData = ref({
  title: 'AKAUN PEMBAHAGIAN KEUNTUNGAN',
  rows: [
    { name: 'Untung/(Rugi) Bersih Tahun Semasa', kka: '54', previousYear: '-', currentYear: '-' },
    { name: 'Campur/(Tolak): Pelarasan Operasi', kka: '54', previousYear: '-', currentYear: '-' },
    { name: 'Untung/(Rugi) Bersih Selepas Pelarasan Operasi', previousYear: '-', currentYear: '-' },
    { name: 'Tolak: (Kerugian) Terkumpul Pada Awal Tahun', previousYear: '-', currentYear: '-' },
    { name: 'Untung/(Rugi) Bersih Selepas Kerugian Terkumpul', previousYear: '-', currentYear: '-' },
    { 
      name: 'Tolak: Pembahagian Berkanun',
      items: [
        { name: 'Kumpulan Wang Rizab Statutori', kka: '57', previousYear: '-', currentYear: '-' },
        { name: 'Kumpulan Wang Amanah Pendidikan Koperasi', kka: '38', previousYear: '-', currentYear: '-' },
        { name: 'Kumpulan Wang Amanah Pembangunan Koperasi', kka: '39', previousYear: '-', currentYear: '-' }
      ]
    },
    { name: 'Untung/(Rugi) Selepas Pembahagian Berkanun', previousYear: '-', currentYear: '-' },
    {
      name: 'Tolak: Peruntukan Cukai',
      items: [
        { name: 'Peruntukan Cukai', kka: '43', previousYear: '-', currentYear: '-' },
        { name: 'Peruntukan Zakat', kka: '43', previousYear: '-', currentYear: '-' }
      ]
    },
    {
      name: 'Tolak: Lain-lain Pembahagian',
      items: [
        { name: 'Pelbagai Langganan', kka: '43', previousYear: '-', currentYear: '-' },
        { name: 'Dividen Atas Modal Syer Anggota', kka: '40', previousYear: '-', currentYear: '-' },
        { name: 'Dividen Atas Modal/Yuran Anggota', kka: '40', previousYear: '-', currentYear: '-' },
        { name: 'Honorarium Lembaga', kka: '41', previousYear: '-', currentYear: '-' },
        { name: 'Kumpulan Wang/Tabung', kka: 'KW', previousYear: '-', currentYear: '-' },
        { name: 'Lain-lain', kka: '43', previousYear: '-', currentYear: '-' }
      ]
    },
    { name: 'Baki Keuntungan Yang Belum Dibahagi/Lebih/(Kurang)', previousYear: '-', currentYear: '-' },
    { name: 'Campur/(Tolak): Pelarasan Bukan Operasi', kka: '55', previousYear: '-', currentYear: '-' },
    { name: 'Keuntungan Terkumpul Pada Awal Tahun', previousYear: '-', currentYear: '-' },
    { name: 'Keuntungan/(Kerugian) Terkumpul Pada Akhir Tahun', previousYear: '-', currentYear: '-' },
    { name: 'PERBEZAAN KEUNTUNGAN/(KERUGIAN) KKK & APK', previousYear: '-', currentYear: '-' }
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
            <th class="w-[15%] py-3 px-4 text-center font-bold">KKA</th>
            <th class="w-[20%] py-3 px-4 text-right font-bold">{{ previousYear }} (RM)</th>
            <th class="w-[20%] py-3 px-4 text-right font-bold">{{ currentYear }} (RM)</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, index) in profitData.rows" :key="index">
            <!-- Main row -->
            <tr v-if="!row.items" class="hover:bg-gray-50">
              <td class="py-2 px-4" :class="{'font-bold': !row.items}">
                {{ row.name }}
              </td>
              <td class="py-2 px-4 text-center">
                <button 
                  v-if="row.kka"
                  @click="handleKKAClick(row.kka)"
                  class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  {{ row.kka }}
                </button>
              </td>
              <td class="py-2 px-4">
                <input
                  type="text"
                  v-model="row.previousYear"
                  @input="(e) => validateInput(e, row, 'previousYear')"
                  class="w-full text-right bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0"
                  placeholder="-"
                />
              </td>
              <td class="py-2 px-4">
                <input
                  type="text"
                  v-model="row.currentYear"
                  @input="(e) => validateInput(e, row, 'currentYear')"
                  class="w-full text-right bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0"
                  placeholder="-"
                />
              </td>
            </tr>

            <!-- Section header -->
            <tr v-if="row.items" class="border-t">
              <td colspan="4" class="py-3 px-4 font-bold">
                {{ row.name }}
              </td>
            </tr>

            <!-- Nested items -->
            <template v-if="row.items">
              <tr v-for="item in row.items" :key="item.name" class="hover:bg-gray-50">
                <td class="py-2 px-4 pl-12">
                  <div class="flex items-center gap-3">
                    <span class="w-2 h-2 bg-gray-300 rounded-full"></span>
                    {{ item.name }}
                  </div>
                </td>
                <td class="py-2 px-4 text-center">
                  <button 
                    v-if="item.kka"
                    @click="handleKKAClick(item.kka)"
                    class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    {{ item.kka }}
                  </button>
                </td>
                <td class="py-2 px-4">
                  <input
                    type="text"
                    v-model="item.previousYear"
                    @input="(e) => validateInput(e, item, 'previousYear')"
                    class="w-full text-right bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0"
                    placeholder="-"
                  />
                </td>
                <td class="py-2 px-4">
                  <input
                    type="text"
                    v-model="item.currentYear"
                    @input="(e) => validateInput(e, item, 'currentYear')"
                    class="w-full text-right bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0"
                    placeholder="-"
                  />
                </td>
              </tr>
            </template>
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

