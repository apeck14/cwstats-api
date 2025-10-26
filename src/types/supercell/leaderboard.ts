import { Location } from '@/models/statistics.model'

export interface SupercellWarLeaderboard extends Array<SupercellWarLeaderboardItem> {}

export interface SupercellWarLeaderboardItem {
  badgeId: number
  clanScore: number
  location: Location
  members: number
  name: string
  previousRank: number
  rank: number
  tag: string
}
