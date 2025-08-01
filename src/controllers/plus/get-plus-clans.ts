import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { plusClansSchema } from '@/schemas/mongo'
import { getPlusClans } from '@/services/mongo'

/**
 * Get all plus clans
 * @route GET /plus/clans?tagsOnly=
 */
export const plusClansController = async (req: Request, res: Response) => {
  try {
    const parsed = plusClansSchema.parse({
      query: req.query,
    })

    const { hideDailyTracking, hideHourlyAverages, tagsOnly } = parsed.query

    const projection: { [key: string]: number } = {}

    if (hideDailyTracking === 'true') projection.dailyTracking = 0
    if (hideHourlyAverages === 'true') projection.hourlyAverages = 0

    const plusClans = await getPlusClans(tagsOnly === 'true', {}, projection)

    res.status(200).json({ data: plusClans })
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

export default plusClansController
