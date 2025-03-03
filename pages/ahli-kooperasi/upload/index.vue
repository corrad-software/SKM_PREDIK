<script setup>
definePageMeta({
  layout: "admin",
});

import { ref, onMounted, computed, watch } from 'vue'
import { useToast } from '~/composables/useToast';

const route = useRoute()
const sections = ref(['Butiran Koperasi', 'Kunci Kira Kira', 'Imbangan Duga', 'Ledger', 'Bank Reconciliation', 'Overall Review']);
const currentSection = ref(0);

// Add cookie storage for form data
const formDataCookie = useCookie('upload-form-data', {
  maxAge: 3600, // Cookie expires in 1 hour
  watch: true // Watch for changes in the cookie value
})

// Add new ref for organization type selection with cookie storage
const isParentOrganization = ref(formDataCookie.value?.isParentOrganization ?? true)

// Get subsidiary parameters from route
const isSubsidiary = computed(() => route.query.isSubsidiary === '1')
const subsidiaryIndex = computed(() => {
  const index = parseInt(route.query.subsidiaryIndex)
  return !isNaN(index) ? index : null
})

// Add organization type options
const organizationTypeOptions = [
  { label: 'Koperasi Induk', value: true },
  { label: 'Anak Syarikat', value: false }
]

// Initialize kooperasiDetails with cookie data
const kooperasiDetails = ref({
  subsidiariKoperasi: formDataCookie.value?.subsidiariKoperasi || '',
  negeri: formDataCookie.value?.negeri || '',
  tahunKewanganSemasa: formDataCookie.value?.tahunKewanganSemasa || '',
  tahunKewanganSebelum: formDataCookie.value?.tahunKewanganSebelum || '',
  diauditOleh: formDataCookie.value?.diauditOleh || '',
  disemakOleh: formDataCookie.value?.disemakOleh || ''
})

// Watch for changes in form data and update cookie
watch([kooperasiDetails, isParentOrganization], async ([newDetails, newIsParent]) => {
  formDataCookie.value = {
    ...newDetails,
    isParentOrganization: newIsParent
  }

  // Update URL with organization_id
  const router = useRouter()
  const currentQuery = { ...route.query }
  
  if (newIsParent) {
    currentQuery.organization_id = PARENT_ORGANIZATION_ID
    delete currentQuery.subsidiary_id
  } else if (newDetails.subsidiariKoperasi) {
    currentQuery.subsidiary_id = newDetails.subsidiariKoperasi
    delete currentQuery.organization_id
  } else {
    delete currentQuery.organization_id
    delete currentQuery.subsidiary_id
  }
  
  await router.replace({ query: currentQuery })
}, { deep: true })

// Function to set initial section and organization based on URL parameters
const initializeSection = () => {
  const sectionParam = parseInt(route.query.section)
  if (!isNaN(sectionParam) && sectionParam >= 0 && sectionParam < sections.value.length) {
    currentSection.value = sectionParam
  }
  
  // Set organization type and ID based on URL parameters
  if (route.query.subsidiary_id) {
    isParentOrganization.value = false
    kooperasiDetails.value.subsidiariKoperasi = route.query.subsidiary_id
  } else if (route.query.organization_id === PARENT_ORGANIZATION_ID) {
    isParentOrganization.value = true
    kooperasiDetails.value.subsidiariKoperasi = ''
  }
}

// Function to clear form data and cookies
const clearFormData = () => {
  kooperasiDetails.value = {
    subsidiariKoperasi: '',
    negeri: '',
    tahunKewanganSemasa: '',
    tahunKewanganSebelum: '',
    diauditOleh: '',
    disemakOleh: ''
  }
  isParentOrganization.value = true
  formDataCookie.value = null
}

// Update page title based on whether we're uploading for subsidiary
const pageTitle = computed(() => {
  return !isParentOrganization.value 
    ? `Muat Naik Dokumen Audit - Anak Syarikat`
    : 'Muat Naik Dokumen Audit - Koperasi Induk'
})

// Initialize section on component mount
onMounted(async () => {
  try {
    // Initialize section
    initializeSection();
    
    // Fetch subsidiaries
    await fetchSubsidiaries();
    
    // If organization ID is already in URL or cookie, fetch its statements
    const organizationId = route.query.organization_id || 
                         route.query.subsidiary_id || 
                         (kooperasiDetails.value.subsidiariKoperasi);
                         
    if (organizationId) {
      await fetchOrganizationStatements(organizationId);
    }
  } catch (error) {
    console.error('Error during initialization:', error);
    errorMessage.value = 'Failed to initialize data. Please refresh the page.';
  }
});

const nextSection = async () => {
  if (currentSection.value < sections.value.length - 1) {
    if (currentSection.value === 0) {
      const organizationId = !isParentOrganization.value 
        ? kooperasiDetails.value.subsidiariKoperasi 
        : PARENT_ORGANIZATION_ID;
        
      if (organizationId) {
        try {
          await fetchOrganizationStatements(organizationId);
          currentSection.value++;
        } catch (error) {
          errorMessage.value = 'Failed to load document information. Please try again.';
        }
      }
    } else {
      currentSection.value++;
    }
  }
};

const prevSection = () => {
  if (currentSection.value > 0) {
    currentSection.value--;
  }
};

const isOpen = ref(false);

// Add new function to prepare statements data
const prepareStatementsData = () => {
  const statements = [];
  
  if (uploadedStatements.value?.kunciKiraKira?.id) {
    statements.push({
      statement_id: uploadedStatements.value.kunciKiraKira.id,
      type: 'kunci_kira_kira'
    });
  }
  
  if (uploadedStatements.value?.imbanganDuga?.id) {
    statements.push({
      statement_id: uploadedStatements.value.imbanganDuga.id,
      type: 'imbangan_duga'
    });
  }
  
  if (uploadedStatements.value?.ledger?.id) {
    statements.push({
      statement_id: uploadedStatements.value.ledger.id,
      type: 'ledger'
    });
  }
  
  if (uploadedStatements.value?.bankReconciliation?.id) {
    statements.push({
      statement_id: uploadedStatements.value.bankReconciliation.id,
      type: 'bank_reconciliation'
    });
  }
  
  return statements;
};

