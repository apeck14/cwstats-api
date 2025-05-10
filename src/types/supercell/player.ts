export interface SupercellPlayer {
  tag: string
  name: string
  expLevel: number
  trophies: number
  bestTrophies: number
  wins: number
  losses: number
  battleCount: number
  threeCrownWins: number
  challengeCardsWon: number
  challengeMaxWins: number
  tournamentCardsWon: number
  tournamentBattleCount: number
  role: string
  donations: number
  donationsReceived: number
  totalDonations: number
  warDayWins: number
  clanCardsCollected: number
  clan: {
    tag: string
    name: string
    badgeId: number
  }
  arena: {
    id: number
    name: string
  }
  leagueStatistics: {
    currentSeason?: {
      trophies: number
      bestTrophies: number
    }
    previousSeason?: {
      id: string
      trophies: number
      bestTrophies: number
    }
    bestSeason?: {
      id: string
      trophies: number
    }
  }
  badges: SupercellBadge[]
}

export interface SupercellBadge {
  name: string
  level: number
  maxLevel: number
  progress: number
  target: number
  iconUrls: {
    large: string
  }
}

export interface SupercellBattleLog extends Array<BattleLogEntry> {}

export interface BattleLogEntry {
  type: string
  battleTime: string
  isLadderTournament: boolean
  arena: Arena
  gameMode: GameMode
  deckSelection: string
  team: Player[]
  opponent: Player[] // Assuming similar structure to team
}

export interface Arena {
  id: number
  name: string
}

export interface GameMode {
  id: number
  name: string
}

export interface Player {
  tag: string
  name: string
  startingTrophies?: number
  crowns: number
  kingTowerHitPoints: number
  princessTowersHitPoints: number[]
  clan?: Clan
  cards: Card[]
  supportCards: Card[]
  globalRank: number | null
  rounds: Round[]
  elixirLeaked: number
}

export interface Clan {
  tag: string
  name: string
  badgeId: number
}

export interface Card {
  name: string
  id: number
  level: number
  starLevel?: number
  evolutionLevel?: number
  maxLevel: number
  maxEvolutionLevel?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'champion'
  elixirCost: number
  used?: boolean
  iconUrls: IconUrls
}

export interface IconUrls {
  medium: string
  evolutionMedium?: string
}

export interface Round {
  crowns: number
  kingTowerHitPoints: number
  princessTowersHitPoints: number[]
  cards: Card[]
  elixirLeaked: number
}
