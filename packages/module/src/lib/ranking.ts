export interface PageData {
  pageId: number
  url: string
  path: string
  crawlDepth: number | null
}

export interface LinkData {
  pageId: number
  resourceId: number
  url: string
}

export interface PageScore {
  pageId: number
  rawScore: number
  inboundCount: number
  depth: number
  isHomePage: boolean
}

export interface RankUpdate {
  pageId: number
  rank: number
}

export interface InternalLinkGraph {
  internalLinks: Map<number, Set<number>> // pageId -> Set of linking pageIds
  outboundLinks: Map<number, Set<number>> // pageId -> Set of linked pageIds
  pageUrlToId: Map<string, number>
  pageIdToUrl: Map<number, string>
  pageCrawlDepth: Map<number, number>
}

/**
 * Builds an internal link graph from page and link data
 */
export function buildInternalLinkGraph(
  allPages: PageData[],
  allLinks: LinkData[],
  baseUrl: string,
): InternalLinkGraph {
  // Create maps for efficient lookups
  const pageUrlToId = new Map<string, number>()
  const pageIdToUrl = new Map<number, string>()
  const pageCrawlDepth = new Map<number, number>()

  for (const page of allPages) {
    pageUrlToId.set(page.url, page.pageId)
    pageIdToUrl.set(page.pageId, page.url)
    // Use stored crawl depth from database
    pageCrawlDepth.set(page.pageId, page.crawlDepth ?? 0)
  }

  // Build internal link graph
  const internalLinks = new Map<number, Set<number>>() // pageId -> Set of linking pageIds
  const outboundLinks = new Map<number, Set<number>>() // pageId -> Set of linked pageIds

  for (const link of allLinks) {
    const linkUrl = new URL(link.url)
    const baseDomain = new URL(baseUrl).origin

    // Only consider internal links (same domain)
    if (linkUrl.origin === baseDomain) {
      const targetPageId = pageUrlToId.get(link.url)
      if (targetPageId) {
        // link.pageId links to targetPageId
        if (!internalLinks.has(targetPageId)) {
          internalLinks.set(targetPageId, new Set())
        }
        if (!outboundLinks.has(link.pageId)) {
          outboundLinks.set(link.pageId, new Set())
        }

        internalLinks.get(targetPageId)!.add(link.pageId)
        outboundLinks.get(link.pageId)!.add(targetPageId)
      }
    }
  }

  return {
    internalLinks,
    outboundLinks,
    pageUrlToId,
    pageIdToUrl,
    pageCrawlDepth,
  }
}

/**
 * Calculates weighted inbound links score (0-50 points max)
 */
export function calculateInboundLinksScore(
  linkingPages: Set<number>,
  internalLinks: Map<number, Set<number>>,
  pageCrawlDepth: Map<number, number>,
): number {
  if (linkingPages.size === 0) {
    return 0
  }

  let weightedInboundScore = 0
  for (const linkingPageId of linkingPages) {
    const linkingPageDepth = pageCrawlDepth.get(linkingPageId) || 0
    const linkingPageInboundCount = (internalLinks.get(linkingPageId) || new Set()).size

    // Authority weight based on depth and inbound links of linking page
    const depthWeight = Math.max(0.2, 1 - (linkingPageDepth * 0.2))
    const linkWeight = Math.min(2, 1 + Math.log(1 + linkingPageInboundCount) / 5)

    weightedInboundScore += depthWeight * linkWeight
  }

  // Use square root to prevent extreme values
  return Math.min(50, Math.sqrt(weightedInboundScore) * 8)
}

/**
 * Calculates depth score (0-25 points max)
 */
export function calculateDepthScore(depth: number, maxDepth: number): number {
  return maxDepth > 0 ? (1 - (depth / maxDepth)) * 25 : 25
}

/**
 * Calculates navigation prominence score (0-15 points)
 * Pages linked from home page or shallow pages get bonus
 */
export function calculateNavigationScore(
  linkingPages: Set<number>,
  pageCrawlDepth: Map<number, number>,
): number {
  let navigationScore = 0
  for (const linkingPageId of linkingPages) {
    const linkingPageDepth = pageCrawlDepth.get(linkingPageId) || 0
    if (linkingPageDepth === 0) {
      navigationScore += 8 // Linked from home page
    }
    else if (linkingPageDepth === 1) {
      navigationScore += 4 // Linked from first level
    }
    else if (linkingPageDepth === 2) {
      navigationScore += 2 // Linked from second level
    }
  }
  return Math.min(15, navigationScore)
}

