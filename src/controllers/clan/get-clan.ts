import { Request, Response } from 'express'

import { getClanBadge } from '@/lib/utils'
import { getClan } from '@/services/supercell'

/**
 * Get clan
 * @route GET /clan/:tag
 */
export const clanController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: clan, error, status } = await getClan(tag)

    if (error || !clan) {
      res.status(status || 404).json({ error: error || 'Clan not found.', status: status || 404 })
      return
    }

    const badge = getClanBadge(clan.badgeId, clan.clanWarTrophies)

    res.status(200).json({ data: { badge, ...clan } })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanController
