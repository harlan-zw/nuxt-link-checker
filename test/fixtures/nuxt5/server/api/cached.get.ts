import { eventHandler } from '#nuxtseo/h3'
import { defineCachedEventHandler } from '#nuxtseo/nitro'

export default defineCachedEventHandler(eventHandler(() => ({
  cached: true,
})))
