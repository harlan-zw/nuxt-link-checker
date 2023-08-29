export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/redirect') {
    return navigateTo('/redirected')
  }
})
