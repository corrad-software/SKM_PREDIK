export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side
  if (process.server) return;
  
  const user = useSupabaseUser();
  
  // Get userRole from localStorage only on client side
  const userRole = process.client ? localStorage.getItem('userRole') : null;
  
  // If no user is logged in and not on login page, redirect to login
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }
  
  // If user is logged in but trying to access a page not for their role
  if (user.value && userRole) {
    // For Ahli Koperasi users
    if (userRole === 'ahli-kooperasi' && to.path.startsWith('/auditor-skm')) {
      return navigateTo('/ahli-kooperasi/entity-management');
    }
    
    // For Auditor SKM users
    if (userRole === 'auditor-skm' && to.path.startsWith('/ahli-kooperasi')) {
      return navigateTo('/auditor-skm/entity-management');
    }
  }
}); 