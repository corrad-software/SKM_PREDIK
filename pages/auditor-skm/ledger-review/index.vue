<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

definePageMeta({
  layout: "admin",
});

// Constants for transaction types and sampling methods
const transactionTypes = [
  { value: 'purchases', label: 'Transaksi Pembelian', description: 'Pembelian barang atau perkhidmatan dari pembekal' },
  { value: 'sales', label: 'Transaksi Jualan', description: 'Jualan produk atau perkhidmatan kepada pelanggan' },
  { value: 'payments', label: 'Transaksi Pembayaran', description: 'Pembayaran kepada pembekal atau pekerja' },
  { value: 'receipts', label: 'Transaksi Penerimaan', description: 'Penerimaan bayaran dari pelanggan' },
  { value: 'loans', label: 'Transaksi Pinjaman', description: 'Pinjaman yang diterima dari institusi kewangan' },
  { value: 'investments', label: 'Transaksi Pelaburan', description: 'Pembelian atau penjualan instrumen kewangan' },
  { value: 'expenses', label: 'Perbelanjaan Operasi', description: 'Perbelanjaan pejabat, pengiklanan, atau perjalanan' },
  { value: 'fixed_assets', label: 'Transaksi Aset Tetap', description: 'Pembelian, penyusutan, atau penjualan aset tetap' },
  { value: 'inventory', label: 'Transaksi Inventori', description: 'Pembelian stok atau bahan mentah' },
  { value: 'other', label: 'Transaksi Kewangan Lain-lain', description: 'Pindahan wang, bayaran cukai, atau yuran lesen' },
  { value: 'equity', label: 'Transaksi Modal', description: 'Pengeluaran dividen atau pelaburan modal' },
  { value: 'accruals', label: 'Transaksi Perakaunan Akruan', description: 'Perakaunan untuk perbelanjaan atau pendapatan akruan' },
  { value: 'adjustments', label: 'Transaksi Pelarasan', description: 'Pelarasan untuk pembetulan kesilapan' },
  { value: 'international', label: 'Transaksi Antarabangsa', description: 'Pembelian atau jualan dalam mata wang asing' },
  { value: 'donations', label: 'Transaksi Amal atau Sumbangan', description: 'Sumbangan yang diterima atau diberikan' }
];

const samplingMethods = [
  { 
    value: 'random', 
    label: 'Random Sampling',
    description: 'Pemilihan item secara rawak dari keseluruhan populasi'
  },
  { 
    value: 'systematic', 
    label: 'Systematic Sampling',
    description: 'Pemilihan item pada selang tetap'
  },
  { 
    value: 'stratified', 
    label: 'Stratified Sampling',
    description: 'Populasi dibahagikan kepada subkumpulan berdasarkan ciri-ciri tertentu'
  }
];

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
const generationMessage = ref('');
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

// Add to reactive declarations at the top
const materialityData = ref({
  benchmark: '',
  benchmarkValue: '',
  materialityPercentage: '',
  pmlPercentage: '',
  cttPercentage: '',
});

// Add new refs for materiality calculation
const showMaterialityResults = ref(false);

// Create a default audit sampling data structure
const defaultAuditSamplingData = {
  population: {
    dateRange: {
      start: '',
      end: ''
    },
    valueRange: {
      min: null,
      max: null
    },
    transactionType: ''
  },
  samplingMethod: '',
  sampleSizeMethod: 'manual',
  manualSampleSize: null,
  automaticSampleSize: {
    auditRisk: 5,
    materiality: 10,
    confidenceLevel: 95
  },
  calculatedSampleSize: null,
  selectedSamples: [],
  findings: [],
  auditNotes: '',
  materialityAssessment: ''
};

// Initialize with the default structure
const auditSamplingData = ref({ ...defaultAuditSamplingData });

// Add a reset function that creates a fresh copy of the default data
const resetAuditSamplingData = () => {
  auditSamplingData.value = JSON.parse(JSON.stringify(defaultAuditSamplingData));
};

