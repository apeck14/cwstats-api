import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { postBulkUpdateClanLogsSchema } from '@/schemas/mongo'
import { bulkUpdateClanLogLastUpdated, bulkUpdateClanLogs } from '@/services/mongo'

/**
 * Bulk update clan logs
 * @route POST /clan-logs/bulk-update-logs
 */
export const postBulkUpdateClanLogsController = async (req: Request, res: Response) => {
  try {
    const parsed = postBulkUpdateClanLogsSchema.parse({
      body: req.body,
    })

    const { entries } = parsed.body

    const now = Date.now()
    const lastUpdatedEntries = entries.map((e) => ({ tag: e.tag, timestamp: now }))

    const [{ modifiedCount }] = await Promise.all([
      bulkUpdateClanLogs(entries),
      bulkUpdateClanLogLastUpdated(lastUpdatedEntries),
    ])

    res.status(200).json({ entriesUpdated: modifiedCount, success: true })
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

export default postBulkUpdateClanLogsController
