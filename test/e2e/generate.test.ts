import { readFile } from 'node:fs/promises'
import { buildNuxt, createResolver, loadNuxt } from '@nuxt/kit'
import { describe, expect, it } from 'vitest'

describe('generate', () => {
  it('basic', async () => {
    process.env.NODE_ENV = 'production'
    process.env.prerender = true
    process.env.NITRO_PRESET = 'static'
    process.env.NUXT_PUBLIC_SITE_URL = 'https://nuxtseo.com'
    const { resolve } = createResolver(import.meta.url)
    const rootDir = resolve('../../playground')
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
              "warning": [
                {
                  "name": "no-uppercase-chars",
                  "scope": "warning",
                  "message": "Links should not contain uppercase characters.",
                  "fix": "/about/billy%20bob",
                  "fixDescription": "Convert to lowercase."
                }
              ],
              "fix": "/about/billy%20bob",
              "link": "/about/Billy%20Bob",
              "passes": false,
              "textContent": "Dynamic Encoded Path"
            },
            {
              "error": [],
              "warning": [],
              "link": ""
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Not Found)."
                }
              ],
              "warning": [
                {
                  "name": "no-double-slashes",
                  "scope": "warning",
                  "message": "Links should not contain double slashes.",
                  "fix": "/oops",
                  "fixDescription": "Remove double slashes."
                }
              ],
              "fix": "/oops",
              "link": "//oops",
              "passes": false,
              "textContent": "double slash"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Not Found)."
                }
              ],
              "warning": [
                {
                  "name": "no-double-slashes",
                  "scope": "warning",
                  "message": "Links should not contain double slashes.",
                  "fix": "/oops",
                  "fixDescription": "Remove double slashes."
                }
              ],
              "fix": "/oops",
              "link": "//oops",
              "passes": false,
              "textContent": "double slash"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /users/%F0%9F%91%A8%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A6/photos/%F0%9F%8C%85-vacation)."
                }
              ],
              "warning": [
                {
                  "name": "no-non-ascii-chars",
                  "scope": "warning",
                  "message": "Links should not contain non-ascii characters.",
                  "fix": "/users/%F0%9F%91%A8%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A6/photos/%F0%9F%8C%85-vacation",
                  "fixDescription": "Encode non-ascii characters."
                },
                {
                  "name": "no-uppercase-chars",
                  "scope": "warning",
                  "message": "Links should not contain uppercase characters.",
                  "fix": "/users/%f0%9f%91%a8%e2%80%8d%f0%9f%91%a9%e2%80%8d%f0%9f%91%a6/photos/%f0%9f%8c%85-vacation",
                  "fixDescription": "Convert to lowercase."
                }
              ],
              "fix": "/users/%f0%9f%91%a8%e2%80%8d%f0%9f%91%a9%e2%80%8d%f0%9f%91%a6/photos/%f0%9f%8c%85-vacation",
              "link": "/users/👨‍👩‍👦/photos/🌅-vacation",
              "passes": false,
              "textContent": "non-ascii"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /%20oops).",
                  "fix": "/foo",
                  "fixDescription": "Did you mean /foo?"
                }
              ],
              "warning": [
                {
                  "name": "no-whitespace",
                  "scope": "warning",
                  "message": "Links should not contain whitespace.",
                  "tip": "Use hyphens to separate words instead of spaces."
                }
              ],
              "fix": "/foo",
              "link": "/ oops",
              "passes": false,
              "textContent": "whitespace"
            },
            {
              "error": [
                {
                  "name": "no-error-response",
                  "scope": "error",
                  "message": "Should not respond with status code 404 (Page not found: /oopsthisisamistake)."
                }
              ],
              "warning": [],
              "fix": "/oopsthisisamistake",
              "link": "/oopsthisisamistake",
              "passes": false,
              "textContent": "uppercase"
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
                  "name": "no-whitespace",
                  "scope": "warning",
                  "message": "Links should not contain whitespace.",
                  "tip": "Use hyphens to separate words instead of spaces."
                },
                {
                  "name": "no-baseless",
                  "scope": "warning",
                  "message": "Links should be root relative.",
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
              "error": [],
              "warning": [],
              "fix": "/#broken-anchor",
              "link": "/#broken-anchor",
              "passes": true,
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

      ## [/](/) 11 errors, 6 warnings
      | Link | Message |
      | --- | --- |
      | /about/Billy%20Bob | Links should not contain uppercase characters. (no-uppercase-chars) |
      | //oops | Should not respond with status code 404 (Not Found). (no-error-response) |
      | //oops | Should not respond with status code 404 (Not Found). (no-error-response) |
      | /users/👨‍👩‍👦/photos/🌅-vacation | Should not respond with status code 404 (Page not found: /users/%F0%9F%91%A8%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A6/photos/%F0%9F%8C%85-vacation). (no-error-response) |
      | /users/👨‍👩‍👦/photos/🌅-vacation | Links should not contain non-ascii characters. (no-non-ascii-chars) |
      | /users/👨‍👩‍👦/photos/🌅-vacation | Links should not contain uppercase characters. (no-uppercase-chars) |
      | / oops | Should not respond with status code 404 (Page not found: /%20oops). (no-error-response) |
      | / oops | Links should not contain whitespace. (no-whitespace) |
      | /oopsthisisamistake | Should not respond with status code 404 (Page not found: /oopsthisisamistake). (no-error-response) |
      | this is a very bad link | Should not respond with status code 404 (Not Found). (no-error-response) |
      | this is a very bad link | Links should not contain whitespace. (no-whitespace) |
      | this is a very bad link | Links should be root relative. (no-baseless) |
      | /abot | Should not respond with status code 404 (Page not found: /abot). (no-error-response) |
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
