<script setup>
import { onMounted, watch, onUnmounted } from "vue";

definePageMeta({
  layout: "admin",
});

// Move all reactive declarations to the top
const searchQuery = ref("");
const isParentOrganization = ref(true);
const selectedKoperasi = ref(null);
const selectedAnakSyarikat = ref(null);
const subsidiaries = ref([]);
const loading = ref(false);
const error = ref(null);
const showAnakSyarikat = ref(false);
const showLedger = ref(false);
const selectedLedger = ref("");
const statementGroups = ref([]);
const selectedGroup = ref(null);
const generationStatus = ref(null);
const generationJobId = ref(null);
const statusCheckInterval = ref(null);
const showExistingLedgerDialog = ref(false);

// Constants
const PARENT_ORGANIZATION_ID = "62986bb9-b23c-4226-93c9-be523adabf77";

// Organization type options
const organizationTypeOptions = [
  { label: "Koperasi Induk", value: true },
  { label: "Anak Syarikat", value: false },
];

// Sample data for ledgers
const ledgers = ref([
  { id: 1, name: "PENYATA KEWANGAN : 31 DISEMBER 20XX" },
  { id: 2, name: "PENYATA KEWANGAN : 31 DISEMBER 20YY" },
]);

// Add reactive data for the ledger
const ledgerData = ref({
  title: "KOPERASI XXXXXXXX BERHAD",
  subtitle: "PENYATA KEWANGAN : 31 DISEMBER 20XX",
  columns: [
    { name: "AKAUN 20XX", subColumns: ["DEBIT RM", "KREDIT RM"] },
    { name: "DRAF 20XX", subColumns: ["DEBIT RM", "KREDIT RM"] },
    { name: "PELARASAN", subColumns: ["DEBIT RM", "KREDIT RM"] },
    { name: "IMBANGAN DUGA", subColumns: ["DEBIT RM", "KREDIT RM"] },
    { name: "AKAUN PERNIAGAAN", subColumns: ["DEBIT RM", "KREDIT RM"] },
    { name: "AK UI BUDI", subColumns: ["DEBIT RM", "KREDIT RM"] },
    { name: "AK PEMBAHAGIAN", subColumns: ["DEBIT RM", "KREDIT RM"] },
    { name: "KUNCI KIRA-KIRA", subColumns: ["DEBIT RM", "KREDIT RM"] },
  ],
  rows: [
    {
      code: "11000",
      name: "Aset Tetap",
      type: "header",
      pic: "",
      values: {},
    },
    {
      code: "11100",
      name: "Nilai Buku Bersih - Tanah",
      type: "item",
      pic: "Ahmad Zulkifli",
      values: {
        "AKAUN 20XX": {
          debit: "50000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "DRAF 20XX": {
          debit: "52000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        PELARASAN: {
          debit: "",
          kredit: "2000",
          debitBg: false,
          kreditBg: false,
        },
        "IMBANGAN DUGA": {
          debit: "50000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AKAUN PERNIAGAAN": {
          debit: "50000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK UI BUDI": {
          debit: "50000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK PEMBAHAGIAN": {
          debit: "50000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "KUNCI KIRA-KIRA": {
          debit: "50000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
      },
    },
    {
      code: "11200",
      name: "Nilai Buku Bersih - Bangunan",
      type: "item",
      pic: "Siti Aminah",
      values: {
        "AKAUN 20XX": {
          debit: "150000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "DRAF 20XX": {
          debit: "155000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        PELARASAN: {
          debit: "",
          kredit: "5000",
          debitBg: false,
          kreditBg: false,
        },
        "IMBANGAN DUGA": {
          debit: "150000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AKAUN PERNIAGAAN": {
          debit: "150000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK UI BUDI": {
          debit: "150000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK PEMBAHAGIAN": {
          debit: "150000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "KUNCI KIRA-KIRA": {
          debit: "150000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
      },
    },
    {
      code: "12000",
      name: "Aset Semasa",
      type: "header",
      pic: "",
      values: {},
    },
    {
      code: "12100",
      name: "Tunai di Bank",
      type: "item",
      pic: "Nurul Huda",
      values: {
        "AKAUN 20XX": {
          debit: "30000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "DRAF 20XX": {
          debit: "31000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        PELARASAN: {
          debit: "",
          kredit: "1000",
          debitBg: false,
          kreditBg: false,
        },
        "IMBANGAN DUGA": {
          debit: "30000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AKAUN PERNIAGAAN": {
          debit: "30000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK UI BUDI": {
          debit: "30000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK PEMBAHAGIAN": {
          debit: "30000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "KUNCI KIRA-KIRA": {
          debit: "30000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
      },
    },
    {
      code: "12200",
      name: "Penghutang",
      type: "item",
      pic: "Mohd Faizal",
      values: {
        "AKAUN 20XX": {
          debit: "20000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "DRAF 20XX": {
          debit: "21000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        PELARASAN: {
          debit: "",
          kredit: "1000",
          debitBg: false,
          kreditBg: false,
        },
        "IMBANGAN DUGA": {
          debit: "20000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AKAUN PERNIAGAAN": {
          debit: "20000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK UI BUDI": {
          debit: "20000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "AK PEMBAHAGIAN": {
          debit: "20000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
        "KUNCI KIRA-KIRA": {
          debit: "20000",
          kredit: "",
          debitBg: false,
          kreditBg: false,
        },
      },
    },
  ],
});

// Initialize empty values for each cell
ledgerData.value.rows.forEach((row) => {
  ledgerData.value.columns.forEach((column) => {
    if (column.subColumns) {
      row.values[column.name] = {
        debit: "",
        kredit: "",
        debitBg: false,
        kreditBg: false,
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
  const field = subColumn.toLowerCase() + "Bg";
  row.values[column.name][field] = !row.values[column.name][field];
};

// Add new row function
const addNewRow = () => {
  const newRow = {
    code: "",
    name: "",
    type: "item",
    pic: "",
    values: {},
  };

  // Initialize values for the new row
  ledgerData.value.columns.forEach((column) => {
    if (column.subColumns) {
      newRow.values[column.name] = {
        debit: "",
        kredit: "",
        debitBg: false,
        kreditBg: false,
      };
    }
  });

  ledgerData.value.rows.push(newRow);
};

// Add reactive data for risk assessment
const riskAssessment = ref({
  overallRisk: "MEDIUM",
  categories: [
    {
      name: "Financial Risk",
      level: "HIGH",
      status: "NEED ATTENTION",
      description: "High debt-to-equity ratio and declining liquidity metrics",
      recommendations: [
        "Review current debt structure",
        "Implement stricter cash flow management",
        "Consider debt consolidation options",
      ],
      isOpen: false,
    },
    {
      name: "Operational Risk",
      level: "LOW",
      status: "ACCEPTABLE",
      description: "Strong internal controls and documented procedures",
      recommendations: [
        "Continue monitoring operational metrics",
        "Regular staff training updates",
      ],
      isOpen: false,
    },
    {
      name: "Compliance Risk",
      level: "MEDIUM",
      status: "MONITORING",
      description: "Recent regulatory changes require attention",
      recommendations: [
        "Update compliance documentation",
        "Schedule regulatory review meeting",
      ],
      isOpen: false,
    },
  ],
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
const selectedCooperative = ref("");

// Add after the reactive declarations
const COOKIE_KEY = "ledger_generation_job";

// Create a cookie to store the job data with 24 hour expiry
const jobCookie = useCookie(COOKIE_KEY, {
  maxAge: 60 * 60 * 24, // 24 hours in seconds
  default: () => null,
});

// Add function to store job ID
const storeJobId = (groupId, jobId) => {
  jobCookie.value = {
    group_id: groupId,
    job_id: jobId,
    timestamp: new Date().getTime(),
  };
};

// Add function to retrieve stored job
const getStoredJob = () => {
  const stored = jobCookie.value;
  if (!stored) return null;

  const hoursSinceStored =
    (new Date().getTime() - stored.timestamp) / (1000 * 60 * 60);

  // Clear if older than 24 hours
  if (hoursSinceStored > 24) {
    clearStoredJob();
    return null;
  }

  return { group_id: stored.group_id, job_id: stored.job_id };
};

// Add function to clear stored job
const clearStoredJob = () => {
  jobCookie.value = null;
};

// Update the checkGenerationStatus function
const checkGenerationStatus = async () => {
  try {
    if (!generationJobId.value) return;

    const response = await $fetch(
      "/api/financial-statement/check-ledger-status",
      {
        method: "POST",
        body: {
          job_id: generationJobId.value,
        },
      }
    );

    generationStatus.value = response;

    if (response.status === "success") {
      // Clear interval and storage when generation is complete
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
        statusCheckInterval.value = null;
      }
      clearStoredJob();

      // Update ledger data with the generated result
      if (response.data?.result) {
        ledgerData.value = response.data.result.ledger;
        riskAssessment.value = response.data.result.riskAssessment;
        materialityData.value = response.data.result.materiality;
        auditSamplingData.value = response.data.result.auditSampling;
        showLedger.value = true;
      }
    } else if (response.status === "error") {
      // Clear interval and storage on error
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
        statusCheckInterval.value = null;
      }
      clearStoredJob();
      error.value = response.data.error;
    }
  } catch (err) {
    console.error("Error checking generation status:", err);
    error.value = "Ralat semasa menyemak status penjanaan";
  }
};

// Update the janaLejar function
const janaLejar = async () => {
  if (selectedGroup.value) {
    try {
      loading.value = true;
      error.value = null;
      generationStatus.value = null;
      showLedger.value = false;

      // Start ledger generation
      const response = await $fetch(
        "/api/financial-statement/generate-ledger",
        {
          method: "POST",
          body: {
            group_id: selectedGroup.value.id,
          },
        }
      );

      if (response.status === "success") {
        generationJobId.value = response.data.job_id;
        // Store the job ID
        storeJobId(selectedGroup.value.id, response.data.job_id);

        // Start polling for status
        if (statusCheckInterval.value) {
          clearInterval(statusCheckInterval.value);
        }
        statusCheckInterval.value = setInterval(checkGenerationStatus, 2000);
      } else {
        throw new Error(response.message || "Ralat semasa memulakan penjanaan");
      }
    } catch (err) {
      console.error("Error generating ledger:", err);
      error.value = err.message || "Ralat semasa memulakan penjanaan";
    } finally {
      loading.value = false;
    }
  }
};

// Add check for stored job on mount
onMounted(async () => {
  const storedJob = getStoredJob();
  if (storedJob && selectedGroup.value?.id === storedJob.group_id) {
    generationJobId.value = storedJob.job_id;
    // Start polling for status
    statusCheckInterval.value = setInterval(checkGenerationStatus, 2000);
  }
});

// Reset ledger view when organization type changes
watch(isParentOrganization, (newValue) => {
  selectedKoperasi.value = newValue ? PARENT_ORGANIZATION_ID : null;
  selectedAnakSyarikat.value = null;
  showLedger.value = false;
  selectedGroup.value = null;
  statementGroups.value = [];

  // Fetch subsidiaries when switching to Anak Syarikat
  if (!newValue) {
    fetchSubsidiaries();
  } else {
    // Fetch statement groups for parent organization
    fetchStatementGroups(PARENT_ORGANIZATION_ID);
  }
});

// Watch for changes in selected koperasi
watch(selectedKoperasi, async (newValue) => {
  if (newValue) {
    await fetchStatementGroups(newValue);
  } else {
    statementGroups.value = [];
  }
});

// Update the selectGroup function to handle existing ledger
const selectGroup = (group) => {
  selectedGroup.value = group;
  showLedger.value = false;
  if (group) {
    ledgerData.value.title = group.name;
    ledgerData.value.subtitle = group.description || "PENYATA KEWANGAN";
  }
};

// Set initial parent organization ID and fetch groups on mount
onMounted(async () => {
  if (isParentOrganization.value) {
    selectedKoperasi.value = PARENT_ORGANIZATION_ID;
    await fetchStatementGroups(PARENT_ORGANIZATION_ID);
  }
});

// Sample data for cooperatives and ledgers
const koperasiList = ref([
  {
    name: "Koperasi A",
    anakSyarikat: ["Anak Syarikat A1", "Anak Syarikat A2"],
  },
  { name: "Koperasi B", anakSyarikat: [] },
  { name: "Koperasi C", anakSyarikat: ["Anak Syarikat C1"] },
]);

// Function to handle cooperative selection
const selectCooperative = (event) => {
  selectedCooperative.value = event.target.value;
  showAnakSyarikat.value = selectedCooperative.value !== "";
};

// Function to handle ledger selection
const selectLedger = (event) => {
  selectedLedger.value = event.target.value;
};

// Add sample data for Materiality and Audit Sampling
const materialityData = ref({
  overallLevel: "MEDIUM",
  categories: [
    {
      name: "Financial Materiality",
      level: "HIGH",
      description:
        "Significant financial impact due to material misstatements.",
      recommendations: [
        "Review financial statements for accuracy.",
        "Ensure compliance with accounting standards.",
      ],
      isOpen: false,
    },
    {
      name: "Operational Materiality",
      level: "MEDIUM",
      description: "Moderate operational impact due to inefficiencies.",
      recommendations: [
        "Optimize operational processes.",
        "Conduct regular performance reviews.",
      ],
      isOpen: false,
    },
  ],
});

const auditSamplingData = ref({
  overallLevel: "MEDIUM",
  categories: [
    {
      name: "Random Sampling",
      level: "LOW",
      description: "Low risk of sampling errors due to random selection.",
      recommendations: [
        "Ensure randomness in sample selection.",
        "Review sampling methodology.",
      ],
      isOpen: false,
    },
    {
      name: "Stratified Sampling",
      level: "MEDIUM",
      description: "Moderate risk due to stratification of data.",
      recommendations: [
        "Validate stratification criteria.",
        "Review stratified sample results.",
      ],
      isOpen: false,
    },
  ],
});

// Fetch subsidiaries for selected parent
const fetchSubsidiaries = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await $fetch(
      `/api/organization/${PARENT_ORGANIZATION_ID}`,
      {
        method: "GET",
      }
    );
    if (response.status === "success" && response.data.children) {
      subsidiaries.value = response.data.children;
    } else {
      throw new Error(response.message || "Failed to fetch subsidiaries");
    }
  } catch (err) {
    error.value = err.message;
    console.error("Error fetching subsidiaries:", err);
  } finally {
    loading.value = false;
  }
};

// Fetch statement groups for the selected organization
const fetchStatementGroups = async (organizationId) => {
  try {
    loading.value = true;
    error.value = null;
    const response = await $fetch("/api/financial-statement/group/list", {
      method: "GET",
      params: {
        organization_id: organizationId,
      },
    });

    if (response.status === "success") {
      statementGroups.value = response.data.groups;
    } else {
      throw new Error(response.message || "Failed to fetch statement groups");
    }
  } catch (err) {
    error.value = err.message;
    console.error("Error fetching statement groups:", err);
  } finally {
    loading.value = false;
  }
};

// Update the useExistingLedger function
const useExistingLedger = () => {
  if (selectedGroup.value?.existing_ledger) {
    showLedger.value = true;

    // Update ledger data with existing result
    const result = selectedGroup.value.existing_ledger.result;
    console.log(result);
    ledgerData.value = result.ledger;
    riskAssessment.value = result.riskAssessment;
    materialityData.value = result.materiality;
    auditSamplingData.value = result.auditSampling;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Add dropdowns for selecting cooperative and ledger -->
    <div class="p-4 bg-white shadow mb-4">
      <div class="flex space-x-4">
        <!-- Organization type selection -->
        <div class="w-64">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Jenis Organisasi</label
          >
          <div class="flex space-x-4">
            <label
              v-for="option in organizationTypeOptions"
              :key="option.value"
              class="flex items-center space-x-2"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="isParentOrganization"
                class="form-radio text-blue-500 h-4 w-4"
              />
              <span class="text-sm text-gray-700">{{ option.label }}</span>
            </label>
          </div>
        </div>
        <div v-if="!isParentOrganization">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Pilih Anak Syarikat</label
          >
          <select
            v-model="selectedKoperasi"
            class="w-full p-2 border rounded"
            :disabled="loading"
          >
            <option disabled value="">Sila pilih anak syarikat</option>
            <option v-for="sub in subsidiaries" :key="sub.id" :value="sub.id">
              {{ sub.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Lejar</label
          >
          <select
            v-model="selectedGroup"
            @change="selectGroup(selectedGroup)"
            class="w-full p-2 border rounded min-w-[300px]"
            :disabled="loading || (!isParentOrganization && !selectedKoperasi)"
          >
            <option disabled value="">Pilih Lejar</option>
            <option
              v-for="group in statementGroups"
              :key="group.id"
              :value="group"
            >
              {{ group.name }}
            </option>
          </select>
        </div>
        <div>
          <button
            @click="janaLejar"
            class="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            :disabled="!selectedGroup || loading"
          >
            <span v-if="loading || generationStatus?.status === 'pending'">
              <svg
                class="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            <span>{{
              loading || generationStatus?.status === "pending"
                ? "Menjana Lejar..."
                : "Jana Lejar"
            }}</span>
          </button>
          <!-- Add View Existing Ledger Button -->
          <button
            v-if="selectedGroup?.existing_ledger"
            @click="useExistingLedger"
            class="mt-6 ml-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <Icon name="material-symbols:file-open" class="w-5 h-5" />
            <span>Lihat Lejar Sedia Ada</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Generation Status -->
    <div v-if="generationStatus" class="mt-4">
      <div
        v-if="generationStatus.status === 'pending'"
        class="bg-yellow-50 border border-yellow-200 rounded-md p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Sedang Menjana</h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>Sila tunggu sementara lejar sedang dijana...</p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="generationStatus.status === 'error'"
        class="bg-red-50 border border-red-200 rounded-md p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Ralat Penjanaan</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ generationStatus.data.error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="mt-4 bg-red-50 border border-red-200 rounded-md p-4"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Ralat</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLedger">
      <!-- Display ledger and review only if ledger is selected and jana lejar is clicked -->
      <div v-if="selectedGroup">
        <!-- Add toggle buttons in the main content -->
        <div class="fixed top-20 right-4 z-10 flex space-x-2">
          <button
            @click="toggleRiskPanel"
            class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span class="sr-only">Tukar Penilaian Risiko</span>
            <Icon name="material-symbols:planner-review" class="w-6 h-6" />
          </button>
          <button
            @click="toggleMaterialityPanel"
            class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span class="sr-only">Tukar Materialiti</span>
            <Icon name="material-symbols:balance" class="w-6 h-6" />
          </button>
          <button
            @click="toggleAuditSamplingPanel"
            class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span class="sr-only">Tukar Persampelan Audit</span>
            <Icon name="material-symbols:checklist" class="w-6 h-6" />
          </button>
        </div>

        <!-- Slide-out Risk Assessment Panel -->
        <div
          class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-[60]"
          :class="isRiskPanelOpen ? 'translate-x-0' : 'translate-x-full'"
        >
          <!-- Panel Header -->
          <div
            class="p-4 border-b flex justify-between items-center bg-gray-50"
          >
            <h2 class="text-lg font-semibold">Semakan Penilaian Risiko</h2>
            <button
              @click="toggleRiskPanel"
              class="p-2 hover:bg-gray-200 rounded-full"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- Overall Risk Level -->
            <div class="mb-6">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Tahap Risiko Keseluruhan:</span>
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-white font-medium text-sm',
                    riskAssessment.overallRisk === 'HIGH' ? 'bg-red-500' : '',
                    riskAssessment.overallRisk === 'MEDIUM'
                      ? 'bg-yellow-500'
                      : '',
                    riskAssessment.overallRisk === 'LOW' ? 'bg-green-500' : '',
                  ]"
                >
                  {{ riskAssessment.overallRisk }}
                </span>
              </div>
            </div>

            <!-- Risk Categories -->
            <div class="space-y-4">
              <div
                v-for="category in riskAssessment.categories"
                :key="category.name"
                class="border rounded-lg"
              >
                <div
                  @click="toggleCategory(category)"
                  class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                >
                  <div class="flex flex-col space-y-2">
                    <span class="font-medium">{{ category.name }}</span>
                    <div class="flex space-x-2">
                      <span
                        :class="[
                          'px-2 py-1 rounded-full text-white text-sm',
                          category.level === 'HIGH' ? 'bg-red-500' : '',
                          category.level === 'MEDIUM' ? 'bg-yellow-500' : '',
                          category.level === 'LOW' ? 'bg-green-500' : '',
                        ]"
                      >
                        {{ category.level }}
                      </span>
                      <span
                        :class="[
                          'px-2 py-1 rounded-full text-sm',
                          category.status === 'NEED ATTENTION'
                            ? 'bg-red-100 text-red-800'
                            : '',
                          category.status === 'MONITORING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : '',
                          category.status === 'ACCEPTABLE'
                            ? 'bg-green-100 text-green-800'
                            : '',
                        ]"
                      >
                        {{ category.status }}
                      </span>
                    </div>
                  </div>
                  <svg
                    class="w-5 h-5 transform transition-transform"
                    :class="{ 'rotate-180': category.isOpen }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                <div v-show="category.isOpen" class="p-3 border-t bg-gray-50">
                  <p class="text-gray-600 mb-2">{{ category.description }}</p>
                  <div class="mt-2">
                    <h4 class="font-medium mb-1">Cadangan:</h4>
                    <ul class="list-disc list-inside text-gray-600">
                      <li
                        v-for="rec in category.recommendations"
                        :key="rec"
                        class="ml-2"
                      >
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
        <div
          class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-[60]"
          :class="isMaterialityPanelOpen ? 'translate-x-0' : 'translate-x-full'"
        >
          <!-- Panel Header -->
          <div
            class="p-4 border-b flex justify-between items-center bg-gray-50"
          >
            <h2 class="text-lg font-semibold">Semakan Materialiti</h2>
            <button
              @click="toggleMaterialityPanel"
              class="p-2 hover:bg-gray-200 rounded-full"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- Materiality Level -->
            <div class="mb-6">
              <div class="flex items-center justify-between">
                <span class="text-gray-600"
                  >Tahap Materialiti Keseluruhan:</span
                >
                <span
                  class="px-3 py-1 rounded-full text-white font-medium text-sm bg-yellow-500"
                >
                  {{ materialityData.overallLevel }}
                </span>
              </div>
            </div>

            <!-- Materiality Categories -->
            <div class="space-y-4">
              <div
                v-for="category in materialityData.categories"
                :key="category.name"
                class="border rounded-lg"
              >
                <div
                  class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                >
                  <div class="flex flex-col space-y-2">
                    <span class="font-medium">{{ category.name }}</span>
                    <div class="flex space-x-2">
                      <span
                        class="px-2 py-1 rounded-full text-white text-sm bg-yellow-500"
                      >
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
                      <li
                        v-for="rec in category.recommendations"
                        :key="rec"
                        class="ml-2"
                      >
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
        <div
          class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-[60]"
          :class="
            isAuditSamplingPanelOpen ? 'translate-x-0' : 'translate-x-full'
          "
        >
          <!-- Panel Header -->
          <div
            class="p-4 border-b flex justify-between items-center bg-gray-50"
          >
            <h2 class="text-lg font-semibold">Semakan Persampelan Audit</h2>
            <button
              @click="toggleAuditSamplingPanel"
              class="p-2 hover:bg-gray-200 rounded-full"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- Audit Sampling Level -->
            <div class="mb-6">
              <div class="flex items-center justify-between">
                <span class="text-gray-600"
                  >Tahap Persampelan Audit Keseluruhan:</span
                >
                <span
                  class="px-3 py-1 rounded-full text-white font-medium text-sm bg-yellow-500"
                >
                  {{ auditSamplingData.overallLevel }}
                </span>
              </div>
            </div>

            <!-- Audit Sampling Categories -->
            <div class="space-y-4">
              <div
                v-for="category in auditSamplingData.categories"
                :key="category.name"
                class="border rounded-lg"
              >
                <div
                  class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                >
                  <div class="flex flex-col space-y-2">
                    <span class="font-medium">{{ category.name }}</span>
                    <div class="flex space-x-2">
                      <span
                        class="px-2 py-1 rounded-full text-white text-sm bg-yellow-500"
                      >
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
                      <li
                        v-for="rec in category.recommendations"
                        :key="rec"
                        class="ml-2"
                      >
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
        <div
          v-if="
            isRiskPanelOpen ||
            isMaterialityPanelOpen ||
            isAuditSamplingPanelOpen
          "
          @click="
            toggleRiskPanel();
            toggleMaterialityPanel();
            toggleAuditSamplingPanel();
          "
          class="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-in-out z-[50]"
        ></div>

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
                  <th
                    class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border"
                  >
                    JENIS AKAUN
                  </th>
                  <th
                    class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border w-[600px]"
                  >
                    BUTIRAN
                  </th>
                  <th
                    class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border w-[150px]"
                  >
                    PIC
                  </th>
                  <!-- Dynamic Columns -->
                  <template
                    v-for="column in ledgerData.columns"
                    :key="column.name"
                  >
                    <th
                      :colspan="column.subColumns ? 2 : 1"
                      class="px-3 py-2 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border"
                    >
                      {{ column.name }}
                    </th>
                  </template>
                </tr>
                <!-- Sub-headers for Debit/Kredit -->
                <tr>
                  <th class="border" colspan="3"></th>
                  <template
                    v-for="column in ledgerData.columns"
                    :key="`sub-${column.name}`"
                  >
                    <template v-if="column.subColumns">
                      <th
                        v-for="subCol in column.subColumns"
                        :key="subCol"
                        class="px-3 py-2 bg-gray-100 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border"
                      >
                        {{ subCol }}
                      </th>
                    </template>
                  </template>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="row in ledgerData.rows"
                  :key="row.code"
                  :class="{ 'bg-yellow-50': row.type === 'header' }"
                >
                  <td
                    class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border"
                  >
                    <input
                      type="text"
                      v-model="row.code"
                      class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                      placeholder="Kod"
                    />
                  </td>
                  <td
                    class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border w-[600px]"
                  >
                    <input
                      type="text"
                      v-model="row.name"
                      class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                      placeholder="Butiran"
                    />
                  </td>
                  <td
                    class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border w-[150px]"
                  >
                    <input
                      type="text"
                      v-model="row.pic"
                      class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                    />
                  </td>
                  <!-- Dynamic value cells -->
                  <template
                    v-for="column in ledgerData.columns"
                    :key="`values-${column.name}`"
                  >
                    <td
                      v-for="subCol in column.subColumns"
                      :key="`${column.name}-${subCol}`"
                      class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border number-column"
                      :class="{
                        'bg-yellow-50':
                          row.values[column.name][
                            subCol.toLowerCase().split(' ')[0] + 'Bg'
                          ],
                      }"
                      @dblclick="
                        toggleBackground(row, column, subCol.split(' ')[0])
                      "
                    >
                      <input
                        type="number"
                        step="0.01"
                        :value="
                          row.values[column.name][
                            subCol.toLowerCase().split(' ')[0]
                          ]
                        "
                        @input="
                          (e) =>
                            updateValue(
                              row,
                              column,
                              subCol.split(' ')[0],
                              e.target.value
                            )
                        "
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
              <button
                @click="addNewRow"
                class="w-full py-3 px-4 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
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
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
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
  scrollbar-color: #cbd5e0 #edf2f7;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #edf2f7;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 4px;
}
</style>