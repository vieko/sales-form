import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schemas from '@/db/schemas'

const sql = neon(process.env.DATABASE_URL!)

const schema = {
  ...schemas,
}

const db = drizzle(sql, { schema })

export { db }
