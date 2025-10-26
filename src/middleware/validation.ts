import { NextFunction, Request, Response } from 'express'
import { AnyZodObject, ZodError } from 'zod'

export default (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query
    })
    next()
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400
      })
    } else {
      // fallback for unexpected errors
      res.status(500).json({ error: 'Unexpected validation error', status: 500 })
    }
  }
}
