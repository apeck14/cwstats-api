import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { postWarReportSchema } from '@/schemas/mongo'
import { createWebhook, webhookExists } from '@/services/discord'
import { getLinkedClan, setLinkedClanWebhookUrl, setWarReportEnabled } from '@/services/mongo'
import { getClan } from '@/services/supercell'

/**
 * Set war report clan (and handle webhooks)
 * @route POST /plus/war-report
 */
export const postWarReportController = async (req: Request, res: Response) => {
  try {
    const parsed = postWarReportSchema.parse({
      body: req.body,
    })

    const { enabled, guildId, tag } = parsed.body

    console.log({ enabled, guildId, tag })

    // if enabling, create webhook if one doesn't exist
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

    await setWarReportEnabled(guildId, enabled)

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

export default postWarReportController
