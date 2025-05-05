<script setup>
import { ref } from 'vue';

definePageMeta({
  layout: "admin",
});

// Title and subject - now editable with defaults
const mpkaTitle = ref('Memo Panduan Kerja Audit (MPKA)');
const perkara = ref('Honorarium');

// Objektif items - with default values
const objektifItems = ref([
  {
    no: 1,
    description: 'Memastikan honorarium yang dicadangkan menggunakan untung bersih semasa mengikut Seksyen 57(5) Akta Koperasi 1993 dan garis panduan yang berkaitan.',
    completed: false
  },
  {
    no: 2,
    description: 'Memastikan pembayaran honorarium mendapat kelulusan mesyuarat agung tahunan dan SKM mengikut Seksyen 57(5)(c) Akta Koperasi 1993.',
    completed: false
  }
]);

// Kerja-kerja Audit items - with default values
const kerjaAuditItems = ref([
  {
    no: 1,
    description: 'Pastikan honorarium yang dicadangkan menggunakan untung bersih semasa.',
    completed: false
  },
  {
    no: 2,
    description: 'Pastikan pembayaran honorarium mendapat kelulusan mesyuarat agung tahunan dan SKM.',
    completed: false
  },
  {
    no: 3,
    description: 'Tentukan kedudukan tunggakan honorarium dan buat pelarasan jika:\ni. Honorarium tidak diluluskan;\nii. Honorarium diluluskan sebahagian.',
    completed: false
  }
]);

// Penemuan dan Rumusan
const penemuan = ref('');
const rumusan = ref('');

// Rujukan Kertas Kerja
const rujukanKertasKerja = ref('');

// Toggle completed state
const toggleCompleted = (item) => {
  item.completed = !item.completed;
};

// Functions to add new items
const addObjektifItem = () => {
  const newNo = objektifItems.value.length > 0 ? objektifItems.value[objektifItems.value.length - 1].no + 1 : 1;
  objektifItems.value.push({
    no: newNo,
    description: '',
    completed: false
  });
};

const addKerjaAuditItem = () => {
  const newNo = kerjaAuditItems.value.length > 0 ? kerjaAuditItems.value[kerjaAuditItems.value.length - 1].no + 1 : 1;
  kerjaAuditItems.value.push({
    no: newNo,
    description: '',
    completed: false
  });
};

// Functions to remove items
const removeObjektifItem = (index) => {
  if (objektifItems.value.length > 1) {
    objektifItems.value.splice(index, 1);
    // Renumber remaining items
    objektifItems.value.forEach((item, idx) => {
      item.no = idx + 1;
    });
  } else {
    // If it's the last item, just clear it instead of removing
    objektifItems.value[0].description = '';
    objektifItems.value[0].completed = false;
  }
};

const removeKerjaAuditItem = (index) => {
  if (kerjaAuditItems.value.length > 1) {
    kerjaAuditItems.value.splice(index, 1);
    // Renumber remaining items
    kerjaAuditItems.value.forEach((item, idx) => {
      item.no = idx + 1;
    });
  } else {
    // If it's the last item, just clear it instead of removing
    kerjaAuditItems.value[0].description = '';
    kerjaAuditItems.value[0].completed = false;
  }
};

// Auto-resize textarea
const adjustTextareaHeight = (event) => {
  const textarea = event.target;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
};
</script>

