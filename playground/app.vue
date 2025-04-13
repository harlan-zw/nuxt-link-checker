<script setup>
import { useSiteConfig } from '#imports'

const siteConfig = useSiteConfig()
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <NuxtLink to="/abot">
      About Us
    </NuxtLink>
    <h2 /> <!-- empty -->
    <header class="sticky top-0 z-50 w-full backdrop-blur flex-none border-b border-gray-900/10 dark:border-gray-50/[0.06] bg-white/75 dark:bg-gray-900/75">
      <div class="py-3">
        <NuxtLink to="/" class="flex items-end gap-1.5 font-bold text-xl text-gray-900 dark:text-white">
          <Icon name="logos:nuxt-icon" class="w-8 h-8" />
          Nuxt
          <div class="text-primary-500 dark:text-primary-400">
            {{ siteConfig.name }}
          </div>
        </NuxtLink>
      </div>
    </header>
    <main class="min-h-full h-full flex-grow">
      <div class="mt-4">
        <NuxtPage />
      </div>
    </main>
  </div>
</template>
