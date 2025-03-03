<script setup>
definePageMeta({
  layout: "admin",
});

// Move all reactive declarations to the top
const searchQuery = ref('');
const isParentOrganization = ref(true);
const selectedKoperasi = ref(null);
const selectedAnakSyarikat = ref(null);
const subsidiaries = ref([]);
const loading = ref(false);
const error = ref(null);
const showAnakSyarikat = ref(false);
const showLedger = ref(false);
const selectedGroup = ref(null);
const generationStatus = ref(null);
const statementGroups = ref([]);
const selectedGroupData = ref(null);

// Panel visibility state
const isRiskPanelOpen = ref(false);
const isMaterialityPanelOpen = ref(false);
const isAuditSamplingPanelOpen = ref(false);

// Add reactive variables for job tracking
const generationJobId = ref(null);
const statusCheckInterval = ref(null);

// Add new refs for viewing ledger
const viewingExistingLedger = ref(false);
const existingLedgerData = ref(null);

// Fetch organizations from API
const { data: organizationResponse } = await useFetch('/api/organization/list', {
  method: 'GET'
});

// Function to fetch statement groups
const fetchStatementGroups = async (organizationId) => {
  if (!organizationId) return;
  
  loading.value = true;
  error.value = null;

  try {
    const { data: response } = await useFetch(`/api/financial-statement/group/list`, {
      method: 'GET',
      params: {
        organization_id: organizationId
      }
    });

    if (response.value?.status === 'success') {
      statementGroups.value = response.value.data.groups;
    } else {
      throw new Error(response.value?.message || 'Failed to fetch statement groups');
    }
  } catch (err) {
    error.value = err.message;
    statementGroups.value = [];
  } finally {
    loading.value = false;
  }
};

// Transform organizations into dropdown options
const koperasiOptions = computed(() => {
  if (!organizationResponse.value?.status === 'success') return [];
  
  return organizationResponse.value.data.organizations.map(org => ({
    value: org.id,
    label: org.name,
    data: org // Store full organization data for later use
  }));
});

// Get selected koperasi data
const selectedKoperasiData = computed(() => {
  if (!selectedKoperasi.value) return null;
  return koperasiOptions.value.find(opt => opt.value === selectedKoperasi.value)?.data;
});

// Transform subsidiaries into dropdown options based on selected koperasi
const anakSyarikatOptions = computed(() => {
  if (!selectedKoperasiData.value) return [];
  
  return selectedKoperasiData.value.children.map(child => ({
    value: child.id,
    label: child.name,
    data: child
  }));
});

// Get available ledger types based on selected organization and group
const availableLedgers = computed(() => {
  if (!selectedKoperasiData.value || !selectedGroup.value) return [];
  
  const organization = selectedAnakSyarikat.value 
    ? anakSyarikatOptions.value.find(opt => opt.value === selectedAnakSyarikat.value)?.data
    : selectedKoperasiData.value;

  if (!organization) return [];

  // Get ledgers from selected group
  const group = statementGroups.value.find(g => g.id === selectedGroup.value);
  if (!group) return [];

  return group.items
    .filter(item => item.type === 'ledger')
    .map(item => ({
      value: item.statement?.id || '',
      label: item.statement?.fileName || 'Unnamed Ledger',
      data: item.statement
    }))
    .filter(item => item.value); // Only include items with valid IDs
});

// Reset selections when dependencies change
watch(selectedKoperasi, async (newValue) => {
  selectedAnakSyarikat.value = null;
  selectedGroup.value = null;
  showAnakSyarikat.value = newValue !== null;
  showLedger.value = false;
  
  if (newValue) {
    await fetchStatementGroups(newValue);
  } else {
    statementGroups.value = [];
  }
});

watch(selectedAnakSyarikat, async (newValue) => {
  selectedGroup.value = null;
  showLedger.value = false;
  
  if (newValue) {
    await fetchStatementGroups(newValue);
  } else if (selectedKoperasi.value) {
    await fetchStatementGroups(selectedKoperasi.value);
  }
});

watch(selectedGroup, (newValue) => {
  showLedger.value = false;
  if (newValue) {
    selectedGroupData.value = statementGroups.value.find(g => g.id === newValue);
  } else {
    selectedGroupData.value = null;
  }
});

