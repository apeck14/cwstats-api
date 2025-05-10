import { SupercellParticipant } from '@/types/supercell/race'

export interface RaceClan {
  tag: string
  name: string
  badgeId: number
  fame: number
  repairPoints: number
  participants: SupercellParticipant[]
  periodPoints: number
  clanScore: number
  decksUsed: number
  slotsUsed: number
  badge: string
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
