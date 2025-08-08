import { logger } from './logger'

// Direct logger calls - no HTTP overhead
export const serverLogger = {
  info: (message: string, data?: unknown) => logger.info(message, data),
  warn: (message: string, data?: unknown) => logger.warn(message, data),
  error: (message: string, data?: unknown) => logger.error(message, data),
  success: (message: string, data?: unknown) => logger.success(message, data),
}
