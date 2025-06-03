import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'pathe'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { useDrizzle } from '../db/db'

export function ensureStorageDir() {
  const storageDir = process.env.STORAGE_DIR
  if (!storageDir) {
    throw new Error('STORAGE_DIR environment variable is not set.')
  }
  // Ensure the storage directory exists
  if (!existsSync(storageDir)) {
    mkdirSync(storageDir, { recursive: true })
  }
}

export function resolveStoragePath(path: string): string {
  return resolve(process.env.STORAGE_DIR, path)
}

// create unstorage
export function storage() {
  return createStorage({
    driver: fsDriver({
      base: process.env.STORAGE_DIR,
    }),
  })
}

export function database(name: string) {
  return useDrizzle(
    resolveStoragePath(`${name}.sqlite3`),
  )
}