// Add error handling to the computed property with multiple safety checks
const selectedTransactionType = computed(() => {
  try {
    if (!auditSamplingData.value) return null;
    if (!auditSamplingData.value.population) return null;
    if (!auditSamplingData.value.population.transactionType) return null;
    
    return transactionTypes.find(type => 
      type.value === auditSamplingData.value.population.transactionType
    ) || null;
  } catch (err) {
    console.error('Error in selectedTransactionType computed property:', err);
    return null;
  }
});

// Add safe calculation function with extensive error handling
const calculateSampleSize = () => {
  try {
    if (!auditSamplingData.value) {
      console.warn('auditSamplingData is not initialized');
      resetAuditSamplingData();
      return;
    }

    if (!auditSamplingData.value.sampleSizeMethod) {
      console.warn('sampleSizeMethod is not set');
      auditSamplingData.value.sampleSizeMethod = 'manual';
    }

    if (auditSamplingData.value.sampleSizeMethod === 'manual') {
      auditSamplingData.value.calculatedSampleSize = auditSamplingData.value.manualSampleSize || 0;
    } else {
      // Ensure automaticSampleSize exists
      if (!auditSamplingData.value.automaticSampleSize) {
        auditSamplingData.value.automaticSampleSize = {
          auditRisk: 5,
          materiality: 10,
          confidenceLevel: 95
        };
      }

      const { auditRisk, materiality, confidenceLevel } = auditSamplingData.value.automaticSampleSize;
      
      // Validate inputs
      if (!auditRisk || !materiality || !confidenceLevel) {
        console.warn('Missing automatic sample size parameters');
        return;
      }

      // Calculate with safety checks
      try {
        auditSamplingData.value.calculatedSampleSize = Math.ceil(
          (confidenceLevel / 100) * (100 / materiality) * Math.log(1 / (auditRisk / 100))
        );
      } catch (err) {
        console.error('Error calculating sample size:', err);
        auditSamplingData.value.calculatedSampleSize = 0;
      }
    }
  } catch (err) {
    console.error('Error in calculateSampleSize:', err);
    // Recover from error
    resetAuditSamplingData();
  }
};

