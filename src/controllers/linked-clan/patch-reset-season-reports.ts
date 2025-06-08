import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { resetSeasonalReportsSent } from '@/services/mongo'

/**
 * Set all seasonal reports sent to false
 * @route PATCH /linked-clan/season-report-sent
 */
export const patchResetSeasonalReportsController = async (req: Request, res: Response) => {
  try {
    const { modifiedCount } = await resetSeasonalReportsSent()

    res.status(200).json({ reportsReset: modifiedCount, success: true })
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

export default patchResetSeasonalReportsController
