import { NextFunction, Request, Response } from 'express'

import logger from '@/lib/logger'

// Interface for custom errors
export interface AppError extends Error {
  statusCode?: number
  errors?: unknown
}

// Handler for 404 errors
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError
  error.statusCode = 404
  next(error)
}

// Handler for all other errors
export const errorHandler = (err: AppError, req: Request, res: Response): void => {
  // Set default status code and message if not specified
  const statusCode = err.statusCode || 500
  const msg = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    error: {
      message: msg,
      ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
      ...(err.errors && typeof err.errors === 'object' ? { errors: err.errors } : {})
    },
    success: false
  })

  logger.error(msg, { stack: err.stack })
}
