# link-no-underscores

Ensures URLs do not contain underscores, using hyphens instead.

## Rule Details

This rule aims to improve URL consistency and SEO by ensuring URLs use hyphens instead of underscores. Search engines generally treat hyphens as word separators, while underscores are treated as part of the word.

Examples of **incorrect** code for this rule:

```html
<a href="/about_us">About Us</a>
<NuxtLink to="/blog_posts">Blog Posts</NuxtLink>
<a href="/products?category_id=electronics">Electronics</a>
```

Examples of **correct** code for this rule:

```html
<a href="/about-us">About Us</a>
<NuxtLink to="/blog-posts">Blog Posts</NuxtLink>
<a href="/products?category-id=electronics">Electronics</a>
```

## Options

This rule does not have any options.

## When Not To Use It

If your website or application specifically requires underscores in URLs for technical or compatibility reasons, you can disable this rule.
