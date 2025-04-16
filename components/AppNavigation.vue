<script setup>
import adminMenu from '~/navigation/admin.json';

const userRole = ref('');

onMounted(() => {
  // Get user role from localStorage
  userRole.value = localStorage.getItem('userRole') || '';
  console.log('Current user role:', userRole.value); // For debugging
});

const filteredMenu = computed(() => {
  if (!userRole.value) return adminMenu.menu; // Show all if no role (you might want to change this)
  
  // Filter sections based on user role
  return adminMenu.menu.filter(section => {
    if (userRole.value === 'ahli-kooperasi' && section.title === 'Ahli Koperasi') {
      return true;
    }
    if (userRole.value === 'auditor-skm' && section.title === 'Auditor SKM') {
      return true;
    }
    return false;
  });
});
</script>

<template>
  <div>
    <div v-for="(section, index) in filteredMenu" :key="index">
      <h3 class="text-sm font-medium mb-2">{{ section.title }}</h3>
      <ul class="space-y-1 mb-6">
        <li v-for="(item, itemIndex) in section.items" :key="itemIndex">
          <NuxtLink 
            :to="item.path" 
            class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
            active-class="bg-accent text-accent-foreground"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            <span>{{ item.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template> 