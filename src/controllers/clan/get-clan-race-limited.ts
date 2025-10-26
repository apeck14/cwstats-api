import { Request, Response } from 'express'
import { omit } from 'lodash'

import { getRiverRace } from '@/services/supercell'
import { ApiRaceLimited } from '@/types/api/race'

/**
 * Get clan
 * @route GET /clan/:tag/race/limited
 */
export const clanRaceLimitedController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: race, error, status } = await getRiverRace(tag)

    if (error || !race) {
      res.status(status).json({ error, status })
      return
    }

    const clanTag = race.clan.tag

    const raceWithoutClan = omit(race, ['clan'])

    const limitedRace: ApiRaceLimited = {
      clanIndex: race.clans.findIndex((c) => c.tag === clanTag),
      dayIndex: race.periodIndex % 7,
      isColosseum: race.periodType === 'colosseum',
      isTraining: race.periodType === 'training',
      ...raceWithoutClan
    }

    res.status(200).json({ data: limitedRace })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanRaceLimitedController
