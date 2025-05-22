import { SupercellParticipant } from '@/types/supercell/race'

export interface RaceClan {
  tag: string
  name: string
  badgeId: number
  repairPoints: number
  participants: SupercellParticipant[]
  clanScore: number
  decksUsed: number
  slotsUsed: number
  badge: string
  projFame: number
  projPlace: number
  currentPlace: number
  fameAvg: number
  crossedFinishLine: boolean
  fame: number
  boatPoints: number
}

export interface RaceClanLimited {
  tag: string
  name: string
  badgeId: number
  fame: number
  repairPoints: number
  participants: SupercellParticipant[]
  periodPoints: number
  clanScore: number
}

export interface ApiRace {
  clanIndex: number
  state: string
  clans: RaceClan[]
  sectionIndex: number
  periodIndex: number
  periodType: string
  dayIndex: number
  isColosseum: boolean
  isTraining: boolean
}

export interface ApiRaceLimited {
  clanIndex: number
  state: string
  clans: RaceClanLimited[]
  sectionIndex: number
  periodIndex: number
  periodType: string
  dayIndex: number
  isColosseum: boolean
  isTraining: boolean
}
