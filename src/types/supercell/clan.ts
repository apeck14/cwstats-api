export interface SupercellClan {
  tag: string
  name: string
  type: string
  description: string
  badgeId: number
  clanScore: number
  clanWarTrophies: number
  location: {
    id: number
    name: string
    isCountry: boolean
    countryCode?: string
  }
  requiredTrophies: number
  donationsPerWeek: number
  clanChestStatus: string
  clanChestLevel: number
  clanChestMaxLevel: number
  members: number
  memberList: SupercellClanMember[]
  clanLevel?: number
  warFrequency?: string
  warWinStreak?: number
  warWins?: number
  warTies?: number
  warLosses?: number
  isFamilyFriendly?: boolean
  warLeague?: { id: number; name: string }
  capitalLeague?: { id: number; name: string }
  labels?: { id: number; name: string; iconUrls: Record<string, string> }[]
}

export interface SupercellClanMember {
  tag: string
  name: string
  role: string
  lastSeen: string // ISO 8601 datetime string
  expLevel: number
  trophies: number
  arena: {
    id: number
    name: string
  }
  clanRank: number
  previousClanRank: number
  donations: number
  donationsReceived: number
  clanChestPoints: number
}

export interface SupercellClansSearch extends Array<SupercellClansSearchItem> {}

export interface SupercellClansSearchItem {
  tag: string
  name: string
  type: 'open' | 'closed' | 'inviteOnly'
  badgeId: number
  clanScore: number
  clanWarTrophies: number
  location: {
    id: number
    name: string
    isCountry: boolean
    countryCode?: string
  }
  requiredTrophies: number
  donationsPerWeek: number
  clanChestLevel: number
  clanChestMaxLevel: number
  members: number
}
