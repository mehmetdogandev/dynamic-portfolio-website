export const runtime = 'nodejs'

import pino from 'pino'
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// Development: Write logs to file for Promtail
const logDir = path.join(process.cwd(), 'logs')
const logFile = path.join(logDir, 'app.log')

if (isDevelopment && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Logger configuration
// Development: Default to 'info' level to reduce log spam (was 'debug')
// Can be overridden with LOG_LEVEL=debug if detailed logging is needed
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'info' : 'info'),
    // Production metadata
    ...(isProduction && {
      base: {
        env: process.env.NODE_ENV,
        service: 'aksiyonsoft-app',
      },
    }),
  },
  // Development: Only write to console for better performance
  // File logging can be enabled with LOG_TO_FILE=true if needed
  // Production: Just stdout (Docker will capture)
  isDevelopment && process.env.LOG_TO_FILE === 'true'
    ? pino.multistream([
        { stream: process.stdout },
        { stream: fs.createWriteStream(logFile, { flags: 'a' }) },
      ])
    : process.stdout
)

// Child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module })
}

// Specific loggers
export const trpcLogger = createLogger('trpc')
export const drizzleLogger = createLogger('drizzle')
export const authLogger = createLogger('auth')
export const cacheLogger = createLogger('cache')
export const apiLogger = createLogger('api')
export const rfidLogger = createLogger('rfid')

// Log levels: trace, debug, info, warn, error, fatal
