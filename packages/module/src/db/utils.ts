import { existsSync, mkdirSync, renameSync } from 'node:fs'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { dirname } from 'pathe'
import { logger } from '../logger'
import { useDrizzle } from './db'

export const dbContainers = new Map<string, Awaited<ReturnType<typeof useDrizzle>>>()

export async function initAndMigrateDb(dbPath: string, migrationsFolder: string) {
  if (dbContainers.has(dbPath)) {
    return dbContainers.get(dbPath)
  }
  // resolve dir immediately
  const dbDir = dirname(dbPath)
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  let db = await useDrizzle(dbPath)
  try {
    migrate(db, {
      migrationsFolder,
    })
  }
  catch (e) {
    logger.error('Failed to migrate database:', e)
    // needs to be yyyy-mm-dd
    const currDate = new Date().toISOString().split('T')[0]
    const newPath = `${dbPath}.${currDate}.backup`
    // migrate current db so we can create a new one
    logger.info(`Backing up broken database \`${dbPath}\` -> \`${newPath}\`...`)
    renameSync(dbPath, newPath)
    logger.info(`Creating new database.`)
    db = await useDrizzle(dbPath)
    migrate(db, {
      migrationsFolder,
    })
  }
  dbContainers.set(dbPath, db)
  return db
}
