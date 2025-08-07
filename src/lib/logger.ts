export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  data?: unknown
}

class Logger {
  private logs: LogEntry[] = []
  private listeners: ((logs: LogEntry[]) => void)[] = []

  private generateId(): string {
    return Math.random().toString(36).slice(2, 11)
  }

  private addLog(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      data
    }
    
    this.logs.unshift(entry)
    this.notifyListeners()
  }

  info(message: string, data?: unknown) {
    this.addLog('info', message, data)
  }

  warn(message: string, data?: unknown) {
    this.addLog('warn', message, data)
  }

  error(message: string, data?: unknown) {
    this.addLog('error', message, data)
  }

  success(message: string, data?: unknown) {
    this.addLog('success', message, data)
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]))
  }

  clear() {
    this.logs = []
    this.notifyListeners()
  }
}

export const logger = new Logger()
