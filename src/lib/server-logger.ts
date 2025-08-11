import { logger } from './server-logger-db'

// Server logger with automatic session ID handling
export const serverLogger = {
  info: async (message: string, data?: unknown, sessionId?: string) => {
    await logger.info(message, data, sessionId)
  },
  warn: async (message: string, data?: unknown, sessionId?: string) => {
    await logger.warn(message, data, sessionId)
  },
  error: async (message: string, data?: unknown, sessionId?: string) => {
    await logger.error(message, data, sessionId)
  },
  success: async (message: string, data?: unknown, sessionId?: string) => {
    await logger.success(message, data, sessionId)
  },
}
