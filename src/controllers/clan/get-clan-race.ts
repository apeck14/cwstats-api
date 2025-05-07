import { Request, Response } from 'express'

import { getRiverRace } from '../../services/supercell'

interface Participant {
  tag: string
  name: string
  fame: number
  repairPoints: number
  boatAttacks: number
  decksUsed: number
  decksUsedToday: number
}

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
    const decksUsed = race.clan.participants.reduce((a: number, b: Participant) => a + b.decksUsedToday, 0)

    const fullRace = {
      ...race,
      clan: {
        decksUsed,
        ...race.clan,
      },
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
