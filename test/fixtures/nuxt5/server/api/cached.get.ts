import { eventHandler } from '#nuxtseo/h3'
import { defineCachedEventHandler } from '#nuxt-link-checker/nitro'

export default defineCachedEventHandler(eventHandler(() => ({
  cached: true,
})))
