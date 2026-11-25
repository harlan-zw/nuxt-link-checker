import type { LinkInspectionResult, Rule, RuleTestContext } from '../types'
import { hasProtocol, parseURL } from 'ufo'
import RuleAbsoluteSiteUrls from './inspections/absolute-site-urls.ts'
import RuleDescriptiveLinkText from './inspections/link-text.ts'
import RuleMissingHash from './inspections/missing-hash.ts'
import RuleNoDocumentRelative from './inspections/no-baseless.ts'
import RuleNoDoubleSlashes from './inspections/no-double-slashes.ts'
import RuleNoDuplicateQueryParams from './inspections/no-duplicate-query-params.ts'
import RuleNoErrorResponse from './inspections/no-error-response.ts'
import RuleNoJavascript from './inspections/no-javascript.ts'
import RuleNoMissingHref from './inspections/no-missing-href.ts'
import RuleNoNonAsciiChars from './inspections/no-non-ascii-chars.ts'
import RuleNoUnderscores from './inspections/no-underscores.ts'
import RuleNoUppercaseChars from './inspections/no-uppercase-chars.ts'
import RuleNoWhitespace from './inspections/no-whitespace.ts'
import RuleTrailingSlash from './inspections/trailing-slash.ts'
import RuleRedirects from './redirects.ts'

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
  // Fold www so a link to the site's other host variant (www↔apex) is treated as
  // internal, not skipped as external by the internal-only rules below.
  const foldWww = (host: string | false | undefined | null): string => {
    return (host || '').replace(/^www\./i, '')
  }
  const siteConfigHost = ctx.siteConfig?.url && parseURL(ctx.siteConfig.url).host
  const url = parseURL(link)
  const validInspections = rules
    .filter(({ id }) => !(ctx.skipInspections || []).includes(id))
  let processing = true
  for (const rule of validInspections) {
    const isFakeAbsolute = link.startsWith('//') && !link.includes('.')
    const hasNonHttpProtocol = hasProtocol(link) && !link.startsWith('http')
    const isExternalLink = hasNonHttpProtocol || (url.host && foldWww(url.host) !== foldWww(siteConfigHost) && !isFakeAbsolute)
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
