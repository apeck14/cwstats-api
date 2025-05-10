export interface SupercellWarLeaderboard extends Array<SupercellWarLeaderboardItem> {}

export interface SupercellWarLeaderboardItem {
  tag: string
  name: string
  rank: number
  previousRank: number
  location: {
    id: number
    name: string
    isCountry: boolean
    countryCode: string
  }
  clanScore: number
  members: number
  badgeId: number
}
