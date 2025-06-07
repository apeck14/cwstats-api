import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { deleteDailyTrackingEntriesSchema } from '@/schemas/mongo'
import { deleteDailyTrackingEntries } from '@/services/mongo'

/**
 * Delete all daily tracking weeks prior to a specified week
 * @route DELETE /plus/daily-tracking/entries
 */
export const deleteDailyTrackingEntriesController = async (req: Request, res: Response) => {
  try {
    const parsed = deleteDailyTrackingEntriesSchema.parse({
      body: req.body,
    })

    const { entries, tag } = parsed.body

    const result = await deleteDailyTrackingEntries(tag, entries)

    if (!result?.modifiedCount) {
      res.status(404).json({ error: 'No entries matched the criteria.', status: 404 })
      return
    }

    res
      .status(200)
      .json({ entriesRemoved: result?.modifiedCount || 0, success: true, tag: formatTag(tag, true) })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: err.errors[0].message,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deleteDailyTrackingEntriesController
