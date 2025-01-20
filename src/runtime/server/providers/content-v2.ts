import type { H3Event } from 'h3'
import { serverQueryContent } from '#content/server'

export default async (e: H3Event) => (await serverQueryContent(e).find()).map((doc: any) => ({
  link: doc._path,
  title: doc.title,
}))
