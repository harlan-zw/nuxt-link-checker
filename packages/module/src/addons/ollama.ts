import { runParallel } from '~/packages/module/src/util'

export function hookOlamma() {
  await runParallel(new Set(res.results.map(result => result.filePath).filter(Boolean)), async (filePath) => {
    const result = res.results.find(r => r.filePath === filePath)
    if (!result?.source) {
      return
    }
    result.llmResult = JSON.parse((await ollama.chat({
      model: 'gemma3',
      messages: [{
        role: 'system',
        content: 'You are a principal engineer at Google with deep expertise in SEO, accessibility, and web performance.',
      }, {
        role: 'user',
        content: `Please review the following markdown, it is the content of a page extracted from HTML. Review the content SEO and accessibility issues,
      do not worry about HTML markup issues, only content issues.

The content has these metadata tags:
- title: HTML Review
- description: HTML Review

The main content is:
---
# HTML Review
please suggest that i use a h2 and h3
## HTML Review
---

Provide your analysis in valid JSON format only, do not wrap in a code block, focus on specific improvements.

Here is the rules you can use:

const seoContentAuditRules = {
  "content-informativeness": {
    ruleId: "content-informativeness",
    severity: "warning",
    message: "Content lacks sufficient depth and information",
    recommendation: "Focus on creating more informative content with detailed explanations",
    potentialImpact: "Shallow content may lead to poor user engagement and lower search rankings"
  },
  "content-keyword-usage": {
    ruleId: "content-keyword-usage",
    severity: "warning",
    message: "Target keywords are missing or underused in content",
    recommendation: "Use target keywords naturally throughout your content",
    potentialImpact: "Content without relevant keywords may rank poorly for intended search terms"
  },
  "h1-keyword-usage": {
    ruleId: "h1-keyword-usage",
    severity: "warning",
    message: "H1 tag does not contain target keywords",
    recommendation: "Include primary keywords in your H1 heading",
    potentialImpact: "H1 headings without keywords may reduce SEO effectiveness"
  },
  "title-keyword-usage": {
    ruleId: "title-keyword-usage",
    severity: "warning",
    message: "Title tag does not contain target keywords",
    recommendation: "Include primary keywords in your title tag",
    potentialImpact: "Titles without keywords may result in lower click-through rates"
  },
  "meta-keyword-usage": {
    ruleId: "meta-keyword-usage",
    severity: "warning",
    message: "Meta description lacks target keywords",
    recommendation: "Include target keywords in meta description",
    potentialImpact: "Meta descriptions without keywords may reduce click-through rates"
  },
  "h1-keyword-stuffing": {
    ruleId: "h1-keyword-stuffing",
    severity: "error",
    message: "H1 tag contains excessive keyword repetition",
    recommendation: "Avoid keyword stuffing in H1 headings",
    potentialImpact: "Keyword stuffing may trigger search engine penalties"
  },
  "meta-keyword-stuffing": {
    ruleId: "meta-keyword-stuffing",
    severity: "error",
    message: "Meta description contains excessive keyword repetition",
    recommendation: "Use keywords naturally in meta descriptions",
    potentialImpact: "Keyword stuffing may trigger search engine penalties"
  },
  "title-keyword-stuffing": {
    ruleId: "title-keyword-stuffing",
    severity: "error",
    message: "Title tag contains excessive keyword repetition",
    recommendation: "Use keywords naturally in title tags",
    potentialImpact: "Keyword stuffing may trigger search engine penalties"
  },
  "content-readability": {
    ruleId: "content-readability",
    severity: "warning",
    message: "Content may be difficult to read or comprehend",
    recommendation: "Ensure text content is easy to read with appropriate language level",
    potentialImpact: "Poor readability may increase bounce rates and reduce engagement"
  },
  "content-semantic-enrichment": {
    ruleId: "content-semantic-enrichment",
    severity: "info",
    message: "Page content lacks semantic richness",
    recommendation: "Enrich your page content with related terms and concepts",
    potentialImpact: "Content without semantic context may not rank well for related searches"
  }
};

Here is an example of the JSON response:

---
{
  "keywords": ["html", "review"],
  "results": [
    {
      ruleId: "heading-duplicate",
      severity: "error",
      message: "Duplicate heading found",
      recommendation: "Use unique headings for each section"
      potentialImpact: "This can cause confusion for screen readers and SEO crawlers"
  ]
}
---

- keywords: please guess the top 3 keywords from the content, do not include the prompt in the keywords
- results: an array of objects with the following properties:
  - ruleId: a string that identifies the rule
  - severity: a string that indicates the severity level of the issue (error, warning, info)
  - message: a string that describes the issue
  - recommendation: a string that describes the recommended fix
  - potentialImpact: a string that describes the potential impact of the issue
`,
      }],
      format: 'json',
    })).message.content)
    console.log('[nuxt-link-checker] LLM result', { result: result.llmResult })
    await (await ctx.storageContainer).storage.setItem(`llm-response-${result.filePath}.json`, result.llmResult)
  }, {
    concurrency: 3,
    interval: 100,
  })
}
