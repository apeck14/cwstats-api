import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { patchUnsetChannelSchema } from '@/schemas/mongo'
import { unsetSeasonalReportChannel, unsetWarReportChannel } from '@/services/mongo'

/**
 * Unset a channel ID for a linked clan (seasonal or war report)
 * @route PATCH /linked-clan/unset-channel
 */
export const patchUnsetChannelController = async (req: Request, res: Response) => {
  try {
    const parsed = patchUnsetChannelSchema.parse({
      body: req.body
    })

    const { channelType, guildId, tag } = parsed.body

    if (channelType === 'seasonal') {
      await unsetSeasonalReportChannel(guildId, tag)
    } else {
      await unsetWarReportChannel(guildId, tag)
    }

    res.status(200).json({ channelType, guildId, success: true, tag: formatTag(tag, true) })
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

export default patchUnsetChannelController
