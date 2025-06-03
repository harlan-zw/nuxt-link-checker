import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { resolve } from 'pathe'
import { useDrizzle } from '../../db/db'
import { ensureStorageDir, resolveStoragePath } from '../util'

const migrationsFolder = resolve(import.meta.dirname, '../../db/audit/migrations')

export async function commandDb(name: string) {
  ensureStorageDir()
  const db = await useDrizzle(
    resolveStoragePath(`${name}.sqlite3`),
  )
  // check if it needs migration
  migrate(db, { migrationsFolder })
}
