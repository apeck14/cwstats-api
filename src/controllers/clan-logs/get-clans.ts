import { Request, Response } from 'express'

import { getProClans } from '@/services/mongo'

/**
 * Get all clan log clans
 * @route GET /clan-logs/clans
 */
export const getClanLogClansController = async (req: Request, res: Response) => {
  try {
    const activeClanLogProClans = await getProClans({ 'clanLogs.enabled': true })

    res.status(200).json({ data: activeClanLogProClans })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getClanLogClansController
