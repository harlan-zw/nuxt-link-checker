# link-valid-router-path

## Rule Details

This rule validates that paths specified in `to`{lang="bash"} and `href`{lang="bash"} attributes of `<NuxtLink>`{lang="html"} and `<RouterLink>`{lang="html"} elements correspond to registered routes in your application.

If they don't match, then you should use the `external`{lang="bash"} property or use an `<a href>`{lang="html"} element instead

<!-- eslint-skip -->
```vue
<!-- 👎 bad -->
<NuxtLink to="/non-existent-page">Invalid Route</NuxtLink>
<RouterLink to="/undefined-route">Invalid Route</RouterLink>
```

<!-- eslint-skip -->
```vue
<!-- 👍 good -->
<NuxtLink to="/about">About Us</NuxtLink>
<RouterLink to="/products/1">Product Details</RouterLink>
<NuxtLink to="/external" external>Explicit External</NuxtLink>
<a href="https://external-site.com">External Link</a>
```

## Notes

- This rule requires access to your application's router configuration to validate paths
- External links (starting with 'http'), anchors (starting with '#'), and special URL schemes (like 'mailto:', 'tel:') are ignored
- Dynamic bindings (using `:to`, `:href`, or `v-bind`) are not validated
- The root path ('/') is always considered valid
- The rule is configured automatically when using the Nuxt module
