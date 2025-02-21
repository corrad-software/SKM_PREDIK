<script setup>
definePageMeta({
  layout: "admin",
});

const sections = ref(['Kunci Kira Kira', 'Imbangan Duga', 'Ledger', 'Bank Reconciliation', 'Overall Review']);
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
  kunciKiraKira: [
    { type: 'Error', comment: 'Missing value in row 5', location: 'Sheet1!A5' },
    { type: 'Warning', comment: 'Inconsistent data in column B', location: 'Sheet1!B2:B10' }
  ],
  // ...other document reviews...
});

const isReviewVisible = computed(() => {
  return accountingDocuments.value.kunciKiraKira && accountingDocuments.value.kunciKiraKiraFailRujukan;
});
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
          <h2 class="text-xl font-semibold my-4">Kunci Kira Kira</h2>
          <Card class="p-2">
            <CardContent>
              <FormKit type="file" label="Kunci Kira Kira" v-model="accountingDocuments.kunciKiraKira" class="w-full mb-4" />
              <FormKit type="file" label="Fail Rujukan" v-model="accountingDocuments.kunciKiraKiraFailRujukan" class="w-full" />
            </CardContent>
          </Card>
          <Card v-if="isReviewVisible" class="mt-4 p-2">
            <CardContent>
              <h3 class="text-lg font-semibold">Current Document Review</h3>
              <table class="min-w-full bg-white">
                <thead>
                  <tr>
                    <th class="py-2">Type</th>
                    <th class="py-2">Comments</th>
                    <th class="py-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(review, index) in documentReview.kunciKiraKira" :key="index">
                    <td class="border px-4 py-2">{{ review.type }}</td>
                    <td class="border px-4 py-2">{{ review.comment }}</td>
                    <td class="border px-4 py-2">{{ review.location }}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentSection === 1" class="mb-4">
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

        <div v-if="currentSection === 2" class="mb-4">
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

        <div v-if="currentSection === 3" class="mb-4">
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

        <div v-if="currentSection === 4" class="mb-4">
          <h2 class="text-xl font-semibold my-4">Overall Review</h2>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Kunci Kira Kira</h3>
              <table class="min-w-full bg-white">
                <thead>
                  <tr>
                    <th class="py-2">Type</th>
                    <th class="py-2">Comments</th>
                    <th class="py-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(review, index) in documentReview.kunciKiraKira" :key="index">
                    <td class="border px-4 py-2">{{ review.type }}</td>
                    <td class="border px-4 py-2">{{ review.comment }}</td>
                    <td class="border px-4 py-2">{{ review.location }}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Imbangan Duga</h3>
              <p v-if="accountingDocuments.imbanganDuga">Imbangan Duga: {{ accountingDocuments.imbanganDuga.name }}</p>
              <p v-if="accountingDocuments.imbanganDugaFailRujukan">Fail Rujukan: {{ accountingDocuments.imbanganDugaFailRujukan.name }}</p>
            </CardContent>
          </Card>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Ledger</h3>
              <p v-if="accountingDocuments.ledger">Ledger: {{ accountingDocuments.ledger.name }}</p>
              <p v-if="accountingDocuments.ledgerFailRujukan">Fail Rujukan: {{ accountingDocuments.ledgerFailRujukan.name }}</p>
            </CardContent>
          </Card>
          <Card class="mt-4">
            <CardContent>
              <h3 class="text-lg font-semibold">Bank Reconciliation</h3>
              <p v-if="accountingDocuments.bankReconciliation">Bank Reconciliation: {{ accountingDocuments.bankReconciliation.name }}</p>
              <p v-if="accountingDocuments.bankReconciliationFailRujukan">Fail Rujukan: {{ accountingDocuments.bankReconciliationFailRujukan.name }}</p>
            </CardContent>
          </Card>
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
