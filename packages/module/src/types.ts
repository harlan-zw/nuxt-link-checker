import type { audits } from './db/root/schema'

export type Task = 'build' | 'serve' | 'crawl' | 'analyze'
export type TaskStatus = 'pending' | 'running' | 'done' | 'error' | 'stopped'
export type CreateAuditInput = Pick<Audit, 'scanType' | 'name'>
export type ScanType = 'default' | 'development' | 'live'

export type Tasks = Record<Task, {
  startedAt?: number
  status: TaskStatus
  error?: string
  timeTaken?: number
  terminal?: string[]
}>

export type Audit = typeof audits.$inferSelect
