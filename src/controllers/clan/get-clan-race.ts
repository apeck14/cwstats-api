import { Request, Response } from 'express'

import { getClanBadge } from '../../lib/utils'
import { getRiverRace } from '../../services/supercell'
import { RaceClan, RaceParticipant } from '../../types/supercell.types'

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

    const dayIndex = race.periodIndex % 7
    const isColosseum = race.periodType === 'colosseum'
    const isTraining = race.periodType === 'training'
    const clanIndex = race.clans.findIndex((c: RaceClan) => c.tag === race.clan.tag)

    delete race.clan

    // add decks used for each clan
    for (const c of race.clans) {
      c.decksUsed = c.participants.reduce((a: number, b: RaceParticipant) => a + b.decksUsedToday, 0)
      c.badge = getClanBadge(c.badgeId, c.trophyCount)
    }

    const fullRace = {
      clanIndex,
      ...race,
      dayIndex,
      isColosseum,
      isTraining,
    }

    res.status(200).json({ data: fullRace })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanRaceController
