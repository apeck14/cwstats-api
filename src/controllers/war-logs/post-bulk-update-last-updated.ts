import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { postWarLogsBulkUpdateLastUpdatedSchema } from '@/schemas/mongo'
import { bulkUpdateWarLogLastUpdated } from '@/services/mongo'

/**
 * Bulk update last updated for war log clans
 * @route POST /war-logs/bulk-update-last-updated
 */
export const postWarLogsBulkUpdateLastUpdatedController = async (req: Request, res: Response) => {
  try {
    const parsed = postWarLogsBulkUpdateLastUpdatedSchema.parse({
      body: req.body
    })

    const { entries } = parsed.body

    await bulkUpdateWarLogLastUpdated(entries)

    res.status(200).json({ success: true })
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

export default postWarLogsBulkUpdateLastUpdatedController
