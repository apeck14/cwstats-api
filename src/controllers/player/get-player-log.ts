import { Request, Response } from 'express'
import { z } from 'zod'

import { playerSchema } from '@/schemas/supercell'
import { getPlayerBattleLog } from '@/services/supercell'

type PlayerParams = z.infer<typeof playerSchema>['params']

/**
 * Get player battle log
 * @route GET /player/:tag/log
 */
export const playerLogController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params as PlayerParams

    const { data: log, error, status } = await getPlayerBattleLog(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json({ data: log })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerLogController
