import type { LogLevel } from './logger'

interface ServerLogOptions {
  level: LogLevel
  message: string
  data?: unknown
}

export async function logToConsole({ level, message, data }: ServerLogOptions) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VERCEL_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/console`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ level, message, data }),
    })

    if (!response.ok) {
      console.error('Failed to log to console:', await response.text())
    }
  } catch (error) {
    console.error('Server logger error:', error)
  }
}

// Convenience methods
export const serverLogger = {
  info: (message: string, data?: unknown) =>
    logToConsole({ level: 'info', message, data }),
  warn: (message: string, data?: unknown) =>
    logToConsole({ level: 'warn', message, data }),
  error: (message: string, data?: unknown) =>
    logToConsole({ level: 'error', message, data }),
  success: (message: string, data?: unknown) =>
    logToConsole({ level: 'success', message, data }),
}
