import { Request, Response } from 'express'

import { deleteGuild, deleteLinkedClans } from '@/services/mongo'

/**
 * Delete a guild and its linked clans
 * @route DELETE /guild/:id
 */
export const deleteGuildController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [{ deletedCount }, { deletedCount: linkedClansDeletedCount }] = await Promise.all([
      deleteGuild(id),
      deleteLinkedClans(id)
    ])

    if (!deletedCount) {
      res.status(404).json({ error: 'Guild not found.', status: 404 })
      return
    }

    res.status(200).json({ guildId: id, linkedClansDeletedCount, success: true })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deleteGuildController
