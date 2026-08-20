import type { ContentRuntime } from 'nuxtseo-shared/content-runtime'
import type { H3Event } from '#nuxtseo/h3'
// @ts-expect-error setupContentRuntime() aliases this to the detected provider's shim
import * as contentRuntime from '#nuxtseo/content'

const { listPageCollections, queryPages } = contentRuntime as unknown as ContentRuntime

/**
 * Link sources from the installed content module's page collections.
 *
 * One provider for @nuxt/content v3 and comark-content both. `#nuxtseo/content`
 * normalizes the manifest shape, so the `path` field check that @nuxt/content needs
 * reads the same as comark answering it trivially. Nuxt Content v2 has no
 * collection model and keeps its own provider.
 */
export default async (e: H3Event): Promise<{ link: string, title: string, file: string }[]> => {
  const collections = (await listPageCollections(e))
    .filter(collection => collection.hasField('path'))
    .map(collection => collection.name)
  const results = await Promise.all(collections.map(collection =>
    queryPages(e, collection).select('id', 'path', 'title').where('path', 'IS NOT NULL').all(),
  ))
  return results.flat()
    .filter(page => !!page.path)
    .map(page => ({ link: page.path, title: page.title, file: page.id }))
}
