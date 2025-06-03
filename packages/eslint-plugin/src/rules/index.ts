import { rule as asciiOnly } from './linking/ascii-only'
import { rule as noDoubleSlashes } from './linking/no-double-slashes'
import { rule as noUnderscores } from './linking/no-underscores'
import { rule as noWhitespace } from './linking/no-whitespace'
import { rule as lowercase } from './linking/only-lowercase'
import { rule as descriptiveLinkText } from './linking/require-descriptive-text'
import { rule as requiresHref } from './linking/require-href'
import { rule as trailingSlash } from './linking/trailing-slash'
import { rule as validRouterPath } from './linking/valid-router-path'
import { rule as duplicateDescription } from './meta/duplicate-description'
import { rule as duplicateTitle } from './meta/duplicate-title'
import { rule as missingDescription } from './meta/missing-description'
import { rule as missingTitle } from './meta/missing-title'

export default {
  // meta
  'meta/missing-title': missingTitle,
  'meta/missing-description': missingDescription,
  'meta/duplicate-title': duplicateTitle,
  'meta/duplicate-description': duplicateDescription,
  // linking
  'linking/require-descriptive-text': descriptiveLinkText,
  'linking/no-whitespace': noWhitespace,
  'linking/ascii-only': asciiOnly,
  'linking/only-lowercase': lowercase,
  'linking/no-double-slashes': noDoubleSlashes,
  'linking/no-underscores': noUnderscores,
  'linking/require-href': requiresHref,
  'linking/trailing-slash': trailingSlash,
  'linking/valid-router-path': validRouterPath,
}
