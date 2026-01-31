import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { patchUnsetWebhookSchema } from '@/schemas/mongo'
import { unsetWarLogWebhook } from '@/services/mongo'

/**
 * Unset a war log webhook URL for a clan
 * @route PATCH /war-logs/unset-webhook
 */
export const patchUnsetWarLogWebhookController = async (req: Request, res: Response) => {
  try {
    const parsed = patchUnsetWebhookSchema.parse({
      body: req.body
    })

    const { tag, webhookNumber } = parsed.body

    await unsetWarLogWebhook(tag, webhookNumber)

    res.status(200).json({ success: true, tag: formatTag(tag, true), webhookNumber })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default patchUnsetWarLogWebhookController
