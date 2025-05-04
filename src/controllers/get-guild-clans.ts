import { Request, Response } from 'express'

import { getLinkedClansByGuild } from '../services/mongo'

/**
 * Get all linked clans by guild
 * @route GET /api/guild/:id/clans
 */
export const getGuildClansController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const data = await getLinkedClansByGuild(id)

    res.status(200).json(data)
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getGuildClansController
