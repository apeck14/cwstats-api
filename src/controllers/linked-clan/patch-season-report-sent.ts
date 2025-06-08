import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { patchSeasonalReportSentSchema } from '@/schemas/mongo'
import { setSeasonalReportSent } from '@/services/mongo'

/**
 * Set seasonal report sent
 * @route PATCH /linked-clan/seasonal-report-sent
 */
export const patchSeasonalReportSentController = async (req: Request, res: Response) => {
  try {
    const parsed = patchSeasonalReportSentSchema.parse({
      body: req.body,
    })

    const { reportSent, tag } = parsed.body

    const { matchedCount, modifiedCount } = await setSeasonalReportSent(tag, reportSent)

    if (!matchedCount) {
      res.status(404).json({ error: 'Linked clan not found', status: 404 })
      return
    }

    if (!modifiedCount) {
      throw new Error()
    }

    res.status(200).json({ reportSent, success: true, tag: formatTag(tag, true) })
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

export default patchSeasonalReportSentController
