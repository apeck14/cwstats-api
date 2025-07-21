import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
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

    const [linkedClan, plusClanTags] = await Promise.all([getLinkedClan(tag), getPlusClans(true, {}, {})])

    const formattedTag = formatTag(tag, true)

    if (!plusClanTags.includes(formattedTag)) {
      res.status(409).json({ error: 'Clan does not have plus activated.', status: 409 })
      return
    }

    // if guildId is null, then allow it to be set as null
    if (guildId && linkedClan?.guildID !== guildId) {
      res.status(409).json({ error: 'Clan is not linked to this guild.', status: 409 })
      return
    }

    let webhookUrl
    if (channelId && guildId) {
      const { error, url } = await createWebhook(channelId, `CWStats War Logs - ${formattedTag}`)

      if (error) {
        res.status(400).json({ error, status: 400 })
        return
      }

      webhookUrl = url
    }

    await setFreeWarLogClan({ channelId, guildId, tag, webhookUrl })

    res.status(200).json({ channelId, guildId, success: true, tag: formattedTag })
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
