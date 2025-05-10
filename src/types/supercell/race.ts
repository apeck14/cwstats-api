export interface SupercellParticipant {
  tag: string
  name: string
  fame: number
  repairPoints: number
  boatAttacks: number
  decksUsed: number
  decksUsedToday: number
}

export interface SupercellRace {
  state: string
  clan: {
    tag: string
    name: string
    badgeId: number
    fame: number
    repairPoints: number
    participants: SupercellParticipant[]
    periodPoints: number
    clanScore: number
  }
  clans: {
    tag: string
    name: string
    badgeId: number
    fame: number
    repairPoints: number
    participants: SupercellParticipant[]
    periodPoints: number
    clanScore: number
  }[]
  sectionIndex: number
  periodIndex: number
  periodType: 'warDay' | 'colosseum' | 'training'
}
