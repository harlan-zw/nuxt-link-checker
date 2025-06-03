# meta-duplicate-title

> Ensure page titles are unique across the site

## Rule Details

This rule enforces unique titles across pages in your site to improve SEO. Search engines give more weight to pages with unique, descriptive titles, and users rely on titles to understand page content in search results and browser tabs.

### ❌ Incorrect

```html
<!-- If "My Page Title" is used on multiple pages -->
<head>
  <title>My Page Title</title>
</head>
```

### ✅ Correct

```html
<head>
  <title>My Unique Page Title</title>
</head>
```

## Why is this important?

Duplicate titles can:
- Cause search engines to rank your pages lower
- Make it harder for users to distinguish between your pages
- Create confusion in analytics and browser bookmarks

## Resources

- [Google: Create good titles and snippets in Search Results](https://developers.google.com/search/docs/appearance/title-link)
