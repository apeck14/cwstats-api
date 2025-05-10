import { Request, Response } from 'express'
import { omit } from 'lodash'

import { getClan } from '@/services/supercell'

/**
 * Get clan
 * @route GET /clan/:tag/limited
 */
export const clanLimitedController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: clan, error, status } = await getClan(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    const limitedClan = omit(clan, ['memberList'])

    res.status(200).json({ data: limitedClan })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanLimitedController
