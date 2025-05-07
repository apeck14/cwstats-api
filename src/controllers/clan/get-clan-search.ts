import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { searchClans } from '@/services/supercell'
import { searchSchema } from '@/zod/supercell'

/**
 * Get clan
 * @route GET /clan/search?name=
 */
export const clanSearchController = async (req: Request, res: Response) => {
  try {
    const parsed = searchSchema.parse({
      query: req.query,
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
      res.status(400).json({
        error: err.errors[0].message,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanSearchController
