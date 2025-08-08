import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/db/schemas'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

export { db }
