import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { getPlayerSearchSchema } from '@/schemas/mongo'
import { searchPlayersByName } from '@/services/mongo'

/**
 * Search players by name from database
 * @route GET /player/search
 */
export const playerSearchController = async (req: Request, res: Response) => {
  try {
    const parsed = getPlayerSearchSchema.parse({
      query: req.query
    })

    const { limit, name } = parsed.query

    const players = await searchPlayersByName(name, Number(limit))

    res.status(200).json({ data: players ?? [], search: name })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerSearchController
