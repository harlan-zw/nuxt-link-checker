import { defineEventHandler, sendRedirect } from 'nuxt/server'

export default defineEventHandler((e) => {
  if (e.path === '/moved-permanently')
    return sendRedirect(e, '/', 301)
})
