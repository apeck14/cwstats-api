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

    const { tagsOnly } = parsed.query

    const plusClans = await getPlusClans(tagsOnly === 'true', {}, {})

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
