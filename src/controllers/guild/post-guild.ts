import { Request, Response } from 'express'

import { createGuild } from '@/services/mongo'

/**
 * Create a new guild
 * @route POST /guild/:id
 */
export const postGuildController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { upsertedCount } = await createGuild(id)

    if (!upsertedCount) {
      res.status(409).json({ error: 'Guild already exists.', status: 409 })
      return
    }

    res.status(200).json({ guildId: id, success: true })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postGuildController
