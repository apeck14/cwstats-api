import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { getAllPlusClans } from '../services/mongo'
import { plusClansSchema } from '../zod/mongo'

/**
 * Get all plus clans
 * @route GET /api/plus/clans?tagsOnly=
 */
export const plusClansController = async (req: Request, res: Response) => {
  try {
    const parsed = plusClansSchema.parse({
      query: req.query,
    })

    const { tagsOnly } = parsed.query

    const data = await getAllPlusClans(tagsOnly === 'true')

    res.status(200).json(data)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: err.errors[0].message,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default plusClansController
