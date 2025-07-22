import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { getDaysDiff } from '@/lib/utils'
import { patchFreeWarLogClanSchema } from '@/schemas/mongo'
import { createWebhook } from '@/services/discord'
import { getLinkedClan, getPlusClans, setFreeWarLogClan } from '@/services/mongo'

/**
 * Set war logs enabled for a specific linked pro clan
 * @route PATCH /plus/free-war-log-clan
 * Each server gets 1 free linked Plus clan, all other must be pro
 */
export const patchFreeWarLogClanController = async (req: Request, res: Response) => {
  try {
    const parsed = patchFreeWarLogClanSchema.parse({
      body: req.body,
    })

    const { channelId, guildId, tag } = parsed.body

    const formattedTag = formatTag(tag, true)

    const [linkedClan, plusClans] = await Promise.all([
      getLinkedClan(tag),
      getPlusClans(false, { tag: formattedTag }, { dailyTracking: 0, hourlyAverages: 0 }),
    ])

    const plusClan = plusClans[0]

    if (!plusClan) {
      res.status(409).json({ error: 'Clan does not have plus activated.', status: 409 })
      return
    }

    // if guildId is null, then allow it to be set as null
    if (guildId && linkedClan?.guildID !== guildId) {
      res.status(409).json({ error: 'Clan is not linked to this guild.', status: 409 })
      return
    }

    const updateTimestamp = !!channelId && !!guildId
    const daysSinceLastChange = plusClan?.freeWarLogClan?.timestamp
      ? getDaysDiff(plusClan.freeWarLogClan.timestamp)
      : 0

    if (updateTimestamp && daysSinceLastChange <= 7) {
      res.status(409).json({ error: 'War log clan update allowed every 7 days.', status: 409 })
      return
    }

    let webhookUrl
    if (updateTimestamp) {
      const { error, url } = await createWebhook(channelId, `CWStats War Logs - ${formattedTag}`)

      if (error) {
        res.status(400).json({ error, status: 400 })
        return
      }

      webhookUrl = url
    }

    await setFreeWarLogClan({ tag, updateTimestamp, webhookUrl })

    res.status(200).json({ success: true, tag: formattedTag, webhookUrl })
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
