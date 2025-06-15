import type { H3Event } from 'h3'
// @ts-expect-error alias
import manifest from '#content/manifest'
// @ts-expect-error alias
import { queryCollection } from '@nuxt/content/nitro'

export default async (e: H3Event) => {
  const collections = []
  // each collection in the manifest has a key => with fields which has a `sitemap`, we want to get all those
  for (const collection in manifest) {
    if ('path' in manifest[collection].fields) {
      collections.push(collection)
    }
  }
  // now we need to handle multiple queries here, we want to run the requests in parallel
  const contentList = []
  for (const collection of collections) {
    contentList.push(queryCollection(e, collection).select('id', 'path', 'title').where('path', 'IS NOT NULL').all())
  }
  // we need to wait for all the queries to finish
  const results = await Promise.all(contentList)
  // we need to flatten the results
  return results.flat().map((d) => {
    return {
      link: d.path,
      title: d.title,
      file: d.id,
    }
  })
}
