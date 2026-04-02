<template>
  <div>
    <h1>Skip Inspection Example</h1>
    <p>
      The <code>missing-hash</code> and <code>no-error-response</code> inspections are
      disabled in nuxt.config.ts, so these links will not be flagged.
    </p>
    <nav>
      <!-- This hash link would normally trigger a missing-hash inspection -->
      <NuxtLink to="/about#nonexistent-section">
        About (missing hash)
      </NuxtLink>
      <!-- External link that might fail error response check -->
      <a href="https://httpstat.us/500">External 500 (skipped)</a>
    </nav>
  </div>
</template>
