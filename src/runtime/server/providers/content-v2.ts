import type { H3Event } from 'h3'
// @ts-expect-error untyped
import { serverQueryContent } from '#content/server'

export default async (e: H3Event) => (await serverQueryContent(e).find()).map((doc: any) => ({
  link: doc._path,
  title: doc.title,
}))
