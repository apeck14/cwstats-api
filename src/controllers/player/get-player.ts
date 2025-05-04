import { Request, Response } from 'express'

import { getPlayer } from '../../services/supercell'

/**
 * Get player
 * @route GET /api/player/:tag
 */
export const playerController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: player, error, status } = await getPlayer(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json(player)
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerController
