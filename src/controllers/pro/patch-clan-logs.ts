import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { getHoursDiff } from '@/lib/utils'
import { patchProWarLogSchema } from '@/schemas/mongo'
import { createWebhook } from '@/services/discord'
import {
  deleteClanLogEntry,
  getGuild,
  getLinkedClan,
  getProClan,
  setClanLogClan,
  setClanLogClanStatus,
} from '@/services/mongo'

/**
 * Set clan logs enabled and create webhooks for a specific linked pro clan
 * @route PATCH /pro/clan-logs
 */
export const patchProClanLogController = async (req: Request, res: Response) => {
  try {
    const parsed = patchProWarLogSchema.parse({
      body: req.body,
    })

    const { channelId, guildId, tag } = parsed.body

    const formattedTag = formatTag(tag, true)

    const isCreation = !!channelId

    // * do various checks + create webhook (if not deleting current webhook)
    if (isCreation) {
      const [linkedClan, guild, proClan] = await Promise.all([
        getLinkedClan(tag),
        getGuild(guildId, true),
        getProClan(tag),
      ])

      if (!guild) {
        res.status(404).json({ error: 'Guild not found.', status: 404 })
        return
      }

      if (linkedClan?.guildID !== guildId) {
        res.status(409).json({ error: 'Clan is not linked to this guild.', status: 409 })
        return
      }

      if (!proClan) {
        res.status(409).json({ error: 'Clan is not a Pro clan.', status: 409 })
        return
      }

      if (!proClan.active) {
        res.status(409).json({ error: 'Clan is not an active pro clan.', status: 409 })
        return
      }

      const hoursSinceLastChange = proClan?.clanLogs?.timestamp
        ? getHoursDiff(proClan.clanLogs.timestamp)
        : Infinity

      if (hoursSinceLastChange <= 0.25) {
        res.status(409).json({ error: 'Clan logs update allowed every 15 mins.', status: 409 })
        return
      }

      const webhookTitle = `CWStats Clan Logs - ${formattedTag} (PRO)`

      let webhooksMissing = 2
      if (proClan?.clanLogs?.webhookUrl1) webhooksMissing--
      if (proClan?.clanLogs?.webhookUrl2) webhooksMissing--

      const promises: Promise<{ error?: string; url?: string }>[] = []

      for (let i = 0; i < webhooksMissing; i++) {
        promises.push(createWebhook(channelId, webhookTitle))
      }

      const results = await Promise.all(promises)

      const firstError = results.find((r) => r.error)?.error

      if (firstError) {
        res.status(400).json({ error: firstError, status: 400 })
        return
      }

      const webhookUrl1 = proClan?.clanLogs?.webhookUrl1 || results[0]?.url
      const webhookUrl2 =
        proClan?.clanLogs?.webhookUrl2 || results[1 - (proClan?.clanLogs?.webhookUrl1 ? 0 : 1)]?.url

      await setClanLogClan({ tag, webhookUrl1, webhookUrl2 })
    } else {
      await Promise.all([deleteClanLogEntry(tag), setClanLogClanStatus(tag, false)])
    }

    res.status(200).json({ isCreation, success: true, tag: formattedTag })
  } catch (err) {
    console.log(err)
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

export default patchProClanLogController
