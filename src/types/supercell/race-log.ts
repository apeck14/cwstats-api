import { SupercellParticipant } from '@/types/supercell/race'

export interface SupercellRaceLog extends Array<SupercellRaceLogEntry> {}

export interface SupercellRaceLogEntry {
  seasonId: number
  sectionIndex: number
  createdDate: string // ISO 8601 date string
  standings: SupercellRaceLogClanStanding[]
}

export interface SupercellRaceLogClanStanding {
  rank: number
  trophyChange: number
  clan: SupercellRaceLogClan
}

export interface SupercellRaceLogClan {
  tag: string
  name: string
  badgeId: number
  fame: number
  repairPoints: number
  finishTime: string // ISO 8601 date string
  participants: SupercellParticipant[]
  periodPoints: number
  clanScore: number
}