// Function to store job ID in localStorage
const storeJobId = (groupId, jobId) => {
  localStorage.setItem('ledgerGenerationJob', JSON.stringify({
    groupId,
    jobId,
    timestamp: Date.now()
  }));
};

// Function to clear stored job
const clearStoredJob = () => {
  localStorage.removeItem('ledgerGenerationJob');
};

// Function to check generation status
const checkGenerationStatus = async () => {
  if (!generationJobId.value) return;

  try {
    const response = await $fetch('/api/financial-statement/check-ledger-status', {
      method: 'POST',
      body: {
        job_id: generationJobId.value
      }
    });

    if (response.status === 'success') {
      // Clear interval and storage
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
        statusCheckInterval.value = null;
      }
      clearStoredJob();

      // Update ledger data with the response
      ledgerData.value = response.data.result.ledger;
      riskAssessment.value = response.data.result.riskAssessment;
      materialityData.value = response.data.result.materiality;
      auditSamplingData.value = response.data.result.auditSampling;
      showLedger.value = true;
      generationStatus.value = 'success';
    } else if (response.status === 'error') {
      // Clear interval and storage on error
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
        statusCheckInterval.value = null;
      }
      clearStoredJob();
      error.value = response.data.error || 'Failed to check generation status';
      generationStatus.value = 'error';
    }
  } catch (err) {
    console.error('Error checking generation status:', err);
    error.value = 'Error while checking generation status';
    generationStatus.value = 'error';
  }
};

// Function to generate ledger
const generateLedger = async () => {
  if (!selectedKoperasi.value || !selectedGroup.value) return;

  loading.value = true;
  error.value = null;
  generationStatus.value = null;
  showLedger.value = false;
  viewingExistingLedger.value = false;

  try {
    const response = await $fetch('/api/financial-statement/generate-ledger', {
      method: 'POST',
      body: {
        group_id: selectedGroup.value
      }
    });

    if (response.status === 'success') {
      generationJobId.value = response.data.job_id;
      // Store the job ID
      storeJobId(selectedGroup.value, response.data.job_id);
      
      // Start checking status
      statusCheckInterval.value = setInterval(checkGenerationStatus, 5000);
    } else {
      throw new Error(response.message || 'Failed to generate ledger');
    }
  } catch (err) {
    error.value = err.message;
    generationStatus.value = 'error';
  } finally {
    loading.value = false;
  }
};

// Check for existing job on component mount
onMounted(() => {
  const storedJob = localStorage.getItem('ledgerGenerationJob');
  if (storedJob) {
    try {
      const { groupId, jobId, timestamp } = JSON.parse(storedJob);
      
      // Check if the job is not too old (e.g., 1 hour)
      if (Date.now() - timestamp < 3600000) {
        generationJobId.value = jobId;
        selectedGroup.value = groupId;
        statusCheckInterval.value = setInterval(checkGenerationStatus, 5000);
      } else {
        clearStoredJob();
      }
    } catch (err) {
      console.error('Error parsing stored job:', err);
      clearStoredJob();
    }
  }
});

// Clean up interval on component unmount
onUnmounted(() => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value);
    statusCheckInterval.value = null;
  }
});

