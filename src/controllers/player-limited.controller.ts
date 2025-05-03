import { Request, Response } from 'express'

import { getPlayer } from '../services/supercell'
import { formatTag } from '../utils/format'

/**
 * Get player by tag (limited)
 * @route GET /api/player/limited/:tag
 */
export const playerLimitedController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: player, error, status } = await getPlayer(formatTag(tag, false))

    if (error || !player) {
      res.status(status).json({ error, status })
    }

    const propsToRemove = [
      'badges',
      'achievements',
      'cards',
      'supportCards',
      'currentDeck',
      'currentDeckSupportCards',
      'currentFavouriteCard',
      'lastPathOfLegendSeasonResult',
      'bestPathOfLegendSeasonResult',
      'leagueStatistics',
      'progress',
    ]

    const limitedPlayer = { ...player }

    for (const p of propsToRemove) {
      delete limitedPlayer[p]
    }

    res.status(200).json(limitedPlayer)
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerLimitedController
