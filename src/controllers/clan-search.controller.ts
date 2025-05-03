import { Request, Response } from 'express'

import { searchSchema } from '../schemas/zod/supercell'
import { searchClans } from '../services/supercell'

/**
 * Get clan
 * @route GET /api/clan/search?name=
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

    res.status(200).json(clans)
  } catch (err) {
    res.status(400).json({ details: err, error: 'Invalid request' })
  }
}

export default clanSearchController
