import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { postSeasonalReportSchema } from '@/schemas/mongo'
import { createWebhook, webhookExists } from '@/services/discord'
import { getLinkedClan, setLinkedClanWebhookUrl, setSeasonalReportEnabled } from '@/services/mongo'
import { getClan } from '@/services/supercell'

/**
 * Set seasonal report clan (and handle webhooks)
 * @route POST /plus/seasonal-report
 */
export const postSeasonalReportController = async (req: Request, res: Response) => {
  try {
    const parsed = postSeasonalReportSchema.parse({
      body: req.body,
    })

    const { enabled, guildId, tag } = parsed.body

    console.log({ enabled, guildId, tag })

    // if enabling, check if need to update webhook
    if (enabled) {
      const linkedClan = await getLinkedClan(tag!)

      let isWebhookValid = false
      let webhookChannelId

      // check if webhook still exists
      if (linkedClan?.webhookUrl) {
        const { channelId, exists } = await webhookExists(linkedClan.webhookUrl)

        isWebhookValid = exists
        webhookChannelId = channelId
      }

      if (!isWebhookValid) {
        const { data: clan } = await getClan(tag!)
        const { url } = await createWebhook(
          webhookChannelId!,
          `CWStats Reports - ${clan?.name || 'Unknown Clan'}`,
        )

        await setLinkedClanWebhookUrl(tag!, url)
      }
    }

    await setSeasonalReportEnabled(guildId, enabled)

    res.status(200).json({ success: true })
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

export default postSeasonalReportController
