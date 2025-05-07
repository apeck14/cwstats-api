import { Request, Response } from 'express'

import { getPlayerBattleLog } from '../../services/supercell'

/**
 * Get player battle log
 * @route GET /player/:tag/log
 */
export const playerLogController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: log, error, status } = await getPlayerBattleLog(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json(log)
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerLogController
