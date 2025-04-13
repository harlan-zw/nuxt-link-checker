# ESLint Plugin Rules Specification

This document outlines the requirements and guidelines for creating rules in this ESLint plugin. The goal is to create parser-agnostic rules that work uniformly across HTML and Vue templates.

## Rule Structure

Each rule should follow this file structure:

```
rules/
  ├── rule-name/
  │   ├── index.ts     # Rule implementation
  │   ├── index.md     # Rule documentation
  │   └── index.test.ts # Rule tests
```

## Rule Implementation Guidelines

### 1. Parser Agnosticism

Rules must work with both HTML and Vue templates. Use the utility functions provided to abstract away parser-specific logic.

```typescript
// Good example
export const rule = createRule({
  // ...
  create(context) {
    return useAnchorLinks(context, (link, node) => {
      // Process links regardless of parser
    }, { tags: ['a', 'nuxtlink'] })
  },
})
```

### 2. Use Utility Functions

Use the provided utility functions to handle different parsers and element types:

- `createRule`: Creates a rule with consistent metadata format
- `useAnchorLinks`: Processes anchor elements in both HTML and Vue templates
- `isVueParser`: Detects whether the Vue parser is being used

If you need to create a new utility function, follow the same structure as existing ones such as `useAnchorLinks`.

### 3. Rule Definition

Each rule should include:

- A descriptive name (kebab-case)
- Comprehensive metadata (type, docs, messages, schema)
- Default options
- Implementation using utility abstractions

We DO NOT we need to add the url of the rule as it's automatically generated.

Use `default` for the messages if there's only one

### 4. Auto-fixing and Accessing Element Attributes

When implementing auto-fix for a rule (`fixable: 'code'`), make sure to:

1. Access attribute value nodes using the `<attrKey>Node` property (e.g., `link.hrefNode` or `link.toNode`)
2. Use the `asStringLiteral` utility to properly format string replacements with the correct quotes:

```typescript
fix(fixer) {
  // Process and fix the value...
  const fixedValue = process(originalValue);

  // Get the attribute node
  const node = link.hrefNode || link.toNode;

  // Replace with properly quoted string
  return fixer.replaceText(node, asStringLiteral(context, fixedValue));
}
```

The `asStringLiteral` utility ensures that the replacement string uses the same quote style (single or double) as the original attribute.

#### meta (object)

- type: (string) Indicates the type of rule, which is one of "problem", "suggestion", or "layout":
  - "problem": The rule is identifying code that either will cause an error or may cause a confusing behavior. Developers should consider this a high priority to resolve.
  - "suggestion": The rule is identifying something that could be done in a better way but no errors will occur if the code isn’t changed.
  - "layout": The rule cares primarily about whitespace, semicolons, commas, and parentheses, all the parts of the program that determine how the code looks rather than how it executes. These rules work on parts of the code that aren’t specified in the AST.
- docs: (object) Properties often used for documentation generation and tooling. Required for core rules and optional for custom rules. Custom rules can include additional properties here as needed.
  - description: (string) Provides a short description of the rule. For core rules, this is used in rules index.
  - recommended: (boolean) For core rules, this specifies whether the rule is enabled by the recommended config from @eslint/js.
  - url: (string) Specifies the URL at which the full documentation can be accessed. Code editors often use this to provide a helpful link on highlighted rule violations.
- fixable: (string) Either "code" or "whitespace" if the --fix option on the command line automatically fixes problems reported by the rule.

Important: the fixable property is mandatory for fixable rules. If this property isn’t specified, ESLint will throw an error whenever the rule attempts to produce a fix. Omit the fixable property if the rule is not fixable.

- hasSuggestions: (boolean) Specifies whether rules can return suggestions (defaults to false if omitted).

Important: the hasSuggestions property is mandatory for rules that provide suggestions. If this property isn’t set to true, ESLint will throw an error whenever the rule attempts to produce a suggestion. Omit the hasSuggestions property if the rule does not provide suggestions.

- schema: (object | array | false) Specifies the options so ESLint can prevent invalid rule configurations. Mandatory when the rule has options.

- defaultOptions: (array) Specifies default options for the rule. If present, any user-provided options in their config will be merged on top of them recursively.

```typescript
export const rule = createRule<'messageId', []>({
  name: 'rule-name',
  meta: {
    type: 'suggestion', // or 'problem' or 'layout'
    docs: {
      description: 'Clear description of what the rule checks',
      recommended: true,
      url: 'URL to documentation',
    },
    messages: {
      messageId: 'Message with {{ placeholder }}',
    },
    schema: [], // Options schema if needed
  },
  defaultOptions: [],
  create(context) {
    // Implementation using utility functions
  },
})
```

The rule should make reports using `context.report()` using messageIds.

If the rule can be safely fixed or suggestions can be made, they should be included in the `context.report()` call.

### 4. Documentation

Every rule must have accompanying documentation in an `index.md` file that includes:

- Rule name and description
- Rule details with examples of incorrect and correct code
- Explanation of why the rule matters
- Options documentation (if applicable)

## Testing Guidelines

Each rule must have comprehensive tests that:

1. Test both HTML and Vue template scenarios
2. Cover all error conditions
3. Verify correct behavior with different options (if applicable)
4. Include positive tests (valid code that doesn't trigger the rule)

```typescript
// Example test structure
import htmlParser from '@html-eslint/parser'
import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import * as vueParser from 'vue-eslint-parser'
import { rule } from './index'

// Configure RuleTester with flat config style
const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

const htmlRuleTester = new RuleTester({
  languageOptions: {
    parser: htmlParser,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

describe('<rule-name>', () => {
  it('vue validates successfully', () => {
    ruleTester.run('<rule-name>', rule, {
      valid: [
        // ...
      ],
      invalid: [
        // ...
      ],
    })
  })
  it('html validates successfully', () => {
    htmlRuleTester.run('link-descriptive-text', rule, {
      valid: [
        // ...
      ],
      invalid: [
        // ...
      ],
    })
  })
})
```

## Performance Considerations

- Rules should be optimized for performance
- Avoid unnecessary processing or complex regular expressions
- Use early returns when possible to avoid unnecessary processing
- Consider caching results for repeated operations

## Adding New Rules

When adding a new rule:

1. Create the rule following the structure above
2. Add the rule to `src/rules/index.ts`
3. Document the rule in its own markdown file
4. Add comprehensive tests
5. Update the main README.md file with the new rule information
