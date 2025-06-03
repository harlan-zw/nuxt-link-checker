export default defineNuxtPlugin(() => {
  // Only run on client-side
  const router = useRouter()

  let hasInitialized = false

  // Save route on navigation
  router.afterEach((to) => {
    try {
      if (hasInitialized) {
        localStorage.setItem('nuxt-analyze:lastRoute', to.fullPath)
      }
    }
    catch (e) {
      console.warn('Failed to save route to localStorage:', e)
    }
  })

  // Check for saved route on initial load
  const savedRoute = localStorage.getItem('nuxt-analyze:lastRoute')
  // Only redirect if there's a saved route different from current
  if (savedRoute) {
    setTimeout(() => {
      Promise.resolve(navigateTo(savedRoute)).then(() => {
        hasInitialized = true
      })
    }, 100)
  }
})
