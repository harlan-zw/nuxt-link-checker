import type { LinkInspectionResult, Rule, RuleTestContext } from '../types'
import { parseURL } from 'ufo'
import RuleAbsoluteSiteUrls from './inspections/absolute-site-urls'
import RuleDescriptiveLinkText from './inspections/descriptive-link-text'
import RuleMissingHash from './inspections/missing-hash'
import RuleNoDocumentRelative from './inspections/no-document-relative'
import RuleNoDoubleSlashes from './inspections/no-double-slashes'
import RuleNoDuplicateQueryParams from './inspections/no-duplicate-query-params'
import RuleNoErrorResponse from './inspections/no-error-response-status'
import RuleNoJavascript from './inspections/no-javascript'
import RuleNoMissingHref from './inspections/no-missing-href'
import RuleNoNonAsciiChars from './inspections/no-non-ascii-chars'
import RuleTrailingSlash from './inspections/trailing-slash'
import RuleRedirects from './redirects'

export const AllInspections = [
  RuleNoMissingHref(),
  RuleNoDuplicateQueryParams(),
  RuleNoNonAsciiChars(),
  RuleMissingHash(),
  RuleNoDoubleSlashes(),
  RuleNoErrorResponse(),
  RuleNoDocumentRelative(),
  RuleNoJavascript(),
  RuleTrailingSlash(),
  RuleAbsoluteSiteUrls(),
  RuleRedirects(),
  RuleDescriptiveLinkText(),
]

export function inspect(ctx: Pick<Required<RuleTestContext>, 'link'> & Omit<Partial<RuleTestContext>, 'link'>, rules?: Rule[]): Partial<LinkInspectionResult> {
  rules = rules || AllInspections
  const res: Partial<LinkInspectionResult> = { error: [], warning: [], fix: ctx.link, link: ctx.link }
  let link = ctx.link
  const url = parseURL(link)
  const validInspections = Object.entries(rules)
    .filter(([name]) => !ctx.skipInspections || !ctx.skipInspections.includes(name))
    .map(([, rule]) => rule) as Rule[]
  let processing = true
  for (const rule of validInspections) {
    rule.test({
      ...(ctx as RuleTestContext),
      link,
      url,
      report(obj, stop) {
        if (stop) {
          processing = false
        }
        // @ts-expect-error untyped
        res[obj.scope].push(obj)
        if (obj.fix)
          link = obj.fix
      },
    })
    if (!processing)
      break
  }
  res.passes = !res.error?.length && !res.warning?.length
  res.fix = link
  res.textContent = ctx.textContent
  return res
}
