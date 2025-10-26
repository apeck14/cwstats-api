export interface SupercellParticipant {
  boatAttacks: number
  decksUsed: number
  decksUsedToday: number
  fame: number
  name: string
  repairPoints: number
  tag: string
}

export interface SupercellRaceClan {
  badgeId: number
  clanScore: number
  fame: number
  name: string
  participants: SupercellParticipant[]
  periodPoints: number
  repairPoints: number
  tag: string
}

export interface SupercellRace {
  clan: SupercellRaceClan
  clans: SupercellRaceClan[]
  periodIndex: number
  periodType: 'colosseum' | 'training' | 'warDay'
  sectionIndex: number
  state: string
}
