import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { leaderboardWarSchema } from '@/schemas/supercell'
import { getWarLeaderboard } from '@/services/supercell'

/**
 * Get clan
 * @route GET /leaderboard/:locationId/war
 */
export const leaderboardWarController = async (req: Request, res: Response) => {
  try {
    const parsed = leaderboardWarSchema.parse({
      params: req.params,
      query: req.query
    })

    const { limit } = parsed.query
    const { locationId } = parsed.params

    const { data: leaderboard, error, status } = await getWarLeaderboard(locationId, limit)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json({ data: leaderboard })
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

export default leaderboardWarController
