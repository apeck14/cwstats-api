import { Request, Response } from 'express'

import { getRiverRace } from '../../services/supercell'

/**
 * Get clan
 * @route GET /clan/:tag/race
 */
export const clanRaceController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: race, error, status } = await getRiverRace(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    res.status(200).json({ data: race })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanRaceController
