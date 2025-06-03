import { sendRedirect } from 'h3'

export default defineEventHandler((e) => {
  if (e.path === '/redirect') {
    console.log('redirecting')
    return sendRedirect(e, '/redirected')
  }
})
