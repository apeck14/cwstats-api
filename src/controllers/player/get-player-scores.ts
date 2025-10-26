import { Request, Response } from 'express'

import { formatTag } from '@/lib/format'
import { DailyTrackingEntry } from '@/models/plus-clan.model'
import { getPlusClans } from '@/services/mongo'

interface Entry extends DailyTrackingEntry {
  season: number
  day: number
  week: number
}

/**
 * Get player scores
 * @route GET /:tag/scores
 */
export const getPlayerScoresController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const formattedTag = formatTag(tag, true)

    const playerQuery = { 'dailyTracking.scores.tag': formattedTag }
    const plusClans = await getPlusClans(false, playerQuery, { dailyTracking: 1, tag: 1 })

    const scores: Record<string, Entry[]> = {}

    for (const c of plusClans) {
      for (const e of c?.dailyTracking || []) {
        const { day, season, week } = e

        for (const s of e.scores) {
          if (s.tag === formattedTag) {
            const weekKey = `${season}-${week}`

            const entry = { ...s, day, season, week }

            if (weekKey in scores) scores[weekKey].push(entry)
            else scores[weekKey] = [entry]
          }
        }
      }
    }

    // sort by week, and sort by day within the week
    const sortedScores = Object.fromEntries(
      Object.entries(scores)
        .map(([key, entries]) => [key, entries.sort((a, b) => a.day - b.day)] as const)
        .sort(([a], [b]) => b.localeCompare(a))
    )

    res.status(200).json({ data: sortedScores })
  } catch (e) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getPlayerScoresController
