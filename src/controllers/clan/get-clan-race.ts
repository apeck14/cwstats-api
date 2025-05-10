import { Request, Response } from 'express'
import { omit } from 'lodash'

import { getClanBadge } from '@/lib/utils'
import { getRiverRace } from '@/services/supercell'
import { ApiRace } from '@/types/api/race'

/**
 * Get clan
 * @route GET /clan/:tag/race
 */
export const clanRaceController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: race, error, status } = await getRiverRace(tag)

    if (error || !race) {
      res.status(status).json({ error, status })
      return
    }

    const clanTag = race.clan.tag

    const clans = race.clans.map((c) => {
      let decksUsed = 0
      let slotsUsed = 0

      for (const p of c.participants) {
        decksUsed += p.decksUsedToday
        if (p.decksUsedToday) slotsUsed++
      }

      return {
        ...c,
        badge: getClanBadge(c.badgeId, c.clanScore),
        decksUsed,
        slotsUsed,
      }
    })

    const fullRace: ApiRace = {
      ...omit(race, ['clan']),
      clanIndex: clans.findIndex((c) => c.tag === clanTag),
      clans,
      dayIndex: race.periodIndex % 7,
      isColosseum: race.periodType === 'colosseum',
      isTraining: race.periodType === 'training',
    }

    res.status(200).json({ data: fullRace })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanRaceController
