'use server'

import { db } from '@/db/drizzle'
import { logs } from '@/db/schemas'
import { eq, desc } from 'drizzle-orm'

export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  data?: unknown
}

export async function addLog(
  sessionId: string,
  level: LogLevel,
  message: string,
  data?: unknown
) {
  try {
    // Ensure data is properly serializable
    let serializedData = null
    if (data !== undefined && data !== null) {
      try {
        // Test if data is serializable by doing a round-trip
        serializedData = JSON.parse(JSON.stringify(data))
      } catch (serializationError) {
        console.error('Data serialization failed:', serializationError)
        serializedData = { error: 'Data not serializable', original: String(data) }
      }
    }
    
    await db.insert(logs).values({
      sessionId,
      level,
      message,
      data: serializedData,
      timestamp: new Date(),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to insert log:', error)
    return { success: false, error: 'Failed to insert log' }
  }
}

export async function getLogs(sessionId: string, limit: number = 100): Promise<LogEntry[]> {
  try {
    const results = await db
      .select()
      .from(logs)
      .where(eq(logs.sessionId, sessionId))
      .orderBy(desc(logs.timestamp))
      .limit(limit)

    return results.map((log): LogEntry => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level as LogLevel,
      message: log.message,
      data: log.data,
    }))
  } catch (error) {
    console.error('Failed to get logs:', error)
    return []
  }
}

export async function clearLogs(sessionId: string) {
  try {
    await db.delete(logs).where(eq(logs.sessionId, sessionId))
    return { success: true }
  } catch (error) {
    console.error('Failed to clear logs:', error)
    return { success: false, error: 'Failed to clear logs' }
  }
}