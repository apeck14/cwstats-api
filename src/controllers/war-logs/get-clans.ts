import { Request, Response } from 'express'

import { getProClans } from '@/services/mongo'

/**
 * Get all war log clans
 * @route GET /war-logs/clans
 */
export const getWarLogClansController = async (req: Request, res: Response) => {
  try {
    const activeProClans = await getProClans({ warLogsEnabled: true })

    res.status(200).json({ data: activeProClans })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getWarLogClansController
