import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { patchGuildTimezoneSchema } from '@/schemas/mongo'
import { setGuildTimezone } from '@/services/mongo'

function isSupportedTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Set guild timezone
 * @route PATCH /guild/:id/timezone
 */
export const patchGuildTimezoneController = async (req: Request, res: Response) => {
  try {
    const parsed = patchGuildTimezoneSchema.parse({
      body: req.body,
      params: req.params,
    })

    const { id } = parsed.params
    const { timezone } = parsed.body

    if (!isSupportedTimezone(timezone)) {
      res.status(400).json({
        error: `Invalid or unsupported timezone: ${timezone}`,
        status: 400,
      })
      return
    }

    await setGuildTimezone(id, timezone)

    res.status(200).json({ id, success: true, timezone })
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

export default patchGuildTimezoneController
