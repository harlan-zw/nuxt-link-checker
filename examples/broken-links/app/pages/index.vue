<template>
  <div>
    <h1>Broken Links Example</h1>
    <p>These links are intentionally broken to demonstrate the link checker catching errors during dev.</p>
    <nav>
      <!-- These links point to pages that do not exist -->
      <NuxtLink to="/nonexistent">
        Nonexistent Page
      </NuxtLink>
      <NuxtLink to="/missing-page">
        Missing Page
      </NuxtLink>
      <NuxtLink to="/does-not-exist">
        Does Not Exist
      </NuxtLink>
    </nav>
  </div>
</template>