// Update submitForm function
const submitForm = async () => {
  try {
    const organizationId = isParentOrganization.value ? 
      PARENT_ORGANIZATION_ID : 
      kooperasiDetails.value.subsidiariKoperasi;

    const statements = prepareStatementsData();
    
    if (statements.length === 0) {
      showErrorToast('Tiada dokumen yang dimuat naik');
      return;
    }

    const payload = {
      name: `Dokumen Audit ${new Date().getFullYear()}`,
      description: `Dokumen audit untuk ${isParentOrganization.value ? 'Koperasi Induk' : 'Anak Syarikat'} - ${new Date().toLocaleDateString()}`,
      statements,
      organization_id: organizationId
    };

    const response = await $fetch('/api/financial-statement/group/create', {
      method: 'POST',
      body: payload
    });

    if (response.status === 'success') {
      isOpen.value = true;
      showSuccessToast('Dokumen berjaya dihantar');
      clearFormData(); // Clear form data after successful submission
    } else {
      throw new Error(response.message || 'Gagal menghantar dokumen');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showErrorToast(error.message || 'Gagal menghantar dokumen');
  }
};

const accountingDocuments = ref({
  kunciKiraKira: null,
  kunciKiraKiraFailRujukan: null,
  imbanganDuga: null,
  imbanganDugaFailRujukan: null,
  ledger: null,
  ledgerFailRujukan: null,
  bankReconciliation: null,
  bankReconciliationFailRujukan: null
});

// Add upload status tracking
const uploadStatus = ref({
  kunciKiraKira: { loading: false, error: null },
  imbanganDuga: { loading: false, error: null },
  ledger: { loading: false, error: null },
  bankReconciliation: { loading: false, error: null }
});

// Remove the simple fileAttachments ref and replace with more specific structure
const fileAttachments = ref({
  kunciKiraKira: { statement: null, reference: null },
  imbanganDuga: { statement: null, reference: null },
  ledger: { statement: null, reference: null },
  bankReconciliation: { statement: null, reference: null }
});

// Add mapping for statement types
const STATEMENT_TYPES = {
  kunciKiraKira: 'kunci_kira_kira',
  imbanganDuga: 'imbangan_duga',
  ledger: 'ledger',
  bankReconciliation: 'bank_reconciliation'
};

// Update handleFileChange to handle both statement and reference files
const handleFileChange = (event, type, fileType) => {
  const files = event.target.files;
  if (files.length > 0) {
    const file = files[0];
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      if (fileAttachments.value[type]) {
        fileAttachments.value[type][fileType] = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }
};

// Remove showSuccessMessage and successMessage refs
const errorMessage = ref('');

// Update showSuccessToast function to use toast properly
const showSuccessToast = (message) => {
  const toast = useToast();
  toast.add({
    title: 'Berjaya',
    description: message,
    type: 'success',
    position: 'top-right',
    duration: 3000
  });
};

// Update showErrorToast function to use toast properly
const showErrorToast = (message) => {
  const toast = useToast();
  toast.add({
    title: 'Ralat',
    description: message,
    type: 'error',
    position: 'top-right',
    duration: 5000
  });
};

// Replace localStorage with cookie storage
const uploadedStatements = useCookie('uploadedStatements', {
  maxAge: 3600 * 24 * 7, // Cookie expires in 7 days
  watch: true,
  default: () => ({
    kunciKiraKira: null,
    imbanganDuga: null,
    ledger: null,
    bankReconciliation: null
  })
});

// Add uploaded files tracking
const uploadedFiles = ref({
  kunciKiraKira: null,
  imbanganDuga: null,
  ledger: null,
  bankReconciliation: null
});

// Initialize data on mount
onMounted(() => {
  if (!uploadedStatements.value) {
    uploadedStatements.value = {};
  }
});

// Update uploadDocument function to save file info
const uploadDocument = async (type) => {
  if (!kooperasiDetails.value.subsidiariKoperasi && !isParentOrganization.value) {
    errorMessage.value = 'Sila pilih anak syarikat terlebih dahulu';
    return;
  }

  if (!fileAttachments.value[type].statement) {
    errorMessage.value = 'Sila pilih fail untuk dimuat naik';
    return;
  }

  uploadStatus.value[type].loading = true;
  uploadStatus.value[type].error = null;

  try {
    const formData = {
      type: STATEMENT_TYPES[type],
      organization_id: kooperasiDetails.value.subsidiariKoperasi,
      year_current: kooperasiDetails.value.tahunKewanganSemasa,
      year_previous: kooperasiDetails.value.tahunKewanganSebelum,
      state: kooperasiDetails.value.negeri,
      audited_by: kooperasiDetails.value.diauditOleh,
      reviewed_by: kooperasiDetails.value.disemakOleh,
      statement_file: fileAttachments.value[type].statement,
      reference_file: fileAttachments.value[type].reference
    };

    // Upload the file
    const response = await $fetch('/api/financial-statement/upload', {
      method: 'POST',
      body: formData
    });

    if (response.status === 'success') {
      // Fetch latest data after successful upload
      await fetchOrganizationStatements(kooperasiDetails.value.subsidiariKoperasi);
      showSuccessToast('Dokumen berjaya dimuat naik');

      // Start analysis process
      analyzingStatus.value[type] = true;
      try {
        const analysisResponse = await $fetch('/api/financial-statement/analyze', {
          method: 'POST',
          body: {
            statement_id: response.data.statement_id
          }
        });

        if (analysisResponse.status === 'success') {
          // Fetch latest data again after analysis
          await fetchOrganizationStatements(kooperasiDetails.value.subsidiariKoperasi);
          showSuccessToast('Analisis dokumen selesai');
        } else {
          throw new Error('Failed to analyze document');
        }
      } catch (analysisError) {
        console.error(`Error analyzing ${type}:`, analysisError);
        errorMessage.value = 'Gagal menganalisis dokumen';
      } finally {
        analyzingStatus.value[type] = false;
      }
      
      // Clear attachments after successful upload
      fileAttachments.value[type] = { statement: null, reference: null };
    } else {
      throw new Error(response.message || 'Failed to upload document');
    }
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    errorMessage.value = error.message || 'Gagal memuat naik dokumen';
  } finally {
    uploadStatus.value[type].loading = false;
  }
};

// Update upload handlers to use the correct type keys
const uploadKunciKiraKira = () => uploadDocument('kunciKiraKira');
const uploadImbanganDuga = () => uploadDocument('imbanganDuga');
const uploadLedger = () => uploadDocument('ledger');
const uploadBankReconciliation = () => uploadDocument('bankReconciliation');

const processDocuments = () => {
  // Logic to process the uploaded documents and map them to the ledger
  console.log('Processing documents:', accountingDocuments.value);
};

// Update isReviewVisible to check for uploaded status instead of accountingDocuments
const isReviewVisible = computed(() => {
  return uploadedStatements.value?.kunciKiraKira?.id != null;
});

// Add analyzing state tracking
const analyzingStatus = ref({
  kunciKiraKira: false,
  imbanganDuga: false,
  ledger: false,
  bankReconciliation: false
});

// Update documentReview to be reactive
const documentReview = ref({
  kunciKiraKira: {
    sections: [
      {
        section: 'Bahagian 1: Gambaran Keseluruhan Dokumen',
        issues: []
      }
    ],
    summary: {
      totalMajorIssues: 0,
      totalMinorIssues: 0,
      totalRalatDokumen: 0,
      sectionsRequiringRevisions: []
    }
  },
  imbanganDuga: { sections: [], summary: { totalMajorIssues: 0, totalMinorIssues: 0, totalRalatDokumen: 0, sectionsRequiringRevisions: [] } },
  ledger: { sections: [], summary: { totalMajorIssues: 0, totalMinorIssues: 0, totalRalatDokumen: 0, sectionsRequiringRevisions: [] } },
  bankReconciliation: { sections: [], summary: { totalMajorIssues: 0, totalMinorIssues: 0, totalRalatDokumen: 0, sectionsRequiringRevisions: [] } }
});

// Add function to map analysis result to review format
const mapAnalysisToReview = (analysis, type) => {
  const issues = analysis.document_overview.map(issue => ({
    issueDescription: issue.issue_description,
    expected: issue.expected_result,
    suggestedCorrection: issue.correction_suggestion,
    faultCategory: issue.issue_category,
    impactLevel: issue.issue_type === 'Isu Utama' ? 'Major' : 'Minor'
  }));

  documentReview.value[type] = {
    sections: [
      {
        section: 'Bahagian 1: Gambaran Keseluruhan Dokumen',
        issues: issues
      }
    ],
    summary: {
      totalMajorIssues: analysis.summary.major_issues,
      totalMinorIssues: analysis.summary.minor_issues,
      totalRalatDokumen: analysis.summary.document_revisions,
      sectionsRequiringRevisions: analysis.summary.sections_to_review
    }
  };
};

// Add new data for dropdowns
const kooperasiList = ref([
  { id: 1, name: 'Koperasi Permodalan Felda Malaysia Berhad', hasSubsidiaries: true },
  { id: 2, name: 'Koperasi Peserta-Peserta Felcra Malaysia Berhad', hasSubsidiaries: false },
  { id: 3, name: 'Koperasi Serbaguna Iman Malaysia Berhad', hasSubsidiaries: true },
  { id: 4, name: 'Bank Kerjasama Rakyat Malaysia Berhad', hasSubsidiaries: true },
]);

const PARENT_ORGANIZATION_ID = '62986bb9-b23c-4226-93c9-be523adabf77'

// Remove the static subsidiariList since we'll fetch from API
const subsidiaries = ref([])

// Fetch subsidiaries from API
const fetchSubsidiaries = async () => {
  try {
    const response = await $fetch(`/api/organization/${PARENT_ORGANIZATION_ID}`)
    if (response?.status === 'success' && response?.data?.children) {
      subsidiaries.value = response.data.children
    }
  } catch (error) {
    console.error('Error fetching subsidiaries:', error)
  }
}

// Fetch organization statements
const fetchOrganizationStatements = async (organizationId) => {
  isLoading.value = true;
  apiError.value = null;
  
  try {
    const response = await $fetch(`/api/financial-statement/organization/${organizationId}`);
    if (response?.status === 'success') {
      const statements = response.data;
      
      uploadedStatements.value = {
        kunciKiraKira: statements.kunci_kira_kira,
        imbanganDuga: statements.imbangan_duga,
        ledger: statements.ledger,
        bankReconciliation: statements.bank_reconciliation
      };

      Object.entries(statements).forEach(([type, data]) => {
        if (data?.analysis) {
          const frontendType = {
            kunci_kira_kira: 'kunciKiraKira',
            imbangan_duga: 'imbanganDuga',
            ledger: 'ledger',
            bank_reconciliation: 'bankReconciliation'
          }[type];

          if (frontendType && data.analysis.document_overview) {
            mapAnalysisToReview({
              document_overview: data.analysis.document_overview,
              summary: data.analysis.summary
            }, frontendType);
          }
        }
      });
    } else {
      throw new Error(response?.message || 'Failed to fetch organization statements');
    }
  } catch (error) {
    console.error('Error fetching organization statements:', error);
    apiError.value = error.message || 'Failed to get document information';
    showErrorToast(apiError.value);
  } finally {
    isLoading.value = false;
  }
};

// Add watcher for subsidiariKoperasi changes
watch(() => kooperasiDetails.value.subsidiariKoperasi, async (newValue) => {
  if (newValue) {
    await fetchOrganizationStatements(newValue);
  }
});

// Update subsidiaries data structure to use API data
const subsidiaryOptions = computed(() => {
  return subsidiaries.value.map(subsidiary => ({
    label: subsidiary.name,
    value: subsidiary.id
  }))
})

// Add Malaysian states data
const malaysianStates = ref([
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Wilayah Persekutuan Kuala Lumpur',
  'Wilayah Persekutuan Labuan',
  'Wilayah Persekutuan Putrajaya'
]);

// Add dummy data for auditors and reviewers
const auditorsList = ref([
  { id: 1, name: 'Ahmad bin Abdullah', position: 'Senior Auditor' },
  { id: 2, name: 'Siti Aminah binti Hassan', position: 'Lead Auditor' },
  { id: 3, name: 'Raj Kumar a/l Muthu', position: 'Principal Auditor' },
  { id: 4, name: 'Lee Wei Ming', position: 'Senior Auditor' },
  { id: 5, name: 'Nurul Huda binti Ismail', position: 'Lead Auditor' }
]);

const reviewersList = ref([
  { id: 1, name: 'Dr. Mohamed Yusoff', position: 'Chief Reviewer' },
  { id: 2, name: 'Sarah Tan Li Mei', position: 'Senior Reviewer' },
  { id: 3, name: 'Abdul Rahman bin Omar', position: 'Principal Reviewer' },
  { id: 4, name: 'Wong Kai Ling', position: 'Senior Reviewer' },
  { id: 5, name: 'Amirah binti Zulkifli', position: 'Lead Reviewer' }
]);

const selectedKoperasi = ref(null);
const showSubsidiaries = computed(() => {
  if (!selectedKoperasi.value) return false;
  const selected = kooperasiList.value.find(k => k.id === selectedKoperasi.value);
  return selected?.hasSubsidiaries;
});

// Update getUploadStatus function
const getUploadStatus = (type) => {
  const statement = uploadedStatements.value?.[type];
  if (!statement || !statement.id || !statement.statementFile?.name) return null;
  
  return {
    id: statement.id,
    statementFile: statement.statementFile || { name: '', path: '' },
    referenceFile: statement.referenceFile,
    uploadedAt: statement.uploadedAt,
    status: statement.status
  };
};

// Update downloadFile function
const downloadFile = (url, filename) => {
  if (!url || !filename) {
    console.error('Invalid file information');
    showErrorToast('Fail tidak dapat dimuat turun');
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    showErrorToast('Gagal memuat turun fail');
  }
};

// Add loading state
const isLoading = ref(false);
const apiError = ref(null);

// Add section validation computed properties
const isKooperasiDetailsComplete = computed(() => {
  if (isLoading.value) return false;
  
  if (isParentOrganization.value) {
    return kooperasiDetails.value.negeri &&
           kooperasiDetails.value.tahunKewanganSemasa &&
           kooperasiDetails.value.tahunKewanganSebelum &&
           kooperasiDetails.value.diauditOleh &&
           kooperasiDetails.value.disemakOleh;
  } else {
    return kooperasiDetails.value.subsidiariKoperasi &&
           kooperasiDetails.value.negeri &&
           kooperasiDetails.value.tahunKewanganSemasa &&
           kooperasiDetails.value.tahunKewanganSebelum &&
           kooperasiDetails.value.diauditOleh &&
           kooperasiDetails.value.disemakOleh;
  }
});

const isKunciKiraKiraComplete = computed(() => {
  return uploadedStatements.value?.kunciKiraKira?.id != null;
});

const isImbanganDugaComplete = computed(() => {
  return uploadedStatements.value?.imbanganDuga?.id != null;
});

const isLedgerComplete = computed(() => {
  return uploadedStatements.value?.ledger?.id != null;
});

const isBankReconciliationComplete = computed(() => {
  return uploadedStatements.value?.bankReconciliation?.id != null;
});

const canProceedToNext = computed(() => {
  switch (currentSection.value) {
    case 0: // Butiran Koperasi
      return isKooperasiDetailsComplete.value;
    case 1: // Kunci Kira Kira
      return isKunciKiraKiraComplete.value;
    case 2: // Imbangan Duga
      return isImbanganDugaComplete.value;
    case 3: // Ledger
      return isLedgerComplete.value;
    case 4: // Bank Reconciliation
      return isBankReconciliationComplete.value;
    case 5: // Overall Review
      return true;
    default:
      return false;
  }
});

// Add new ref for active tab
const activeTab = ref('kunciKiraKira');
</script>

<template>
  <div>
    <!-- Add loading overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
        <Icon name="eos-icons:loading" class="w-8 h-8 text-blue-500 animate-spin" />
        <span class="text-lg">Memuat data...</span>
      </div>
    </div>

    <!-- Add Toast component with position -->
    <Toast position="top-right" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold">Muat Naik Dokumen Audit</h1>
    </div>

    <!-- Section Indicator -->
    <div class="mb-4 flex justify-center space-x-4">
      <div v-for="(section, index) in sections" :key="index" class="flex items-center">
        <div :class="{'bg-slate-500 text-white': currentSection === index, 'bg-gray-200 text-gray-500': currentSection !== index}" class="rounded-full h-8 w-8 flex items-center justify-center">
          {{ index + 1 }}
        </div>
        <span :class="{'font-bold': currentSection === index, 'text-gray-500': currentSection !== index}" class="ml-2">
          {{ section }}
        </span>
        <div v-if="index < sections.length - 1" class="mx-2 h-px w-8 bg-gray-300"></div>
      </div>
    </div>

    <!-- Form Sections -->
    <Card>
      <CardContent class="p-4">
        <div v-if="currentSection === 0" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Butiran Koperasi</h2>
          <Card class="p-2">
            <CardContent>
              <!-- Organization Type Selection -->
              <FormKit
                type="radio"
                label="Jenis Organisasi"
                v-model="isParentOrganization"
                :options="organizationTypeOptions"
                class="w-full mb-4"
              />
              <!-- Subsidiary Selection (Only visible when not parent organization) -->
              <FormKit
                v-if="!isParentOrganization"
                type="select"
                label="Pilih Anak Syarikat"
                v-model="kooperasiDetails.subsidiariKoperasi"
                :options="subsidiaryOptions"
                :disabled="subsidiaryOptions.length === 0"
                placeholder="Pilih Anak Syarikat"
                validation="required"
                validation-visibility="live"
                :validation-messages="{
                  required: 'Sila pilih anak syarikat'
                }"
                class="w-full mb-4"
              />
              <div v-if="!isParentOrganization && subsidiaryOptions.length === 0" 
                   class="text-sm text-gray-500 mb-4">
                Tiada anak syarikat dijumpai
              </div>
              
              <!-- Rest of the form fields -->
              <FormKit
                type="select"
                label="Negeri"
                v-model="kooperasiDetails.negeri"
                :options="malaysianStates.map(state => ({ label: state, value: state }))"
                placeholder="Pilih Negeri"
                class="w-full mb-4"
              />
              <FormKit
                type="date"
                label="Tahun Kewangan Semasa"
                v-model="kooperasiDetails.tahunKewanganSemasa"
                class="w-full mb-4"
              />
              <FormKit
                type="date"
                label="Tahun Kewangan Sebelum"
                v-model="kooperasiDetails.tahunKewanganSebelum"
                class="w-full mb-4"
              />
              <FormKit
                type="select"
                label="Diaudit Oleh"
                v-model="kooperasiDetails.diauditOleh"
                :options="auditorsList.map(auditor => ({
                  label: `${auditor.name} - ${auditor.position}`,
                  value: auditor.name
                }))"
                placeholder="Pilih Auditor"
                class="w-full mb-4"
              />
              <FormKit
                type="select"
                label="Disemak Oleh"
                v-model="kooperasiDetails.disemakOleh"
                :options="reviewersList.map(reviewer => ({
                  label: `${reviewer.name} - ${reviewer.position}`,
                  value: reviewer.name
                }))"
                placeholder="Pilih Penyemak"
                class="w-full mb-4"
              />
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 1" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Kunci Kira Kira</h2>
          <Card class="p-2">
            <CardContent>
              <FormKit
                type="form"
                id="kunciKiraKiraForm"
                :actions="false"
                @submit="uploadKunciKiraKira"
                :disabled="uploadStatus.kunciKiraKira.loading"
                method="post"
              >
                <!-- Show uploaded file status -->
                <div v-if="getUploadStatus('kunciKiraKira')?.id && getUploadStatus('kunciKiraKira')?.statementFile?.name" class="mb-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-green-700 font-medium">Fail telah dimuat naik</p>
                      <p class="text-sm text-green-600">
                        {{ getUploadStatus('kunciKiraKira')?.statementFile?.name }}
                      </p>
                      <p class="text-xs text-green-500">
                        {{ getUploadStatus('kunciKiraKira')?.uploadedAt ? 
                           new Date(getUploadStatus('kunciKiraKira').uploadedAt).toLocaleString() : 
                           'Date not available' }}
                      </p>
                    </div>
                    <button 
                      v-if="getUploadStatus('kunciKiraKira')?.statementFile?.path"
                      @click="downloadFile(
                        getUploadStatus('kunciKiraKira').statementFile.path, 
                        getUploadStatus('kunciKiraKira').statementFile.name
                      )"
                      class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center"
                    >
                      <Icon name="material-symbols:download" class="w-5 h-5 mr-2" />
                      Muat Turun
                    </button>
                  </div>
                </div>

                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'kunciKiraKira', 'statement')"
                  id="statement"
                  accept=".xlsx"
                  :multiple="false"
                  label="Muat Naik Fail Excel"
                  validation="required"
                  :validation-messages="{
                    required: 'Sila pilih fail untuk dimuat naik'
                  }"
                  class="w-full mb-4"
                />
                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'kunciKiraKira', 'reference')"
                  id="reference"
                  accept=".txt"
                  :multiple="false"
                  label="Muat Naik Fail Rujukan"
                  class="w-full mb-4"
                />
                <div class="flex justify-end">
                  <Button
                    type="submit"
                    :disabled="uploadStatus.kunciKiraKira.loading"
                    class="btn"
                  >
                    <Icon
                      :name="uploadStatus.kunciKiraKira.loading ? 'eos-icons:loading' : 'material-symbols:upload'"
                      class="mr-2"
                    />
                    {{ uploadStatus.kunciKiraKira.loading ? 'Memuat Naik...' : 'Muat Naik' }}
                  </Button>
                </div>
                <p v-if="uploadStatus.kunciKiraKira.error" class="text-red-500 mt-2">
                  {{ uploadStatus.kunciKiraKira.error }}
                </p>
              </FormKit>
            </CardContent>
          </Card>
          <template v-if="isReviewVisible">
            <!-- Add analyzing state indicator -->
            <div v-if="analyzingStatus.kunciKiraKira" class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div class="flex items-center space-x-3">
                <Icon name="eos-icons:loading" class="w-6 h-6 text-blue-500 animate-spin" />
                <p class="text-blue-700">Sedang menganalisis dokumen...</p>
              </div>
            </div>

            <div v-else class="mt-8 space-y-6">
              <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Dokumen</h3>
                <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
              </div>

              <div v-for="(section, sectionIndex) in documentReview.kunciKiraKira.sections"
                   :key="sectionIndex"
                   class="bg-white rounded-lg shadow-sm border border-slate-200">
                <div class="p-4 border-b border-slate-200 bg-slate-50">
                  <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                </div>
                
                <div class="p-4 space-y-4">
                  <div v-for="(issue, issueIndex) in section.issues"
                       :key="issueIndex"
                       class="bg-white rounded-lg p-4 border border-slate-200">
                    <div class="flex items-center gap-2 mb-3">
                      <div :class="{
                        'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                        'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                      }" class="px-3 py-1 rounded-full text-sm font-medium">
                        {{ issue.impactLevel }} Isu
                      </div>
                      <div class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                        {{ issue.faultCategory }}
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 class="text-sm font-medium text-slate-700">Penerangan Isu</h5>
                          <p class="text-slate-600">{{ issue.issueDescription }}</p>
                        </div>
                        <div>
                          <h5 class="text-sm font-medium text-slate-700">Hasil Yang Dijangka</h5>
                          <p class="text-slate-600">{{ issue.expected }}</p>
                        </div>
                      </div>
                      <div class="pt-2">
                        <h5 class="text-sm font-medium text-slate-700">Cadangan Pembetulan</h5>
                        <p class="text-slate-600">{{ issue.suggestedCorrection }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                <div class="p-4 border-b border-slate-200 bg-slate-50">
                  <h4 class="text-lg font-medium text-slate-800">Ringkasan Semakan</h4>
                </div>
                
                <div class="p-4">
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                      <div class="text-red-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.totalMajorIssues }}
                      </div>
                      <div class="text-red-600 text-sm">Isu Utama</div>
                    </div>
                    
                    <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <div class="text-yellow-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.totalMinorIssues }}
                      </div>
                      <div class="text-yellow-600 text-sm">Isu Kecil</div>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div class="text-blue-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.totalRalatDokumen }}
                      </div>
                      <div class="text-blue-600 text-sm">Pembetulan Dokumen</div>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div class="text-green-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.sectionsRequiringRevisions.length }}
                      </div>
                      <div class="text-green-600 text-sm">Bahagian Memerlukan Semakan</div>
                    </div>
                  </div>

                  <div class="bg-slate-50 p-4 rounded-lg">
                    <h5 class="text-sm font-medium text-slate-700 mb-2">Bahagian Memerlukan Semakan:</h5>
                    <div class="flex flex-wrap gap-2">
                      <span v-for="section in documentReview.kunciKiraKira.summary.sectionsRequiringRevisions"
                            :key="section"
                            class="bg-white px-3 py-1 rounded-full text-sm text-slate-600 border border-slate-200">
                        {{ section }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-if="currentSection === 2" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Imbangan Duga</h2>
          <Card class="mb-4">
            <CardContent>
              <!-- Upload status and form -->
              <div v-if="getUploadStatus('imbanganDuga')?.id && getUploadStatus('imbanganDuga')?.statementFile?.name" class="mb-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-green-700 font-medium">Fail telah dimuat naik</p>
                    <p class="text-sm text-green-600">
                      {{ getUploadStatus('imbanganDuga')?.statementFile?.name }}
                    </p>
                    <p class="text-xs text-green-500">
                      {{ getUploadStatus('imbanganDuga')?.uploadedAt ? 
                         new Date(getUploadStatus('imbanganDuga').uploadedAt).toLocaleString() : 
                         'Date not available' }}
                    </p>
                  </div>
                  <button 
                    v-if="getUploadStatus('imbanganDuga')?.statementFile?.path"
                    @click="downloadFile(
                      getUploadStatus('imbanganDuga').statementFile.path, 
                      getUploadStatus('imbanganDuga').statementFile.name
                    )"
                    class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center"
                  >
                    <Icon name="material-symbols:download" class="w-5 h-5 mr-2" />
                    Muat Turun
                  </button>
                </div>
              </div>
              <FormKit
                type="form"
                id="imbanganDugaForm"
                :actions="false"
                @submit="uploadImbanganDuga"
                :disabled="uploadStatus.imbanganDuga.loading"
                method="post"
              >
                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'imbanganDuga', 'statement')"
                  id="statement"
                  accept=".xlsx"
                  :multiple="false"
                  label="Muat Naik Fail Excel"
                  validation="required"
                  :validation-messages="{
                    required: 'Sila pilih fail untuk dimuat naik'
                  }"
                  class="w-full mb-4"
                />
                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'imbanganDuga', 'reference')"
                  id="reference"
                  accept=".txt"
                  :multiple="false"
                  label="Muat Naik Fail Rujukan"
                  class="w-full mb-4"
                />
                <div class="flex justify-end">
                  <Button
                    type="submit"
                    :disabled="uploadStatus.imbanganDuga.loading"
                    class="btn"
                  >
                    <Icon
                      :name="uploadStatus.imbanganDuga.loading ? 'eos-icons:loading' : 'material-symbols:upload'"
                      class="mr-2"
                    />
                    {{ uploadStatus.imbanganDuga.loading ? 'Memuat Naik...' : 'Muat Naik' }}
                  </Button>
                </div>
                <p v-if="uploadStatus.imbanganDuga.error" class="text-red-500 mt-2">
                  {{ uploadStatus.imbanganDuga.error }}
                </p>
              </FormKit>

              <!-- Add analyzing state indicator -->
              <div v-if="analyzingStatus.imbanganDuga" class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div class="flex items-center space-x-3">
                  <Icon name="eos-icons:loading" class="w-6 h-6 text-blue-500 animate-spin" />
                  <p class="text-blue-700">Sedang menganalisis dokumen...</p>
                </div>
              </div>

              <!-- Add review section -->
              <div v-else-if="documentReview.imbanganDuga.sections.length > 0" class="mt-8 space-y-6">
                <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Dokumen</h3>
                  <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
                </div>

                <div v-for="(section, sectionIndex) in documentReview.imbanganDuga.sections"
                     :key="sectionIndex"
                     class="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div class="p-4 border-b border-slate-200 bg-slate-50">
                    <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                  </div>
                  
                  <div class="p-4 space-y-4">
                    <div v-for="(issue, issueIndex) in section.issues"
                         :key="issueIndex"
                         class="bg-white rounded-lg p-4 border border-slate-200">
                      <div class="flex items-center gap-2 mb-3">
                        <div :class="{
                          'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                          'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                        }" class="px-3 py-1 rounded-full text-sm font-medium">
                          {{ issue.impactLevel }} Isu
                        </div>
                        <div class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                          {{ issue.faultCategory }}
                        </div>
                      </div>

                      <div class="space-y-2">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 class="text-sm font-medium text-slate-700">Penerangan Isu</h5>
                            <p class="text-slate-600">{{ issue.issueDescription }}</p>
                          </div>
                          <div>
                            <h5 class="text-sm font-medium text-slate-700">Hasil Yang Dijangka</h5>
                            <p class="text-slate-600">{{ issue.expected }}</p>
                          </div>
                        </div>
                        <div class="pt-2">
                          <h5 class="text-sm font-medium text-slate-700">Cadangan Pembetulan</h5>
                          <p class="text-slate-600">{{ issue.suggestedCorrection }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Summary section -->
                <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div class="p-4 border-b border-slate-200 bg-slate-50">
                    <h4 class="text-lg font-medium text-slate-800">Ringkasan Semakan</h4>
                  </div>
                  
                  <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                        <div class="text-red-800 text-2xl font-bold">
                          {{ documentReview.imbanganDuga.summary.totalMajorIssues }}
                        </div>
                        <div class="text-red-600 text-sm">Isu Utama</div>
                      </div>
                      
                      <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <div class="text-yellow-800 text-2xl font-bold">
                          {{ documentReview.imbanganDuga.summary.totalMinorIssues }}
                        </div>
                        <div class="text-yellow-600 text-sm">Isu Kecil</div>
                      </div>
                      
                      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div class="text-blue-800 text-2xl font-bold">
                          {{ documentReview.imbanganDuga.summary.totalRalatDokumen }}
                        </div>
                        <div class="text-blue-600 text-sm">Pembetulan Dokumen</div>
                      </div>
                      
                      <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div class="text-green-800 text-2xl font-bold">
                          {{ documentReview.imbanganDuga.summary.sectionsRequiringRevisions.length }}
                        </div>
                        <div class="text-green-600 text-sm">Bahagian Memerlukan Semakan</div>
                      </div>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-lg">
                      <h5 class="text-sm font-medium text-slate-700 mb-2">Bahagian Memerlukan Semakan:</h5>
                      <div class="flex flex-wrap gap-2">
                        <span v-for="section in documentReview.imbanganDuga.summary.sectionsRequiringRevisions"
                              :key="section"
                              class="bg-white px-3 py-1 rounded-full text-sm text-slate-600 border border-slate-200">
                          {{ section }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 3" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Ledger</h2>
          <Card class="mb-4">
            <CardContent>
              <FormKit
                type="form"
                id="ledgerForm"
                :actions="false"
                @submit="uploadLedger"
                :disabled="uploadStatus.ledger.loading"
                method="post"
              >
                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'ledger', 'statement')"
                  id="statement"
                  accept=".xlsx"
                  :multiple="false"
                  label="Muat Naik Fail Excel"
                  validation="required"
                  :validation-messages="{
                    required: 'Sila pilih fail untuk dimuat naik'
                  }"
                  class="w-full mb-4"
                />
                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'ledger', 'reference')"
                  id="reference"
                  accept=".txt"
                  :multiple="false"
                  label="Muat Naik Fail Rujukan"
                  class="w-full mb-4"
                />
                <div class="flex justify-end">
                  <Button
                    type="submit"
                    :disabled="uploadStatus.ledger.loading"
                    class="btn"
                  >
                    <Icon
                      :name="uploadStatus.ledger.loading ? 'eos-icons:loading' : 'material-symbols:upload'"
                      class="mr-2"
                    />
                    {{ uploadStatus.ledger.loading ? 'Memuat Naik...' : 'Muat Naik' }}
                  </Button>
                </div>
                <p v-if="uploadStatus.ledger.error" class="text-red-500 mt-2">
                  {{ uploadStatus.ledger.error }}
                </p>
              </FormKit>

              <!-- Add analyzing state indicator -->
              <div v-if="analyzingStatus.ledger" class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div class="flex items-center space-x-3">
                  <Icon name="eos-icons:loading" class="w-6 h-6 text-blue-500 animate-spin" />
                  <p class="text-blue-700">Sedang menganalisis dokumen...</p>
                </div>
              </div>

              <!-- Add review section -->
              <div v-else-if="documentReview.ledger.sections.length > 0" class="mt-8 space-y-6">
                <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Dokumen</h3>
                  <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
                </div>

                <div v-for="(section, sectionIndex) in documentReview.ledger.sections"
                     :key="sectionIndex"
                     class="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div class="p-4 border-b border-slate-200 bg-slate-50">
                    <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                  </div>
                  
                  <div class="p-4 space-y-4">
                    <div v-for="(issue, issueIndex) in section.issues"
                         :key="issueIndex"
                         class="bg-white rounded-lg p-4 border border-slate-200">
                      <div class="flex items-center gap-2 mb-3">
                        <div :class="{
                          'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                          'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                        }" class="px-3 py-1 rounded-full text-sm font-medium">
                          {{ issue.impactLevel }} Isu
                        </div>
                        <div class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                          {{ issue.faultCategory }}
                        </div>
                      </div>

                      <div class="space-y-2">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 class="text-sm font-medium text-slate-700">Penerangan Isu</h5>
                            <p class="text-slate-600">{{ issue.issueDescription }}</p>
                          </div>
                          <div>
                            <h5 class="text-sm font-medium text-slate-700">Hasil Yang Dijangka</h5>
                            <p class="text-slate-600">{{ issue.expected }}</p>
                          </div>
                        </div>
                        <div class="pt-2">
                          <h5 class="text-sm font-medium text-slate-700">Cadangan Pembetulan</h5>
                          <p class="text-slate-600">{{ issue.suggestedCorrection }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Summary section -->
                <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div class="p-4 border-b border-slate-200 bg-slate-50">
                    <h4 class="text-lg font-medium text-slate-800">Ringkasan Semakan</h4>
                  </div>
                  
                  <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                        <div class="text-red-800 text-2xl font-bold">
                          {{ documentReview.ledger.summary.totalMajorIssues }}
                        </div>
                        <div class="text-red-600 text-sm">Isu Utama</div>
                      </div>
                      
                      <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <div class="text-yellow-800 text-2xl font-bold">
                          {{ documentReview.ledger.summary.totalMinorIssues }}
                        </div>
                        <div class="text-yellow-600 text-sm">Isu Kecil</div>
                      </div>
                      
                      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div class="text-blue-800 text-2xl font-bold">
                          {{ documentReview.ledger.summary.totalRalatDokumen }}
                        </div>
                        <div class="text-blue-600 text-sm">Pembetulan Dokumen</div>
                      </div>
                      
                      <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div class="text-green-800 text-2xl font-bold">
                          {{ documentReview.ledger.summary.sectionsRequiringRevisions.length }}
                        </div>
                        <div class="text-green-600 text-sm">Bahagian Memerlukan Semakan</div>
                      </div>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-lg">
                      <h5 class="text-sm font-medium text-slate-700 mb-2">Bahagian Memerlukan Semakan:</h5>
                      <div class="flex flex-wrap gap-2">
                        <span v-for="section in documentReview.ledger.summary.sectionsRequiringRevisions"
                              :key="section"
                              class="bg-white px-3 py-1 rounded-full text-sm text-slate-600 border border-slate-200">
                          {{ section }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 4" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Penyelarasan Bank</h2>
          <Card class="mb-4">
            <CardContent>
              <FormKit
                type="form"
                id="bankReconciliationForm"
                :actions="false"
                @submit="uploadBankReconciliation"
                :disabled="uploadStatus.bankReconciliation.loading"
                method="post"
              >
                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'bankReconciliation', 'statement')"
                  id="statement"
                  accept=".xlsx"
                  :multiple="false"
                  label="Muat Naik Fail Excel"
                  validation="required"
                  :validation-messages="{
                    required: 'Sila pilih fail untuk dimuat naik'
                  }"
                  class="w-full mb-4"
                />
                <FormKit
                  type="file"
                  @change="(event) => handleFileChange(event, 'bankReconciliation', 'reference')"
                  id="reference"
                  accept=".txt"
                  :multiple="false"
                  label="Muat Naik Fail Rujukan"
                  class="w-full mb-4"
                />
                <div class="flex justify-end">
                  <Button
                    type="submit"
                    :disabled="uploadStatus.bankReconciliation.loading"
                    class="btn"
                  >
                    <Icon
                      :name="uploadStatus.bankReconciliation.loading ? 'eos-icons:loading' : 'material-symbols:upload'"
                      class="mr-2"
                    />
                    {{ uploadStatus.bankReconciliation.loading ? 'Memuat Naik...' : 'Muat Naik' }}
                  </Button>
                </div>
                <p v-if="uploadStatus.bankReconciliation.error" class="text-red-500 mt-2">
                  {{ uploadStatus.bankReconciliation.error }}
                </p>
              </FormKit>

              <!-- Add analyzing state indicator -->
              <div v-if="analyzingStatus.bankReconciliation" class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div class="flex items-center space-x-3">
                  <Icon name="eos-icons:loading" class="w-6 h-6 text-blue-500 animate-spin" />
                  <p class="text-blue-700">Sedang menganalisis dokumen...</p>
                </div>
              </div>

              <!-- Add review section -->
              <div v-else-if="documentReview.bankReconciliation.sections.length > 0" class="mt-8 space-y-6">
                <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Dokumen</h3>
                  <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
                </div>

                <div v-for="(section, sectionIndex) in documentReview.bankReconciliation.sections"
                     :key="sectionIndex"
                     class="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div class="p-4 border-b border-slate-200 bg-slate-50">
                    <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                  </div>
                  
                  <div class="p-4 space-y-4">
                    <div v-for="(issue, issueIndex) in section.issues"
                         :key="issueIndex"
                         class="bg-white rounded-lg p-4 border border-slate-200">
                      <div class="flex items-center gap-2 mb-3">
                        <div :class="{
                          'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                          'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                        }" class="px-3 py-1 rounded-full text-sm font-medium">
                          {{ issue.impactLevel }} Isu
                        </div>
                        <div class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                          {{ issue.faultCategory }}
                        </div>
                      </div>

                      <div class="space-y-2">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 class="text-sm font-medium text-slate-700">Penerangan Isu</h5>
                            <p class="text-slate-600">{{ issue.issueDescription }}</p>
                          </div>
                          <div>
                            <h5 class="text-sm font-medium text-slate-700">Hasil Yang Dijangka</h5>
                            <p class="text-slate-600">{{ issue.expected }}</p>
                          </div>
                        </div>
                        <div class="pt-2">
                          <h5 class="text-sm font-medium text-slate-700">Cadangan Pembetulan</h5>
                          <p class="text-slate-600">{{ issue.suggestedCorrection }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Summary section -->
                <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div class="p-4 border-b border-slate-200 bg-slate-50">
                    <h4 class="text-lg font-medium text-slate-800">Ringkasan Semakan</h4>
                  </div>
                  
                  <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                        <div class="text-red-800 text-2xl font-bold">
                          {{ documentReview.bankReconciliation.summary.totalMajorIssues }}
                        </div>
                        <div class="text-red-600 text-sm">Isu Utama</div>
                      </div>
                      
                      <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <div class="text-yellow-800 text-2xl font-bold">
                          {{ documentReview.bankReconciliation.summary.totalMinorIssues }}
                        </div>
                        <div class="text-yellow-600 text-sm">Isu Kecil</div>
                      </div>
                      
                      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div class="text-blue-800 text-2xl font-bold">
                          {{ documentReview.bankReconciliation.summary.totalRalatDokumen }}
                        </div>
                        <div class="text-blue-600 text-sm">Pembetulan Dokumen</div>
                      </div>
                      
                      <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div class="text-green-800 text-2xl font-bold">
                          {{ documentReview.bankReconciliation.summary.sectionsRequiringRevisions.length }}
                        </div>
                        <div class="text-green-600 text-sm">Bahagian Memerlukan Semakan</div>
                      </div>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-lg">
                      <h5 class="text-sm font-medium text-slate-700 mb-2">Bahagian Memerlukan Semakan:</h5>
                      <div class="flex flex-wrap gap-2">
                        <span v-for="section in documentReview.bankReconciliation.summary.sectionsRequiringRevisions"
                              :key="section"
                              class="bg-white px-3 py-1 rounded-full text-sm text-slate-600 border border-slate-200">
                          {{ section }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 5" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Semakan Keseluruhan</h2>
          
          <!-- Overall Summary Dashboard -->
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
            <div class="p-4 border-b border-slate-200 bg-slate-50">
              <h3 class="text-lg font-medium text-slate-800">Ringkasan Semakan Dokumen</h3>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div class="text-red-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.totalMajorIssues, 0) }}
                  </div>
                  <div class="text-red-600 text-sm">Jumlah Isu Utama</div>
                </div>
                
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div class="text-yellow-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.totalMinorIssues, 0) }}
                  </div>
                  <div class="text-yellow-600 text-sm">Jumlah Isu Kecil</div>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div class="text-blue-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.totalRalatDokumen, 0) }}
                  </div>
                  <div class="text-blue-600 text-sm">Jumlah Pembetulan Dokumen</div>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div class="text-green-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.sectionsRequiringRevisions.length, 0) }}
                  </div>
                  <div class="text-green-600 text-sm">Jumlah Bahagian Memerlukan Semakan</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Document Reviews in Tabs -->
          <div class="bg-white rounded-lg shadow-sm border border-slate-200">
            <div class="p-4">
              <Tabs v-model="activeTab" class="w-full">
                <TabsList class="mb-4">
                  <TabsTrigger value="kunciKiraKira">
                    <div class="flex items-center space-x-2">
                      <span>Kunci Kira Kira</span>
                      <span class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                        {{ documentReview.kunciKiraKira.summary.totalMajorIssues }}
                      </span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="imbanganDuga">
                    <div class="flex items-center space-x-2">
                      <span>Imbangan Duga</span>
                      <span class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                        {{ documentReview.imbanganDuga.summary.totalMajorIssues }}
                      </span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="ledger">
                    <div class="flex items-center space-x-2">
                      <span>Ledger</span>
                      <span class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                        {{ documentReview.ledger.summary.totalMajorIssues }}
                      </span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="bankReconciliation">
                    <div class="flex items-center space-x-2">
                      <span>Penyelarasan Bank</span>
                      <span class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                        {{ documentReview.bankReconciliation.summary.totalMajorIssues }}
                      </span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="kunciKiraKira">
                  <div class="space-y-6">
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Kunci Kira Kira</h3>
                      <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
                    </div>

                    <div v-for="(section, index) in documentReview.kunciKiraKira.sections"
                         :key="index"
                         class="bg-white rounded-lg shadow-sm border border-slate-200">
                      <div class="p-4 border-b border-slate-200 bg-slate-50">
                        <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                      </div>
                      
                      <div class="p-4 space-y-4">
                        <div v-for="(issue, issueIndex) in section.issues"
                             :key="issueIndex"
                             class="bg-slate-50 p-4 rounded-lg">
                          <div class="flex items-center gap-2 mb-2">
                            <span :class="{
                              'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                              'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                            }" class="px-2 py-1 rounded-full text-sm">
                              {{ issue.impactLevel }}
                            </span>
                            <span class="text-slate-600">{{ issue.faultCategory }}</span>
                          </div>
                          <p class="text-slate-700">{{ issue.issueDescription }}</p>
                          <p class="text-slate-600 text-sm mt-1">{{ issue.suggestedCorrection }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="imbanganDuga">
                  <div class="space-y-6">
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Imbangan Duga</h3>
                      <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
                    </div>

                    <div v-for="(section, index) in documentReview.imbanganDuga.sections"
                         :key="index"
                         class="bg-white rounded-lg shadow-sm border border-slate-200">
                      <div class="p-4 border-b border-slate-200 bg-slate-50">
                        <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                      </div>
                      
                      <div class="p-4 space-y-4">
                        <div v-for="(issue, issueIndex) in section.issues"
                             :key="issueIndex"
                             class="bg-slate-50 p-4 rounded-lg">
                          <div class="flex items-center gap-2 mb-2">
                            <span :class="{
                              'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                              'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                            }" class="px-2 py-1 rounded-full text-sm">
                              {{ issue.impactLevel }}
                            </span>
                            <span class="text-slate-600">{{ issue.faultCategory }}</span>
                          </div>
                          <p class="text-slate-700">{{ issue.issueDescription }}</p>
                          <p class="text-slate-600 text-sm mt-1">{{ issue.suggestedCorrection }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ledger">
                  <div class="space-y-6">
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Ledger</h3>
                      <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
                    </div>

                    <div v-for="(section, index) in documentReview.ledger.sections"
                         :key="index"
                         class="bg-white rounded-lg shadow-sm border border-slate-200">
                      <div class="p-4 border-b border-slate-200 bg-slate-50">
                        <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                      </div>
                      
                      <div class="p-4 space-y-4">
                        <div v-for="(issue, issueIndex) in section.issues"
                             :key="issueIndex"
                             class="bg-slate-50 p-4 rounded-lg">
                          <div class="flex items-center gap-2 mb-2">
                            <span :class="{
                              'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                              'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                            }" class="px-2 py-1 rounded-full text-sm">
                              {{ issue.impactLevel }}
                            </span>
                            <span class="text-slate-600">{{ issue.faultCategory }}</span>
                          </div>
                          <p class="text-slate-700">{{ issue.issueDescription }}</p>
                          <p class="text-slate-600 text-sm mt-1">{{ issue.suggestedCorrection }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bankReconciliation">
                  <div class="space-y-6">
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 class="text-xl font-semibold text-slate-800">Analisis Semakan Penyelarasan Bank</h3>
                      <p class="text-slate-600 text-sm mt-1">Semakan menyeluruh dokumen yang dimuat naik dan isu yang dikenal pasti</p>
                    </div>

                    <div v-for="(section, index) in documentReview.bankReconciliation.sections"
                         :key="index"
                         class="bg-white rounded-lg shadow-sm border border-slate-200">
                      <div class="p-4 border-b border-slate-200 bg-slate-50">
                        <h4 class="text-lg font-medium text-slate-800">{{ section.section }}</h4>
                      </div>
                      
                      <div class="p-4 space-y-4">
                        <div v-for="(issue, issueIndex) in section.issues"
                             :key="issueIndex"
                             class="bg-slate-50 p-4 rounded-lg">
                          <div class="flex items-center gap-2 mb-2">
                            <span :class="{
                              'bg-red-100 text-red-700': issue.impactLevel === 'Major',
                              'bg-yellow-100 text-yellow-700': issue.impactLevel === 'Minor'
                            }" class="px-2 py-1 rounded-full text-sm">
                              {{ issue.impactLevel }}
                            </span>
                            <span class="text-slate-600">{{ issue.faultCategory }}</span>
                          </div>
                          <p class="text-slate-700">{{ issue.issueDescription }}</p>
                          <p class="text-slate-600 text-sm mt-1">{{ issue.suggestedCorrection }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <!-- Action Buttons -->
          <!-- <div class="mt-6 flex justify-end space-x-4">
            <Button variant="outline" class="btn">
              <Icon name="material-symbols:download" class="mr-2" />
              Muat Turun Laporan
            </Button>
          </div> -->
        </div>

        <div class="flex justify-between mt-4">
          <Button 
            @click="prevSection" 
            :disabled="currentSection === 0" 
            class="btn"
            :class="{ 'opacity-50 cursor-not-allowed': currentSection === 0 }"
          >
            <Icon name="material-symbols:chevron-left" class="mr-2" />
            Sebelumnya
          </Button>
          <Button 
            v-if="currentSection === sections.length - 1" 
            @click="submitForm" 
            class="btn"
            :disabled="!canProceedToNext"
            :class="{ 'opacity-50 cursor-not-allowed': !canProceedToNext }"
          >
            <Icon name="lsicon:submit-filled" class="mr-2" />
            Hantar
          </Button>
          <Button 
            v-else 
            @click="nextSection" 
            class="btn"
            :disabled="!canProceedToNext"
            :class="{ 'opacity-50 cursor-not-allowed': !canProceedToNext }"
          >
            <Icon name="material-symbols:chevron-right" class="mr-2" />
            Seterusnya
          </Button>
        </div>
      </CardContent>
    </Card>

    <Modal v-model:open="isOpen">
      <ModalHeader>
        <ModalTitle>Penghantaran Borang</ModalTitle>
        <ModalDescription>Borang anda telah dihantar dengan jayanya.</ModalDescription>
      </ModalHeader>
      <ModalBody>
        <p>Terima kasih atas penghantaran anda. Kami akan menyemak permohonan anda dan menghubungi anda tidak lama lagi.</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" @click="isOpen = false">Tutup</Button>
        <!-- <Button @click="refreshPage">Sahkan</Button> -->
      </ModalFooter>
    </Modal>

  </div>
</template>

<style scoped>
@keyframes fade-in-out {
  0% { opacity: 0; transform: translateY(-1rem); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-1rem); }
}

.animate-fade-in-out {
  animation: fade-in-out 3s ease-in-out;
}
</style>
