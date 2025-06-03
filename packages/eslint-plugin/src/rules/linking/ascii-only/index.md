# link-ascii-only

## Rule Details

This rule aims to improve the compatibility and reliability of URLs by ensuring they don't contain non-ASCII characters, which can cause issues with some browsers and servers.

Examples of **incorrect** code for this rule:

```html
<a href="/café">Coffee</a>
<NuxtLink to="/página">Page</NuxtLink>
<a href="/path?search=résumé">Resume</a>
```

Examples of **correct** code for this rule:

```html
<a href="/cafe">Coffee</a>
<NuxtLink to="/pagina">Page</NuxtLink>
<a href="/path?search=resume">Resume</a>
<!-- Or properly encoded: -->
<a href="/caf%C3%A9">Coffee</a>
<NuxtLink to="/p%C3%A1gina">Page</NuxtLink>
<a href="/path?search=r%C3%A9sum%C3%A9">Resume</a>
```

## Options

This rule does not have any options.

## When Not To Use It

If your website specifically requires non-ASCII characters in URLs and you've ensured they are handled properly by your server and target browsers, you can disable this rule.
