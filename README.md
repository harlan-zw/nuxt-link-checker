<h1 align='center'>nuxt-link-checker</h1>

<p align="center">
<a href='https://github.com/harlan-zw/nuxt-link-checker/actions/workflows/test.yml'>
</a>
<a href="https://www.npmjs.com/package/nuxt-link-checker" target="__blank"><img src="https://img.shields.io/npm/v/nuxt-link-checker?style=flat&colorA=002438&colorB=28CF8D" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/nuxt-link-checker" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/nuxt-link-checker?flat&colorA=002438&colorB=28CF8D"></a>
<a href="https://github.com/harlan-zw/nuxt-link-checker" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/harlan-zw/nuxt-link-checker?flat&colorA=002438&colorB=28CF8D"></a>
</p>


<p align="center">
Find broken links in your Nuxt v3 pre-rendered app.
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
<i>Status:</i> Early Access</b> <br>
<sup> Please report any issues 🐛</sup><br>
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦 • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for help</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

## Features

- ⛰️ Discover broken links - 404s and internal redirects
- ❌ Fail on build if broken links are found (optional)

## Install

```bash
npm install --save-dev nuxt-link-checker

# Using yarn
yarn add --dev nuxt-link-checker
```

## Setup

_nuxt.config.ts_

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-link-checker',
  ],
})
```

To have routes scanned for broken links automatically, they need to be pre-rendered by Nitro.

```ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        // any URLs that can't be discovered by crawler
        '/my-hidden-url'
      ]
    }
  }
})
```  


### Set host

You'll need to provide the host of your site in order to generate the sitemap.xml.

```ts
export default defineNuxtConfig({
  // Recommended 
  runtimeConfig: {
    siteUrl: 'https://example.com',
  },
  // OR 
  sitemap: {
    host: 'https://example.com',
  },
})
```

## Module Config

### `host`

- Type: `string`
- Default: `runtimeConfig.public.siteUrl`
- Required: `false`

The host of your site. This is required to validate absolute URLs which may be internal.

### `trailingSlash`

- Type: `boolean`
- Default: `false`

Whether internal links should have a trailing slash or not.

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>


## License

MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
