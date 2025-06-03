import type { BaseHttpResponseData } from '@crawlee/core'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}

export const pages = sqliteTable('pages', {
  pageId: integer('page_id').notNull().primaryKey({ autoIncrement: true }),
  ...timestamps,
  requestId: text('requestId').notNull(),
  statusCode: integer('status_code').notNull(),
  headers: text('headers', { mode: 'json' }).notNull().$type<BaseHttpResponseData['headers']>(),
  errorMessages: text('error_messages', { mode: 'json' }).$type<string[]>(),
  title: text('title'),
  description: text('description'),
  url: text('url').notNull(),
  loadedUrl: text('loaded_url'),
  path: text('path').notNull(),
  contentLength: integer('content_length').notNull(),
  // Essential SEO columns
  canonical: text('canonical'),
  metaRobots: text('meta_robots'),
  h1: text('h1'),
  wordCount: integer('word_count'),
  // Important SEO/Technical columns
  lang: text('lang'),
  viewport: text('viewport'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  // Performance/Advanced columns
  responseTime: integer('response_time'),
  structuredData: text('structured_data', { mode: 'json' }).$type<object[]>(),
  hreflang: text('hreflang', { mode: 'json' }).$type<string[]>(),
  // Caching columns
  cacheControl: text('cache_control'),
  lastModified: text('last_modified'),
  etag: text('etag'),
  expires: text('expires'),
  // Task analysis tracking
  taskAnalyzed: integer('task_analyzed', { mode: 'boolean' }).notNull().default(false),
  // Internal link rank (0-100, similar to Ahrefs PageRank)
  internalLinkRank: integer('internal_link_rank'),
  // Crawl depth (0 = home page, 1 = first level, etc.)
  crawlDepth: integer('crawl_depth'),
  // Nuxt payload data for SSR/prerender analysis
  nuxtPayload: text('nuxt_payload', { mode: 'json' }).$type<object>(),
  // SSR and prerender flags derived from payload
  isServerRendered: integer('is_server_rendered', { mode: 'boolean' }),
  isPrerendered: integer('is_prerendered', { mode: 'boolean' }),
  prerenderedAt: integer('prerendered_at'), // Unix timestamp
  // Payload performance data
  payloadSize: integer('payload_size'), // Size of the _payload.json file in bytes
}, t => [
  unique('unq').on(t.requestId),
  unique('pathunq').on(t.path),
])

// images table, we'll need a relation page_images to link pages and images, we need to have a statusCode for each image
// and size I guess, the alt / width / height may change between pages but the status code
export const resources = sqliteTable('resources', {
  resourceId: integer('resource_id').notNull().primaryKey({ autoIncrement: true }),
  ...timestamps,
  url: text('url').notNull(),
  loadedUrl: text('loaded_url'),
  statusCode: integer('status_code'),
  headers: text('headers', { mode: 'json' }).$type<BaseHttpResponseData['headers']>(),
  contentLength: integer('content_length'),
  contentType: text('content_type'),
  // Caching columns for resources
  cacheControl: text('cache_control'),
  lastModified: text('last_modified'),
  etag: text('etag'),
  expires: text('expires'),
  // Performance columns
  responseTime: integer('response_time'),
  // Compression from headers
  contentEncoding: text('content_encoding'), // gzip, br, deflate
}, t => [
  unique('urlunq').on(t.url),
])

export const pageImages = sqliteTable('page_images', {
  pageId: integer('page_id').notNull().references(() => pages.pageId),
  resourceId: integer('resourceId').notNull().references(() => resources.resourceId),
  // alt text, width, height may change between pages
  alt: text('alt'),
  width: text('width'),
  height: text('height'),
  // HTML attributes we can extract
  loading: text('loading'), // lazy, eager
  fetchpriority: text('fetchpriority'), // high, low, auto
  sizes: text('sizes'),
  srcset: text('srcset'),
  ariaLabel: text('aria_label'),
})

export const pageLinks = sqliteTable('page_links', {
  pageId: integer('page_id').notNull().references(() => pages.pageId),
  resourceId: integer('resourceId').notNull().references(() => resources.resourceId),
  textContent: text('text_content').notNull(),
  title: text('title'),
  rel: text('rel'),
  target: text('target'),
  // Additional link attributes
  download: text('download'),
  hreflang: text('hreflang'),
  type: text('type'),
  referrerpolicy: text('referrerpolicy'),
  // Accessibility
  ariaLabel: text('aria_label'),
  // Link classification
  isInternal: integer('is_internal', { mode: 'boolean' }).notNull(),
})

export const pageScripts = sqliteTable('page_scripts', {
  pageId: integer('page_id').notNull().references(() => pages.pageId),
  resourceId: integer('resourceId').references(() => resources.resourceId), // null for inline scripts
  // Script attributes
  async: integer('async', { mode: 'boolean' }),
  defer: integer('defer', { mode: 'boolean' }),
  type: text('type'),
  integrity: text('integrity'),
  crossorigin: text('crossorigin'),
  // Placement tracking for blocking analysis
  placement: text('placement').notNull(), // 'head', 'body-start', 'body-end'
  isInline: integer('is_inline', { mode: 'boolean' }).notNull(),
  // For inline scripts, store the content hash for deduplication
  contentHash: text('content_hash'),
  // Order within placement for precise blocking analysis
  orderInPage: integer('order_in_page').notNull(),
})

export const pageStyles = sqliteTable('page_styles', {
  pageId: integer('page_id').notNull().references(() => pages.pageId),
  resourceId: integer('resourceId').references(() => resources.resourceId), // null for inline styles
  // Style attributes
  media: text('media'),
  disabled: integer('disabled', { mode: 'boolean' }),
  integrity: text('integrity'),
  crossorigin: text('crossorigin'),
  // Placement tracking for render blocking analysis
  placement: text('placement').notNull(), // 'head', 'body'
  isInline: integer('is_inline', { mode: 'boolean' }).notNull(),
  // For inline styles, store the content hash for deduplication
  contentHash: text('content_hash'),
  // Order within placement for precise blocking analysis
  orderInPage: integer('order_in_page').notNull(),
})

export const pageRules = sqliteTable('page_rules', {
  ruleId: integer('rule_id').notNull().primaryKey({ autoIncrement: true }),
  pageId: integer('page_id').notNull().references(() => pages.pageId),
  ...timestamps,
  // ESLint rule information
  eslintRuleId: text('eslint_rule_id').notNull(), // e.g., 'nuxt-analyze/link-descriptive-text'
  severity: integer('severity').notNull(), // 1 = warning, 2 = error
  message: text('message').notNull(),
  // Location information
  line: integer('line'),
  column: integer('column'),
  endLine: integer('end_line'),
  endColumn: integer('end_column'),
  // ESLint metadata
  nodeType: text('node_type'),
  messageId: text('message_id'),
  // Fix information (if available)
  fixRange: text('fix_range', { mode: 'json' }).$type<[number, number]>(),
  fixText: text('fix_text'),
  // Source context
  sourceLines: text('source_lines', { mode: 'json' }).$type<string[]>(),
  highlightedSource: text('highlighted_source'),
  startLine: integer('start_line'),
  startColumn: integer('start_column'),
})

export type Page = typeof pages.$inferSelect
export type PageRule = typeof pageRules.$inferSelect
