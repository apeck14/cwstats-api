import { Request, Response } from 'express'
import { z } from 'zod'

import { guildSchema } from '@/schemas/mongo'
import { getGuild } from '@/services/mongo'

type GuildParams = z.infer<typeof guildSchema>['params']

/**
 * Get guild data by id
 * @route GET /guild/:id/limited
 */
export const getGuildLimitedController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as GuildParams

    const guild = await getGuild(id, true)

    if (!guild) {
      res.status(404).json({ error: 'Guild not found', status: 404 })
      return
    }

    res.status(200).json({ data: guild })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getGuildLimitedController
