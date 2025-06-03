# link-no-double-slashes

## Rule Details

This rule aims to improve URL consistency and prevent potential routing issues by ensuring URLs don't contain double slashes (or more) in the path portion.

Double slashes in URL paths can cause confusion for web servers and may lead to unexpected behavior or 404 errors. In most web applications, especially those built with Nuxt, double slashes in paths are unintentional and indicate a potential problem.

Examples of **incorrect** code for this rule:

```html
<a href="//path">Invalid path</a>
<a href="/path//to/page">Invalid path</a>
<NuxtLink to="/about//us">Invalid path</NuxtLink>
<a href="///page">Invalid path</a>
<a href="/section//detail/////info">Invalid path</a>
```

Examples of **correct** code for this rule:

```html
<a href="/path">Valid path</a>
<a href="/path/to/page">Valid path</a>
<NuxtLink to="/about/us">Valid path</NuxtLink>

<!-- The following are also valid as they use proper URL protocols -->
<a href="https://example.com/path">Valid external link</a>
<a href="http://example.com/path">Valid external link</a>
<a href="//example.com/path">Valid protocol-relative URL</a>

<!-- Dynamic links are not checked -->
<a :href="dynamicPath">Dynamic link</a>
<NuxtLink :to="dynamicPath">Dynamic link</NuxtLink>
```

## Why This Rule Matters

Double slashes in URL paths can lead to several issues:

1. **Routing Inconsistencies**: Many web frameworks, including Nuxt, normalize URLs when routing. Double slashes can cause unexpected behavior or routing failures.

2. **SEO Impact**: Search engines may treat URLs with double slashes as separate from their single-slash counterparts, potentially diluting SEO value.

3. **User Experience**: URLs with double slashes appear unprofessional and can confuse users.

4. **Cache Inconsistencies**: Browsers and CDNs may cache different versions of the same resource if accessed via URLs with different slash patterns.

This rule helps maintain URL consistency and prevents these potential issues by automatically detecting and fixing double slashes in anchor and NuxtLink elements.

## Automatic Fixes

This rule offers automatic fixes for detected issues. When you run ESLint with the `--fix` option, it will replace consecutive slashes with a single slash:

```html
<!-- Before -->
<a href="/path//to///page">Link</a>

<!-- After -->
<a href="/path/to/page">Link</a>
```

## Options

This rule does not have any options.

## When Not To Use It

If you're working with URLs that intentionally use double slashes for a specific purpose, you can disable this rule for specific lines using ESLint inline comments:

```html
<!-- eslint-disable-next-line link-no-double-slashes -->
<a href="/special//path">Special Link</a>
```
