import { Request, Response } from 'express'

import { emojiBulkAddSchema } from '@/schemas/mongo'
import { bulkWriteEmojis } from '@/services/mongo'

/**
 * Bulk add emojis to database
 * @route POST /emoji/bulk-add
 */
export const postEmojiBulkAddController = async (req: Request, res: Response) => {
  try {
    const parsed = emojiBulkAddSchema.parse({
      body: req.body,
    })

    const { emojis } = parsed.body

    const { modifiedCount, upsertedCount } = await bulkWriteEmojis(emojis)

    res.status(200).json({ modifiedCount, success: true, upsertedCount })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postEmojiBulkAddController
