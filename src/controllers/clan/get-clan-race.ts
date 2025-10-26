import { Request, Response } from 'express'
import { omit } from 'lodash'

import { getAvgFame, getClanBadge, getPlacements, getProjFame } from '@/lib/utils'
import { getRiverRace } from '@/services/supercell'
import { ApiRace } from '@/types/api/race'

type BoatAccessorKey = 'fame' | 'periodPoints'
type FameAccessorKey = 'fame' | 'periodPoints'

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

    const isColosseum = race.periodType === 'colosseum'
    const dayIndex = race.periodIndex % 7
    const clanTag = race.clan.tag

    const { boatAccessor, fameAccessor }: { boatAccessor: BoatAccessorKey; fameAccessor: FameAccessorKey } = isColosseum
      ? { boatAccessor: 'periodPoints', fameAccessor: 'fame' }
      : { boatAccessor: 'fame', fameAccessor: 'periodPoints' }

    const clans = race.clans.map((c) => {
      let decksUsed = 0
      let slotsUsed = 0
      let duelsCompleted = 0

      for (const p of c.participants) {
        decksUsed += p.decksUsedToday
        if (p.decksUsedToday) slotsUsed++
        if (p.decksUsedToday >= 2) duelsCompleted++
      }

      const fameAvg = getAvgFame({
        boatPoints: c[boatAccessor],
        dayIndex,
        decksUsedToday: decksUsed,
        fame: c[fameAccessor],
        isColosseum
      })

      const projFame = getProjFame({
        boatPoints: c[boatAccessor],
        dayIndex,
        decksUsedToday: decksUsed,
        duelsCompleted,
        fame: c[fameAccessor],
        isColosseum
      })

      return {
        ...omit(c, ['periodPoints']),
        badge: getClanBadge(c.badgeId, c.clanScore),
        boatPoints: c[boatAccessor],
        crossedFinishLine: c[boatAccessor] >= 10000,
        currentPlace: -1, // default to -1
        decksUsed,
        fame: c[fameAccessor],
        fameAvg,
        projFame,
        projPlace: -1, // default to -1
        slotsUsed
      }
    })

    // add current and proj placements
    const currentPlacements = getPlacements({ clans, fameAccessor: 'fame' })
    const projPlacements = getPlacements({ clans, fameAccessor: 'projFame' })

    for (const c of clans) {
      const currentPlace = currentPlacements.find((cl) => cl.tag === c.tag)?.place
      const projPlace = projPlacements.find((cl) => cl.tag === c.tag)?.place

      if (currentPlace) c.currentPlace = currentPlace
      if (projPlace) c.projPlace = projPlace
    }

    // sort clans by crossedFinishLine, currentPlace, no placement (currentPlace === -1)
    clans.sort((a, b) => {
      // First, prioritize crossedFinishLine
      if (a.crossedFinishLine !== b.crossedFinishLine) {
        return a.crossedFinishLine ? -1 : 1
      }

      // Then sort by currentPlace
      if (a.currentPlace === -1 && b.currentPlace !== -1) return 1
      if (a.currentPlace !== -1 && b.currentPlace === -1) return -1
      if (a.currentPlace !== -1 && b.currentPlace !== -1) {
        return a.currentPlace - b.currentPlace
      }

      return 0
    })

    const fullRace: ApiRace = {
      ...omit(race, ['clan']),
      clanIndex: clans.findIndex((c) => c.tag === clanTag),
      clans,
      dayIndex,
      isColosseum,
      isTraining: race.periodType === 'training'
    }

    res.status(200).json({ data: fullRace })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default clanRaceController
