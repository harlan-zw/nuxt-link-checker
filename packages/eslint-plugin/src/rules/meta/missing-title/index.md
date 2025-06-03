# meta-missing-title

## Rule Details

This rule enforces that HTML documents have a `<head>` element containing a non-empty `<title>` tag. The title tag is crucial for SEO, accessibility, and user experience as it defines what appears in browser tabs and search results.

### ❌ Incorrect

```html
<!DOCTYPE html>
<html>
<head>
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
  <title></title>
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
  <meta charset="UTF-8">
</head>
<body>
  <!-- Content -->
</body>
</html>
```

## Why

The `<title>` element:

- Is required for valid HTML documents
- Improves SEO by helping search engines understand page content
- Appears in browser tabs, bookmarks, and search results
- Aids accessibility for screen reader users
- Improves user experience by providing context about the page

## Fix

This rule can automatically add a missing title tag with a default value of "Page Title" or fill in an empty title tag with the same value.
