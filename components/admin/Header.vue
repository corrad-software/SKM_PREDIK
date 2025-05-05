<script setup>
import { createClient } from '@supabase/supabase-js'

const props = defineProps({
  isMinimized: {
    type: Boolean,
    default: false,
  },
});

const layoutStore = useLayoutStore();
const isRTL = computed(() => layoutStore.isRTL);

defineEmits(["toggle"]);

const unreadCount = 2;

// Create Supabase client directly instead of using useSupabaseClient
const config = useRuntimeConfig();
const supabaseUrl = config.public.supabaseUrl;
const supabaseKey = config.public.supabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = useRouter();
const { add: toast } = useToast();

// Get user information from localStorage
const userRole = ref(localStorage.getItem('userRole') || '');
const userName = ref('');
const userEmail = ref(localStorage.getItem('userEmail') || '');

// Set user display name based on email
onMounted(() => {
  // Instead of useSupabaseUser, check session directly
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      userEmail.value = data.session.user.email;
      
      // Set name based on email like in login page
      if (userEmail.value === 'koperasi@skm.my') {
        userName.value = 'Ahli Koperasi';
      } else if (userEmail.value === 'auditor@skm.my') {
        userName.value = 'Auditor SKM';
      } else {
        userName.value = userEmail.value;
      }
    } else {
      // Fallback to localStorage value if no session
      if (userEmail.value) {
        if (userEmail.value === 'koperasi@skm.my') {
          userName.value = 'Ahli Koperasi';
        } else if (userEmail.value === 'auditor@skm.my') {
          userName.value = 'Auditor SKM';
        } else {
          userName.value = userEmail.value;
        }
      }
    }
  });
});

// Handle logout action
const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear user data from localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    
    toast({
      title: "Success",
      description: "Logged out successfully",
      variant: "success",
    });
    
    // Redirect to login page
    router.push('/login');
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Logout failed",
      variant: "destructive",
    });
  }
};
</script>

<template>
  <header
    class="sticky top-0 h-14 bg-background border-b px-3 flex items-center gap-3 z-[45]"
    :class="[isRTL ? 'flex-row-reverse' : 'flex-row']"
  >
    <!-- Left side -->
    <button
      @click="$emit('toggle')"
      :class="[
        'p-1.5 hover:bg-accent rounded-lg flex items-center justify-center',
        isRTL ? 'order-last' : 'order-first',
      ]"
    >
      <Icon name="mdi:menu" class="w-4 h-4" />
    </button>

    <!-- Right side -->
    <div
      class="flex items-center gap-2"
      :class="[isRTL ? 'mr-auto' : 'ml-auto']"
    >
      <!-- Theme Switcher -->
      <!-- <ThemeSwitcher /> -->

      <!-- Notification -->
      <!-- <Dropdown>
        <DropdownTrigger class="relative">
          <button
            class="p-1.5 hover:bg-accent rounded-lg flex items-center justify-center"
          >
            <Icon name="mdi:bell" class="w-5 h-5" />
            <span
              v-if="unreadCount"
              :class="[
                'absolute top-0.5 w-3.5 h-3.5 bg-danger rounded-full text-[10px] text-danger-foreground flex items-center justify-center',
                isRTL ? 'left-0.5' : 'right-0.5',
              ]"
            >
              {{ unreadCount }}
            </span>
          </button>
        </DropdownTrigger>
        <DropdownContent class="w-80">
          <div class="px-3 py-2 border-b">
            <h3 class="font-semibold text-sm">Notifications</h3>
          </div>
          <div class="py-1.5">
            <DropdownItem>
              <div class="flex items-start gap-3">
                <div class="p-1 bg-primary/10 rounded">
                  <Icon name="mdi:email" class="w-3.5 h-3.5 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">New message received</p>
                  <p class="text-xs text-muted-foreground truncate">
                    You have a new message from John Doe
                  </p>
                </div>
                <p class="text-xs text-muted-foreground">2m ago</p>
              </div>
            </DropdownItem>
            <DropdownItem>
              <div class="flex items-start gap-3">
                <div class="p-1 bg-success/10 rounded">
                  <Icon
                    name="mdi:check-circle"
                    class="w-3.5 h-3.5 text-success"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">Task completed</p>
                  <p class="text-xs text-muted-foreground truncate">
                    Project X has been successfully deployed
                  </p>
                </div>
                <p class="text-xs text-muted-foreground">1h ago</p>
              </div>
            </DropdownItem>
          </div>
          <div class="px-3 py-2 border-t text-center">
            <NuxtLink
              to="#"
              class="text-xs text-primary hover:text-primary/90"
            >
              View all notifications
            </NuxtLink>
          </div>
        </DropdownContent>
      </Dropdown> -->

      <!-- User Profile -->
      <Dropdown>
        <DropdownTrigger>
          <button
            class="flex items-center gap-2 p-1 hover:bg-accent rounded-lg ml-auto"
          >
            <div
              class="w-7 h-7 rounded-full border flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 256 256"
              >
                <path
                  fill="currentColor"
                  d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24M74.08 197.5a64 64 0 0 1 107.84 0a87.83 87.83 0 0 1-107.84 0M96 120a32 32 0 1 1 32 32a32 32 0 0 1-32-32m97.76 66.41a79.66 79.66 0 0 0-36.06-28.75a48 48 0 1 0-59.4 0a79.66 79.66 0 0 0-36.06 28.75a88 88 0 1 1 131.52 0"
                />
              </svg>
            </div>
            <div class="flex flex-col items-start">
              <span class="text-sm font-medium">{{ userName }}</span>
              <span class="text-xs text-muted-foreground">{{ userRole }}</span>
            </div>
            <Icon name="mdi:chevron-down" class="w-4 h-4" />
          </button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem @click="handleLogout">
            <div class="flex items-center gap-2">
              <Icon name="mdi:logout" class="w-4 h-4" />
              <span class="text-sm">Log out</span>
            </div>
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  </header>
</template>
