import { NextFunction, Request, Response } from 'express'

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

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
      ...(err.errors && typeof err.errors === 'object' ? { errors: err.errors } : {}),
    },
    success: false,
  })
}
