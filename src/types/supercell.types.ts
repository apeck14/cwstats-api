export interface RaceParticipant {
  tag: string
  name: string
  fame: number
  repairPoints: number
  boatAttacks: number
  decksUsed: number
  decksUsedToday: number
}

export interface RaceClan {
  tag: string
  name: string
  badgeId: number
  fame: number
  repairPoints: number
  participants: RaceParticipant[]
  periodPoints: number
  clanScore: number
}
