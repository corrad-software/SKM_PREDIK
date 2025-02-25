<script setup>
const { add: toast } = useToast();

const handleLogin = async (formData) => {
  try {
    navigateTo("/ahli-kooperasi/upload");
    // toast({
    //   title: "Success",
    //   description: "Login successful",
    //   variant: "success",
    // });
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Login failed",
      variant: "destructive",
    });
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
        <div class="p-0.5">⌘</div>
        Corrad
      </div>

      <!-- Testimonial section - positioned at bottom -->
      <div class="mt-auto">
        <blockquote
          class="text-xl lg:text-2xl font-medium leading-relaxed mb-3"
        >
          "This library has saved me countless hours of work and helped me
          deliver stunning designs to my clients faster than ever before."
        </blockquote>
        <p class="text-sm text-muted-foreground">Sofia Davis</p>
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
            type="text"
            name="email"
            placeholder="name@example.com"
            label="Email"
          />

          <FormKit
            type="password"
            name="password"
            placeholder="Enter your password"
            label="Password"
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
          >
            Sign In
          </Button>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t"></span>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-card px-2 text-muted-foreground"
                >Or continue with</span
              >
            </div>
          </div>

          <div class="space-y-2">
            <Button variant="outline" class="w-full h-9" type="button">
              <Icon name="mdi:google" class="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" class="w-full h-9" type="button">
              <Icon name="mdi:github" class="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
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
