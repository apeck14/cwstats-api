import { Location } from '@/models/statistics.model'

export interface SupercellWarLeaderboard extends Array<SupercellWarLeaderboardItem> {}

export interface SupercellWarLeaderboardItem {
  tag: string
  name: string
  rank: number
  previousRank: number
  location: Location
  clanScore: number
  members: number
  badgeId: number
}