// Add ledger data
const ledgerData = ref({
  title: computed(() => selectedKoperasiData.value?.name || 'KOPERASI XXXXXXXX BERHAD'),
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
      pic: 'Ahmad Zulkifli',
      values: {
        'AKAUN 20XX': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '52000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '2000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '50000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '50000', kredit: '', debitBg: false, kreditBg: false }
      }
    },
    {
      code: '11200',
      name: 'Nilai Buku Bersih - Bangunan',
      type: 'item',
      pic: 'Siti Aminah',
      values: {
        'AKAUN 20XX': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '155000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '5000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '150000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '150000', kredit: '', debitBg: false, kreditBg: false }
      }
    },
    {
      code: '12000',
      name: 'Aset Semasa',
      type: 'header',
      pic: '',
      values: {}
    },
    {
      code: '12100',
      name: 'Tunai di Bank',
      type: 'item',
      pic: 'Nurul Huda',
      values: {
        'AKAUN 20XX': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '31000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '1000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '30000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '30000', kredit: '', debitBg: false, kreditBg: false }
      }
    },
    {
      code: '12200',
      name: 'Penghutang',
      type: 'item',
      pic: 'Mohd Faizal',
      values: {
        'AKAUN 20XX': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'DRAF 20XX': { debit: '21000', kredit: '', debitBg: false, kreditBg: false },
        'PELARASAN': { debit: '', kredit: '1000', debitBg: false, kreditBg: false },
        'IMBANGAN DUGA': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'AKAUN PERNIAGAAN': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'AK UI BUDI': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'AK PEMBAHAGIAN': { debit: '20000', kredit: '', debitBg: false, kreditBg: false },
        'KUNCI KIRA-KIRA': { debit: '20000', kredit: '', debitBg: false, kreditBg: false }
      }
    }
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

// Handlers and Functions
const handleCooperativeSelect = (event) => {
  selectedKoperasi.value = event.target.value;
  showAnakSyarikat.value = selectedKoperasi.value !== '';
};

const handleLedgerSelect = (event) => {
  selectedGroup.value = event.target.value;
};

const updateValue = (row, column, subColumn, value) => {
  if (column.subColumns) {
    const field = subColumn.toLowerCase();
    row.values[column.name][field] = value;
  }
};

const toggleBackground = (row, column, subColumn) => {
  const field = subColumn.toLowerCase() + 'Bg';
  row.values[column.name][field] = !row.values[column.name][field];
};

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

const toggleRiskPanel = () => {
  isRiskPanelOpen.value = !isRiskPanelOpen.value;
};

const toggleMaterialityPanel = () => {
  isMaterialityPanelOpen.value = !isMaterialityPanelOpen.value;
};

const toggleAuditSamplingPanel = () => {
  isAuditSamplingPanelOpen.value = !isAuditSamplingPanelOpen.value;
};

const toggleCategory = (category) => {
  category.isOpen = !category.isOpen;
};

// Risk Assessment Data
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
    }
  ]
});

// Materiality Data
const materialityData = ref({
  overallLevel: 'MEDIUM',
  benchmark: {
    selected: '',
    value: '',
    options: [
      { value: 'sales', label: 'Jualan' },
      { value: 'assets', label: 'Jumlah Aset' },
      { value: 'expenses', label: 'Perbelanjaan' }
    ]
  },
  percentages: {
    materiality: '',
    performanceMateriality: '',
    clearlyTrivial: ''
  },
  calculations: {
    materiality: 0,
    performanceMateriality: 0,
    clearlyTrivial: 0
  }
});

// Audit Sampling Data
const auditSamplingData = ref({
  overallLevel: 'MEDIUM',
  population: {
    dateRange: {
      start: '',
      end: ''
    },
    valueRange: {
      min: '',
      max: ''
    },
    transactionType: '',
    transactionTypes: [
      { value: 'purchases', label: 'Transaksi Pembelian' },
      { value: 'sales', label: 'Transaksi Jualan' },
      { value: 'payments', label: 'Transaksi Pembayaran' },
      { value: 'receipts', label: 'Transaksi Penerimaan' },
      { value: 'loans', label: 'Transaksi Pinjaman' },
      { value: 'investments', label: 'Transaksi Pelaburan' },
      { value: 'operating_expenses', label: 'Transaksi Perbelanjaan Operasi' },
      { value: 'fixed_assets', label: 'Transaksi Aset Tetap' },
      { value: 'inventory', label: 'Transaksi Inventori' },
      { value: 'other_financial', label: 'Transaksi Kewangan Lain-lain' },
      { value: 'equity', label: 'Transaksi Modal' },
      { value: 'accruals', label: 'Transaksi Perakaunan Akruan' },
      { value: 'adjustments', label: 'Transaksi Pelarasan' },
      { value: 'international', label: 'Transaksi Antarabangsa' },
      { value: 'donations', label: 'Transaksi Amal atau Sumbangan' }
    ]
  },
  method: {
    selected: '',
    options: [
      { 
        value: 'random', 
        label: 'Random Sampling',
        description: 'Pemilihan item secara rawak dari keseluruhan populasi tanpa sebarang bias atau pola tertentu.'
      },
      { 
        value: 'systematic', 
        label: 'Systematic Sampling',
        description: 'Pemilihan item pada selang tetap (contohnya setiap transaksi ke-10 dalam senarai).'
      },
      { 
        value: 'stratified', 
        label: 'Stratified Sampling',
        description: 'Populasi dibahagikan kepada subkumpulan (strata) berdasarkan ciri-ciri tertentu.'
      }
    ]
  },
  sampleSize: {
    method: 'manual',
    manualSize: '',
    automatic: {
      auditRisk: '',
      materiality: '',
      confidenceLevel: ''
    },
    calculatedSize: 0
  },
  selectedSamples: []
});

