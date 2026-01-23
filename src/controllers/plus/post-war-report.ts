import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { postWarReportSchema } from '@/schemas/mongo'
import { setWarReport } from '@/services/mongo'

/**
 * Set war report clan (store Discord channel ID)
 * @route POST /plus/war-report
 */
export const postWarReportController = async (req: Request, res: Response) => {
  try {
    const parsed = postWarReportSchema.parse({
      body: req.body
    })

    const { channelId, enabled, guildId } = parsed.body

    await setWarReport(guildId, enabled, channelId)

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

export default postWarReportController
