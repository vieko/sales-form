export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  data?: unknown
}

class Logger {
  private sessionLogs = new Map<string, LogEntry[]>()
  private sessionListeners = new Map<string, ((logs: LogEntry[]) => void)[]>()

  private generateId(): string {
    return Math.random().toString(36).slice(2, 11)
  }

  private addLog(level: LogLevel, message: string, data?: unknown, sessionId?: string) {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      data,
    }

    if (sessionId) {
      const logs = this.sessionLogs.get(sessionId) || []
      logs.unshift(entry)
      
      if (logs.length > 100) {
        logs.splice(100)
      }
      
      this.sessionLogs.set(sessionId, logs)
      this.notifySessionListeners(sessionId)
    }
  }

  info(message: string, data?: unknown, sessionId?: string) {
    this.addLog('info', message, data, sessionId)
  }

  warn(message: string, data?: unknown, sessionId?: string) {
    this.addLog('warn', message, data, sessionId)
  }

  error(message: string, data?: unknown, sessionId?: string) {
    this.addLog('error', message, data, sessionId)
  }

  success(message: string, data?: unknown, sessionId?: string) {
    this.addLog('success', message, data, sessionId)
  }

  getLogs(sessionId?: string): LogEntry[] {
    if (sessionId) {
      return [...(this.sessionLogs.get(sessionId) || [])]
    }
    return []
  }

  subscribe(listener: (logs: LogEntry[]) => void, sessionId?: string) {
    if (!sessionId) return () => {}
    
    const listeners = this.sessionListeners.get(sessionId) || []
    listeners.push(listener)
    this.sessionListeners.set(sessionId, listeners)
    
    return () => {
      const currentListeners = this.sessionListeners.get(sessionId) || []
      const filtered = currentListeners.filter((l) => l !== listener)
      this.sessionListeners.set(sessionId, filtered)
    }
  }

  private notifySessionListeners(sessionId: string) {
    const listeners = this.sessionListeners.get(sessionId) || []
    const logs = this.sessionLogs.get(sessionId) || []
    listeners.forEach((listener) => listener([...logs]))
  }

  clear(sessionId?: string) {
    if (sessionId) {
      this.sessionLogs.set(sessionId, [])
      this.notifySessionListeners(sessionId)
    }
  }
}

export const logger = new Logger()
