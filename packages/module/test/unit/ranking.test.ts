import type { LinkData, PageData } from '../../src/lib/ranking'
import { describe, expect, it } from 'vitest'
import {
  buildInternalLinkGraph,
  calculateContentQualityScore,
  calculateDepthScore,
  calculateInboundLinksScore,
  calculateInternalLinkRanks,
  calculateNavigationScore,
  calculatePageScores,

  normalizePageRanks,

} from '../../src/lib/ranking'

describe('ranking', () => {
  const baseUrl = 'https://example.com'

  const mockPages: PageData[] = [
    { pageId: 1, url: 'https://example.com/', path: '/', crawlDepth: 0 },
    { pageId: 2, url: 'https://example.com/about', path: '/about', crawlDepth: 1 },
    { pageId: 3, url: 'https://example.com/blog/post-1', path: '/blog/post-1', crawlDepth: 2 },
    { pageId: 4, url: 'https://example.com/category/tech', path: '/category/tech', crawlDepth: 2 },
    { pageId: 5, url: 'https://example.com/very/deeply/nested/page/with/a/really/long/path/that/exceeds/one/hundred/characters/in/total/length', path: '/very/deeply/nested/page/with/a/really/long/path/that/exceeds/one/hundred/characters/in/total/length', crawlDepth: 3 },
  ]

  const mockLinks: LinkData[] = [
    // Home page links to about and blog post
    { pageId: 1, resourceId: 1, url: 'https://example.com/about' },
    { pageId: 1, resourceId: 2, url: 'https://example.com/blog/post-1' },
    // About page links to home and category
    { pageId: 2, resourceId: 3, url: 'https://example.com/' },
    { pageId: 2, resourceId: 4, url: 'https://example.com/category/tech' },
    // Blog post links to home and category
    { pageId: 3, resourceId: 5, url: 'https://example.com/' },
    { pageId: 3, resourceId: 6, url: 'https://example.com/category/tech' },
    // External link (should be ignored)
    { pageId: 1, resourceId: 7, url: 'https://external.com/page' },
  ]

  describe('buildInternalLinkGraph', () => {
    it('builds correct internal link graph', () => {
      const graph = buildInternalLinkGraph(mockPages, mockLinks, baseUrl)

      // Check that external links are filtered out
      expect(graph.internalLinks.size).toBe(4) // home, about, category, blog pages have inbound links
      expect(graph.outboundLinks.size).toBe(3) // home, about, blog pages have outbound links

      // Home page should have 2 inbound links (from about and blog)
      expect(graph.internalLinks.get(1)?.size).toBe(2)
      expect(graph.internalLinks.get(1)?.has(2)).toBe(true) // from about
      expect(graph.internalLinks.get(1)?.has(3)).toBe(true) // from blog

      // About page should have 1 inbound link (from home)
      expect(graph.internalLinks.get(2)?.size).toBe(1)
      expect(graph.internalLinks.get(2)?.has(1)).toBe(true) // from home

      // Category page should have 2 inbound links (from about and blog)
      expect(graph.internalLinks.get(4)?.size).toBe(2)
      expect(graph.internalLinks.get(4)?.has(2)).toBe(true) // from about
      expect(graph.internalLinks.get(4)?.has(3)).toBe(true) // from blog
    })

    it('creates correct lookup maps', () => {
      const graph = buildInternalLinkGraph(mockPages, mockLinks, baseUrl)

      expect(graph.pageUrlToId.get('https://example.com/')).toBe(1)
      expect(graph.pageUrlToId.get('https://example.com/about')).toBe(2)
      expect(graph.pageIdToUrl.get(1)).toBe('https://example.com/')
      expect(graph.pageIdToUrl.get(2)).toBe('https://example.com/about')
      expect(graph.pageCrawlDepth.get(1)).toBe(0)
      expect(graph.pageCrawlDepth.get(3)).toBe(2)
    })

    it('handles null crawl depth', () => {
      const pagesWithNullDepth: PageData[] = [
        { pageId: 1, url: 'https://example.com/', path: '/', crawlDepth: null },
      ]
      const graph = buildInternalLinkGraph(pagesWithNullDepth, [], baseUrl)

      expect(graph.pageCrawlDepth.get(1)).toBe(0)
    })
  })

  describe('calculateInboundLinksScore', () => {
    it('returns 0 for pages with no inbound links', () => {
      const score = calculateInboundLinksScore(new Set(), new Map(), new Map())
      expect(score).toBe(0)
    })

    it('calculates score based on linking page authority', () => {
      const linkingPages = new Set([2, 3]) // about and blog pages link to this page
      const internalLinks = new Map([
        [2, new Set([1])], // about page has 1 inbound link
        [3, new Set([1])], // blog page has 1 inbound link
      ])
      const pageCrawlDepth = new Map([
        [1, 0], // home page (depth 0)
        [2, 1], // about page (depth 1)
        [3, 2], // blog page (depth 2)
      ])

      const score = calculateInboundLinksScore(linkingPages, internalLinks, pageCrawlDepth)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(50)
    })

    it('gives higher scores to links from shallower pages', () => {
      const linkingFromShallow = new Set([1]) // home page (depth 0)
      const linkingFromDeep = new Set([5]) // deep page (depth 3)
      const internalLinks = new Map()
      const pageCrawlDepth = new Map([
        [1, 0],
        [5, 3],
      ])

      const shallowScore = calculateInboundLinksScore(linkingFromShallow, internalLinks, pageCrawlDepth)
      const deepScore = calculateInboundLinksScore(linkingFromDeep, internalLinks, pageCrawlDepth)

      expect(shallowScore).toBeGreaterThan(deepScore)
    })
  })

  describe('calculateDepthScore', () => {
    it('gives maximum score to home page (depth 0)', () => {
      const score = calculateDepthScore(0, 3)
      expect(score).toBe(25)
    })

    it('gives decreasing scores for deeper pages', () => {
      const maxDepth = 3
      const depth0Score = calculateDepthScore(0, maxDepth)
      const depth1Score = calculateDepthScore(1, maxDepth)
      const depth2Score = calculateDepthScore(2, maxDepth)
      const depth3Score = calculateDepthScore(3, maxDepth)

      expect(depth0Score).toBeGreaterThan(depth1Score)
      expect(depth1Score).toBeGreaterThan(depth2Score)
      expect(depth2Score).toBeGreaterThan(depth3Score)
      expect(depth3Score).toBe(0)
    })

    it('handles maxDepth of 0', () => {
      const score = calculateDepthScore(0, 0)
      expect(score).toBe(25)
    })
  })

  describe('calculateNavigationScore', () => {
    it('gives highest score for links from home page', () => {
      const linkingPages = new Set([1]) // home page
      const pageCrawlDepth = new Map([[1, 0]])

      const score = calculateNavigationScore(linkingPages, pageCrawlDepth)
      expect(score).toBe(8)
    })

    it('gives medium score for links from first level', () => {
      const linkingPages = new Set([2]) // first level page
      const pageCrawlDepth = new Map([[2, 1]])

      const score = calculateNavigationScore(linkingPages, pageCrawlDepth)
      expect(score).toBe(4)
    })

    it('gives low score for links from second level', () => {
      const linkingPages = new Set([3]) // second level page
      const pageCrawlDepth = new Map([[3, 2]])

      const score = calculateNavigationScore(linkingPages, pageCrawlDepth)
      expect(score).toBe(2)
    })

    it('gives no score for links from deeper levels', () => {
      const linkingPages = new Set([4]) // third level page
      const pageCrawlDepth = new Map([[4, 3]])

      const score = calculateNavigationScore(linkingPages, pageCrawlDepth)
      expect(score).toBe(0)
    })

    it('caps total score at 15 points', () => {
      const linkingPages = new Set([1, 2, 3, 4, 5]) // many linking pages from different levels
      const pageCrawlDepth = new Map([
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0], // all from home level
      ])

      const score = calculateNavigationScore(linkingPages, pageCrawlDepth)
      expect(score).toBe(15) // 5 * 8 = 40, but capped at 15
    })
  })

  describe('calculateContentQualityScore', () => {
    it('gives bonus for blog/article pages', () => {
      expect(calculateContentQualityScore('/blog/my-post')).toBe(3)
      expect(calculateContentQualityScore('/article/news')).toBe(3)
    })

    it('gives penalty for category/tag pages', () => {
      expect(calculateContentQualityScore('/category/tech')).toBe(0) // -2 capped at 0
      expect(calculateContentQualityScore('/tag/javascript')).toBe(0) // -2 capped at 0
    })

    it('gives penalty for very long URLs', () => {
      const longPath = '/very/deeply/nested/page/with/a/really/long/path/that/exceeds/one/hundred/characters/in/total/length'
      expect(calculateContentQualityScore(longPath)).toBe(0) // -1 capped at 0
    })

    it('combines multiple factors', () => {
      // Blog page with long URL: +3 -1 = 2
      const blogLongPath = '/blog/very/deeply/nested/page/with/a/really/long/path/that/exceeds/one/hundred/characters/in/total/length'
      expect(calculateContentQualityScore(blogLongPath)).toBe(2)

      // Category page with long URL: -2 -1 = -3, but capped at 0
      const categoryLongPath = '/category/very/deeply/nested/page/with/a/really/long/path/that/exceeds/one/hundred/characters/in/total/length'
      expect(calculateContentQualityScore(categoryLongPath)).toBe(0)
    })

    it('caps score between 0 and 10', () => {
      expect(calculateContentQualityScore('/normal')).toBe(0)
      expect(calculateContentQualityScore('/blog/post')).toBeLessThanOrEqual(10)
      expect(calculateContentQualityScore('/category/tech')).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculatePageScores', () => {
    it('calculates comprehensive scores for all pages', () => {
      const graph = buildInternalLinkGraph(mockPages, mockLinks, baseUrl)
      const pageScores = calculatePageScores(mockPages, graph)

      expect(pageScores).toHaveLength(5)

      // Home page should have highest score (depth 0, inbound links, navigation prominence)
      const homeScore = pageScores.find(p => p.pageId === 1)
      expect(homeScore).toBeDefined()
      expect(homeScore!.isHomePage).toBe(true)
      expect(homeScore!.depth).toBe(0)
      expect(homeScore!.inboundCount).toBe(2)

      // Blog page should get content quality bonus
      const blogScore = pageScores.find(p => p.pageId === 3)
      expect(blogScore).toBeDefined()
      expect(blogScore!.rawScore).toBeGreaterThan(0)

      // Category page should get content quality penalty
      const categoryScore = pageScores.find(p => p.pageId === 4)
      expect(categoryScore).toBeDefined()

      // Deep page with long URL should have lower score
      const deepScore = pageScores.find(p => p.pageId === 5)
      expect(deepScore).toBeDefined()
      expect(deepScore!.depth).toBe(3)
    })
  })

  describe('normalizePageRanks', () => {
    it('normalizes scores to 0-100 range', () => {
      const pageScores = [
        { pageId: 1, rawScore: 100, inboundCount: 5, depth: 0, isHomePage: true },
        { pageId: 2, rawScore: 80, inboundCount: 3, depth: 1, isHomePage: false },
        { pageId: 3, rawScore: 60, inboundCount: 1, depth: 2, isHomePage: false },
        { pageId: 4, rawScore: 40, inboundCount: 0, depth: 3, isHomePage: false },
      ]

      const rankUpdates = normalizePageRanks(pageScores)

      expect(rankUpdates).toHaveLength(4)
      expect(rankUpdates.every(r => r.rank >= 1 && r.rank <= 100)).toBe(true)

      // Higher raw scores should get higher ranks
      const sortedUpdates = rankUpdates.sort((a, b) => b.rank - a.rank)
      expect(sortedUpdates[0].pageId).toBe(1) // Home page should be highest
    })

    it('ensures home page gets high score', () => {
      const pageScores = [
        { pageId: 1, rawScore: 50, inboundCount: 1, depth: 0, isHomePage: true },
        { pageId: 2, rawScore: 80, inboundCount: 5, depth: 1, isHomePage: false },
      ]

      const rankUpdates = normalizePageRanks(pageScores)
      const homeRank = rankUpdates.find(r => r.pageId === 1)!.rank

      expect(homeRank).toBeGreaterThanOrEqual(85)
    })

    it('limits top 5% to score of 100', () => {
      // Create 20 pages so top 5% = 1 page
      const pageScores = Array.from({ length: 20 }, (_, i) => ({
        pageId: i + 1,
        rawScore: 100 - i,
        inboundCount: 5 - Math.floor(i / 4),
        depth: Math.floor(i / 5),
        isHomePage: i === 0,
      }))

      const rankUpdates = normalizePageRanks(pageScores)
      const rank100Count = rankUpdates.filter(r => r.rank === 100).length

      expect(rank100Count).toBeLessThanOrEqual(1) // Only top 5% can get 100
    })
  })

  describe('calculateInternalLinkRanks', () => {
    it('integrates all ranking calculations', () => {
      const rankUpdates = calculateInternalLinkRanks(mockPages, mockLinks, baseUrl)

      expect(rankUpdates).toHaveLength(5)
      expect(rankUpdates.every(r => r.rank >= 1 && r.rank <= 100)).toBe(true)

      // Home page should have high rank
      const homeRank = rankUpdates.find(r => r.pageId === 1)!.rank
      expect(homeRank).toBeGreaterThan(80)

      // All pages should have valid ranks
      expect(rankUpdates.every(r => typeof r.pageId === 'number' && typeof r.rank === 'number')).toBe(true)
    })

    it('handles empty data gracefully', () => {
      const rankUpdates = calculateInternalLinkRanks([], [], baseUrl)
      expect(rankUpdates).toEqual([])
    })

    it('handles single page', () => {
      const singlePage: PageData[] = [
        { pageId: 1, url: 'https://example.com/', path: '/', crawlDepth: 0 },
      ]
      const rankUpdates = calculateInternalLinkRanks(singlePage, [], baseUrl)

      expect(rankUpdates).toHaveLength(1)
      expect(rankUpdates[0].pageId).toBe(1)
      expect(rankUpdates[0].rank).toBeGreaterThan(80) // Should get high rank as home page
    })
  })
})
