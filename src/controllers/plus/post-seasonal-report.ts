import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { postSeasonalReportSchema } from '@/schemas/mongo'
import { setSeasonalReport } from '@/services/mongo'

/**
 * Set seasonal report clan (store Discord channel ID)
 * @route POST /plus/seasonal-report
 */
export const postSeasonalReportController = async (req: Request, res: Response) => {
  try {
    const parsed = postSeasonalReportSchema.parse({
      body: req.body
    })

    const { channelId, enabled, guildId, tag } = parsed.body

    const result = await setSeasonalReport(guildId, tag, enabled, channelId)

    if (!result?.matchedCount) {
      res.status(404).json({ error: 'Linked clan not found', status: 404 })
      return
    }

    res.status(200).json({
      success: true
    })
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

export default postSeasonalReportController
