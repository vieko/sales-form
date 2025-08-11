import { addLog, type LogLevel, type LogEntry } from '@/actions/logging'

class Logger {
  private sessionId: string | null = null

  // Initialize session ID (client-side only)
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      // Server-side: return empty string, caller should provide sessionId
      return ''
    }

    if (!this.sessionId) {
      this.sessionId = sessionStorage.getItem('sessionId') || 
        (() => {
          const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          sessionStorage.setItem('sessionId', id)
          return id
        })()
    }
    
    return this.sessionId
  }

  async info(message: string, data?: unknown, sessionId?: string) {
    await this.log('info', message, data, sessionId)
  }

  async warn(message: string, data?: unknown, sessionId?: string) {
    await this.log('warn', message, data, sessionId)
  }

  async error(message: string, data?: unknown, sessionId?: string) {
    await this.log('error', message, data, sessionId)
  }

  async success(message: string, data?: unknown, sessionId?: string) {
    await this.log('success', message, data, sessionId)
  }

  private async log(level: LogLevel, message: string, data?: unknown, sessionId?: string) {
    const id = sessionId || this.getSessionId()
    
    // Always log to console for immediate feedback
    const logMethod = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : console.log
    
    // Only log data to console if it exists
    if (data !== undefined) {
      logMethod(`[${level.toUpperCase()}]`, message, data)
    } else {
      logMethod(`[${level.toUpperCase()}]`, message)
    }

    // If no session ID available (server-side without explicit ID), skip database
    if (!id) {
      return
    }

    try {
      // Only pass data to server action if it's not undefined
      await addLog(id, level, message, data !== undefined ? data : undefined)
    } catch (error) {
      // Fallback to console if action fails
      console.error('Failed to log to database:', error)
    }
  }

  // Legacy methods for backward compatibility
  getLogs(): LogEntry[] {
    console.warn('logger.getLogs() is deprecated - use getLogs action or API endpoint')
    return []
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    console.warn('logger.subscribe() is deprecated - use polling instead')
    return () => {}
  }

  clear() {
    console.warn('logger.clear() is deprecated - use clearLogs action or API endpoint')
  }
}

export const logger = new Logger()
export type { LogLevel, LogEntry }