import { Request, Response } from 'express'
import { z } from 'zod'

import { playerSchema } from '@/schemas/supercell'
import { getPlayer } from '@/services/supercell'

type PlayerParams = z.infer<typeof playerSchema>['params']

/**
 * Get player
 * @route GET /player/:tag
 */
export const playerController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params as PlayerParams

    const { data: player, error, status } = await getPlayer(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json({ data: player })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerController
