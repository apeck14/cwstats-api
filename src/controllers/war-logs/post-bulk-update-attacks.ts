import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { postBulkUpdateWarLogClanAttacksSchema } from '@/schemas/mongo'
import { bulkUpdateWarLogClanAttacks } from '@/services/mongo'

/**
 * Bulk update war log clan attacks
 * @route POST /war-logs/bulk-update-attacks
 */
export const postBulkUpdateWarLogAttacksController = async (req: Request, res: Response) => {
  try {
    const parsed = postBulkUpdateWarLogClanAttacksSchema.parse({
      body: req.body
    })

    const { entries } = parsed.body

    const { modifiedCount } = await bulkUpdateWarLogClanAttacks(entries)

    res.status(200).json({ entriesUpdated: modifiedCount, success: true })
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

export default postBulkUpdateWarLogAttacksController