// Add calculation function
const calculateMateriality = () => {
  const benchmarkValue = parseFloat(materialityData.value.benchmark.value) || 0;
  const materialityPercent = parseFloat(materialityData.value.percentages.materiality) || 0;
  const pmlPercent = parseFloat(materialityData.value.percentages.performanceMateriality) || 0;
  const cttPercent = parseFloat(materialityData.value.percentages.clearlyTrivial) || 0;

  // Calculate Materiality
  const materiality = benchmarkValue * (materialityPercent / 100);
  materialityData.value.calculations.materiality = materiality;

  // Calculate Performance Materiality
  const pml = materiality * (pmlPercent / 100);
  materialityData.value.calculations.performanceMateriality = pml;

  // Calculate Clearly Trivial Threshold
  const ctt = pml * (cttPercent / 100);
  materialityData.value.calculations.clearlyTrivial = ctt;
};

// Update the calculateSampleSize function
const calculateSampleSize = () => {
  if (auditSamplingData.value.sampleSize.method === 'manual') {
    // For manual input, directly use the input value
    auditSamplingData.value.sampleSize.calculatedSize = 
      parseInt(auditSamplingData.value.sampleSize.manualSize) || 0;
  } else {
    // For automatic calculation
    const risk = parseFloat(auditSamplingData.value.sampleSize.automatic.auditRisk) || 0;
    const materiality = parseFloat(auditSamplingData.value.sampleSize.automatic.materiality) || 0;
    const confidence = parseFloat(auditSamplingData.value.sampleSize.automatic.confidenceLevel) || 0;
    
    // Example calculation (replace with actual formula)
    auditSamplingData.value.sampleSize.calculatedSize = 
      Math.ceil((confidence / (risk * materiality)) * 100);
  }
};

// Add helper function to generate random date between two dates
const getRandomDate = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDiff = endDate.getTime() - startDate.getTime();
  const randomTime = Math.random() * timeDiff;
  const randomDate = new Date(startDate.getTime() + randomTime);
  
  // Format date as YYYY-MM-DD
  return randomDate.toISOString().split('T')[0];
};

