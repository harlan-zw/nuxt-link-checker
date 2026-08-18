import type { H3Event } from '#nuxtseo/h3'
import { queryCollection, queryCollectionManifest } from '@harlan-zw/comark-content/server'

/**
 * Link sources from comark-content collections.
 *
 * comark reads its collections from Nitro server assets in process, so this needs
 * no database and no `#content/manifest` alias. Every comark collection is a page
 * collection with a `path`, so the manifest needs no field check.
 */
export default async (e: H3Event): Promise<{ link: string, title: string, file: string }[]> => {
  const manifest = await queryCollectionManifest(e)
  const results = await Promise.all(manifest.map(({ name }) =>
    queryCollection(e, name).select('id', 'path', 'title').all(),
  ))
  return results.flat()
    .filter(page => !!page.path)
    .map(page => ({ link: page.path, title: page.title, file: page.id }))
}
