import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { patchUnsetNudgeChannelSchema } from '@/schemas/mongo'
import { unsetNudgeChannel } from '@/services/mongo'

/**
 * Unset (remove) a nudge scheduled for a specific channel
 * @route PATCH /guild/unset-nudge-channel
 */
export const patchUnsetNudgeChannelController = async (req: Request, res: Response) => {
  try {
    const parsed = patchUnsetNudgeChannelSchema.parse({
      body: req.body
    })

    const { guildId, scheduledHourUTC, tag } = parsed.body

    await unsetNudgeChannel(guildId, tag, scheduledHourUTC)

    res.status(200).json({ guildId, scheduledHourUTC, success: true, tag: formatTag(tag, true) })
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

export default patchUnsetNudgeChannelController
