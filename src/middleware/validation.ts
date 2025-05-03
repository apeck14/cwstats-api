import { NextFunction, Request, Response } from 'express'
import { AnyZodObject, ZodError, ZodIssue } from 'zod'

export default (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query,
    })
    next()
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue: ZodIssue) => ({
        message: issue.message,
        path: issue.path.join('.'),
      }))
      res.status(400).json({ errors: formattedErrors })
    } else {
      // fallback for unexpected errors
      res.status(500).json({ error: 'Unexpected validation error' })
    }
  }
}
