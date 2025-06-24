import { Request, Response } from 'express'

import { setLbLastUpdated } from '@/services/mongo'

/**
 * Set daily leaderboard last updated timestamp
 * @route PATCH /leaderboard/timestamp
 */
export const patchLeaderboardTimestampController = async (req: Request, res: Response) => {
  try {
    const timestamp = Date.now()
    await setLbLastUpdated(timestamp)

    res.status(200).json({ success: true, timestamp })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default patchLeaderboardTimestampController
