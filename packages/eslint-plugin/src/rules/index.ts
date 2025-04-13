import { rule as asciiOnly } from './link-ascii-only'
import { rule as descriptiveLinkText } from './link-descriptive-text'
import { rule as headTitle } from './head-title'
import { rule as lowercase } from './link-lowercase'
import { rule as noDoubleSlashes } from './link-no-double-slashes'
import { rule as noUnderscores } from './link-no-underscores'
import { rule as noWhitespace } from './link-no-whitespace'
import { rule as requiresHref } from './link-requires-href'
import { rule as trailingSlash } from './link-trailing-slash'
import { rule as validRouterPath } from './link-valid-router-path'

export default {
  'head-title': headTitle,
  'link-descriptive-text': descriptiveLinkText,
  'link-no-whitespace': noWhitespace,
  'link-ascii-only': asciiOnly,
  'link-lowercase': lowercase,
  'link-no-double-slashes': noDoubleSlashes,
  'link-no-underscores': noUnderscores,
  'link-requires-href': requiresHref,
  'link-trailing-slash': trailingSlash,
  'link-valid-router-path': validRouterPath,
}