/**
 * Calculates content quality score based on URL patterns (0-10 points)
 */
export function calculateContentQualityScore(path: string): number {
  let contentScore = 0

  // Pages with certain URL patterns get bonus/penalty
  if (path.includes('/blog/') || path.includes('/article/')) {
    contentScore += 3 // Content pages
  }
  if (path.includes('/tag/') || path.includes('/category/')) {
    contentScore -= 2 // Category/tag pages typically less valuable
  }
  if (path.length > 100) {
    contentScore -= 1 // Very long URLs might be less important
  }

  return Math.max(0, Math.min(10, contentScore))
}

/**
 * Calculates raw page scores based on various ranking factors
 */
export function calculatePageScores(
  allPages: PageData[],
  linkGraph: InternalLinkGraph,
): PageScore[] {
  const { internalLinks, pageCrawlDepth } = linkGraph
  const pageScores: PageScore[] = []
  const maxDepth = Math.max(...allPages.map(p => pageCrawlDepth.get(p.pageId) || 0))

  for (const page of allPages) {
    const linkingPages = internalLinks.get(page.pageId) || new Set()
    const inboundCount = linkingPages.size
    const depth = pageCrawlDepth.get(page.pageId) || 0
    const isHomePage = page.path === '/' || page.path === ''

    let rawScore = 0

    // 1. Weighted inbound links score (0-50 points max)
    rawScore += calculateInboundLinksScore(linkingPages, internalLinks, pageCrawlDepth)

    // 2. Depth score (0-25 points max)
    rawScore += calculateDepthScore(depth, maxDepth)

    // 3. Navigation prominence (0-15 points)
    rawScore += calculateNavigationScore(linkingPages, pageCrawlDepth)

    // 4. Content quality indicators (0-10 points)
    rawScore += calculateContentQualityScore(page.path)

    pageScores.push({
      pageId: page.pageId,
      rawScore,
      inboundCount,
      depth,
      isHomePage,
    })
  }

  return pageScores
}

/**
 * Normalizes page scores to final ranks (0-100 scale)
 */
export function normalizePageRanks(pageScores: PageScore[]): RankUpdate[] {
  // Sort by raw score to apply relative ranking
  const sortedScores = [...pageScores].sort((a, b) => b.rawScore - a.rawScore)

  const rankUpdates: RankUpdate[] = []
  const totalPages = sortedScores.length

  sortedScores.forEach((pageScore, index) => {
    let finalScore = pageScore.rawScore

    // Apply relative ranking bonus for top performers
    const percentile = (totalPages - index) / totalPages
    const percentileBonus = percentile ** 2 * 20 // Non-linear bonus for top pages
    finalScore += percentileBonus

    // Home page special treatment
    if (pageScore.isHomePage) {
      finalScore = Math.max(finalScore, 85) // Ensure home page gets high score but not always 100
    }

    // Normalize to 0-100 range with better distribution
    let normalizedRank = Math.min(100, Math.max(1, Math.round(finalScore)))

    // Prevent too many 100s - only top 5% can get 100
    const top5PercentThreshold = Math.ceil(totalPages * 0.05)
    if (index >= top5PercentThreshold && normalizedRank === 100) {
      normalizedRank = 95 + Math.floor((top5PercentThreshold - index) / top5PercentThreshold * 4)
    }

    rankUpdates.push({
      pageId: pageScore.pageId,
      rank: normalizedRank,
    })
  })

  return rankUpdates
}

/**
 * Calculates internal link rankings for all pages
 * This is the main function that orchestrates the ranking calculation
 */
export function calculateInternalLinkRanks(
  allPages: PageData[],
  allLinks: LinkData[],
  baseUrl: string,
): RankUpdate[] {
  // Build the internal link graph
  const linkGraph = buildInternalLinkGraph(allPages, allLinks, baseUrl)

  // Calculate raw scores for all pages
  const pageScores = calculatePageScores(allPages, linkGraph)

  // Normalize scores to final ranks
  return normalizePageRanks(pageScores)
}
