import { db } from '@/db/drizzle'
import { logs, type Log, type NewLog } from '@/db/schemas'
import { eq, desc, and, gte } from 'drizzle-orm'

export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  data?: unknown
}

class Logger {
  async addLog(level: LogLevel, message: string, data?: unknown, sessionId?: string) {
    if (!sessionId) {
      console.log(`[${level.toUpperCase()}]`, message, data)
      return
    }

    try {
      await db.insert(logs).values({
        sessionId,
        level,
        message,
        data: data || null,
        timestamp: new Date(),
      })
    } catch (error) {
      console.error('Failed to insert log:', error)
      console.log(`[${level.toUpperCase()}]`, message, data)
    }
  }

  async info(message: string, data?: unknown, sessionId?: string) {
    await this.addLog('info', message, data, sessionId)
  }

  async warn(message: string, data?: unknown, sessionId?: string) {
    await this.addLog('warn', message, data, sessionId)
  }

  async error(message: string, data?: unknown, sessionId?: string) {
    await this.addLog('error', message, data, sessionId)
  }

  async success(message: string, data?: unknown, sessionId?: string) {
    await this.addLog('success', message, data, sessionId)
  }

  async getLogs(sessionId?: string, limit: number = 100): Promise<LogEntry[]> {
    if (!sessionId) return []

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

  async clear(sessionId?: string) {
    if (!sessionId) return

    try {
      await db.delete(logs).where(eq(logs.sessionId, sessionId))
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  // Legacy method for backward compatibility - now just returns empty function
  subscribe(listener: (logs: LogEntry[]) => void, sessionId?: string) {
    console.warn('Logger.subscribe is deprecated - use polling instead')
    return () => {}
  }
}

export const logger = new Logger()
