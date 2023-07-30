import { getHeader } from 'h3'
import { parseURL } from 'ufo'
import { fixSlashes } from 'site-config-stack'
import RuleTrailingSlash from './inspections/trailing-slash'
import RuleMissingHash from './inspections/missing-hash'
import RuleNoBaseLess from './inspections/no-baseless'
import RuleNoJavascript from './inspections/no-javascript'
import RuleAbsoluteSiteUrls from './inspections/absolute-site-urls'
import RuleRedirects from './inspections/redirects'
import RuleNoErrorResponse from './inspections/no-error-response-status'
import type { LinkInspectionResult, Rule, RuleTestContext } from './types'

const inspection = [
  RuleMissingHash(),
  RuleNoErrorResponse(),
  RuleNoBaseLess(),
  RuleNoJavascript(),
  RuleTrailingSlash(),
  RuleAbsoluteSiteUrls(),
  RuleRedirects(),
]

export function inspect(ctx: RuleTestContext, rules?: Rule[]): Partial<LinkInspectionResult> {
  if (!rules)
    rules = inspection
  const res: Partial<LinkInspectionResult> = { error: [], warning: [], fix: ctx.link, link: ctx.link }
  let link = ctx.link
  const url = parseURL(link)
  if (!url.pathname && !url.protocol && !url.host) {
    // @ts-expect-error untyped
    res.error.push({
      name: 'invalid-url',
      scope: 'error',
      message: `Invalid URL: ${link}`,
    })
    return res
  }
  const fromPath = fixSlashes(false, parseURL(getHeader(ctx.e, 'referer') || '/').pathname)
  for (const rule of rules) {
    rule.test({
      ...ctx,
      link,
      url,
      fromPath,
      report(obj) {
        // @ts-expect-error untyped
        res[obj.scope].push(obj)
        if (obj.fix)
          link = obj.fix
      },
    })
  }
  res.passes = !res.error?.length && !res.warning?.length
  res.fix = link
  return res
}
