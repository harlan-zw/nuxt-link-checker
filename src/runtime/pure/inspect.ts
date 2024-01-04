import { parseURL } from 'ufo'
import type { LinkInspectionResult, Rule, RuleTestContext } from '../types'
import RuleTrailingSlash from './inspections/trailing-slash'
import RuleMissingHash from './inspections/missing-hash'
import RuleNoBaseLess from './inspections/no-baseless'
import RuleNoJavascript from './inspections/no-javascript'
import RuleAbsoluteSiteUrls from './inspections/absolute-site-urls'
import RuleRedirects from './redirects'
import RuleNoErrorResponse from './inspections/no-error-response-status'
import RuleDescriptiveLinkText from './inspections/descriptive-link-text'
import { isNonFetchableLink } from './inspections/util'

export const DefaultInspections = {
  'missing-hash': RuleMissingHash(),
  'no-error-response': RuleNoErrorResponse(),
  'no-baseless': RuleNoBaseLess(),
  'no-javascript': RuleNoJavascript(),
  'trailing-slash': RuleTrailingSlash(),
  'absolute-site-urls': RuleAbsoluteSiteUrls(),
  'redirects': RuleRedirects(),
  'link-text': RuleDescriptiveLinkText(),
} as const

export function inspect(ctx: RuleTestContext, rules = DefaultInspections): Partial<LinkInspectionResult> {
  const res: Partial<LinkInspectionResult> = { error: [], warning: [], fix: ctx.link, link: ctx.link }
  let link = ctx.link
  const url = parseURL(link)
  if (!url.pathname && !url.protocol && !url.host && !isNonFetchableLink(link)) {
    // @ts-expect-error untyped
    res.error.push({
      name: 'invalid-url',
      scope: 'error',
      message: `Invalid URL: ${link}`,
    })
    return res
  }
  const validInspections = Object.entries(rules)
    .filter(([name]) => !ctx.skipInspections || !ctx.skipInspections.includes(name))
    .map(([, rule]) => rule) as Rule[]
  for (const rule of validInspections) {
    rule.test({
      ...ctx,
      link,
      url,
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
  res.textContent = ctx.textContent
  return res
}
