import { Request, Response } from 'express'

import { playerDocumentSchema } from '../schemas/mongo'
import { addPlayer } from '../services/mongo'
import { getPlayer } from '../services/supercell'

/**
 * Get player
 * @route PUT /api/player
 */
export const playerAddController = async (req: Request, res: Response) => {
  try {
    const parsed = playerDocumentSchema.parse(req.body)

    const { tag } = parsed

    const { data: player, error, status } = await getPlayer(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    const data = { clanName: player?.clan?.name, name: player.name, tag: player.tag.substr(1) }

    await addPlayer(data)

    res.status(200).json({ success: true, ...data })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerAddController
