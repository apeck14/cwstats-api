import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { deleteGuildNudgeLinkSchema } from '@/schemas/mongo'
import { deleteNudgeLink } from '@/services/mongo'

/**
 * Delete a nudge link from a guild
 * @route DELETE /guild/:id/nudge-link
 */
export const deleteGuildNudgeLinkController = async (req: Request, res: Response) => {
  try {
    const parsed = deleteGuildNudgeLinkSchema.parse({
      body: req.body,
      params: req.params,
    })

    const { id } = parsed.params
    const { tag, userId } = parsed.body

    const formattedTag = formatTag(tag, true)

    const { matchedCount, modifiedCount } = await deleteNudgeLink({ guildId: id, tag: formattedTag, userId })

    if (!modifiedCount) {
      res.status(404).json({ error: 'Link not found.', status: 404 })
      return
    }

    if (!matchedCount) {
      res.status(404).json({ error: 'Guild not found.', status: 404 })
      return
    }

    res.status(200).json({ success: true, tag: formattedTag })
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

export default deleteGuildNudgeLinkController
