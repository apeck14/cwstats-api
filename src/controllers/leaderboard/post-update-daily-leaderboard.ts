import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { updateDailyLeaderboardSchema } from '@/schemas/mongo'
import { deleteDailyLeaderboard, updateDailyLeaderboard } from '@/services/mongo'

/**
 * Update daily leaderboard
 * @route POST /leaderboard/daily/update
 */
export const postUpdateDailyLeaderboardController = async (req: Request, res: Response) => {
  try {
    const parsed = updateDailyLeaderboardSchema.parse({
      body: req.body,
    })

    const { entries } = parsed.body

    await deleteDailyLeaderboard()
    await updateDailyLeaderboard(entries)

    res.status(200).json({ success: true })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postUpdateDailyLeaderboardController
