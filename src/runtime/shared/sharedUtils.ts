export { createFilter, type CreateFilterOptions } from 'nuxtseo-shared/utils'

export interface SerializedRegExp {
  __regexp__: true
  source: string
  flags: string
}

export type SerializedFilterEntry = string | SerializedRegExp

export function serializeFilterEntries(entries: (string | RegExp)[]): SerializedFilterEntry[] {
  return entries.map(e =>
    e instanceof RegExp
      ? { __regexp__: true as const, source: e.source, flags: e.flags }
      : e,
  )
}

export function deserializeFilterEntries(entries: SerializedFilterEntry[]): (string | RegExp)[] {
  return entries.map(e =>
    typeof e === 'object' && e !== null && '__regexp__' in e
      ? new RegExp(e.source, e.flags)
      : e as string,
  )
}
