import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { searchSchema } from '@/schemas/supercell'
import { searchClans } from '@/services/supercell'

/**
 * Get clan
 * @route GET /clan/search?name=
 */
export const clanSearchController = async (req: Request, res: Response) => {
  try {
    const parsed = searchSchema.parse({
      query: req.query
    })

    const { name } = parsed.query

    const { data: clans, error, status } = await searchClans(name)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json({ data: clans })
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

export default clanSearchController
