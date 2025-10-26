import { Location } from '@/models/statistics.model'

export interface SupercellClan {
  badgeId: number
  capitalLeague?: { id: number; name: string }
  clanChestLevel: number
  clanChestMaxLevel: number
  clanChestStatus: string
  clanLevel?: number
  clanScore: number
  clanWarTrophies: number
  description: string
  donationsPerWeek: number
  isFamilyFriendly?: boolean
  labels?: { id: number; name: string; iconUrls: Record<string, string> }[]
  location: Location
  memberList: SupercellClanMember[]
  members: number
  name: string
  requiredTrophies: number
  tag: string
  type: string
  warFrequency?: string
  warLeague?: { id: number; name: string }
  warLosses?: number
  warTies?: number
  warWins?: number
  warWinStreak?: number
}

export interface SupercellClanMember {
  arena: {
    id: number
    name: string
  }
  clanChestPoints: number
  clanRank: number
  donations: number
  donationsReceived: number
  expLevel: number
  lastSeen: string // ISO 8601 datetime string
  name: string
  previousClanRank: number
  role: string
  tag: string
  trophies: number
}

export interface SupercellClansSearch extends Array<SupercellClansSearchItem> {}

export interface SupercellClansSearchItem {
  badgeId: number
  clanChestLevel: number
  clanChestMaxLevel: number
  clanScore: number
  clanWarTrophies: number
  donationsPerWeek: number
  location: Location
  members: number
  name: string
  requiredTrophies: number
  tag: string
  type: 'closed' | 'inviteOnly' | 'open'
}
