import { Request, Response } from 'express'

import { getProClans } from '@/services/mongo'

/**
 * Get all war log clans
 * @route GET /war-logs/clans
 */
export const getWarLogClansController = async (req: Request, res: Response) => {
  try {
    const proClans = await getProClans()

    res.status(200).json({ data: proClans })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getWarLogClansController
