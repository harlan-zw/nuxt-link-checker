import { existsSync } from 'node:fs'
import { join, resolve } from 'pathe'
import { decodePath } from 'ufo'

/**
 * Create a lookup for paths that resolve to a directory index in `publicDir`, such as `/demo/` for `public/demo/index.html`.
 */
export function createPublicDirectoryIndexLookup(publicDir: string): (path: string) => boolean {
  const root = resolve(publicDir)
  return (path) => {
    const index = join(root, decodePath(path), 'index.html')
    // a path that climbs out of the public directory is not one of its files
    return index.startsWith(`${root}/`) && existsSync(index)
  }
}
