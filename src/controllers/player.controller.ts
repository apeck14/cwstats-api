import { Request, Response } from 'express'

import { getPlayer } from '../services/supercell'
import { formatTag } from '../utils/format'

/**
 * Get player by tag
 * @route GET /api/player/:tag
 */
export const playerController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: player, error, status } = await getPlayer(formatTag(tag, false))

    if (error) {
      res.status(status).json({ error, status })
    }

    res.status(200).json(player)
  } catch {
    res.status(500).json({ error: 'Server error', status: 500 })
  }
}

export default playerController
