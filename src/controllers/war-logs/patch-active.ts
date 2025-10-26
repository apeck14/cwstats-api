import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { patchWarLogActiveSchema } from '@/schemas/mongo'
import { setWarLogClanStatus } from '@/services/mongo'

/**
 * Set war logs active status for a clan
 * @route PATCH /war-logs/active
 */
export const patchWarLogsActiveController = async (req: Request, res: Response) => {
  try {
    const parsed = patchWarLogActiveSchema.parse({
      body: req.body
    })

    const { active, tag } = parsed.body

    await setWarLogClanStatus(tag, active)

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

export default patchWarLogsActiveController
