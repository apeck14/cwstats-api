import { Request, Response } from 'express'

import { DiscordApiError } from '@/lib/errors'
import { formatTag } from '@/lib/format'
import { deleteDiscordWebhookByUrl } from '@/services/discord'
import { deleteWebhook } from '@/services/mongo'

/**
 * Delete the webhook from a linked clan
 * @route DELETE /clan/:tag/webhook
 */
export const deleteWebhookController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const linkedClan = await deleteWebhook(tag)

    if (!linkedClan) {
      res.status(404).json({ error: 'Linked clan not found.', status: 404 })
      return
    } else if (linkedClan.webhookUrl) {
      // remove webhook from guild
      await deleteDiscordWebhookByUrl(linkedClan?.webhookUrl)
    }

    res
      .status(200)
      .json({ success: true, tag: formatTag(tag, true), webhookUrl: linkedClan?.webhookUrl || false })
  } catch (err) {
    if (err instanceof DiscordApiError) {
      res.status(err.status).json({ error: err.message, status: err.status })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deleteWebhookController
