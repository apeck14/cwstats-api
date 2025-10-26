import { SupercellParticipant } from '@/types/supercell/race'

export interface SupercellRaceLog extends Array<SupercellRaceLogEntry> {}

export interface SupercellRaceLogEntry {
  createdDate: string // ISO 8601 date string
  seasonId: number
  sectionIndex: number
  standings: SupercellRaceLogClanStanding[]
}

export interface SupercellRaceLogClanStanding {
  clan: SupercellRaceLogClan
  rank: number
  trophyChange: number
}

export interface SupercellRaceLogClan {
  badgeId: number
  clanScore: number
  fame: number
  finishTime: string // ISO 8601 date string
  name: string
  participants: SupercellParticipant[]
  periodPoints: number
  repairPoints: number
  tag: string
}
