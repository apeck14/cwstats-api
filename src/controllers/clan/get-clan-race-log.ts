import { Request, Response } from 'express'

import { getRaceLog } from '@/services/supercell'

/**
 * Get clan race log
 * @route GET /clan/:tag/log
 */
export const getClanRaceLogController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: log, error, status } = await getRaceLog(tag)

    if (error || !log) {
      res.status(status || 404).json({ error: error || 'Log not found.', status: status || 404 })
      return
    }

    res.status(200).json({ data: log })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getClanRaceLogController
