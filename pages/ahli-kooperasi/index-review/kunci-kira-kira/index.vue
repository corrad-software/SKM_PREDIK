<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "nuxt/app";

definePageMeta({
  layout: "admin",
});

// Organization data
const route = useRoute();
const organizationId = route.query.organization_id;
const organizationName = ref("");

// Dynamic year selection
const currentYear = ref(new Date().getFullYear());
const previousYear = ref(currentYear.value - 1);

// Fetch organization data
const fetchOrganization = async () => {
  try {
    const { data: response } = await useFetch(
      `/api/organization/${organizationId}`
    );
    if (response.value?.status === "success") {
      organizationName.value = response.value.data.name;
      if (response.value.data.current_year) {
        currentYear.value = response.value.data.current_year;
        previousYear.value = currentYear.value - 1;
      }
    }
  } catch (error) {
    console.error("Error fetching organization:", error);
  }
};

// Fetch organization data when component mounts
onMounted(() => {
  if (organizationId) {
    fetchOrganization();
  }
});

// Function to format currency
const formatCurrency = (value) => {
  if (value === "-" || !value) return "-";
  return parseFloat(value).toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Function to calculate subtotal for a section
const calculateSubtotal = (items, year) => {
  const total = items.reduce((sum, item) => {
    const value = parseFloat(item[year]) || 0;
    return sum + value;
  }, 0);
  return formatCurrency(total);
};

// Ledger data for Aset
const asetData = ref({
  title: computed(() => organizationName.value || "Loading..."),
  date: `PADA ${currentYear.value}`,
  rows: [
    {
      name: "ASET BUKAN SEMASA",
      type: "mainHeader",
      showLine: true,
    },
    {
      name: "HARTA TANAH, LOJI DAN PERALATAN",
      type: "header",
      items: [
        {
          code: "1",
          name: "Tanah",
          kka: "A1",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "2",
          name: "Bangunan",
          kka: "A2",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "3",
          name: "Kenderaan",
          kka: "A3",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "4",
          name: "Komputer",
          kka: "A4",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "5",
          name: "Aset-aset Lain",
          kka: "A5",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: true,
    },
    {
      name: "ASET GERAN / BANTUAN",
      type: "header",
      items: [
        {
          code: "6",
          name: "Aset Geran / Bantuan",
          kka: "B",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: true,
    },
    {
      name: "PELABURAN",
      type: "header",
      items: [
        {
          code: "7",
          name: "Pelaburan Dalam Syer Siarharga",
          kka: "C1",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "8",
          name: "Pelaburan Dalam Syer Tak Siarharga",
          kka: "C2",
          previousYear: "-",
          currentYear: "-",
        },
      ],
    },
    {
      name: "Kepentingan Dalam Subsidiari",
      type: "subheader",
      items: [
        {
          code: "9",
          name: "Pelaburan Dalam Subsidiari",
          kka: "C3",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "10",
          name: "Hutang Subsidiari",
          kka: "C4",
          previousYear: "-",
          currentYear: "-",
        },
      ],
    },
    {
      name: "Kepentingan Dalam Syarikat",
      type: "subheader",
      items: [
        {
          code: "11",
          name: "Pelaburan Dalam Syarikat Bersekutu",
          kka: "C5",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "12",
          name: "Hutang Syarikat Bersekutu",
          kka: "C6",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "13",
          name: "Pelaburan Dalam Hartanah",
          kka: "C7",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "14",
          name: "Pelaburan Dalam Usahasama",
          kka: "C8",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "15",
          name: "Pelaburan-Pelaburan Lain",
          kka: "C9",
          previousYear: "-",
          currentYear: "-",
        },
      ],
    },
    {
      name: "ASET-ASET LAIN",
      type: "header",
      items: [
        {
          code: "16",
          name: "Projek Dalam Perlaksanaan (L.Panjang)",
          kka: "D1",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "17",
          name: "Pinjaman Anggota & Bukan Anggota",
          kka: "D2",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "18",
          name: "Akaun Caruman Kump Wang Likuiditi Pusat",
          kka: "D3",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "19",
          name: "Lain-lain Aset Bukan Semasa",
          kka: "D4",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: true,
    },
    {
      name: "ASET SEMASA",
      type: "mainHeader",
      showLine: true,
    },
    {
      name: "ASET OPERASI",
      type: "header",
      items: [
        {
          code: "20",
          name: "Inventori",
          kka: "E1",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "21",
          name: "Penghutang Perdagangan",
          kka: "E2",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "22",
          name: "Pelaburan Jangka Pendek",
          kka: "E3",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "23",
          name: "Projek Dalam Pelaksanaan (L.Pendek)",
          kka: "E4",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "24",
          name: "Pinjaman Anggota dan Bukan Anggota (L.Pendek)",
          kka: "E5",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "25",
          name: "Aset Kumpulan Wang Rizab Statutori",
          kka: "E6",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "26",
          name: "Pelbagai Penghutang",
          kka: "E7",
          previousYear: "-",
          currentYear: "-",
        },
      ],
    },
    {
      name: "TUNAI DAN BAKI BANK",
      type: "header",
      items: [
        {
          code: "27",
          name: "Deposit Tetap",
          kka: "F1",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "28",
          name: "Wang Di Bank",
          kka: "F2",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "29",
          name: "Wang Dalam Perjalanan",
          kka: "F3",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "30",
          name: "Wang Di Tangan",
          kka: "F4",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: true,
    },
  ],
});

// Updated Ledger data for Liabiliti
const liabilitiData = ref({
  title: "LIABILITI",
  date: `PADA ${currentYear.value}`,
  rows: [
    {
      name: "LIABILITI SEMASA",
      type: "header",
      items: [
        {
          code: "31",
          name: "Pemiutang Perdagangan",
          kka: "L1",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "32",
          name: "Simpanan Anggota",
          kka: "L2",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "33",
          name: "Simpanan Bukan Anggota",
          kka: "L3",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "34",
          name: "Simpanan/Deposit Khas",
          kka: "L4",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "35",
          name: "Pinjaman Dari SKM",
          kka: "L5",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "36",
          name: "Pinjaman Dari Lain-Lain Institusi Kewangan",
          kka: "L6",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "37",
          name: "Fi Audit Suruhanjaya",
          kka: "L7",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "38",
          name: "Kumpulan Wang Amanah Pendidikan Koperasi",
          kka: "L8",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "39",
          name: "Kumpulan Wang Amanah Pembangunan Koperasi",
          kka: "L9",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "40",
          name: "Dividen",
          kka: "L10",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "41",
          name: "Honorarium",
          kka: "L11",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "42",
          name: "Amaun Terhutang Kepada Syarikat Berkenaan",
          kka: "L12",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "43",
          name: "Pelbagai Pemiutang",
          kka: "L13",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "44",
          name: "Overdraf Bank",
          kka: "L14",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: true,
    },
    {
      name: "ASET / LIABILITI SEMASA BERSIH",
      type: "header",
      items: [
        {
          code: "55",
          name: "ASET / LIABILITI SEMASA BERSIH",
          kka: "L25",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: false,
    },
    {
      name: "Dibiayai Oleh",
      type: "header",
      items: [
        {
          code: "45",
          name: "Modal Syer Anggota",
          kka: "L15",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "46",
          name: "Modal Syer Bonus",
          kka: "L16",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "47",
          name: "Modal Yuran Anggota",
          kka: "L17",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "48",
          name: "Modal Yuran Ditebus",
          kka: "L18",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "49",
          name: "Modal Syer Ditebus",
          kka: "L19",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "50",
          name: "Modal Syer Bonus Ditebus",
          kka: "L20",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "51",
          name: "Akaun Rizab Modal",
          kka: "L21",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "52",
          name: "Akaun Rizab Penilaian Semula",
          kka: "L22",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "53",
          name: "Kumpulan Wang Menebus Syer",
          kka: "L23",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "54",
          name: "Kumpulan Wang Menebus Bonus Syer",
          kka: "L24",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "55",
          name: "Lain-Lain Kumpulan Wang / Tabung / Rizab Anggota",
          kka: "L25",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "56",
          name: "Akaun Untung Rugi Terkumpul",
          kka: "L26",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: true,
    },
    {
      name: "LIABILITI BUKAN SEMASA",
      type: "header",
      items: [
        {
          code: "60",
          name: "Pinjaman Dari SKM",
          kka: "L27",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "61",
          name: "Pinjaman Dari Lain-Lain Institusi Kewangan",
          kka: "L28",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "62",
          name: "Pendapatan Tertangguh/Tertunda",
          kka: "L29",
          previousYear: "-",
          currentYear: "-",
        },
        {
          code: "63",
          name: "Liabiliti Lain",
          kka: "L30",
          previousYear: "-",
          currentYear: "-",
        },
      ],
      showSubtotal: true,
    },
  ],
});

// Tab management
const activeTab = ref("aset");

// Function to handle KKA link click
const handleKKAClick = (kka) => {
  navigateTo(`/ahli-kooperasi/index-review/kunci-kira-kira/${kka}`);
};

// Function to validate number input
const validateInput = (event, item, field) => {
  const value = event.target.value;
  if (value === "" || value === "-") {
    item[field] = "-";
    return;
  }

  // Only allow numbers and decimal point
  const numericValue = value.replace(/[^0-9.]/g, "");

  // Ensure only one decimal point
  const parts = numericValue.split(".");
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
      <h1 class="text-2xl font-bold text-gray-800">
        {{ organizationName || "Loading..." }}
      </h1>
      <h3 class="text-lg text-gray-600 mt-1">PADA {{ currentYear }}</h3>
    </div>

    <!-- Tab Navigation -->
    <div class="flex justify-around mb-6">
      <button
        @click="activeTab = 'aset'"
        :class="{
          'font-bold border-b-2 border-blue-600': activeTab === 'aset',
        }"
        class="flex-1 py-2 text-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        Aset
      </button>
      <button
        @click="activeTab = 'liabiliti'"
        :class="{
          'font-bold border-b-2 border-blue-600': activeTab === 'liabiliti',
        }"
        class="flex-1 py-2 text-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        Liabiliti
      </button>
    </div>

    <!-- Main Table -->
    <div class="max-w-7xl mx-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-y-2 border-black">
            <th class="w-[45%] py-3 px-4 text-left font-bold">BUTIRAN</th>
            <th class="w-[15%] py-3 px-4 text-center font-bold">KKA</th>
            <th class="w-[20%] py-3 px-4 text-right font-bold">
              {{ previousYear }} (RM)
            </th>
            <th class="w-[20%] py-3 px-4 text-right font-bold">
              {{ currentYear }} (RM)
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="activeTab === 'aset'">
            <template v-for="(category, index) in asetData.rows" :key="index">
              <!-- Main Headers -->
              <tr v-if="category.type === 'mainHeader'" class="border-b">
                <td colspan="4" class="py-4 px-4 font-bold text-lg">
                  {{ category.name }}
                </td>
              </tr>

              <!-- Category Headers -->
              <tr v-else-if="category.type === 'header'">
                <td colspan="4" class="py-3 px-4 font-bold">
                  {{ category.name }}
                </td>
              </tr>

              <!-- Items -->
              <template v-if="category.items">
                <tr
                  v-for="item in category.items"
                  :key="item.code"
                  class="hover:bg-gray-50"
                >
                  <td class="py-2 px-4 pl-12">
                    <div class="flex items-center gap-3">
                      <span class="text-gray-500">{{ item.code }}.</span>
                      <span>{{ item.name }}</span>
                    </div>
                  </td>
                  <td class="py-2 px-4 text-center">
                    <button
                      @click="handleKKAClick(item.kka)"
                      class="text-blue-600 hover:text-blue-800 hover:underline"
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

                <!-- Subtotal -->
                <tr
                  v-if="category.showSubtotal"
                  class="border-t border-b-2 border-black"
                >
                  <td colspan="2" class="py-3 px-4 font-bold">
                    JUMLAH {{ category.name }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold">
                    {{ calculateSubtotal(category.items, "previousYear") }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold">
                    {{ calculateSubtotal(category.items, "currentYear") }}
                  </td>
                </tr>
              </template>
            </template>
          </template>

          <template v-if="activeTab === 'liabiliti'">
            <template
              v-for="(category, index) in liabilitiData.rows"
              :key="index"
            >
              <!-- Main Headers -->
              <tr v-if="category.type === 'mainHeader'" class="border-b">
                <td colspan="4" class="py-4 px-4 font-bold text-lg">
                  {{ category.name }}
                </td>
              </tr>

              <!-- Category Headers -->
              <tr v-else-if="category.type === 'header'">
                <td colspan="4" class="py-3 px-4 font-bold">
                  {{ category.name }}
                </td>
              </tr>

              <!-- Items -->
              <template v-if="category.items">
                <tr
                  v-for="item in category.items"
                  :key="item.code"
                  class="hover:bg-gray-50"
                >
                  <td class="py-2 px-4 pl-12">
                    <div class="flex items-center gap-3">
                      <span class="text-gray-500">{{ item.code }}.</span>
                      <span>{{ item.name }}</span>
                    </div>
                  </td>
                  <td class="py-2 px-4 text-center">
                    <button
                      @click="handleKKAClick(item.kka)"
                      class="text-blue-600 hover:text-blue-800 hover:underline"
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

                <!-- Subtotal for LIABILITI SEMASA -->
                <tr
                  v-if="category.showSubtotal"
                  class="border-t border-b-2 border-black"
                >
                  <td colspan="2" class="py-3 px-4 font-bold">
                    JUMLAH {{ category.name }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold">
                    {{ calculateSubtotal(category.items, "previousYear") }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold">
                    {{ calculateSubtotal(category.items, "currentYear") }}
                  </td>
                </tr>
              </template>
            </template>

            <!-- ASET / LIABILITI SEMASA BERSIH Subtotal -->
            <!-- This row has been removed as per your request -->
            <!-- ASET / LIABILITI SEMASA BERSIH Subtotal -->
            <!-- <tr class="border-t border-b-2 border-black">
              <td colspan="2" class="py-3 px-4 font-bold">
                JUMLAH ASET / LIABILITI SEMASA BERSIH
              </td>
              <td class="py-3 px-4 text-right font-bold">
                {{ calculateSubtotal(liabilitiData.rows[0].items, 'previousYear') }}
              </td>
              <td class="py-3 px-4 text-right font-bold">
                {{ calculateSubtotal(liabilitiData.rows[0].items, 'currentYear') }}
              </td>
            </tr> -->
            <!-- JUMLAH LIABILITI SEMASA -->
            <tr class="border-t border-b-2 border-black">
              <td colspan="2" class="py-3 px-4 font-bold">
                JUMLAH LIABILITI SEMASA
              </td>
              <td class="py-3 px-4 text-right font-bold">
                {{
                  calculateSubtotal(liabilitiData.rows[0].items, "previousYear")
                }}
              </td>
              <td class="py-3 px-4 text-right font-bold">
                {{
                  calculateSubtotal(liabilitiData.rows[0].items, "currentYear")
                }}
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
  color: #1f2937; /* text-gray-800 */
  font-family: "Courier New", Courier, monospace; /* font-mono */
}

/* Remove spinner for number inputs */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Print-friendly styles */
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
</style>
