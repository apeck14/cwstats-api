export interface SupercellParticipant {
  tag: string
  name: string
  fame: number
  repairPoints: number
  boatAttacks: number
  decksUsed: number
  decksUsedToday: number
}

export interface SupercellRaceClan {
  tag: string
  name: string
  badgeId: number
  fame: number
  repairPoints: number
  participants: SupercellParticipant[]
  periodPoints: number
  clanScore: number
}

export interface SupercellRace {
  state: string
  clan: SupercellRaceClan
  clans: SupercellRaceClan[]
  sectionIndex: number
  periodIndex: number
  periodType: 'warDay' | 'colosseum' | 'training'
}
