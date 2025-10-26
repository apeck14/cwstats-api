import { Request, Response } from 'express'

import { getAllWarLogClanAttacks } from '@/services/mongo'

/**
 * Get all war log clan attacks
 * @route GET /war-logs/attacks
 */
export const getWarLogClanAttacksController = async (req: Request, res: Response) => {
  try {
    const clanAttacks = await getAllWarLogClanAttacks()

    res.status(200).json({ data: clanAttacks })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getWarLogClanAttacksController