<template>
  <div class="min-h-screen bg-white p-6">
    <!-- Header with tooltip -->
    <div class="mb-6 border-b border-gray-300 pb-2 relative group">
      <input 
        v-model="mpkaTitle" 
        class="text-xl font-bold text-gray-700 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors"
        placeholder="Masukkan tajuk memo"
        title="Klik untuk edit tajuk memo"
      />
      <div class="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 left-0 bottom-0 mb-8">
        Klik untuk edit tajuk
      </div>
    </div>

    <!-- Main Form -->
    <div class="max-w-5xl mx-auto border border-gray-400 rounded-md shadow-sm">
      <!-- Perkara Section -->
      <div class="border-b border-gray-400 p-3 bg-gray-50">
        <div class="flex items-center">
          <div class="font-bold w-24">Perkara:</div>
          <input 
            v-model="perkara" 
            class="font-bold flex-1 border border-transparent rounded p-1 hover:border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors"
            placeholder="Masukkan perkara audit"
            title="Masukkan perkara audit"
          />
        </div>
      </div>

      <!-- Objektif Section -->
      <div class="border-b border-gray-400">
        <div class="flex border-b border-gray-400 bg-gray-50">
          <div class="font-bold p-3 w-2/3 border-r border-gray-400">Objektif:</div>
          <div class="p-3 w-16 text-center border-r border-gray-400">✓</div>
          <div class="p-3 flex-1">
            <div class="font-bold">Rujukan Kertas Kerja:</div>
            <input 
              v-model="rujukanKertasKerja" 
              class="w-full border border-transparent rounded p-1 hover:border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors"
              placeholder="Masukkan rujukan"
              title="Masukkan rujukan kertas kerja"
            />
          </div>
        </div>
        
        <div v-for="(item, index) in objektifItems" :key="`objektif-${item.no}`" class="flex border-b border-gray-400 last:border-b-0 hover:bg-gray-50 transition-colors">
          <div class="p-3 w-16 text-center border-r border-gray-400">
            <input 
              v-model="item.no" 
              type="number"
              class="w-8 text-center border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors"
              title="Nombor objektif"
            />.
          </div>
          <div class="p-3 w-2/3 border-r border-gray-400">
            <textarea 
              v-model="item.description" 
              rows="2"
              class="w-full border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors rounded p-1"
              placeholder="Masukkan objektif audit"
              @input="adjustTextareaHeight"
              title="Masukkan objektif audit"
            ></textarea>
          </div>
          <div class="p-3 w-16 text-center border-r border-gray-400">
            <input 
              type="checkbox" 
              v-model="item.completed"
              class="w-5 h-5 cursor-pointer"
              title="Tandakan jika selesai"
            />
          </div>
          <div class="p-3 flex-1 flex items-center">
            <button 
              @click="removeObjektifItem(index)" 
              class="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              title="Buang objektif ini"
            >
              <span class="text-xl">×</span>
            </button>
          </div>
        </div>
        
        <!-- Add new objektif button -->
        <div class="p-2 flex justify-center bg-gray-50">
          <button 
            @click="addObjektifItem" 
            class="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-md text-sm transition-colors"
            title="Tambah objektif baru"
          >
            <span class="mr-1">+</span> Tambah Objektif
          </button>
        </div>
      </div>

      <!-- Kerja-kerja Audit Section -->
      <div class="border-b border-gray-400">
        <div class="font-bold p-3 border-b border-gray-400 bg-gray-50">Kerja-kerja Audit Dijalankan:</div>
        
        <div v-for="(item, index) in kerjaAuditItems" :key="`kerja-${item.no}`" class="flex border-b border-gray-400 last:border-b-0 hover:bg-gray-50 transition-colors">
          <div class="p-3 w-16 text-center border-r border-gray-400">
            <input 
              v-model="item.no" 
              type="number"
              class="w-8 text-center border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors"
              title="Nombor kerja audit"
            />.
          </div>
          <div class="p-3 flex-1 border-r border-gray-400">
            <textarea 
              v-model="item.description" 
              rows="2"
              class="w-full border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors rounded p-1"
              placeholder="Masukkan kerja audit yang perlu dijalankan"
              @input="adjustTextareaHeight"
              title="Masukkan kerja audit yang perlu dijalankan"
            ></textarea>
          </div>
          <div class="p-3 w-16 text-center flex items-center justify-between">
            <input 
              type="checkbox" 
              v-model="item.completed"
              class="w-5 h-5 cursor-pointer"
              title="Tandakan jika selesai"
            />
            <button 
              @click="removeKerjaAuditItem(index)" 
              class="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              title="Buang kerja audit ini"
            >
              <span class="text-xl">×</span>
            </button>
          </div>
        </div>
        
        <!-- Add new kerja audit button -->
        <div class="p-2 flex justify-center bg-gray-50">
          <button 
            @click="addKerjaAuditItem" 
            class="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-md text-sm transition-colors"
            title="Tambah kerja audit baru"
          >
            <span class="mr-1">+</span> Tambah Kerja Audit
          </button>
        </div>
      </div>

      <!-- Penemuan Section -->
      <div class="border-b border-gray-400">
        <div class="font-bold p-3 border-b border-gray-400 bg-gray-50">Penemuan:</div>
        <div class="p-3">
          <textarea 
            v-model="penemuan" 
            rows="6" 
            class="w-full border border-gray-300 p-2 hover:border-gray-400 focus:border-blue-500 focus:ring-0 rounded-md transition-colors"
            placeholder="Masukkan penemuan hasil audit yang dijalankan"
            title="Masukkan penemuan hasil audit yang dijalankan"
          ></textarea>
        </div>
      </div>

      <!-- Rumusan Section -->
      <div>
        <div class="font-bold p-3 border-b border-gray-400 bg-gray-50">Rumusan:</div>
        <div class="p-3">
          <textarea 
            v-model="rumusan" 
            rows="4" 
            class="w-full border border-gray-300 p-2 hover:border-gray-400 focus:border-blue-500 focus:ring-0 rounded-md transition-colors"
            placeholder="Masukkan rumusan keseluruhan"
            title="Masukkan rumusan keseluruhan"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end mt-6 gap-4">
      <button 
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center"
        title="Kembali ke halaman sebelumnya"
      >
        <NuxtLink to="/ahli-kooperasi/index-review/kertas-kerja">
          <span class="mr-1">←</span> Kembali
        </NuxtLink>
      </button>
      <button 
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
        title="Simpan maklumat"
      >
        <span class="mr-1">💾</span> Simpan
      </button>
      <button 
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
        title="Cetak memo"
      >
        <span class="mr-1">🖨️</span> Cetak
      </button>
    </div>
  </div>
</template>

<style scoped>
input[type="text"], 
input[type="number"], 
textarea {
  outline: none;
  color: #1f2937;
  background-color: transparent;
}

input[type="checkbox"] {
  cursor: pointer;
}

textarea {
  resize: none;
  overflow: hidden;
  min-height: 40px;
}

input:focus, textarea:focus {
  background-color: #f9fafb;
}

/* Hover effects */
input:hover, textarea:hover {
  background-color: #f9fafb;
}

/* Hide number input arrows */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Print styles */
@media print {
  .bg-white {
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  button {
    display: none;
  }

  input, textarea {
    border: none !important;
  }
  
  input::placeholder, textarea::placeholder {
    color: transparent;
  }
  
  .hover\:bg-gray-50:hover {
    background-color: transparent !important;
  }
}
</style>