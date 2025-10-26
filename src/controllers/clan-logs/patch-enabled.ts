import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { patchClanLogEnabledSchema } from '@/schemas/mongo'
import { setClanLogClanStatus } from '@/services/mongo'

/**
 * Set clan logs enabled status for a clan
 * @route PATCH /clan-logs/enabled
 */
export const patchClanLogsEnabledController = async (req: Request, res: Response) => {
  try {
    const parsed = patchClanLogEnabledSchema.parse({
      body: req.body
    })

    const { enabled, tag } = parsed.body

    await setClanLogClanStatus(tag, enabled)

    res.status(200).json({ success: true, tag: formatTag(tag, true) })
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

export default patchClanLogsEnabledController
