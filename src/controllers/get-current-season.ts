import { Request, Response } from 'express'

import { getCurrentSeason } from '@/services/mongo'

/**
 * Get current season
 * @route GET /current-season
 */
export const getCurrentSeasonController = async (req: Request, res: Response) => {
  try {
    const currentSeason = await getCurrentSeason()

    if (currentSeason === -1) {
      res.status(404).json({ error: 'Current season could not be determined.', status: 404 })
      return
    }

    res.status(200).json({ data: currentSeason })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getCurrentSeasonController
