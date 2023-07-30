// @todo
// eslint-disable-next-line unused-imports/no-unused-vars
function purgeOnHmr() {
  // nuxt.hooks.hook('builder:watch', async (event: WatchEvent, path: string) => {
  //     if (['add', 'unlink'].includes(event) && path.startsWith(resolve(nuxt.options.rootDir, nuxt.options.dir.pages))) {
  //         const rpc = await _rpc
  //         // @todo convert to path?
  //         rpc.broadcast.purgeLinkPath(relative(nuxt.options.rootDir, path))
  //     }
  // })
  // let lastRoutes: string[] = []
  // extendPages(async (pages) => {
  //     // convert pages to routes
  //     const routes = convertNuxtPagesToPaths(pages)
  //     if (lastRoutes.length) {
  //         const rpc = await _rpc
  //         const routeDiff = diffArrays(lastRoutes, routes)
  //         routeDiff.forEach((diff) => {
  //             if (diff.added || diff.removed) {
  //                 diff.value.forEach((p) => {
  //                     rpc.broadcast.purgeLinkPath(p)
  //                 })
  //             }
  //         })
  //     }
  //
  //     lastRoutes = routes
  // })
}
