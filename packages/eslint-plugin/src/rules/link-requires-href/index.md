# link-requires-href

Ensures anchor tags have an href attribute for better accessibility and user experience.

## Rule Details

This rule aims to improve accessibility and user experience by ensuring that all `<a>` elements either have an `href` attribute or a `role="button"` attribute. Anchor tags without an `href` attribute do not properly function as links and can confuse users and assistive technology.

Examples of **incorrect** code for this rule:

```html
<a>Link without href</a>
<a class="nav-link" @click="handleClick">JavaScript link</a>
<a role="navigation">Missing href</a>
```

Examples of **correct** code for this rule:

```html
<a href="/page">Link with href</a>
<a href="#">Link with hash</a>
<a href="">Link with empty href</a>
<a :href="dynamicPath">Dynamic link</a>
<a role="button" @click="handleClick">Button-like link</a>

<!-- Also acceptable for button-like behavior -->
<NuxtLink to="/page">Link with to prop</NuxtLink>
```

## Options

This rule does not have any options.

## When Not To Use It

If you have valid use cases for anchor tags without href attributes (beyond those with `role="button"`), you might want to disable this rule or customize it to suit your needs.
