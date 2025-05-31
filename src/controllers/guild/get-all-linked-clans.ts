import { Request, Response } from 'express'

import { getAllLinkedClans } from '@/services/mongo'

/**
 * Get all linked clans
 * @route GET /guild/clans
 */
export const getLinkedClans = async (req: Request, res: Response) => {
  try {
    const linkedClans = await getAllLinkedClans()

    res.status(200).json({ data: linkedClans })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getLinkedClans
