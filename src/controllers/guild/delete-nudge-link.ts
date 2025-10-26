import { Request, Response } from 'express'

import { formatTag } from '@/lib/format'
import { deleteNudgeLink } from '@/services/mongo'

/**
 * Delete a nudge link from a guild
 * @route DELETE /guild/:id/nudge-link/:tag
 */
export const deleteGuildNudgeLinkController = async (req: Request, res: Response) => {
  try {
    const { id, tag } = req.params

    const formattedTag = formatTag(tag, true)

    const { matchedCount, modifiedCount } = await deleteNudgeLink({ guildId: id, tag: formattedTag })

    if (!modifiedCount) {
      res.status(404).json({ error: 'Link not found.', status: 404 })
      return
    }

    if (!matchedCount) {
      res.status(404).json({ error: 'Guild not found.', status: 404 })
      return
    }

    res.status(200).json({ success: true, tag: formattedTag })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deleteGuildNudgeLinkController
