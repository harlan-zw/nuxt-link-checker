import { once } from 'node:events'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const portServer = createServer()
portServer.listen(0, '127.0.0.1')
await once(portServer, 'listening')
const port = portServer.address().port
portServer.close()
await once(portServer, 'close')

const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  cwd: import.meta.dirname,
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: String(port),
    NITRO_PORT: String(port),
    NITRO_HOST: '127.0.0.1',
  },
  stdio: ['ignore', 'pipe', 'inherit'],
})

let output = ''
server.stdout.setEncoding('utf8')
server.stdout.on('data', chunk => output += chunk)

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt++) {
    const match = output.match(/Listening on:?\s*(http:\/\/[^/\s]+)\/?/)
    if (match)
      return match[1]
    if (server.exitCode !== null)
      throw new Error(`Nuxt 5 server exited with code ${server.exitCode}`)
    await delay(50)
  }
  throw new Error('Timed out waiting for Nuxt 5 server')
}

try {
  const origin = await waitForServer()
  const [compatResponse, cachedResponse] = await Promise.all([
    fetch(`${origin}/api/compat`),
    fetch(`${origin}/api/cached`),
  ])
  if (!compatResponse.ok)
    throw new Error(`Compatibility endpoint returned ${compatResponse.status}`)
  if (!cachedResponse.ok)
    throw new Error(`Cached endpoint returned ${cachedResponse.status}`)
  const compatResult = await compatResponse.json()
  const cachedResult = await cachedResponse.json()
  if (compatResult.marker !== 'nuxt-5')
    throw new Error(`Unexpected compatibility marker: ${JSON.stringify(compatResult)}`)
  if (compatResult.inspection !== 'no-javascript')
    throw new Error('The server alias did not inspect the link')
  const html = await fetch(origin).then(response => response.text())
  if (!html.includes('id="alias-app">no-javascript<'))
    throw new Error('The app alias did not inspect the link')
  if (cachedResult.cached !== true)
    throw new Error(`Unexpected cached handler result: ${JSON.stringify(cachedResult)}`)

  const reportResponse = await fetch(`${origin}/__link-checker__/link-checker-report.json`)
  if (!reportResponse.ok)
    throw new Error(`Published link report returned ${reportResponse.status}`)
  const report = await reportResponse.json()
  const inspections = report.flatMap(page => page.reports)
  if (!inspections.some(link => link.link === '/missing' && link.error.some(issue => issue.name === 'no-error-response' && issue.message.includes('status code 404'))))
    throw new Error('The packed module did not report the missing page')
  if (!inspections.some(link => link.link === '/Target' && link.warning.some(issue => issue.name === 'no-uppercase-chars')))
    throw new Error('The packed module did not report the uppercase URL')
  if (inspections.find(link => link.link === '/Target')?.error.length)
    throw new Error('The packed module rejected a valid page')
}
finally {
  if (server.exitCode === null && server.signalCode === null) {
    const exited = once(server, 'exit')
    server.kill('SIGTERM')
    await exited
  }
}
