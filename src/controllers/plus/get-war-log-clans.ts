import { Request, Response } from 'express'

import { getPlusClans } from '@/services/mongo'

/**
 * Get all war log clans
 * @route GET /plus/war-log-clans
 */
export const getWarLogClansController = async (req: Request, res: Response) => {
  try {
    const warLogClans = await getPlusClans(
      false,
      { 'freeWarLogClan.webhookUrl': { $exists: true } },
      { _id: 0, dailyTracking: 0, hourlyAverages: 0 },
    )

    res.status(200).json({ data: warLogClans })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getWarLogClansController
