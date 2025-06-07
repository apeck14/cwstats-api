import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { playerDocumentSchema } from '@/schemas/mongo'
import { addPlayer } from '@/services/mongo'
import { getPlayer } from '@/services/supercell'

/**
 * Add player to collection
 * @route PUT /player
 */
export const playerAddController = async (req: Request, res: Response) => {
  try {
    const parsed = playerDocumentSchema.parse(req.body)

    const { tag } = parsed

    const { data: player, error, status } = await getPlayer(tag)

    if (error || !player) {
      res.status(status || 404).json({ error: error || 'Player not found.', status: status || 404 })
      return
    }

    const data = { clanName: player?.clan?.name, name: player.name, tag: player.tag }

    await addPlayer(data)

    res.status(200).json({ success: true, ...data })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerAddController
