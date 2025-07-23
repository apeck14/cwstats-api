import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { getDaysDiff } from '@/lib/utils'
import { patchFreeWarLogClanSchema } from '@/schemas/mongo'
import { createWebhook } from '@/services/discord'
import {
  deleteGuildFreeWarLogClan,
  getGuild,
  getLinkedClan,
  getPlusClans,
  setFreeWarLogClan,
} from '@/services/mongo'

/**
 * Set war logs enabled for a specific linked pro clan
 * @route PATCH /guild/free-war-log-clan
 * Each server gets 1 free linked Plus clan, all other must be pro
 */
export const patchFreeWarLogClanController = async (req: Request, res: Response) => {
  try {
    const parsed = patchFreeWarLogClanSchema.parse({
      body: req.body,
    })

    const { channelId, guildId, tag } = parsed.body

    const formattedTag = formatTag(tag, true)

    const isCreation = !!channelId

    // * do various checks + create webhook (if not deleting current webhook)
    if (isCreation) {
      const [linkedClan, plusClans, guild] = await Promise.all([
        getLinkedClan(tag),
        getPlusClans(false, { tag: formattedTag }, { dailyTracking: 0, hourlyAverages: 0 }),
        getGuild(guildId, true),
      ])

      const plusClan = plusClans[0]

      if (!plusClan) {
        res.status(409).json({ error: 'Clan does not have plus activated.', status: 409 })
        return
      }

      if (!guild) {
        res.status(404).json({ error: 'Guild not found.', status: 404 })
        return
      }

      if (linkedClan?.guildID !== guildId) {
        res.status(409).json({ error: 'Clan is not linked to this guild.', status: 409 })
        return
      }

      const daysSinceLastChange = guild?.freeWarLogClan?.timestamp
        ? getDaysDiff(guild.freeWarLogClan.timestamp)
        : Infinity

      if (daysSinceLastChange <= 7) {
        res.status(409).json({ error: 'War log clan update allowed every 7 days.', status: 409 })
        return
      }

      const { error, url } = await createWebhook(channelId, `CWStats War Logs - ${formattedTag}`)

      if (error) {
        res.status(400).json({ error, status: 400 })
        return
      }

      await setFreeWarLogClan({ guildId, isCreation, tag, webhookUrl: url })
    } else {
      await deleteGuildFreeWarLogClan(tag)
    }

    res.status(200).json({ isCreation, success: true, tag: formattedTag })
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

export default patchFreeWarLogClanController
