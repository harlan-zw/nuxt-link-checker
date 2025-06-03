# meta-duplicate-description

> Ensure meta descriptions are unique across the site

## Rule Details

This rule enforces unique meta descriptions across pages in your site to improve SEO. Search engines often use meta descriptions as snippets in search results, and unique descriptions help distinguish your pages and improve click-through rates.

### ❌ Incorrect

```html
<!-- If this description is used on multiple pages -->
<head>
  <meta name="description" content="Welcome to our website where we offer products and services.">
</head>
```

### ✅ Correct

```html
<head>
  <meta name="description" content="Unique, specific description about this particular page's content.">
</head>
```

## Why is this important?

Duplicate meta descriptions can:
- Make your pages seem less relevant to search engines
- Reduce click-through rates from search results
- Create a poor user experience when browsing search results
- Miss opportunities to target different keywords for different pages

## Resources

- [Google: Meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Moz: Meta Description Best Practices](https://moz.com/learn/seo/meta-description)
