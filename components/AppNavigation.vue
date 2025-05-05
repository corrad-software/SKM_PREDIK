<script setup>
import adminMenu from '~/navigation/admin.json';

const userRole = ref('');

onMounted(() => {
  // Get user role from localStorage
  userRole.value = localStorage.getItem('userRole') || '';
  console.log('Current user role:', userRole.value); // For debugging
  console.log('Original menu:', adminMenu.menu); // Log original menu structure
});

const filteredMenu = computed(() => {
  console.log('Computing filtered menu for role:', userRole.value);
  
  if (!userRole.value) {
    console.log('No user role found, returning empty array');
    return [];
  }
  
  // Filter sections and their items based on user role
  const result = adminMenu.menu
    .map(section => {
      console.log('Processing section:', section.title);
      
      // Filter items within the section based on user role
      const filteredItems = section.items.filter(item => {
        console.log('Checking item:', item.name, 'roles:', item.roles, 'includes user role:', item.roles?.includes(userRole.value));
        return item.roles?.includes(userRole.value);
      });
      
      console.log('Filtered items for section:', section.title, filteredItems);
      
      // Return section with filtered items if there are any visible items
      if (filteredItems.length > 0) {
        return {
          ...section,
          items: filteredItems
        };
      }
      return null;
    })
    .filter(section => section !== null);
    
  console.log('Final filtered menu:', result);
  return result;
});

// Watch for changes in the filtered menu
watch(filteredMenu, (newMenu) => {
  console.log('Filtered menu updated:', newMenu);
}, { immediate: true });
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