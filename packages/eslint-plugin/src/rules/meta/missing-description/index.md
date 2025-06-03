# meta-missing-description

## Rule Details

This rule enforces that HTML documents have a `<head>` element containing a non-empty meta description tag. The meta description tag is crucial for SEO as it provides a brief summary of page content that appears in search engine results.

### ❌ Incorrect

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page Title</title>
  <meta charset="UTF-8">
</head>
<body>
  <!-- Content -->
</body>
</html>
```

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page Title</title>
  <meta name="description" content="">
  <meta charset="UTF-8">
</head>
<body>
  <!-- Content -->
</body>
</html>
```

### ✅ Correct

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page Title</title>
  <meta name="description" content="This is a description of what this page is about">
  <meta charset="UTF-8">
</head>
<body>
  <!-- Content -->
</body>
</html>
```

## Why

The meta description element:

- Improves SEO by providing search engines with a summary of page content
- Appears in search engine results pages (SERPs)
- Influences click-through rates from search results
- Helps users determine if a page is relevant to their search
- Can be used by social media platforms when sharing links

## Fix

This rule can automatically add a missing meta description tag with a default value or fill in an empty meta description tag with a default value.
