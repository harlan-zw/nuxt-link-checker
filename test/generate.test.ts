import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { buildNuxt, createResolver, loadNuxt } from '@nuxt/kit'

describe('generate', () => {
  it('basic', async () => {
    process.env.NODE_ENV = 'production'
    process.env.prerender = true
    process.env.NITRO_PRESET = 'static'
    process.env.NUXT_PUBLIC_SITE_URL = 'https://nuxtseo.com'
    const { resolve } = createResolver(import.meta.url)
    const rootDir = resolve('../playground')
    const nuxt = await loadNuxt({
      rootDir,
      overrides: {
        nitro: {
          preset: 'static',
        },
        _generate: true,
      },
    })
    await buildNuxt(nuxt)

    await new Promise(resolve => setTimeout(resolve, 1000))

    const reportJson = (await readFile(resolve(rootDir, '.output/link-checker-report.json'), 'utf-8'))
    expect(reportJson).toMatchInlineSnapshot(`
      "[
        {
          "route": "/",
          "reports": [
            {
              "error": [],
              "warning": [],
              "fix": "/",
              "link": "/",
              "passes": true,
              "textContent": "Nuxt nuxt-link-checker-playground"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/#anchor",
              "link": "/#anchor",
              "passes": true,
              "textContent": "valid anchor"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/valid",
              "link": "/valid",
              "passes": true,
              "textContent": "valid link"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/redirect",
              "link": "/redirect",
              "passes": true,
              "textContent": "valid link to redirect"
            },
            {
              "error": [],
              "warning": [],
              "link": "/ignored"
            },
            {
              "error": [],
              "warning": [],
              "fix": "mailto:harlan@harlanzw.com",
              "link": "mailto:harlan@harlanzw.com",
              "passes": true,
              "textContent": "mail to link"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/some-file.pdf",
              "link": "/some-file.pdf",
              "passes": true,
              "textContent": "file link"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/about/Billy%20Bob",
              "link": "/about/Billy%20Bob",
              "passes": true,
              "textContent": "Dynamic Encoded Path"
            },
            {
              "error": [],
              "warning": [
                {
                  "name": "link-text",
                  "scope": "warning",
                  "message": "Should have descriptive text.",
                  "tip": "The here descriptive text does not provide any context to the link."
                }
              ],
              "fix": "/about",
              "link": "/about",
              "passes": false,
              "textContent": "here"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Not Found).",
                  "canRetry": true
                }
              ],
              "warning": [
                {
                  "name": "no-baseless",
                  "scope": "warning",
                  "message": "Should not have a base.",
                  "fix": "/this is a very bad link",
                  "fixDescription": "Add base /."
                }
              ],
              "fix": "/this is a very bad link",
              "link": "this is a very bad link",
              "passes": false,
              "textContent": "very bad link"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /abot).",
                  "fix": "/about",
                  "fixDescription": "Did you mean /about?"
                }
              ],
              "warning": [],
              "fix": "/about",
              "link": "/abot",
              "passes": false,
              "textContent": "page typo with magic fix"
            },
            {
              "error": [
                {
                  "name": "missing-hash",
                  "scope": "error",
                  "message": "No element with id \\"broken-anchor\\" found.",
                  "fix": "/#anchor",
                  "fixDescription": "Did you mean /#anchor?"
                }
              ],
              "warning": [],
              "fix": "/#anchor",
              "link": "/#broken-anchor",
              "passes": false,
              "textContent": "broken anchor"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /404link)."
                }
              ],
              "warning": [],
              "fix": "/404link",
              "link": "/404link",
              "passes": false,
              "textContent": "404 links"
            },
            {
              "error": [],
              "warning": [],
              "fix": "https://example.com/absolute",
              "link": "https://example.com/absolute",
              "passes": true,
              "textContent": "absolute 404 link"
            },
            {
              "error": [
                {
                  "name": "no-javascript",
                  "scope": "error",
                  "tip": "Using a <button type=\\"button\\"> instead as a better practice.",
                  "message": "Should not use JavaScript"
                }
              ],
              "warning": [],
              "fix": "javascript:history.back()",
              "link": "javascript:history.back()",
              "passes": false,
              "textContent": "javacript link"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/error",
              "link": "/error",
              "passes": true,
              "textContent": "to an error page"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /completely-broken/)."
                }
              ],
              "warning": [
                {
                  "name": "trailing-slash",
                  "scope": "warning",
                  "message": "Should not have a trailing slash.",
                  "tip": "Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.",
                  "fix": "/completely-broken",
                  "fixDescription": "Removing trailing slash."
                }
              ],
              "fix": "/completely-broken",
              "link": "/completely-broken/",
              "passes": false,
              "textContent": "error and warning"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /abt).",
                  "fix": "/about",
                  "fixDescription": "Did you mean /about?"
                }
              ],
              "warning": [],
              "fix": "/about",
              "link": "/abt",
              "passes": false,
              "textContent": "page typo with magic fix - AGAIN 123"
            },
            {
              "error": [],
              "warning": [],
              "fix": "https://nuxt.com/docs/",
              "link": "https://nuxt.com/docs/",
              "passes": true,
              "textContent": "nuxt.com - remote URL"
            },
            {
              "error": [],
              "warning": [
                {
                  "name": "trailing-slash",
                  "scope": "warning",
                  "message": "Should not have a trailing slash.",
                  "tip": "Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.",
                  "fix": "/trailingslash",
                  "fixDescription": "Removing trailing slash."
                }
              ],
              "fix": "/trailingslash",
              "link": "/trailingslash/",
              "passes": false,
              "textContent": "trailing slash"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/redirect",
              "link": "/redirect",
              "passes": true,
              "textContent": "redirect link"
            },
            {
              "error": [],
              "warning": [],
              "fix": "https://nuxt-link-checker.com/about",
              "link": "https://nuxt-link-checker.com/about",
              "passes": true,
              "textContent": "Absolute internal link"
            }
          ]
        },
        {
          "route": "/fix-test",
          "reports": [
            {
              "error": [],
              "warning": [],
              "fix": "/",
              "link": "/",
              "passes": true,
              "textContent": "Nuxt nuxt-link-checker-playground"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/#anchor",
              "link": "/#anchor",
              "passes": true,
              "textContent": "valid anchor"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/valid",
              "link": "/valid",
              "passes": true,
              "textContent": "valid link"
            },
            {
              "error": [],
              "warning": [],
              "link": "/ignored"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /abt).",
                  "fix": "/about",
                  "fixDescription": "Did you mean /about?"
                }
              ],
              "warning": [],
              "fix": "/about",
              "link": "/abt",
              "passes": false,
              "textContent": "page typo with magic fix"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/#broken-anchor",
              "link": "/#broken-anchor",
              "passes": true,
              "textContent": "broken anchor dd"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /404link/)."
                }
              ],
              "warning": [
                {
                  "name": "trailing-slash",
                  "scope": "warning",
                  "message": "Should not have a trailing slash.",
                  "tip": "Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.",
                  "fix": "/404link",
                  "fixDescription": "Removing trailing slash."
                }
              ],
              "fix": "/404link",
              "link": "/404link/",
              "passes": false,
              "textContent": "404 links"
            },
            {
              "error": [],
              "warning": [],
              "fix": "https://example.com/absolute",
              "link": "https://example.com/absolute",
              "passes": true,
              "textContent": "absolute 404 link"
            },
            {
              "error": [
                {
                  "name": "no-javascript",
                  "scope": "error",
                  "tip": "Using a <button type=\\"button\\"> instead as a better practice.",
                  "message": "Should not use JavaScript"
                }
              ],
              "warning": [],
              "fix": "javascript:history.back()",
              "link": "javascript:history.back()",
              "passes": false,
              "textContent": "javacript link"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/error",
              "link": "/error",
              "passes": true,
              "textContent": "to an error page"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /completely-broken/)."
                }
              ],
              "warning": [
                {
                  "name": "trailing-slash",
                  "scope": "warning",
                  "message": "Should not have a trailing slash.",
                  "tip": "Incorrect trailing slashes can cause duplicate pages in search engines and waste crawl budget.",
                  "fix": "/completely-broken",
                  "fixDescription": "Removing trailing slash."
                }
              ],
              "fix": "/completely-broken",
              "link": "/completely-broken/",
              "passes": false,
              "textContent": "error and warning"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/about",
              "link": "/about",
              "passes": true,
              "textContent": "page typo with magic fix - AGAIN 123"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/trailingslash",
              "link": "/trailingslash",
              "passes": true,
              "textContent": "trailing slash"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/redirected",
              "link": "/redirected",
              "passes": true,
              "textContent": "redirect link"
            },
            {
              "error": [],
              "warning": [],
              "fix": "/about",
              "link": "/about",
              "passes": true,
              "textContent": "Absolute internal link"
            }
          ]
        }
      ]"
    `)

    const reportMarkdown = (await readFile(resolve(rootDir, '.output/link-checker-report.md'), 'utf-8'))
    expect(reportMarkdown).toMatchInlineSnapshot(`
      "# Link Checker Report

      ## [/](/) 7 errors, 4 warnings
      | Link | Message |
      | --- | --- |
      | /about | Should have descriptive text. (link-text) |
      | this is a very bad link | Should not respond with status code 404 (Not Found). (no-error-response) |
      | this is a very bad link | Should not have a base. (no-baseless) |
      | /abot | Should not respond with status code 404 (Page not found: /abot). (no-error-response) |
      | /#broken-anchor | No element with id "broken-anchor" found. (missing-hash) |
      | /404link | Should not respond with status code 404 (Page not found: /404link). (no-error-response) |
      | javascript:history.back() | Should not use JavaScript (no-javascript) |
      | /completely-broken/ | Should not respond with status code 404 (Page not found: /completely-broken/). (no-error-response) |
      | /completely-broken/ | Should not have a trailing slash. (trailing-slash) |
      | /abt | Should not respond with status code 404 (Page not found: /abt). (no-error-response) |
      | /trailingslash/ | Should not have a trailing slash. (trailing-slash) |

      ## [/fix-test](/fix-test) 4 errors, 2 warnings
      | Link | Message |
      | --- | --- |
      | /abt | Should not respond with status code 404 (Page not found: /abt). (no-error-response) |
      | /404link/ | Should not respond with status code 404 (Page not found: /404link/). (no-error-response) |
      | /404link/ | Should not have a trailing slash. (trailing-slash) |
      | javascript:history.back() | Should not use JavaScript (no-javascript) |
      | /completely-broken/ | Should not respond with status code 404 (Page not found: /completely-broken/). (no-error-response) |
      | /completely-broken/ | Should not have a trailing slash. (trailing-slash) |
      "
    `)
  })
})
