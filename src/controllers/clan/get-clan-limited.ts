import { Request, Response } from 'express'
import { omit } from 'lodash'
import { z } from 'zod'

import { getClanBadge } from '@/lib/utils'
import { clanSchema } from '@/schemas/supercell'
import { getClan } from '@/services/supercell'

type ClanParams = z.infer<typeof clanSchema>['params']

/**
 * Get clan
 * @route GET /clan/:tag/limited
 */
export const clanLimitedController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params as ClanParams

    const { data: clan, error, status } = await getClan(tag)

    if (error || !clan) {
      res.status(status || 404).json({ error: error || 'Clan not found.', status: status || 404 })
      return
    }

    const badge = getClanBadge(clan.badgeId, clan.clanWarTrophies)
    const limitedClan = omit(clan, ['memberList'])

    res.status(200).json({ data: { ...limitedClan, badge } })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanLimitedController
