import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './audit/schema'

export async function useDrizzle(path: string) {
  return drizzle(path, {
    schema,
  })
}

// // Use simple db0 API to make queries
// await db.sql`create table if not exists users (
//     id integer primary key autoincrement,
//     full_name text
//   )`
// await db.sql`insert into users (full_name) values ('John Doe')`
//
// // And then leverage drizzle typed API to make more advanced ones
// const drizzleDb = drizzle(db)
// await drizzleDb.select().from(users).all()
