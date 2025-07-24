import { Request, Response } from 'express'

import { getGuilds } from '@/services/mongo'

/**
 * Get all war log clans
 * @route GET /war-logs/clans
 */
export const getWarLogClansController = async (req: Request, res: Response) => {
  try {
    const guildsWithWarLogs = await getGuilds({
      'freeWarLogClan.webhookUrl1': { $exists: true },
      'freeWarLogClan.webhookUrl2': { $exists: true },
    })

    const mappedGuilds = guildsWithWarLogs.map((g) => g.freeWarLogClan)

    res.status(200).json({ data: mappedGuilds })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getWarLogClansController
