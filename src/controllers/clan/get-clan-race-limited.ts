import { Request, Response } from 'express'

import { getRiverRace } from '../../services/supercell'
import { RaceClan } from '../../types/supercell.types'

/**
 * Get clan
 * @route GET /clan/:tag/race/limited
 */
export const clanRaceLimitedController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: race, error, status } = await getRiverRace(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    const dayIndex = race.periodIndex % 7
    const isColosseum = race.periodType === 'colosseum'
    const isTraining = race.periodType === 'training'
    const clanIndex = race.clans.findIndex((c: RaceClan) => c.tag === race.clan.tag)

    delete race.clan

    const limitedRace = {
      clanIndex,
      ...race,
      dayIndex,
      isColosseum,
      isTraining,
    }

    res.status(200).json({ data: limitedRace })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanRaceLimitedController
