# link-no-whitespace

## Rule Details

This rule checks that `href` and `to` attributes in `<a>` and `<NuxtLink>` elements don't contain whitespace characters, which can cause broken links.

<!-- eslint-skip -->
```vue
<!-- 👎 bad -->
<a href="/invalid link">Bad Link</a>
<NuxtLink to="/page with spaces">Bad Link</NuxtLink>
<NuxtLink href="  /leading/trailing  ">Bad Link</NuxtLink>
```

<!-- eslint-skip -->
```vue
<!-- 👍 good -->
<a href="/valid-link">Good Link</a>
<NuxtLink to="/valid-link">Good Link</NuxtLink>
<NuxtLink :to="dynamicPath">Dynamic Link</NuxtLink>
```

This rule automatically fixes issues by replacing whitespace with URL-encoded equivalents (`%20` for spaces).

## Notes

- Only checks static string values (not dynamic bindings with `:to`, `:href`, or `v-bind`)
- Applies to both `<a>` and `<NuxtLink>` elements
- Checks both `href` and `to` attributes
