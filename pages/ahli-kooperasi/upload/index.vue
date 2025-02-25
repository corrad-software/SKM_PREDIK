<script setup>
definePageMeta({
  layout: "admin",
});

import { ref, onMounted, computed } from 'vue'

const route = useRoute()
const sections = ref(['Butiran Koperasi', 'Kunci Kira Kira', 'Imbangan Duga', 'Ledger', 'Bank Reconciliation', 'Overall Review']);
const currentSection = ref(0);

// Get subsidiary parameters from route
const isSubsidiary = computed(() => route.query.isSubsidiary === '1')
const subsidiaryIndex = computed(() => {
  const index = parseInt(route.query.subsidiaryIndex)
  return !isNaN(index) ? index : null
})

// Function to set initial section based on URL parameter
const initializeSection = () => {
  const sectionParam = parseInt(route.query.section)
  if (!isNaN(sectionParam) && sectionParam >= 0 && sectionParam < sections.value.length) {
    currentSection.value = sectionParam
  }
}

// Update page title based on whether we're uploading for subsidiary
const pageTitle = computed(() => {
  return isSubsidiary.value 
    ? `Muat Naik Dokumen Audit - Anak Syarikat ${subsidiaryIndex.value + 1}`
    : 'Muat Naik Dokumen Audit'
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

const kooperasiDetails = ref({
  namaKoperasi: '',
  subsidiariKoperasi: '',
  negeri: '',
  tahunKewanganSemasa: '',
  tahunKewanganSebelum: '',
  diauditOleh: '',
  disemakOleh: ''
});

// Add new data for dropdowns
const kooperasiList = ref([
  { id: 1, name: 'Koperasi Permodalan Felda Malaysia Berhad', hasSubsidiaries: true },
  { id: 2, name: 'Koperasi Peserta-Peserta Felcra Malaysia Berhad', hasSubsidiaries: false },
  { id: 3, name: 'Koperasi Serbaguna Iman Malaysia Berhad', hasSubsidiaries: true },
  { id: 4, name: 'Bank Kerjasama Rakyat Malaysia Berhad', hasSubsidiaries: true },
]);

const subsidiariList = ref({
  1: [ // Felda subsidiaries
    'Felda Trading Sdn Bhd',
    'Felda Investment Corporation',
    'Felda Global Ventures Holdings'
  ],
  3: [ // Koperasi Serbaguna subsidiaries
    'Iman Developments Sdn Bhd',
    'Iman Properties Berhad'
  ],
  4: [ // Bank Rakyat subsidiaries
    'Rakyat Holdings Sdn Bhd',
    'Rakyat Management Services'
  ]
});

const selectedKoperasi = ref(null);
const showSubsidiaries = computed(() => {
  if (!selectedKoperasi.value) return false;
  const selected = kooperasiList.value.find(k => k.id === selectedKoperasi.value);
  return selected?.hasSubsidiaries;
});

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
              <FormKit
                type="select"
                label="Nama Koperasi"
                v-model="selectedKoperasi"
                :options="kooperasiList.map(k => ({ label: k.name, value: k.id }))"
                placeholder="Pilih Koperasi"
                class="w-full mb-4"
              />
              
              <FormKit
                v-if="showSubsidiaries"
                type="select"
                label="Subsidiari Koperasi"
                v-model="kooperasiDetails.subsidiariKoperasi"
                :options="subsidiariList[selectedKoperasi]?.map(s => ({ label: s, value: s })) || []"
                placeholder="Pilih Subsidiari"
                class="w-full mb-4"
              />
              
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
              <FormKit type="file" label="Kunci Kira Kira" v-model="accountingDocuments.kunciKiraKira" class="w-full mb-4" />
              <FormKit type="file" label="Fail Rujukan" v-model="accountingDocuments.kunciKiraKiraFailRujukan" class="w-full" />
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
              <FormKit type="file" label="Imbangan Duga" v-model="accountingDocuments.imbanganDuga" class="w-full mb-4" />
              <FormKit type="file" label="Fail Rujukan" v-model="accountingDocuments.imbanganDugaFailRujukan" class="w-full mb-4" />
            </CardContent>
          </Card>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Semakan Dokumen Semasa</h3>
              <p v-if="accountingDocuments.imbanganDuga">Imbangan Duga: {{ accountingDocuments.imbanganDuga.name }}</p>
              <p v-if="accountingDocuments.imbanganDugaFailRujukan">Fail Rujukan: {{ accountingDocuments.imbanganDugaFailRujukan.name }}</p>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 3" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Ledger</h2>
          <Card class="mb-4">
            <CardContent>
              <FormKit type="file" label="Ledger" v-model="accountingDocuments.ledger" class="w-full mb-4" />
              <FormKit type="file" label="Fail Rujukan" v-model="accountingDocuments.ledgerFailRujukan" class="w-full mb-4" />
            </CardContent>
          </Card>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Semakan Dokumen Semasa</h3>
              <p v-if="accountingDocuments.ledger">Ledger: {{ accountingDocuments.ledger.name }}</p>
              <p v-if="accountingDocuments.ledgerFailRujukan">Fail Rujukan: {{ accountingDocuments.ledgerFailRujukan.name }}</p>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 4" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Penyelarasan Bank</h2>
          <Card class="mb-4">
            <CardContent>
              <FormKit type="file" label="Penyelarasan Bank" v-model="accountingDocuments.bankReconciliation" class="w-full mb-4" />
              <FormKit type="file" label="Fail Rujukan" v-model="accountingDocuments.bankReconciliationFailRujukan" class="w-full mb-4" />
            </CardContent>
          </Card>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Semakan Dokumen Semasa</h3>
              <p v-if="accountingDocuments.bankReconciliation">Penyelarasan Bank: {{ accountingDocuments.bankReconciliation.name }}</p>
              <p v-if="accountingDocuments.bankReconciliationFailRujukan">Fail Rujukan: {{ accountingDocuments.bankReconciliationFailRujukan.name }}</p>
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
