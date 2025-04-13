# link-valid-router-path

Ensures links point to valid routes in your application.

## Rule Details

This rule validates that paths specified in `to` and `href` attributes of `<NuxtLink>`, `<RouterLink>`, and `<a>` elements correspond to registered routes in your application.

<!-- eslint-skip -->
```vue
<!-- 👎 bad -->
<NuxtLink to="/non-existent-page">Invalid Route</NuxtLink>
<RouterLink to="/undefined-route">Invalid Route</RouterLink>
<a href="/page-not-found">Invalid Route</a>
```

<!-- eslint-skip -->
```vue
<!-- 👍 good -->
<NuxtLink to="/about">About Us</NuxtLink>
<RouterLink to="/products/1">Product Details</RouterLink>
<a href="/contact">Contact Us</a>
<a href="https://external-site.com">External Link</a>
<a href="#section-id">Anchor Link</a>
<NuxtLink :to="dynamicRoute">Dynamic Link</NuxtLink>
```

## Notes

- This rule requires access to your application's router configuration to validate paths
- External links (starting with 'http'), anchors (starting with '#'), and special URL schemes (like 'mailto:', 'tel:') are ignored
- Dynamic bindings (using `:to`, `:href`, or `v-bind`) are not validated
- The root path ('/') is always considered valid
- The rule is configured automatically when using the Nuxt module
