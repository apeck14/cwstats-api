import { Request, Response } from 'express'

import { formatTag } from '@/lib/format'
import { getPlusClans } from '@/services/mongo'

/**
 * Get player scores
 * @route GET /:tag/scores
 */
export const getPlayerScoresController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const plusClans = await getPlusClans(false, {})

    const scores = []

    const formattedTag = formatTag(tag, true)

    for (const c of plusClans) {
      for (const e of c?.dailyTracking || []) {
        const { day, season, week } = e

        for (const s of e.scores) {
          if (s.tag === formattedTag) scores.push({ ...s, day, season, week })
        }
      }
    }

    res.status(200).json({ data: scores })
  } catch (e) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getPlayerScoresController
