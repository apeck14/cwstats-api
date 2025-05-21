import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { getDailyLeaderboard } from '@/services/mongo'
import locations from '@/static/locations.json'
import { leaderboardDailySchema } from '@/zod/supercell'

/**
 * Get clan
 * @route GET /leaderboard/daily?key=global&limit=100&maxTrophies=6000&minTrophies=4000
 */
export const leaderboardDailyController = async (req: Request, res: Response) => {
  try {
    const parsed = leaderboardDailySchema.parse({
      query: req.query,
    })

    const { key, limit = 0, maxTrophies = Infinity, minTrophies = 0 } = parsed.query

    const formattedKey = key?.toLowerCase()
    const location = locations.find((l) => l.key.toLowerCase() === formattedKey)

    if (!location && key) {
      res.status(404).json({ error: 'Region not found', status: 404 })
      return
    }

    const dailyLb = await getDailyLeaderboard({ limit, maxTrophies, minTrophies, name: location?.name })

    res.status(200).json({ data: dailyLb })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: err.errors[0].message,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default leaderboardDailyController
