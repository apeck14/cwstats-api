import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { addHourlyTrackingEntriesSchema } from '@/schemas/mongo'
import { bulkAddHourlyTrackingEntries } from '@/services/mongo'

/**
 * Bulk add hourly tracking entries
 * @route POST /plus/hourly-tracking/entries
 */
export const postAddHourlyTrackingEntries = async (req: Request, res: Response) => {
  try {
    const parsed = addHourlyTrackingEntriesSchema.parse({
      body: req.body,
    })

    const { entries } = parsed.body

    const { modifiedCount } = await bulkAddHourlyTrackingEntries(entries)

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

export default postAddHourlyTrackingEntries
