import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  cwd: import.meta.dirname,
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: '0',
  },
  stdio: ['ignore', 'pipe', 'inherit'],
})

let output = ''
server.stdout.setEncoding('utf8')
server.stdout.on('data', chunk => output += chunk)

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt++) {
    const match = output.match(/Listening on: (http:\/\/[^/]+)\//)
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
  if (cachedResult.cached !== true)
    throw new Error(`Unexpected cached handler result: ${JSON.stringify(cachedResult)}`)
}
finally {
  server.kill('SIGTERM')
  await new Promise(resolve => server.once('exit', resolve))
}
