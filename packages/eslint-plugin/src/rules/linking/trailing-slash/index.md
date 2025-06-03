# link-trailing-slash

## Rule Details

This rule enforces a consistent style for URL paths, either requiring or prohibiting trailing slashes. It helps ensure that all links within your application follow the same pattern, which can improve SEO and prevent redirect issues.

### Options

The rule takes an optional object configuration with the following property:

* `requireTrailingSlash`: Set to `true` to require trailing slashes, or `false` (default) to prohibit them.

### Examples

#### Default (no trailing slashes)

Examples of **correct** code with default settings:

```vue
<template>
  <a href="/about">About</a>
  <NuxtLink to="/products/1">
    Product
  </NuxtLink>
  <RouterLink to="/contact">
    Contact
  </RouterLink>
</template>
```

Examples of **incorrect** code with default settings:

```vue
<template>
  <a href="/about/">About</a>
  <NuxtLink to="/products/1/">
    Product
  </NuxtLink>
  <RouterLink to="/contact/">
    Contact
  </RouterLink>
</template>
```

#### With `requireTrailingSlash: true`

Examples of **correct** code with `requireTrailingSlash: true`:

```vue
<template>
  <a href="/about/">About</a>
  <NuxtLink to="/products/1/">
    Product
  </NuxtLink>
  <RouterLink to="/contact/">
    Contact
  </RouterLink>
</template>
```

Examples of **incorrect** code with `requireTrailingSlash: true`:

```vue
<template>
  <a href="/about">About</a>
  <NuxtLink to="/products/1">
    Product
  </NuxtLink>
  <RouterLink to="/contact">
    Contact
  </RouterLink>
</template>
```

### When Not To Use It

You might want to disable this rule if:
- Your application intentionally mixes both styles for different routes
- You're working with a framework or CMS that has its own URL formatting conventions

## Further Reading

- [Trailing Slashes on URLs: Contentious or Settled?](https://www.searchenginejournal.com/trailing-slashes-urls/370756/)
- [URL Trailing Slash SEO Recommendations](https://ahrefs.com/blog/trailing-slash/)
