import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { patchWarLogTimezoneSchema } from '@/schemas/mongo'
import { setWarLogClanTimezone } from '@/services/mongo'

function isSupportedTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Set war logs timezone for a clan
 * @route PATCH /war-logs/timezone
 */
export const patchWarLogsTimezoneController = async (req: Request, res: Response) => {
  try {
    const parsed = patchWarLogTimezoneSchema.parse({
      body: req.body,
    })

    const { tag, timezone } = parsed.body

    if (!isSupportedTimezone(timezone)) {
      res.status(400).json({
        error: `Invalid or unsupported timezone: ${timezone}`,
        status: 400,
      })
      return
    }

    await setWarLogClanTimezone(tag, timezone)

    res.status(200).json({ success: true, tag: formatTag(tag, true) })
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

export default patchWarLogsTimezoneController
