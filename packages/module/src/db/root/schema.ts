import type { ScanType, Task, Tasks, TaskStatus } from '../../types'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: integer('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}

export const audits = sqliteTable('audits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  tasks: text('tasks', { mode: 'json' }).notNull().$type<TaskStatus>(),
  currentTask: text('current_task').$type<Task>(), // 'build' | 'serve' | 'crawl' | 'analyze' | null
  currentTaskStatus: text('current_task_status').notNull().default('pending').$type<Tasks>(), // 'pending' | 'running' | 'done' | 'error'
  scanType: text('scan_type').notNull().default('default').$type<ScanType>(), // 'default' | 'development' | 'live'
  origin: text('origin'), // URL origin for live scans - will add in migration
  // origin: text('origin'), // URL origin for live scans - will add in migration
  ...timestamps,
})

export type Audit = typeof audits.$inferSelect
