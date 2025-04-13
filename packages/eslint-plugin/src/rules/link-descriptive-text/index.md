# link-descriptive-text

Ensures links have descriptive text content for better SEO and accessibility.

## Rule Details

This rule aims to improve the accessibility and SEO of your application by ensuring that link texts are descriptive.

A descriptive link gives readers an understanding of where the link takes them.
This is important for screen readers that jump between links and for search engines that use link text for relevance.

Examples of **incorrect** code for this rule:

```html
<a href="/about">click here</a>
<a href="/contact">here</a>
<a href="/products">learn more</a>
<a href="/blog">read more</a>
<a href="/docs">view</a>
<a href="/details">this</a>
```

Examples of **correct** code for this rule:

```html
<a href="/about">Learn more about our company</a>
<a href="/contact">Contact our support team</a>
<a href="/products">Browse our product catalog</a>
<a href="/blog">Read our latest blog posts</a>
```

## Why This Matters

Descriptive link text is essential for:

1. **Accessibility**: Users of assistive technologies often navigate by jumping between links. Generic text like "click here" provides no context when heard in isolation.

2. **SEO**: Search engines use link text to understand the content of the destination page. Descriptive link text improves your site's search rankings.

3. **Usability**: All users benefit from clear, descriptive links that explain where the link will take them.

## Options

This rule does not have any options.
