import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { deleteGuildNudgeSchema } from '@/schemas/mongo'
import { deleteNudge } from '@/services/mongo'

/**
 * Delete a nudge from a guild
 * @route DELETE /nudge
 */
export const deleteGuildNudgeController = async (req: Request, res: Response) => {
  try {
    const parsed = deleteGuildNudgeSchema.parse({
      body: req.body
    })

    const { guildId, scheduledHourUTC, tag } = parsed.body

    const formattedTag = formatTag(tag, true)

    const { matchedCount, modifiedCount } = await deleteNudge({
      guildId,
      scheduledHourUTC,
      tag: formattedTag
    })

    if (!modifiedCount) {
      res.status(404).json({ error: 'Nudge not found.', status: 404 })
      return
    }

    if (!matchedCount) {
      res.status(404).json({ error: 'Guild not found.', status: 404 })
      return
    }

    res.status(200).json({ guildId, scheduledHourUTC, success: true, tag: formattedTag })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deleteGuildNudgeController
