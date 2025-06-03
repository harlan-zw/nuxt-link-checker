# link-lowercase

## Rule Details

This rule aims to improve URL consistency and SEO by ensuring all URLs use lowercase characters, which is considered a best practice for web URLs.

Examples of **incorrect** code for this rule:

```html
<a href="/About-Us">About Us</a>
<NuxtLink to="/Blog/Posts">Blog Posts</NuxtLink>
<a href="/products?Category=Electronics">Electronics</a>
```

Examples of **correct** code for this rule:

```html
<a href="/about-us">About Us</a>
<NuxtLink to="/blog/posts">Blog Posts</NuxtLink>
<a href="/products?category=electronics">Electronics</a>
```

## Options

This rule does not have any options.

## When Not To Use It

If your website or application specifically requires uppercase characters in URLs for technical or branding reasons, you can disable this rule.
