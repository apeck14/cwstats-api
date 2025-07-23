import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { parseDate } from '@/lib/utils'
import { postWarLogsBulkAddSchema } from '@/schemas/mongo'
import { addWarLogs } from '@/services/mongo'

/**
 * Add new war logs
 * @route POST /war-logs/logs
 */
export const postWarLogsController = async (req: Request, res: Response) => {
  try {
    const parsed = postWarLogsBulkAddSchema.parse({
      body: req.body,
    })

    const { entries } = parsed.body

    const mappedEntries = entries.map((e) => ({
      key: `${formatTag(e.tag, false)}_${e.battleTime}`,
      tag: e.tag,
      timestamp: parseDate(e.battleTime),
    }))

    await addWarLogs(mappedEntries)

    res.status(200).json({ success: true })
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

export default postWarLogsController
