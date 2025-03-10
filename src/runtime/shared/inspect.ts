import type { LinkInspectionResult, Rule, RuleTestContext } from '../types'
import { hasProtocol, parseURL } from 'ufo'
import RuleAbsoluteSiteUrls from './inspections/absolute-site-urls'
import RuleDescriptiveLinkText from './inspections/link-text'
import RuleMissingHash from './inspections/missing-hash'
import RuleNoDocumentRelative from './inspections/no-baseless'
import RuleNoDoubleSlashes from './inspections/no-double-slashes'
import RuleNoDuplicateQueryParams from './inspections/no-duplicate-query-params'
import RuleNoErrorResponse from './inspections/no-error-response'
import RuleNoJavascript from './inspections/no-javascript'
import RuleNoMissingHref from './inspections/no-missing-href'
import RuleNoNonAsciiChars from './inspections/no-non-ascii-chars'
import RuleNoUnderscores from './inspections/no-underscores'
import RuleNoUppercaseChars from './inspections/no-uppercase-chars'
import RuleNoWhitespace from './inspections/no-whitespace'
import RuleTrailingSlash from './inspections/trailing-slash'
import RuleRedirects from './redirects'

export const AllInspections = [
  RuleNoMissingHref(),
  RuleNoDuplicateQueryParams(),
  RuleNoNonAsciiChars(),
  RuleMissingHash(),
  RuleNoUnderscores(),
  RuleNoWhitespace(),
  RuleNoDoubleSlashes(),
  RuleNoErrorResponse(),
  RuleNoDocumentRelative(),
  RuleNoJavascript(),
  RuleTrailingSlash(),
  RuleNoUppercaseChars(),
  RuleAbsoluteSiteUrls(),
  RuleRedirects(),
  RuleDescriptiveLinkText(),
]

export function inspect(ctx: Pick<Required<RuleTestContext>, 'link'> & Omit<Partial<RuleTestContext>, 'link'>, rules?: Rule[]): Partial<LinkInspectionResult> {
  rules = rules || AllInspections
  const res: Partial<LinkInspectionResult> = { error: [], warning: [], fix: ctx.link, link: ctx.link }
  let link = ctx.link
  const siteConfigHost = ctx.siteConfig?.url && parseURL(ctx.siteConfig.url).host
  const url = parseURL(link)
  const validInspections = rules
    .filter(({ id }) => !(ctx.skipInspections || []).includes(id))
  let processing = true
  for (const rule of validInspections) {
    const isFakeAbsolute = link.startsWith('//') && !link.includes('.')
    const hasNonHttpProtocol = hasProtocol(link) && !link.startsWith('http')
    const isExternalLink = hasNonHttpProtocol || (url.host && url.host !== siteConfigHost && !isFakeAbsolute)
    if (!rule.externalLinks && isExternalLink) {
      continue
    }
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
