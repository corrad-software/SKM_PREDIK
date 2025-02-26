<script setup>
definePageMeta({
  layout: "admin",
});

import { ref, onMounted, computed, watch } from 'vue'

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
watch([kooperasiDetails, isParentOrganization], ([newDetails, newIsParent]) => {
  formDataCookie.value = {
    ...newDetails,
    isParentOrganization: newIsParent
  }
}, { deep: true })

// Function to set initial section based on URL parameter
const initializeSection = () => {
  const sectionParam = parseInt(route.query.section)
  if (!isNaN(sectionParam) && sectionParam >= 0 && sectionParam < sections.value.length) {
    currentSection.value = sectionParam
  }
  
  // Set organization type based on route query
  if (isSubsidiary.value) {
    isParentOrganization.value = false
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
onMounted(() => {
  initializeSection()
})

const nextSection = () => {
  if (currentSection.value < sections.value.length - 1) {
    currentSection.value++;
  }
};

const prevSection = () => {
  if (currentSection.value > 0) {
    currentSection.value--;
  }
};

const isOpen = ref(false);

const submitForm = () => {
  isOpen.value = true;
  clearFormData(); // Clear form data after successful submission
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

// Update uploadDocument function to handle both files
const uploadDocument = async (type) => {
  if (!kooperasiDetails.value.subsidiariKoperasi && !isParentOrganization.value) {
    alert('Sila pilih anak syarikat terlebih dahulu');
    return;
  }

  if (!fileAttachments.value[type].statement) {
    alert('Sila pilih fail untuk dimuat naik');
    return;
  }

  uploadStatus.value[type].loading = true;
  uploadStatus.value[type].error = null;

  try {
    const formData = {
      type,
      organization_id: kooperasiDetails.value.subsidiariKoperasi,
      year_current: kooperasiDetails.value.tahunKewanganSemasa,
      year_previous: kooperasiDetails.value.tahunKewanganSebelum,
      state: kooperasiDetails.value.negeri,
      audited_by: kooperasiDetails.value.diauditOleh,
      reviewed_by: kooperasiDetails.value.disemakOleh,
      statement_file: fileAttachments.value[type].statement,
      reference_file: fileAttachments.value[type].reference
    };

    const response = await $fetch('/api/financial-statement/upload', {
      method: 'POST',
      body: formData
    });

    if (response.status === 'success') {
      alert('Dokumen berjaya dimuat naik');
      nextSection();
      // Clear attachments after successful upload
      fileAttachments.value[type] = { statement: null, reference: null };
    } else {
      throw new Error(response.message || 'Failed to upload document');
    }
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    uploadStatus.value[type].error = error.message || 'Gagal memuat naik dokumen';
    alert(uploadStatus.value[type].error);
  } finally {
    uploadStatus.value[type].loading = false;
  }
};

// Update upload handlers to not pass formRef
const uploadKunciKiraKira = () => uploadDocument('kunciKiraKira');
const uploadImbanganDuga = () => uploadDocument('imbanganDuga');
const uploadLedger = () => uploadDocument('ledger');
const uploadBankReconciliation = () => uploadDocument('bankReconciliation');

const processDocuments = () => {
  // Logic to process the uploaded documents and map them to the ledger
  console.log('Processing documents:', accountingDocuments.value);
};

const documentReview = ref({
  kunciKiraKira: {
    sections: [
      {
        section: 'Bahagian 1: Gambaran Keseluruhan Dokumen',
        issues: [
          {
            issueDescription: 'Nilai hilang di baris 5',
            expected: 'Data kewangan lengkap di semua baris',
            suggestedCorrection: 'Isi nilai yang hilang di baris 5',
            faultCategory: 'Data Tidak Lengkap',
            impactLevel: 'Kecil'
          },
          {
            issueDescription: 'Data tidak konsisten di lajur B',
            expected: 'Format data yang konsisten di seluruh lajur',
            suggestedCorrection: 'Standardkan format data di lajur B',
            faultCategory: 'Ketidakkonsistenan Data',
            impactLevel: 'Kecil'
          }
        ]
      }
    ],
    summary: {
      totalMajorIssues: 0,
      totalMinorIssues: 2,
      totalRalatDokumen: 0,
      sectionsRequiringRevisions: ['Gambaran Keseluruhan Dokumen']
    }
  },
  imbanganDuga: { sections: [], summary: { totalMajorIssues: 0, totalMinorIssues: 0, totalRalatDokumen: 0, sectionsRequiringRevisions: [] } },
  ledger: { sections: [], summary: { totalMajorIssues: 0, totalMinorIssues: 0, totalRalatDokumen: 0, sectionsRequiringRevisions: [] } },
  bankReconciliation: { sections: [], summary: { totalMajorIssues: 0, totalMinorIssues: 0, totalRalatDokumen: 0, sectionsRequiringRevisions: [] } }
});

const isReviewVisible = computed(() => {
  return accountingDocuments.value.kunciKiraKira && accountingDocuments.value.kunciKiraKiraFailRujukan;
});

// Add new data for dropdowns
const kooperasiList = ref([
  { id: 1, name: 'Koperasi Permodalan Felda Malaysia Berhad', hasSubsidiaries: true },
  { id: 2, name: 'Koperasi Peserta-Peserta Felcra Malaysia Berhad', hasSubsidiaries: false },
  { id: 3, name: 'Koperasi Serbaguna Iman Malaysia Berhad', hasSubsidiaries: true },
  { id: 4, name: 'Bank Kerjasama Rakyat Malaysia Berhad', hasSubsidiaries: true },
]);

const PARENT_ORGANIZATION_ID = '3df46589-5c74-45d2-a436-4291ddc6fdde'

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

// Update subsidiaries data structure to use API data
const subsidiaryOptions = computed(() => {
  return subsidiaries.value.map(subsidiary => ({
    label: subsidiary.name,
    value: subsidiary.id
  }))
})

// Initialize data on component mount
onMounted(async () => {
  initializeSection()
  await fetchSubsidiaries()
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
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">{{ pageTitle }}</h1>
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
            <div class="mt-8 space-y-6">
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

          <!-- Document-wise Review Sections -->
          <div class="space-y-6">
            <!-- Kunci Kira Kira Review -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
              <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 class="text-lg font-medium text-slate-800">Semakan Kunci Kira Kira</h3>
                <div class="flex gap-2">
                  <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {{ documentReview.kunciKiraKira.summary.totalMajorIssues }} Utama
                  </span>
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    {{ documentReview.kunciKiraKira.summary.totalMinorIssues }} Kecil
                  </span>
                </div>
              </div>
              <div class="p-4">
                <div v-for="(section, index) in documentReview.kunciKiraKira.sections"
                     :key="index"
                     class="mb-4 last:mb-0">
                  <h4 class="font-medium text-slate-700 mb-2">{{ section.section }}</h4>
                  <div class="space-y-3">
                    <div v-for="(issue, issueIndex) in section.issues"
                         :key="issueIndex"
                         class="bg-slate-50 p-3 rounded-lg">
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
            </div>

            <!-- Imbangan Duga Review -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
              <!-- Similar structure as Kunci Kira Kira, but with Imbangan Duga data -->
              <!-- ... -->
            </div>

            <!-- Ledger Review -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
              <!-- Similar structure as above, but with Ledger data -->
              <!-- ... -->
            </div>

            <!-- Bank Reconciliation Review -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
              <!-- Similar structure as above, but with Bank Reconciliation data -->
              <!-- ... -->
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex justify-end space-x-4">
            <Button variant="outline" class="btn">
              <Icon name="material-symbols:download" class="mr-2" />
              Muat Turun Laporan
            </Button>
          </div>
        </div>

        <div class="flex justify-between mt-4">
          <Button @click="prevSection" :disabled="currentSection === 0" class="btn"><Icon name="material-symbols:chevron-left" class="mr-2"></Icon>Sebelumnya</Button>
          <Button v-if="currentSection === sections.length - 1" @click="submitForm" class="btn"><Icon name="lsicon:submit-filled" class="mr-2"></Icon>Hantar</Button>
          <Button v-else @click="nextSection" class="btn"><Icon name="material-symbols:chevron-right" class="mr-2"></Icon>Seterusnya</Button>
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
        <Button @click="refreshPage">Sahkan</Button>
      </ModalFooter>
    </Modal>

  </div>
</template>
