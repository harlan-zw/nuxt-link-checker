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

export const AllInspections = [
  RuleMissingHash(),
  RuleNoErrorResponse(),
  RuleNoBaseLess(),
  RuleNoJavascript(),
  RuleTrailingSlash(),
  RuleAbsoluteSiteUrls(),
  RuleRedirects(),
  RuleDescriptiveLinkText(),
]

export function inspect(ctx: Pick<Required<RuleTestContext>, 'link'> & Omit<Partial<RuleTestContext>, 'link'>, rules: Rule[]): Partial<LinkInspectionResult> {
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
      ...(ctx as RuleTestContext),
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
