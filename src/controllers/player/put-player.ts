import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { addPlayer } from '../../services/mongo'
import { getPlayer } from '../../services/supercell'
import { playerDocumentSchema } from '../../zod/mongo'

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

    const data = { clanName: player?.clan?.name, name: player.name, tag: player.tag }

    await addPlayer(data)

    res.status(200).json({ success: true, ...data })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: err.errors[0].message,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerAddController
