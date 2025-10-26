import { Request, Response } from 'express'

import { getAllClanLogs } from '@/services/mongo'

/**
 * Get all clan logs
 * @route GET /clan-logs/logs
 */
export const getClanLogsController = async (req: Request, res: Response) => {
  try {
    const clanLogs = await getAllClanLogs()

    res.status(200).json({ data: clanLogs })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getClanLogsController
