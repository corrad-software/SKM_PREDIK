<script setup>
defineOptions({ name: "TableHead" });
</script>

<template>
  <th
    class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
  >
    <slot />
  </th>
</template>
