import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

type Lane = 'nuxt4' | 'future5' | 'nuxt5'
const lanes: Lane[] = ['nuxt4', 'future5', 'nuxt5']
const root = resolve(import.meta.dirname, '..')
const fixture = join(root, 'test/fixtures/nuxt5')
const selected = process.argv[2]
const tarballs = JSON.parse(process.env.NUXT_TEST_TARBALLS || '{}') as Record<string, string>
if (selected && !lanes.includes(selected as Lane))
  throw new Error(`Unknown Nuxt lane: ${selected}`)

function run(args: string[], cwd: string, lane: Lane): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, {
      cwd,
      env: { ...process.env, NUXT_TEST_LANE: lane },
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`pnpm failed: ${signal || code}`)))
  })
}

await run(['build'], root, selected ? selected as Lane : lanes[0]!)

for (const lane of selected ? [selected as Lane] : lanes) {
  const consumer = await mkdtemp(join(tmpdir(), `nuxt-module-${lane}-`))
  try {
    await cp(fixture, consumer, {
      recursive: true,
      filter: path => !/(?:^|\/)(?:node_modules|\.nuxt|\.output|\.data)(?:\/|$)/.test(path) && !path.endsWith('.tgz') && !path.endsWith('pnpm-lock.yaml'),
    })
    const manifestFile = join(consumer, 'package.json')
    const manifest = JSON.parse(await readFile(manifestFile, 'utf8'))
    const moduleName = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).name as string
    const artifact = String(manifest.dependencies[moduleName]).replace(/^file:(?:\.\/)?/, '')
    manifest.dependencies.nuxt = lane === 'nuxt5' ? 'npm:nuxt-nightly@5.0.0-2610052343-36eafab' : '4.6.0'
    if (lane !== 'nuxt5') {
      delete manifest.dependencies.nitro
      delete manifest.dependencies.nitropack
    }
    const overrides: Record<string, string> = {}
    for (const [packageName, tarball] of Object.entries(tarballs)) {
      const destination = join(consumer, `${packageName.replaceAll('/', '-')}.tgz`)
      await cp(resolve(tarball), destination)
      overrides[packageName] = `file:${destination}`
      if (manifest.dependencies[packageName])
        manifest.dependencies[packageName] = `file:${destination}`
    }
    const workspaceFile = join(consumer, 'pnpm-workspace.yaml')
    let workspace = await readFile(workspaceFile, 'utf8')
    const rootWorkspace = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8')
    for (const match of rootWorkspace.matchAll(/^ {2}- ((?:cssnano|postcss|stylehacks)[\w-]*@[\d.]+)$/gm)) {
      const exception = match[1]!
      if (!workspace.includes(`  - ${exception}\n`))
        workspace = workspace.replace('trustPolicyExclude:\n', `trustPolicyExclude:\n  - ${exception}\n`)
      const separator = exception.lastIndexOf('@')
      overrides[exception.slice(0, separator)] = exception.slice(separator + 1)
    }
    const overrideEntries = Object.entries(overrides).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join('\n')
    if (overrideEntries) {
      workspace = workspace.includes('overrides:\n')
        ? workspace.replace('overrides:\n', `overrides:\n${overrideEntries}\n`)
        : `${workspace}\noverrides:\n${overrideEntries}\n`
    }
    await writeFile(workspaceFile, workspace)
    await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`)
    await run(['--config.ignore-scripts=true', 'pack', '--out', join(consumer, artifact)], root, lane)
    await run(['install', '--no-frozen-lockfile', '--update-checksums'], consumer, lane)
    await run(['test'], consumer, lane)
  }
  finally {
    if (process.env.NUXT_TEST_KEEP)
      console.log(`Consumer retained: ${consumer}`)
    else
      await rm(consumer, { recursive: true, force: true })
  }
}
