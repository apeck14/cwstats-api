import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { addDailyTrackingEntriesSchema } from '@/schemas/mongo'
import { bulkAddDailyTrackingEntries } from '@/services/mongo'

/**
 * Bulk add daily tracking entries
 * @route POST /plus/daily-tracking/entries
 */
export const postAddDailyTrackingEntries = async (req: Request, res: Response) => {
  try {
    const parsed = addDailyTrackingEntriesSchema.parse({
      body: req.body,
    })

    const { entries } = parsed.body

    const { modifiedCount } = await bulkAddDailyTrackingEntries(entries)

    res.status(200).json({ entriesAdded: modifiedCount, success: true })
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

export default postAddDailyTrackingEntries
