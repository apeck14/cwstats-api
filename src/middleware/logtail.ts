import { NextFunction, Request, Response } from 'express'

import logger from '@/lib/logger'

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    logger.info('HTTP Request', {
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
    })
  })
  next()
}
