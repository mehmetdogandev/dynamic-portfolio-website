import pinoHttp from 'pino-http'
import { logger } from './index'

// HTTP request/response logger for Next.js
export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => {
      // Ignore health checks and static files
      const ignorePaths = ['/_next/', '/favicon.ico', '/api/health', '/health']
      return ignorePaths.some((path) => req.url?.startsWith(path))
    },
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error'
    }
    if (res.statusCode >= 400) {
      return 'warn'
    }
    return 'info'
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        referer: req.headers.referer,
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
})
