import { Request, Response } from 'express'

import { getClan } from '../services/supercell'

/**
 * Get clan
 * @route GET /api/clan/:tag
 */
export const clanController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: clan, error, status } = await getClan(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json(clan)
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanController
