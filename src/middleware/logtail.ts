import { NextFunction, Request, Response } from 'express'

import logger from '@/lib/logger'

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    logger.info('HTTP Request', {
      ip: req.ip,
      isDev: process.env.NODE_ENV === 'development',
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
    })
  })
  next()
}
