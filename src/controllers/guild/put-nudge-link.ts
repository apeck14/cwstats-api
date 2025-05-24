import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { putGuildNudgeLinkSchema } from '@/schemas/mongo'
import { addNudgeLink } from '@/services/mongo'
import { getPlayer } from '@/services/supercell'

/**
 * Add a nudge link for a specified guild
 * @route PUT /guild/:id/nudge-link
 */
export const putGuildNudgeLinkController = async (req: Request, res: Response) => {
  try {
    const parsed = putGuildNudgeLinkSchema.parse({
      body: req.body,
      params: req.params,
    })

    const { id } = parsed.params
    const { tag, userId } = parsed.body

    const { data: player, error, status } = await getPlayer(tag)

    if (error || !player) {
      res.status(status || 404).json({ error: error || 'Player not found.', status: status || 404 })
      return
    }

    const { matchedCount, modifiedCount } = await addNudgeLink({
      guildId: id,
      name: player.name,
      tag,
      userId,
    })

    if (!matchedCount || !modifiedCount) {
      res.status(409).json({ error: 'Tag already linked or guild not found.', status: 409 })
      return
    }

    res.status(200).json({ guildId: id, name: player.name, success: true, tag, userId })
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

export default putGuildNudgeLinkController
