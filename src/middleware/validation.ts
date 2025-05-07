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
      res.status(400).json({ error: error.issues[0].message, status: 400 })
    } else {
      // fallback for unexpected errors
      res.status(500).json({ error: 'Unexpected validation error', status: 500 })
    }
  }
}
