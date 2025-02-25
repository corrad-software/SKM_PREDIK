<script setup>
definePageMeta({
  layout: "admin",
});

const sections = ref(['Butiran Koperasi', 'Kunci Kira Kira', 'Imbangan Duga', 'Ledger', 'Bank Reconciliation', 'Overall Review']);
const currentSection = ref(0);

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
        section: 'Section 1: Document Overview',
        issues: [
          {
            issueDescription: 'Missing value in row 5',
            expected: 'Complete financial data in all rows',
            suggestedCorrection: 'Fill in the missing value in row 5',
            faultCategory: 'Incomplete Data',
            impactLevel: 'Minor'
          },
          {
            issueDescription: 'Inconsistent data in column B',
            expected: 'Consistent data format throughout the column',
            suggestedCorrection: 'Standardize the data format in column B',
            faultCategory: 'Data Inconsistency',
            impactLevel: 'Minor'
          }
        ]
      }
    ],
    summary: {
      totalMajorIssues: 0,
      totalMinorIssues: 2,
      totalRalatDokumen: 0,
      sectionsRequiringRevisions: ['Document Overview']
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
                <h3 class="text-xl font-semibold text-slate-800">Document Review Analysis</h3>
                <p class="text-slate-600 text-sm mt-1">Comprehensive review of uploaded documents and identified issues</p>
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
                        {{ issue.impactLevel }} Issue
                      </div>
                      <div class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                        {{ issue.faultCategory }}
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 class="text-sm font-medium text-slate-700">Issue Description</h5>
                          <p class="text-slate-600">{{ issue.issueDescription }}</p>
                        </div>
                        <div>
                          <h5 class="text-sm font-medium text-slate-700">Expected Result</h5>
                          <p class="text-slate-600">{{ issue.expected }}</p>
                        </div>
                      </div>
                      <div class="pt-2">
                        <h5 class="text-sm font-medium text-slate-700">Suggested Correction</h5>
                        <p class="text-slate-600">{{ issue.suggestedCorrection }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                <div class="p-4 border-b border-slate-200 bg-slate-50">
                  <h4 class="text-lg font-medium text-slate-800">Review Summary</h4>
                </div>
                
                <div class="p-4">
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                      <div class="text-red-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.totalMajorIssues }}
                      </div>
                      <div class="text-red-600 text-sm">Major Issues</div>
                    </div>
                    
                    <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <div class="text-yellow-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.totalMinorIssues }}
                      </div>
                      <div class="text-yellow-600 text-sm">Minor Issues</div>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div class="text-blue-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.totalRalatDokumen }}
                      </div>
                      <div class="text-blue-600 text-sm">Document Corrections</div>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div class="text-green-800 text-2xl font-bold">
                        {{ documentReview.kunciKiraKira.summary.sectionsRequiringRevisions.length }}
                      </div>
                      <div class="text-green-600 text-sm">Sections Needing Review</div>
                    </div>
                  </div>

                  <div class="bg-slate-50 p-4 rounded-lg">
                    <h5 class="text-sm font-medium text-slate-700 mb-2">Sections Requiring Revisions:</h5>
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
              <h3 class="text-lg font-semibold">Current Document Review</h3>
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
              <h3 class="text-lg font-semibold">Current Document Review</h3>
              <p v-if="accountingDocuments.ledger">Ledger: {{ accountingDocuments.ledger.name }}</p>
              <p v-if="accountingDocuments.ledgerFailRujukan">Fail Rujukan: {{ accountingDocuments.ledgerFailRujukan.name }}</p>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 4" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Bank Reconciliation</h2>
          <Card class="mb-4">
            <CardContent>
              <FormKit type="file" label="Bank Reconciliation" v-model="accountingDocuments.bankReconciliation" class="w-full mb-4" />
              <FormKit type="file" label="Fail Rujukan" v-model="accountingDocuments.bankReconciliationFailRujukan" class="w-full mb-4" />
            </CardContent>
          </Card>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Current Document Review</h3>
              <p v-if="accountingDocuments.bankReconciliation">Bank Reconciliation: {{ accountingDocuments.bankReconciliation.name }}</p>
              <p v-if="accountingDocuments.bankReconciliationFailRujukan">Fail Rujukan: {{ accountingDocuments.bankReconciliationFailRujukan.name }}</p>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 5" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Overall Review</h2>
          
          <!-- Overall Summary Dashboard -->
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
            <div class="p-4 border-b border-slate-200 bg-slate-50">
              <h3 class="text-lg font-medium text-slate-800">Document Review Summary</h3>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div class="text-red-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.totalMajorIssues, 0) }}
                  </div>
                  <div class="text-red-600 text-sm">Total Major Issues</div>
                </div>
                
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div class="text-yellow-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.totalMinorIssues, 0) }}
                  </div>
                  <div class="text-yellow-600 text-sm">Total Minor Issues</div>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div class="text-blue-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.totalRalatDokumen, 0) }}
                  </div>
                  <div class="text-blue-600 text-sm">Total Document Corrections</div>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div class="text-green-800 text-2xl font-bold">
                    {{ Object.values(documentReview).reduce((acc, doc) => acc + doc.summary.sectionsRequiringRevisions.length, 0) }}
                  </div>
                  <div class="text-green-600 text-sm">Total Sections Needing Review</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Document-wise Review Sections -->
          <div class="space-y-6">
            <!-- Kunci Kira Kira Review -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
              <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 class="text-lg font-medium text-slate-800">Kunci Kira Kira Review</h3>
                <div class="flex gap-2">
                  <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {{ documentReview.kunciKiraKira.summary.totalMajorIssues }} Major
                  </span>
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    {{ documentReview.kunciKiraKira.summary.totalMinorIssues }} Minor
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
              Download Report
            </Button>
          </div>
        </div>

        <div class="flex justify-between mt-4">
          <Button @click="prevSection" :disabled="currentSection === 0" class="btn"><Icon name="material-symbols:chevron-left" class="mr-2"></Icon>Previous</Button>
          <Button v-if="currentSection === sections.length - 1" @click="submitForm" class="btn"><Icon name="lsicon:submit-filled" class="mr-2"></Icon>Submit</Button>
          <Button v-else @click="nextSection" class="btn"><Icon name="material-symbols:chevron-right" class="mr-2"></Icon>Next</Button>
        </div>
      </CardContent>
    </Card>

    <Modal v-model:open="isOpen">
      <ModalHeader>
        <ModalTitle>Form Submission</ModalTitle>
        <ModalDescription>Your form has been submitted successfully.</ModalDescription>
      </ModalHeader>
      <ModalBody>
        <p>Thank you for your submission. We will review your application and get back to you shortly.</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" @click="isOpen = false">Close</Button>
        <Button @click="refreshPage">Affirmative</Button>
      </ModalFooter>
    </Modal>

  </div>
</template>
