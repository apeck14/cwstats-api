import { Request, Response } from 'express'

import { resetSeasonalReportsSent } from '@/services/mongo'

/**
 * Set all seasonal reports sent to false
 * @route PATCH /linked-clan/reset-season-reports
 */
export const patchResetSeasonalReportsController = async (req: Request, res: Response) => {
  try {
    const { modifiedCount } = await resetSeasonalReportsSent()

    res.status(200).json({ reportsReset: modifiedCount, success: true })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default patchResetSeasonalReportsController
