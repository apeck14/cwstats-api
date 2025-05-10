import { Request, Response } from 'express'
import { omit } from 'lodash'

import { getPlayer } from '@/services/supercell'

/**
 * Get player (limited)
 * @route GET /player/:tag/limited
 */
export const playerLimitedController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: player, error, status } = await getPlayer(tag)

    if (error || !player) {
      res.status(status).json({ error, status })
      return
    }

    const limitedPlayer = omit(player, [
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
    ])

    res.status(200).json({ data: limitedPlayer })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerLimitedController
