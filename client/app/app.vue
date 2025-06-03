<script setup lang="ts">
import { useAuditStore } from '#imports'
import { ref } from 'vue'

const rpcConnected = ref(false)

const auditStore = useAuditStore()
const currentAudit = useActiveAudit()
watch(auditStore, () => {
  if (auditStore.value) {
    rpcConnected.value = true
  }
  console.log({ auditStore: auditStore.value })
})
</script>

<template>
  <UApp>
    <header class="backdrop-blur top-0 z-2 border-none bg-transparent pt-2 px-5 h-auto">
      <UContainer class="max-w-[1000px] lg:bg-gray-600/3 lg:border border-[var(--ui-border)] lg:dark:bg-gray-900/10 mx-auto py-0 px-0 lg:px-5 sm:px-0 rounded-lg">
        <div class="flex justify-between items-center gap-5 w-full">
          <UButton to="/" variant="link">
            <h1 class="text-xl flex items-center gap-2 text-[var(--ui-text)] font-medium">
              <UIcon name="i-carbon-ibm-engineering-test-mgmt" class="text-blue-300 hidden md:block" />
              Nuxt Analyze <UBadge color="neutral" variant="soft" size="sm" class="hidden md:block">
                {{ data?.runtimeConfig?.version || 'v0.1.0' }}
              </UBadge>
            </h1>

            <UBadge color="info" variant="soft" size="sm" class="hidden md:block">
              Early Access
            </UBadge>
          </UButton>
          <div class="flex items-center justify-end space-x-3 flex-grow">
            <UNavigationMenu
              v-if="currentAudit"
              :items="[
                { label: currentAudit.name, icon: 'carbon:circle-solid', to: `/audits/${currentAudit.id}` },
              ]"
            />
            <UNavigationMenu
              :items="[
                { label: 'New Audit', icon: 'carbon:add', to: '/create' },
                auditStore?.length ? { label: 'History', icon: 'carbon:warning-diamond', to: '/' } : undefined,
                { label: 'Rules', to: '/rules', icon: 'i-carbon-list-checked' },
                { label: 'Docs', icon: 'carbon:book' },
              ].filter(Boolean)"
            />
          </div>
        </div>
      </UContainer>
    </header>
    <div class="flex-row flex h-full" style="min-height: calc(100vh - 64px);">
      <main class="mx-auto flex flex-col w-full">
        <div class="px-4 lg:px-6 py-5">
          <NuxtLayout>
            <div v-if="!rpcConnected" class="text-center">
              <!-- Waiting for connection to Nuxt -->
              <p class="text-center text-gray-300 mb-5">
                Waiting for connection to Nuxt...
              </p>
              <UIcon name="heroicons:bolt-slash-solid" class="animate-bounce text-gray-500 text-3xl" />
            </div>
            <div v-else>
              <NuxtPage />
            </div>
          </NuxtLayout>
        </div>
        <div class="flex-auto" />
      </main>
    </div>
    <footer>
      <a href="https://nuxtseo.com" target="_blank" class="flex items-end gap-1.5 font-semibold text-xl dark:text-white font-title">
        <NuxtSeoLogo />
      </a>
    </footer>
  </UApp>
</template>

<style>
html {
  --at-apply: font-sans;
  overflow-y: scroll;
  overscroll-behavior: none;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
body::-webkit-scrollbar {
  display: none;
}
body {
  /* trap scroll inside iframe */
  height: calc(100vh + 1px);
}

/* Markdown */
.n-markdown a {
  --at-apply: text-primary hover:underline;
}
.prose a {
  --uno: hover:text-primary;
}
.prose code::before {
  content: ""
}
.prose code::after {
  content: ""
}
pre {
  white-space: break-spaces;
}
</style>
