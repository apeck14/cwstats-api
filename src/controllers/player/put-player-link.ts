import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { playerLinkSchema } from '@/schemas/mongo'
import { addPlayer, linkPlayer } from '@/services/mongo'
import { getPlayer } from '@/services/supercell'

/**
 * Link player to Discord user
 * @route PUT /player/link
 */
export const playerLinkController = async (req: Request, res: Response) => {
  try {
    const parsed = playerLinkSchema.parse(req.body)

    const { tag, userId } = parsed

    const { data: player, error, status } = await getPlayer(tag)

    if (error || !player) {
      res.status(status || 404).json({ error: error || 'Player not found.', status: status || 404 })
      return
    }

    const data = { clanName: player?.clan?.name, name: player.name, tag: player.tag }

    addPlayer(data)

    const result = await linkPlayer({ name: player.name, tag: player.tag, userId })

    res.status(200).json({ name: player.name, result, success: true, tag: player.tag, userId })
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

export default playerLinkController
