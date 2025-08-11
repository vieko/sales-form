// Client-side logger - no database access, just console logging
export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  data?: unknown
}

class ClientLogger {
  info(message: string, data?: unknown) {
    console.log(`[INFO]`, message, data)
  }

  warn(message: string, data?: unknown) {
    console.warn(`[WARN]`, message, data)
  }

  error(message: string, data?: unknown) {
    console.error(`[ERROR]`, message, data)
  }

  success(message: string, data?: unknown) {
    console.log(`[SUCCESS]`, message, data)
  }

  // Legacy method for backward compatibility
  getLogs(): LogEntry[] {
    return []
  }

  // Legacy method for backward compatibility
  subscribe(listener: (logs: LogEntry[]) => void) {
    return () => {}
  }

  // Legacy method for backward compatibility
  clear() {
    // No-op on client
  }
}

export const logger = new ClientLogger()