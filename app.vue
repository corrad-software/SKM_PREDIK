<script setup>
useSeoMeta({
  title: "PRIDIK",
  description: "Modern UI components for PRIDIK",
});
</script>

<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Toast containers for all positions -->
    <Toast position="top-left" />
    <Toast position="top-right" />
    <Toast position="bottom-left" />
    <Toast position="bottom-right" />
  </div>
</template>
