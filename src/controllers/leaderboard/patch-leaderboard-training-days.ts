import { Request, Response } from 'express'

import { resetDailyLeaderboardClans } from '@/services/mongo'

/**
 * Reset daily leaderboard clan values on training days
 * @route PATCH /leaderboard/training-days
 */
export const patchLeaderboardTrainingDaysController = async (req: Request, res: Response) => {
  try {
    await resetDailyLeaderboardClans()

    res.status(200).json({ success: true })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default patchLeaderboardTrainingDaysController