// Update the selectSamples function
const selectSamples = () => {
  const sampleSize = auditSamplingData.value.sampleSize.calculatedSize;
  const startDate = auditSamplingData.value.population.dateRange.start;
  const endDate = auditSamplingData.value.population.dateRange.end;

  if (sampleSize <= 0) {
    alert('Sila kira saiz sampel terlebih dahulu');
    return;
  }

  if (!startDate || !endDate) {
    alert('Sila pilih tempoh masa terlebih dahulu');
    return;
  }

  // Generate samples with dates within the selected range
  const samples = Array(sampleSize).fill(null).map((_, index) => {
    const randomDate = getRandomDate(startDate, endDate);
    return {
      id: 101 + index,
      date: randomDate,
      type: Math.random() > 0.5 ? 'Debit' : 'Kredit',
      accountCode: 1234 + index,
      amount: (Math.random() * 5000).toFixed(2),
      description: 'Pembayaran Utiliti'
    };
  });

  // Sort samples by date
  samples.sort((a, b) => new Date(a.date) - new Date(b.date));

  auditSamplingData.value.selectedSamples = samples;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Add dropdowns for selecting cooperative and ledger -->
    <div class="p-4 bg-white shadow mb-4">
      <div class="flex space-x-4">
        <div>
          <label for="cooperative" class="block text-sm font-medium text-gray-700">Koperasi</label>
          <select 
            id="cooperative" 
            v-model="selectedKoperasi" 
            @change="handleCooperativeSelect" 
            class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Pilih Koperasi</option>
            <option v-for="koperasi in koperasiOptions" :key="koperasi.value" :value="koperasi.value">
              {{ koperasi.label }}
            </option>
          </select>
        </div>
        <div v-if="showAnakSyarikat">
          <label for="anak-syarikat" class="block text-sm font-medium text-gray-700">Anak Syarikat</label>
          <select 
            id="anak-syarikat" 
            v-model="selectedAnakSyarikat"
            class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Pilih Anak Syarikat</option>
            <option v-for="anakSyarikat in anakSyarikatOptions" :key="anakSyarikat.value" :value="anakSyarikat.value">
              {{ anakSyarikat.label }}
            </option>
          </select>
        </div>
        <div>
          <label for="statement-group" class="block text-sm font-medium text-gray-700">Lejar</label>
          <select 
            id="statement-group" 
            v-model="selectedGroup"
            :disabled="!selectedKoperasi"
            class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Pilih Lejar</option>
            <option v-for="group in statementGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>
        <div>
          <button 
            @click="generateLedger" 
            :disabled="!selectedKoperasi || !selectedGroup || loading"
            class="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span v-if="loading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            <span>{{ loading ? 'Menjana...' : 'Jana Lejar' }}</span>
          </button>
          <!-- Add View Existing Ledger button -->
          <button 
            v-if="selectedGroupData?.existing_ledger"
            @click="viewExistingLedger"
            :disabled="loading"
            class="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span v-if="loading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            <span>{{ loading ? 'Memuat...' : 'Lihat Lejar Sedia Ada' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mt-4">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
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
    </div>

    <!-- Success Alert -->
    <div v-if="generationStatus === 'success'" class="mt-4">
      <div class="bg-green-50 border border-green-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">{{ viewingExistingLedger ? 'Lejar Sedia Ada Dimuat' : 'Lejar Berjaya Dijana' }}</h3>
            <div class="mt-2 text-sm text-green-700">
              <p>{{ viewingExistingLedger ? 'Lejar sedia ada telah berjaya dimuat.' : 'Lejar baru telah berjaya dijana.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLedger">
      <!-- Display ledger and review only if both cooperative and ledger are selected -->
      <div v-if="selectedKoperasi && selectedGroup">
        <!-- Add toggle buttons in the main content -->
        <div class="fixed top-20 right-4 z-10 flex space-x-2">
          <button @click="toggleRiskPanel" class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200">
            <span class="sr-only">Tukar Penilaian Risiko</span>
            <Icon name="material-symbols:planner-review" class="w-6 h-6" />
          </button>
          <button @click="toggleMaterialityPanel" class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200">
            <span class="sr-only">Tukar Materialiti</span>
            <Icon name="material-symbols:balance" class="w-6 h-6" />
          </button>
          <button @click="toggleAuditSamplingPanel" class="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200">
            <span class="sr-only">Tukar Persampelan Audit</span>
            <Icon name="material-symbols:checklist" class="w-6 h-6" />
          </button>
        </div>

        <!-- Slide-out Risk Assessment Panel -->
        <div class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
            :class="isRiskPanelOpen ? 'translate-x-0' : 'translate-x-full'">
          <!-- Panel Header -->
          <div class="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-semibold">Semakan Penilaian Risiko</h2>
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
                <span class="text-gray-600">Tahap Risiko Keseluruhan:</span>
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
                    <h4 class="font-medium mb-1">Cadangan:</h4>
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

        <!-- Slide-out Materiality Panel -->
        <div class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
            :class="isMaterialityPanelOpen ? 'translate-x-0' : 'translate-x-full'">
          <!-- Panel Header -->
          <div class="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-semibold">Semakan Materialiti</h2>
            <button @click="toggleMaterialityPanel" class="p-2 hover:bg-gray-200 rounded-full">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- Update Benchmark Selection to Dropdown -->
            <div class="mb-6">
              <h3 class="text-lg font-medium mb-4">Pemilihan Benchmark (Asas Pengiraan)</h3>
              <select v-model="materialityData.benchmark.selected" class="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="" disabled>Pilih Benchmark</option>
                <option v-for="option in materialityData.benchmark.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <!-- Benchmark Value -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nilai Benchmark (RM)
              </label>
              <input type="number"
                     v-model="materialityData.benchmark.value"
                     class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                     placeholder="Contoh: 1000000">
            </div>

            <!-- Materiality Percentage -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Peratusan Materiality (%)
              </label>
              <input type="number"
                     v-model="materialityData.percentages.materiality"
                     class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                     placeholder="Contoh: 1.5"
                     step="0.1">
            </div>

            <!-- Performance Materiality Percentage -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Peratusan Performance Materiality (50%-75%)
              </label>
              <input type="number"
                     v-model="materialityData.percentages.performanceMateriality"
                     class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                     placeholder="Contoh: 75"
                     min="50"
                     max="75">
            </div>

            <!-- Clearly Trivial Threshold Percentage -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Peratusan Clearly Trivial Threshold (5%-10%)
              </label>
              <input type="number"
                     v-model="materialityData.percentages.clearlyTrivial"
                     class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                     placeholder="Contoh: 10"
                     min="5">
            </div>

            <!-- Calculate Button -->
            <button @click="calculateMateriality"
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-6">
              Kira Materiality
            </button>

            <!-- Results -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-lg font-medium mb-4">Keputusan Pengiraan</h3>
              <div class="space-y-3">
                <div>
                  <span class="text-gray-600">Materiality:</span>
                  <span class="font-medium ml-2">
                    RM{{ materialityData.calculations.materiality.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-600">Performance Materiality:</span>
                  <span class="font-medium ml-2">
                    RM{{ materialityData.calculations.performanceMateriality.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-600">Clearly Trivial Threshold:</span>
                  <span class="font-medium ml-2">
                    RM{{ materialityData.calculations.clearlyTrivial.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slide-out Audit Sampling Panel -->
        <div class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
            :class="isAuditSamplingPanelOpen ? 'translate-x-0' : 'translate-x-full'">
          <!-- Panel Header -->
          <div class="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-semibold">Semakan Persampelan Audit</h2>
            <button @click="toggleAuditSamplingPanel" class="p-2 hover:bg-gray-200 rounded-full">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-4 overflow-y-auto h-full pb-20">
            <!-- 1. Takrifkan Populasi -->
            <div class="mb-8">
              <h3 class="text-lg font-medium mb-4">1. Takrifkan Populasi</h3>
              
              <!-- Date Range -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Tempoh Masa</label>
                <div class="flex space-x-4">
                  <input type="date" 
                         v-model="auditSamplingData.population.dateRange.start"
                         class="border rounded-md px-3 py-2 w-1/2">
                  <input type="date" 
                         v-model="auditSamplingData.population.dateRange.end"
                         class="border rounded-md px-3 py-2 w-1/2">
                </div>
              </div>

              <!-- Value Range -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Julat Nilai (RM)</label>
                <div class="flex space-x-4">
                  <input type="number" 
                         v-model="auditSamplingData.population.valueRange.min"
                         placeholder="Nilai Minimum"
                         class="border rounded-md px-3 py-2 w-1/2">
                  <input type="number" 
                         v-model="auditSamplingData.population.valueRange.max"
                         placeholder="Nilai Maksimum"
                         class="border rounded-md px-3 py-2 w-1/2">
                </div>
              </div>

              <!-- Transaction Type -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Jenis Transaksi</label>
                <select v-model="auditSamplingData.population.transactionType"
                        class="w-full border rounded-md px-3 py-2">
                  <option value="">Pilih Jenis Transaksi</option>
                  <option v-for="type in auditSamplingData.population.transactionTypes"
                          :key="type.value"
                          :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 2. Tentukan Kaedah Sampling -->
            <div class="mb-8">
              <h3 class="text-lg font-medium mb-4">2. Tentukan Kaedah Sampling</h3>
              <div class="space-y-4">
                <div v-for="method in auditSamplingData.method.options"
                     :key="method.value"
                     class="border rounded-lg p-4"
                     :class="{'border-blue-500 bg-blue-50': auditSamplingData.method.selected === method.value}">
                  <div class="flex items-center">
                    <input type="radio"
                           :id="method.value"
                           :value="method.value"
                           v-model="auditSamplingData.method.selected"
                           class="h-4 w-4 text-blue-600">
                    <label :for="method.value" class="ml-2 font-medium">{{ method.label }}</label>
                  </div>
                  <p class="mt-2 text-sm text-gray-600">{{ method.description }}</p>
                </div>
              </div>
            </div>

            <!-- 3. Tentukan Saiz Sampel -->
            <div class="mb-8">
              <h3 class="text-lg font-medium mb-4">3. Tentukan Saiz Sampel</h3>
              
              <!-- Method Selection -->
              <div class="mb-4">
                <select v-model="auditSamplingData.sampleSize.method"
                        class="w-full border rounded-md px-3 py-2">
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatik</option>
                </select>
              </div>

              <!-- Manual Input -->
              <div v-if="auditSamplingData.sampleSize.method === 'manual'" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Saiz Sampel</label>
                <input type="number"
                       v-model="auditSamplingData.sampleSize.manualSize"
                       class="w-full border rounded-md px-3 py-2"
                       placeholder="Masukkan saiz sampel">
              </div>

              <!-- Automatic Calculation -->
              <div v-else class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Risiko Audit (%)</label>
                  <input type="number"
                         v-model="auditSamplingData.sampleSize.automatic.auditRisk"
                         class="w-full border rounded-md px-3 py-2"
                         placeholder="Contoh: 5">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Materialiti (%)</label>
                  <input type="number"
                         v-model="auditSamplingData.sampleSize.automatic.materiality"
                         class="w-full border rounded-md px-3 py-2"
                         placeholder="Contoh: 10">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tahap Keyakinan (%)</label>
                  <input type="number"
                         v-model="auditSamplingData.sampleSize.automatic.confidenceLevel"
                         class="w-full border rounded-md px-3 py-2"
                         placeholder="Contoh: 95">
                </div>
              </div>

              <!-- Calculate Button -->
              <button @click="calculateSampleSize"
                      class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4">
                Kira Saiz Sampel
              </button>

              <!-- Display Calculated Size -->
              <div v-if="auditSamplingData.sampleSize.calculatedSize > 0"
                   class="mt-4 p-4 bg-gray-50 rounded-lg">
                <div class="text-lg font-medium">Output Saiz Sampel:</div>
                <div class="mt-2">
                  <span class="text-gray-700">Saiz Sampel:</span>
                  <span class="ml-2 font-medium">{{ auditSamplingData.sampleSize.calculatedSize }} transaksi</span>
                </div>
              </div>
            </div>

            <!-- 4. Pilih Sampel -->
            <div class="mb-8">
              <button @click="selectSamples"
                      class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                Jana Sampel
              </button>

              <!-- Display Selected Samples -->
              <div v-if="auditSamplingData.selectedSamples.length > 0" class="mt-4">
                <!-- Summary Header -->
                <div class="mb-4 bg-white p-4 rounded-lg shadow">
                  <h4 class="font-medium text-lg mb-2">Tajuk: Paparan Data Sampel</h4>
                  <div class="text-sm text-gray-600">
                    <div>KAEDAH SAMPLING: {{ auditSamplingData.method.selected === 'random' ? 'Random Sampling' : 
                                            auditSamplingData.method.selected === 'systematic' ? 'Systematic Sampling' : 
                                            'Stratified Sampling' }}</div>
                    <div>SAIZ SAMPEL: {{ auditSamplingData.selectedSamples.length }} transaksi</div>
                  </div>
                </div>

                <!-- Table with scroll containers -->
                <div class="bg-white rounded-lg shadow">
                  <div class="max-h-[400px] overflow-y-auto"> <!-- Vertical scroll -->
                    <div class="overflow-x-auto"> <!-- Horizontal scroll -->
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0 z-10"> <!-- Sticky header -->
                          <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">No. Transaksi</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Tarikh Transaksi</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Jenis Transaksi</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Kod Akaun</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Amaun (RM)</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          <tr v-for="sample in auditSamplingData.selectedSamples" :key="sample.id">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ sample.id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ sample.date }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ sample.type }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ sample.accountCode }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {{ sample.amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ sample.description }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Download Button -->
                <button 
                  class="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  <Icon name="material-symbols:download" class="w-5 h-5" />
                  Muat Turun Data Sampel Sebagai CSV/PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Backdrop -->
        <div v-if="isRiskPanelOpen || isMaterialityPanelOpen || isAuditSamplingPanel" 
            @click="toggleRiskPanel(); toggleMaterialityPanel(); toggleAuditSamplingPanel()"
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
                      placeholder="Kod"
                    />
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border w-[600px]">
                    <input
                      type="text"
                      v-model="row.name"
                      class="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-1"
                      placeholder="Butiran"
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
