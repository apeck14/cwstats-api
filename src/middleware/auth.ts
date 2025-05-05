import { NextFunction, Request, Response } from 'express'

export default (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header', status: 401 })
    return
  }

  const token = authHeader.split(' ')[1]
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(403).json({ error: 'Unauthorized', status: 403 })
    return
  }

  next()
}
