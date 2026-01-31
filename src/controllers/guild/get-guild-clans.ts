import { Request, Response } from 'express'
import { z } from 'zod'

import { guildSchema } from '@/schemas/mongo'
import { getLinkedClansByGuild } from '@/services/mongo'

type GuildParams = z.infer<typeof guildSchema>['params']

/**
 * Get all linked clans by guild
 * @route GET /guild/:id/clans
 */
export const getGuildClansController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as GuildParams

    const linkedClans = await getLinkedClansByGuild(id)

    res.status(200).json({ data: linkedClans })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getGuildClansController