// Add safe generate samples function with error handling
const generateSamples = () => {
  try {
    if (!auditSamplingData.value?.calculatedSampleSize) {
      console.warn('Sample size must be calculated first');
      return;
    }

    // Ensure selectedSamples array exists
    if (!auditSamplingData.value.selectedSamples) {
      auditSamplingData.value.selectedSamples = [];
    }

    // Generate realistic sample data
    const currentYear = new Date().getFullYear();
    const sampleSize = auditSamplingData.value.calculatedSampleSize;
    
    auditSamplingData.value.selectedSamples = Array.from(
      { length: sampleSize },
      (_, i) => ({
        id: `${100 + i}`,
        date: `${currentYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        type: ['Kredit', 'Debit', 'Tunai', 'Pindahan'][Math.floor(Math.random() * 4)],
        description: `Transaksi ${i + 1}`,
        amount: Math.floor(Math.random() * 1000000) / 100,
        reviewed: false,
        hasIssue: false,
        notes: ''
      })
    );
    
    // Sort by date
    auditSamplingData.value.selectedSamples.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('Error in generateSamples:', err);
    // Recover from error
    auditSamplingData.value.selectedSamples = [];
  }
};

// Add safe submit finding function with error handling
const submitFinding = (finding) => {
  try {
    if (!auditSamplingData.value) {
      console.warn('auditSamplingData is not initialized');
      resetAuditSamplingData();
      return;
    }

    // Ensure findings array exists
    if (!auditSamplingData.value.findings) {
      auditSamplingData.value.findings = [];
    }

    auditSamplingData.value.findings.push({
      ...finding,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in submitFinding:', err);
    // Recover from error
    if (!auditSamplingData.value.findings) {
      auditSamplingData.value.findings = [];
    }
  }
};

// Add error handling for panel toggle with data validation
const toggleAuditSamplingPanel = () => {
  try {
    isAuditSamplingPanelOpen.value = !isAuditSamplingPanelOpen.value;
    
    if (isAuditSamplingPanelOpen.value) {
      // Validate data structure when panel is opened
      if (!auditSamplingData.value || 
          !auditSamplingData.value.population || 
          !auditSamplingData.value.population.dateRange) {
        console.log('Resetting audit sampling data due to invalid structure');
        resetAuditSamplingData();
      }
    }
  } catch (err) {
    console.error('Error in toggleAuditSamplingPanel:', err);
    // Recover from error
    isAuditSamplingPanelOpen.value = false;
    resetAuditSamplingData();
  }
};

// Watch for changes to ensure data integrity
watch(isAuditSamplingPanelOpen, (newValue) => {
  if (newValue) {
    // Validate data structure when panel is opened
    if (!auditSamplingData.value || 
        !auditSamplingData.value.population || 
        !auditSamplingData.value.population.dateRange) {
      console.log('Resetting audit sampling data due to invalid structure (from watcher)');
      resetAuditSamplingData();
    }
  }
});

// Initialize data when component is mounted
onMounted(() => {
  try {
    console.log('Initializing audit sampling data on mount');
    resetAuditSamplingData();
  } catch (err) {
    console.error('Error initializing audit sampling data:', err);
    // Ensure we have a valid data structure even if initialization fails
    auditSamplingData.value = JSON.parse(JSON.stringify(defaultAuditSamplingData));
  }
});

// Clean up when component is unmounted
onUnmounted(() => {
  try {
    console.log('Cleaning up audit sampling data on unmount');
    resetAuditSamplingData();
  } catch (err) {
    console.error('Error cleaning up audit sampling data:', err);
  }
});

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

    // Update status and message
    generationStatus.value = response.status;
    generationMessage.value = response.data?.message || '';

    if (response.status === 'success' && response.data?.result) {
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
    } else if (response.status === 'error') {
      // Clear interval and storage on error
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
        statusCheckInterval.value = null;
      }
      clearStoredJob();
      error.value = response.data?.error || 'Failed to check generation status';
    } else if (response.status === 'pending') {
      // Still processing, update message
      generationMessage.value = 'Sedang menjana lejar...';
    }
  } catch (err) {
    console.error('Error checking generation status:', err);
    error.value = 'Error while checking generation status';
    generationStatus.value = 'error';
    
    // Clear interval on error
    if (statusCheckInterval.value) {
      clearInterval(statusCheckInterval.value);
      statusCheckInterval.value = null;
    }
  }
};

// Function to generate ledger
const generateLedger = async () => {
  if (!selectedKoperasi.value || !selectedGroup.value) return;

  loading.value = true;
  error.value = null;
  generationStatus.value = 'pending';
  generationMessage.value = 'Memulakan penjanaan lejar...';
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
      
      // Update message
      generationMessage.value = 'Sedang menjana lejar...';
    } else {
      throw new Error(response.message || 'Failed to generate ledger');
    }
  } catch (err) {
    error.value = err.message;
    generationStatus.value = 'error';
    generationMessage.value = '';
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

// Add computed properties for calculations
const calculateMateriality = computed(() => {
  if (!materialityData.value.benchmarkValue || !materialityData.value.materialityPercentage || !showMaterialityResults.value) {
    return '0.00';
  }
  const result = (materialityData.value.benchmarkValue * materialityData.value.materialityPercentage) / 100;
  return result.toFixed(2);
});

const calculatePML = computed(() => {
  if (!calculateMateriality.value || !materialityData.value.pmlPercentage || !showMaterialityResults.value) {
    return '0.00';
  }
  const result = (parseFloat(calculateMateriality.value) * materialityData.value.pmlPercentage) / 100;
  return result.toFixed(2);
});

const calculateCTT = computed(() => {
  if (!calculatePML.value || !materialityData.value.cttPercentage || !showMaterialityResults.value) {
    return '0.00';
  }
  const result = (parseFloat(calculatePML.value) * materialityData.value.cttPercentage) / 100;
  return result.toFixed(2);
});

// Add function to handle materiality calculation
const handleCalculateMateriality = () => {
  showMaterialityResults.value = true;
};

// Add function to view existing ledger
const viewExistingLedger = async () => {
  if (!selectedGroupData.value?.existing_ledger) return;
  
  loading.value = true;
  error.value = null;
  viewingExistingLedger.value = true;
  
  try {
    // Load the existing ledger data
    const existingLedger = selectedGroupData.value.existing_ledger;
    ledgerData.value = existingLedger.result.ledger;
    riskAssessment.value = existingLedger.result.riskAssessment;
    materialityData.value = existingLedger.result.materiality;
    auditSamplingData.value = existingLedger.result.auditSampling;
    showLedger.value = true;
  } catch (err) {
    error.value = 'Failed to load existing ledger';
    console.error('Error loading existing ledger:', err);
  } finally {
    loading.value = false;
  }
};

// Add function to export sample data as CSV/PDF
const exportSampleData = () => {
  // Implementation for exporting data
  console.log('Exporting sample data...');
  // This would typically involve generating a CSV or PDF file
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
          <div>
            <button 
              @click="generateLedger" 
              :disabled="!selectedKoperasi || !selectedGroup || loading"
              class="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
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
    </div>

    <!-- Status Message -->
    <div v-if="generationStatus === 'pending'" class="mt-4">
      <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">Sedang Memproses</h3>
            <div class="mt-2 text-sm text-blue-700">
              <p>{{ generationMessage }}</p>
            </div>
          </div>
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
            <h3 class="font-medium text-gray-900 mb-4">Pemilihan Benchmark (Asas Pengiraan)</h3>
            
            <!-- Benchmark Selection Dropdown -->
            <div class="mb-6">
              <select
                v-model="materialityData.benchmark"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Pilih Benchmark</option>
                <option value="jualan">Jualan</option>
                <option value="aset">Jumlah Aset</option>
                <option value="perbelanjaan">Perbelanjaan</option>
              </select>
              
              <!-- Benchmark Notes -->
              <div class="mt-2 text-xs text-gray-500">
                <p>• Jualan: Untuk syarikat yang aktif</p>
                <p>• Jumlah Aset: Jika syarikat tidak mempunyai jualan</p>
                <p>• Perbelanjaan: Jika sesuai dengan profil syarikat</p>
              </div>
            </div>

            <!-- Benchmark Value -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Nilai Benchmark (RM)
              </label>
              <input 
                type="number"
                v-model="materialityData.benchmarkValue"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="200000"
              />
            </div>

            <!-- Materiality Percentage -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Peratusan Materiality (%)
              </label>
              <input 
                type="number"
                v-model="materialityData.materialityPercentage"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="1.5"
                step="0.1"
              />
            </div>

            <!-- Performance Materiality -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Peratusan Performance Materiality (50%-75%)
              </label>
              <input 
                type="number"
                v-model="materialityData.pmlPercentage"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="60"
                min="50"
                max="75"
              />
              <p class="text-xs text-gray-500 mt-1">Tidak boleh 100%</p>
            </div>

            <!-- Clearly Trivial Threshold -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Peratusan Clearly Trivial Threshold (5%-10%)
              </label>
              <input 
                type="number"
                v-model="materialityData.cttPercentage"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="6"
                min="5"
              />
              <p class="text-xs text-gray-500 mt-1">Boleh lebih 10%</p>
            </div>

            <!-- Results -->
            <div class="mt-8" v-if="showMaterialityResults">
              <h3 class="font-medium text-gray-900 mb-4">Keputusan Pengiraan</h3>
              
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Materiality:</span>
                  <span class="font-medium">RM {{ calculateMateriality }}</span>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Performance Materiality:</span>
                  <span class="font-medium">RM {{ calculatePML }}</span>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Clearly Trivial Threshold:</span>
                  <span class="font-medium">RM {{ calculateCTT }}</span>
                </div>
              </div>
            </div>

            <!-- Update the Calculate Button -->
            <button 
              @click="handleCalculateMateriality"
              class="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Kira Materiality
            </button>
          </div>
        </div>

        <!-- Updated Audit Sampling Panel -->
        <div v-if="isAuditSamplingPanelOpen" class="fixed inset-y-0 right-0 w-[600px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
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

          <!-- Panel Content with defensive rendering -->
          <div v-if="auditSamplingData && auditSamplingData.population" class="p-4 overflow-y-auto h-[calc(100vh-64px)]">
            <!-- Population Definition Section -->
            <div class="space-y-6 mb-8">
              <h3 class="text-lg font-medium border-b pb-2">Takrifkan Populasi</h3>
              
              <!-- Date Range with defensive rendering -->
              <div v-if="auditSamplingData.population.dateRange" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Tempoh Masa</label>
                <div class="flex space-x-4">
                  <div class="flex-1">
                    <input type="date" 
                           v-model="auditSamplingData.population.dateRange.start"
                           class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                  <span class="self-center text-gray-500">hingga</span>
                  <div class="flex-1">
                    <input type="date" 
                           v-model="auditSamplingData.population.dateRange.end"
                           class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <!-- Value Range with defensive rendering -->
              <div v-if="auditSamplingData.population.valueRange" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Julat Nilai (RM)</label>
                <div class="flex space-x-4">
                  <div class="flex-1">
                    <input type="number" 
                           v-model="auditSamplingData.population.valueRange.min"
                           placeholder="Minimum"
                           class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                  <span class="self-center text-gray-500">hingga</span>
                  <div class="flex-1">
                    <input type="number" 
                           v-model="auditSamplingData.population.valueRange.max"
                           placeholder="Maksimum"
                           class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <!-- Transaction Type -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Jenis Transaksi</label>
                <select v-model="auditSamplingData.population.transactionType"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Pilih jenis transaksi</option>
                  <option v-for="type in transactionTypes" 
                          :key="type.value" 
                          :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
                <p v-if="selectedTransactionType" 
                   class="mt-2 text-sm text-gray-500">
                  {{ selectedTransactionType.description }}
                </p>
              </div>
            </div>

            <!-- Sampling Method Section -->
            <div class="space-y-6 mb-8">
              <h3 class="text-lg font-medium border-b pb-2">Kaedah Sampling</h3>
              <div class="space-y-4">
                <div v-for="method in samplingMethods" 
                     :key="method.value"
                     class="border rounded-lg p-4 cursor-pointer"
                     :class="{'border-blue-500 bg-blue-50': auditSamplingData.samplingMethod === method.value}"
                     @click="auditSamplingData.samplingMethod = method.value">
                  <div class="flex items-center">
                    <input type="radio" 
                           :value="method.value"
                           v-model="auditSamplingData.samplingMethod"
                           class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                    <div class="ml-3">
                      <span class="block text-sm font-medium">{{ method.label }}</span>
                      <span class="block text-sm text-gray-500">{{ method.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sample Size Section with defensive rendering -->
            <div v-if="auditSamplingData" class="space-y-6 mb-8">
              <h3 class="text-lg font-medium border-b pb-2">Saiz Sampel</h3>
              
              <div class="space-y-4">
                <!-- Method Selection -->
                <div class="flex space-x-4">
                  <label class="inline-flex items-center">
                    <input type="radio" 
                           v-model="auditSamplingData.sampleSizeMethod" 
                           value="manual"
                           class="text-blue-600 focus:ring-blue-500" />
                    <span class="ml-2">Manual</span>
                  </label>
                  <label class="inline-flex items-center">
                    <input type="radio" 
                           v-model="auditSamplingData.sampleSizeMethod" 
                           value="automatic"
                           class="text-blue-600 focus:ring-blue-500" />
                    <span class="ml-2">Automatik</span>
                  </label>
                </div>

                <!-- Manual Input -->
                <div v-if="auditSamplingData.sampleSizeMethod === 'manual'" class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">Saiz Sampel</label>
                  <input type="number" 
                         v-model="auditSamplingData.manualSampleSize"
                         class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                         placeholder="Masukkan saiz sampel" />
                </div>

                <!-- Automatic Calculation with defensive rendering -->
                <div v-else-if="auditSamplingData.automaticSampleSize" class="space-y-4">
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Risiko Audit (%)</label>
                    <input type="number" 
                           v-model="auditSamplingData.automaticSampleSize.auditRisk"
                           class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                           placeholder="5" />
                  </div>
                  
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Materialiti (%)</label>
                    <input type="number" 
                           v-model="auditSamplingData.automaticSampleSize.materiality"
                           class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                           placeholder="10" />
                  </div>
                  
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Tahap Keyakinan (%)</label>
                    <input type="number" 
                           v-model="auditSamplingData.automaticSampleSize.confidenceLevel"
                           class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                           placeholder="95" />
                  </div>
                </div>

                <!-- Calculate Button -->
                <button @click="calculateSampleSize"
                        class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Kira Saiz Sampel
                </button>

                <!-- Results -->
                <div v-if="auditSamplingData.calculatedSampleSize" 
                     class="mt-4 p-4 bg-gray-50 rounded-md">
                  <p class="text-sm font-medium text-gray-900">
                    Saiz Sampel yang Dicadangkan: {{ auditSamplingData.calculatedSampleSize }} transaksi
                  </p>
                </div>
              </div>
            </div>

            <!-- Generate Samples Button -->
            <button @click="generateSamples"
                    class="w-full mb-8 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Jana Sampel
            </button>

            <!-- Selected Samples Section with defensive rendering -->
            <div v-if="auditSamplingData && auditSamplingData.selectedSamples && auditSamplingData.selectedSamples.length > 0" 
                 class="space-y-6 mb-8">
              <div class="bg-gray-100 p-4 rounded-md">
                <h3 class="text-lg font-medium">Tajuk: Paparan Data Sampel</h3>
                <p class="text-sm text-gray-700">KAEDAH SAMPLING: {{ samplingMethods.find(m => m.value === auditSamplingData.samplingMethod)?.label || 'Random Sampling' }}</p>
                <p class="text-sm text-gray-700">SAIZ SAMPEL: {{ auditSamplingData.calculatedSampleSize }} transaksi</p>
              </div>
              
              <!-- Sample data table -->
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        NO. TRANSAKSI
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TARIKH TRANSAKSI
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        JENIS TRANSAKSI
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AMAUN (RM)
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TERDAPAT ISU
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="sample in auditSamplingData.selectedSamples" :key="sample.id">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ sample.id }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ sample.date }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ sample.type }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ sample.amount.toFixed(2) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <label class="inline-flex items-center">
                          <input type="checkbox" v-model="sample.hasIssue" class="text-red-600 focus:ring-red-500" />
                          <span class="ml-2 text-sm">{{ sample.hasIssue ? 'Ya' : 'Tidak' }}</span>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Notes for samples with issues -->
              <div v-if="auditSamplingData.selectedSamples.some(s => s.hasIssue)" class="space-y-4 mt-4">
                <h4 class="font-medium">Catatan Isu</h4>
                <div v-for="sample in auditSamplingData.selectedSamples.filter(s => s.hasIssue)" :key="sample.id" class="p-3 border rounded-md">
                  <p class="font-medium">Transaksi #{{ sample.id }}</p>
                  <textarea v-model="sample.notes"
                            rows="2"
                            class="w-full mt-2 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                            placeholder="Catatan isu..."></textarea>
                </div>
              </div>
              
              <!-- Export button -->
              <a href="https://skm-db.datasc.dev/storage/v1/object/public/financial-statements//transaction_report.xlsx"
                 target="_blank"
                 download
                 class="flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Muat Turun Data Sampel
              </a>
            </div>

            <!-- Output Saiz Sampel section -->
            <div v-if="auditSamplingData.calculatedSampleSize" class="bg-gray-50 p-4 rounded-md mb-6">
              <h3 class="text-lg font-medium">Output Saiz Sampel:</h3>
              <p class="text-md">Saiz Sampel: <span class="font-bold">{{ auditSamplingData.calculatedSampleSize }} transaksi</span></p>
            </div>

            <!-- Audit Findings Section with defensive rendering -->
            <div v-if="auditSamplingData" class="space-y-6">
              <h3 class="text-lg font-medium border-b pb-2">Penemuan Audit</h3>
              <textarea v-model="auditSamplingData.auditNotes"
                        rows="4"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Masukkan nota penemuan audit..."></textarea>
              
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Penilaian Materialiti</label>
                <select v-model="auditSamplingData.materialityAssessment"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Pilih penilaian</option>
                  <option value="material">Material</option>
                  <option value="not_material">Tidak Material</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Fallback content if data structure is invalid -->
          <div v-else class="p-4">
            <p class="text-red-500">Terdapat ralat dengan data persampelan. Sila tutup panel dan cuba lagi.</p>
            <button @click="resetAuditSamplingData" 
                    class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md">
              Reset Data
            </button>
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
            <h3 class="font-medium text-gray-900 mb-4">Pemilihan Benchmark (Asas Pengiraan)</h3>
            
            <!-- Benchmark Selection Dropdown -->
            <div class="mb-6">
              <select
                v-model="materialityData.benchmark"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Pilih Benchmark</option>
                <option value="jualan">Jualan</option>
                <option value="aset">Jumlah Aset</option>
                <option value="perbelanjaan">Perbelanjaan</option>
              </select>
              
              <!-- Benchmark Notes -->
              <div class="mt-2 text-xs text-gray-500">
                <p>• Jualan: Untuk syarikat yang aktif</p>
                <p>• Jumlah Aset: Jika syarikat tidak mempunyai jualan</p>
                <p>• Perbelanjaan: Jika sesuai dengan profil syarikat</p>
              </div>
            </div>

            <!-- Benchmark Value -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Nilai Benchmark (RM)
              </label>
              <input 
                type="number"
                v-model="materialityData.benchmarkValue"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="200000"
              />
            </div>

            <!-- Materiality Percentage -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Peratusan Materiality (%)
              </label>
              <input 
                type="number"
                v-model="materialityData.materialityPercentage"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="1.5"
                step="0.1"
              />
            </div>

            <!-- Performance Materiality -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Peratusan Performance Materiality (50%-75%)
              </label>
              <input 
                type="number"
                v-model="materialityData.pmlPercentage"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="60"
                min="50"
                max="75"
              />
              <p class="text-xs text-gray-500 mt-1">Tidak boleh 100%</p>
            </div>

            <!-- Clearly Trivial Threshold -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700">
                Peratusan Clearly Trivial Threshold (5%-10%)
              </label>
              <input 
                type="number"
                v-model="materialityData.cttPercentage"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="6"
                min="5"
              />
              <p class="text-xs text-gray-500 mt-1">Boleh lebih 10%</p>
            </div>

            <!-- Results -->
            <div class="mt-8" v-if="showMaterialityResults">
              <h3 class="font-medium text-gray-900 mb-4">Keputusan Pengiraan</h3>
              
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Materiality:</span>
                  <span class="font-medium">RM {{ calculateMateriality }}</span>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Performance Materiality:</span>
                  <span class="font-medium">RM {{ calculatePML }}</span>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Clearly Trivial Threshold:</span>
                  <span class="font-medium">RM {{ calculateCTT }}</span>
                </div>
              </div>
            </div>

            <!-- Update the Calculate Button -->
            <button 
              @click="handleCalculateMateriality"
              class="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Kira Materiality
            </button>
          </div>
        </div>

        <!-- Backdrop -->
        <div v-if="isRiskPanelOpen || isMaterialityPanelOpen || isAuditSamplingPanelOpen" 
            @click="toggleRiskPanel(); toggleMaterialityPanel(); toggleAuditSamplingPanel()"
            class="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-in-out z-[48]">
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

          <!-- Download Financial Report Button -->
          <div class="mt-4 flex justify-center">
            <a 
              href="https://skm-db.datasc.dev/storage/v1/object/public/financial-statements//financial_report.xlsx"
              target="_blank"
              download
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Muat Turun Laporan Kewangan
            </a>
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