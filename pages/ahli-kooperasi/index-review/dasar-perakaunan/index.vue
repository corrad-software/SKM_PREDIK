<script setup>
import { ref, computed } from 'vue';

definePageMeta({
  layout: "admin",
});

// Dynamic year selection
const currentYear = ref(new Date().getFullYear());
const previousYear = ref(currentYear.value - 1);

// General information form data
const generalInfo = ref({
  activities: ['Aktiviti perdagangan dan perniagaan', 'Pelaburan dan pengurusan aset'],
  actNumber: 'Akta Koperasi 1993 (Akta 502)',
  registeredAddress: '',
  statementApprovalDate: '',
  approvedBy: ''
});

// Computed financial year end date
const financialYearEnd = computed(() => {
  return `31 Disember ${previousYear.value}`;
});

// Form validation
const isFormValid = computed(() => {
  return generalInfo.value.registeredAddress && 
         generalInfo.value.statementApprovalDate && 
         generalInfo.value.approvedBy;
});

// Risk management policies
const riskPolicies = ref([
  {
    title: 'Risiko Pasaran',
    content: 'Koperasi meminimumkan pendedahan kepada risiko kadar faedah dengan memantau dan menguruskan campuran aset dan liabiliti kewangan yang sesuai.'
  },
  {
    title: 'Risiko Kredit',
    content: 'Koperasi menguruskan risiko kredit dengan menetapkan had kredit, mendapatkan cagaran yang mencukupi dan memantau akaun secara berterusan.'
  },
  {
    title: 'Risiko Kecairan',
    content: 'Koperasi mengekalkan tahap tunai dan setara tunai yang mencukupi dan mempunyai akses kepada pelbagai sumber pembiayaan.'
  }
]);

// Risk management policy text
const riskPolicy = ref(`Dasar pengurusan risiko kewangan koperasi memastikan bahawa sumber kewangan yang mencukupi adalah tersedia untuk pembangunan perniagaan koperasi di samping menguruskan risikonya. Koperasi beroperasi mengikut garis panduan yang tetap dan jelas yang telah diluluskan oleh Anggota Lembaga dan polisi koperasi untuk tidak melibatkan sebarang urusniaga yang berasaskan spekulasi. Polisi-polisi di bawah merangkumi pendekatan pengurusan risiko yang diamalkan oleh koperasi.`);

// Print function
const printForm = () => {
  window.print();
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <!-- Header with print button -->
      <div class="bg-blue-600 p-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-white">Dasar Perakaunan Koperasi</h1>
        <button @click="printForm" class="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors print:hidden flex items-center">
          <span class="mr-2">Cetak</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>
      </div>
      
      <!-- Form content -->
      <div class="p-6">
        <!-- General Information Section -->
        <div class="mb-8">
          <h2 class="text-xl font-bold mb-4 text-blue-700 border-b pb-2">1. MAKLUMAT UMUM</h2>
          
          <div class="mb-6">
            <p class="font-medium mb-2">Koperasi menjalankan aktiviti-aktiviti seperti berikut:-</p>
            <div class="mt-2 space-y-4">
              <div class="flex">
                <span class="mr-2 font-medium">(a)</span>
                <input 
                  type="text" 
                  v-model="generalInfo.activities[0]" 
                  class="flex-1 border-b border-gray-300 focus:border-blue-500 px-2 py-1" 
                  placeholder="Nyatakan aktiviti utama" 
                />
              </div>
              <div class="flex">
                <span class="mr-2 font-medium">(b)</span>
                <input 
                  type="text" 
                  v-model="generalInfo.activities[1]" 
                  class="flex-1 border-b border-gray-300 focus:border-blue-500 px-2 py-1" 
                  placeholder="Nyatakan aktiviti kedua" 
                />
              </div>
            </div>
          </div>
          
          <div class="mb-6">
            <p class="font-medium mb-2">Koperasi ini diperbadankan di bawah:</p>
            <input 
              type="text" 
              v-model="generalInfo.actNumber" 
              class="w-full border-b border-gray-300 focus:border-blue-500 px-2 py-1 mt-2" 
              placeholder="Contoh: Akta Koperasi 1993 (Akta 502)" 
            />
          </div>
          
          <div class="mb-6">
            <p class="font-medium mb-2">Alamat berdaftar dan alamat perniagaan koperasi:</p>
            <input 
              type="text" 
              v-model="generalInfo.registeredAddress" 
              class="w-full border-b border-gray-300 focus:border-blue-500 px-2 py-1 mt-2" 
              placeholder="Masukkan alamat lengkap" 
            />
          </div>
        </div>
        
        <!-- Financial Statement Approval Date -->
        <div class="mb-8">
          <h2 class="text-xl font-bold mb-4 text-blue-700 border-b pb-2">2. TARIKH PENGESAHAN Dasar Perakaunan</h2>
          
          <div class="mb-6">
            <p class="font-medium mb-2">Dasar Perakaunan koperasi untuk tahun kewangan berakhir {{ financialYearEnd }} disahkan oleh Lembaga Koperasi pada:</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label class="block text-sm text-gray-600 mb-1">Tarikh Pengesahan</label>
                <input 
                  type="date" 
                  v-model="generalInfo.statementApprovalDate" 
                  class="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">Disahkan Oleh</label>
                <input 
                  type="text" 
                  v-model="generalInfo.approvedBy" 
                  class="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Nama Pengerusi Lembaga" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Risk Management Policy -->
        <div class="mb-8">
          <h2 class="text-xl font-bold mb-4 text-blue-700 border-b pb-2">3. POLISI PENGURUSAN RISIKO KEWANGAN</h2>
          
          <div class="mb-6">
            <p class="text-gray-700 leading-relaxed mb-4">{{ riskPolicy }}</p>
            
            <div class="space-y-4 mt-6">
              <div v-for="(policy, index) in riskPolicies" :key="index" class="bg-gray-50 p-4 rounded-md">
                <h3 class="font-medium text-blue-600 mb-2">{{ policy.title }}</h3>
                <textarea 
                  v-model="policy.content" 
                  rows="3" 
                  class="w-full mt-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Huraian polisi pengurusan risiko...">
                </textarea>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-md">
                <h3 class="font-medium text-blue-600 mb-2">Polisi Tambahan</h3>
                <textarea 
                  rows="3" 
                  class="w-full mt-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Masukkan polisi-polisi tambahan di sini...">
                </textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Form Submission -->
        <div class="mt-8 border-t pt-6 flex justify-end">
          <button 
            :class="['px-6 py-2 rounded-md font-medium transition-colors', 
                     isFormValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed']"
            :disabled="!isFormValid"
          >
            Simpan Dokumen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input, textarea {
  outline: none;
  color: #1f2937;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1rem;
  background-color: transparent;
  transition: all 0.2s ease;
}

textarea {
  resize: vertical;
}

@media print {
  .bg-gray-50 {
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .shadow-md {
    box-shadow: none;
  }
  
  input, textarea {
    border-color: #e5e7eb !important;
  }

  .print\:hidden {
    display: none !important;
  }
  
  button {
    display: none !important;
  }
}

/* Form field hover effects */
input:hover, textarea:hover {
  background-color: rgba(243, 244, 246, 0.5);
}

input:focus, textarea:focus {
  border-color: #3b82f6;
  background-color: white;
}
</style>