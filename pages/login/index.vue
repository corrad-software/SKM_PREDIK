<script setup>
import { createClient } from '@supabase/supabase-js'
const { add: toast } = useToast();

// Use runtime config instead of process.env
const config = useRuntimeConfig();
console.log('Runtime config:', config.public);

const supabaseUrl = config.public.supabaseUrl;
const supabaseKey = config.public.supabaseKey;

console.log('Using Supabase URL from config:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Create Supabase client with explicit values
const supabase = createClient(supabaseUrl, supabaseKey);

const router = useRouter();

// Form loading state
const isLoading = ref(false);

const handleLogin = async (formData) => {
  try {
    isLoading.value = true;
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) throw error;
    
    // Get user role based on email
    let redirectPath = '';
    let userRole = '';
    
    if (formData.email === 'koperasi@skm.my') {
      redirectPath = '/ahli-kooperasi/entity-management';
      userRole = 'ahli-kooperasi';
    } else if (formData.email === 'auditor@skm.my') {
      redirectPath = '/auditor-skm/entity-management';
      userRole = 'auditor-skm';
    } else {
      // Default fallback - you might want to handle this differently
      redirectPath = '/ahli-kooperasi/upload';
      userRole = 'ahli-kooperasi';
    }
    
    // Store user role in localStorage for navigation filtering
    localStorage.setItem('userRole', userRole);
    
    toast({
      title: "Success",
      description: "Login successful",
      variant: "success",
    });
    
    // Navigate to the appropriate page based on role
    navigateTo(redirectPath);
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Login failed",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen grid md:grid-cols-2">
    <!-- Left side - Dark section with testimonial -->
    <div
      class="hidden md:flex flex-col bg-accent text-accent-foreground p-6 lg:p-8 relative"
    >
      <!-- Logo section -->
      <div class="flex items-center gap-2 text-base">
        <img
            src="\assets\image\skm-logo.png"
            alt="Logo"
            class="w-8 h-8 rounded-md"
          />
        PREDIK SKM
      </div>


    </div>

    <!-- Right side - Login form -->
    <div class="flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-card">
      <!-- Top right register link -->
      <div class="text-right">
        <NuxtLink
          to="/register"
          class="text-sm text-muted-foreground hover:text-foreground"
        >
          Register
        </NuxtLink>
      </div>

      <!-- Form section -->
      <div class="w-full max-w-sm mx-auto">
        <h1 class="text-2xl font-semibold mb-2">Welcome back</h1>
        <p class="text-sm text-muted-foreground mb-6">
          Enter your credentials to access your account
        </p>

        <FormKit
          type="form"
          :actions="false"
          @submit="handleLogin"
        >
          <FormKit
            type="email"
            name="email"
            placeholder="name@example.com"
            label="Email"
            validation="required|email"
          />

          <FormKit
            type="password"
            name="password"
            placeholder="Enter your password"
            label="Password"
            validation="required"
          />

          <div class="flex items-start justify-between">
            <FormKit type="checkbox" name="remember" label="Remember me" />
            <NuxtLink
              to="/forgot-password"
              class="text-sm text-gray-500 hover:text-gray-800"
            >
              Forgot password?
            </NuxtLink>
          </div>

          <Button
            type="submit"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Signing in...</span>
            <span v-else>Sign In</span>
          </Button>

        </FormKit>

        <!-- Terms text -->
        <p class="text-xs text-muted-foreground mt-6">
          Don't have an account?
          <NuxtLink to="/register" class="underline hover:text-foreground"
            >Create an account</NuxtLink
          >
        </p>
      </div>

      <div></div>
      <!-- Spacer for flex alignment -->
    </div>
  </div>
</template>
