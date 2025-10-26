import { SupercellParticipant } from '@/types/supercell/race'

export interface RaceClan {
  badge: string
  badgeId: number
  boatPoints: number
  clanScore: number
  crossedFinishLine: boolean
  currentPlace: number
  decksUsed: number
  fame: number
  fameAvg: number
  name: string
  participants: SupercellParticipant[]
  projFame: number
  projPlace: number
  repairPoints: number
  slotsUsed: number
  tag: string
}

export interface RaceClanLimited {
  badgeId: number
  clanScore: number
  fame: number
  name: string
  participants: SupercellParticipant[]
  periodPoints: number
  repairPoints: number
  tag: string
}

export interface ApiRace {
  clanIndex: number
  clans: RaceClan[]
  dayIndex: number
  isColosseum: boolean
  isTraining: boolean
  periodIndex: number
  periodType: string
  sectionIndex: number
  state: string
}

export interface ApiRaceLimited {
  clanIndex: number
  clans: RaceClanLimited[]
  dayIndex: number
  isColosseum: boolean
  isTraining: boolean
  periodIndex: number
  periodType: string
  sectionIndex: number
  state: string
}
