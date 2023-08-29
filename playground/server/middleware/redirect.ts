import { sendRedirect } from 'h3'

export default defineEventHandler((e) => {
  if (e.path === '/redirect')
    return sendRedirect(e, '/redirected')
})
