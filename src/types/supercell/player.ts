export interface SupercellPlayer {
  arena: {
    id: number
    name: string
  }
  badges: SupercellBadge[]
  battleCount: number
  bestTrophies: number
  challengeCardsWon: number
  challengeMaxWins: number
  clan: {
    tag: string
    name: string
    badgeId: number
  }
  clanCardsCollected: number
  donations: number
  donationsReceived: number
  expLevel: number
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
  losses: number
  name: string
  role: string
  tag: string
  threeCrownWins: number
  totalDonations: number
  tournamentBattleCount: number
  tournamentCardsWon: number
  trophies: number
  warDayWins: number
  wins: number
}

export interface SupercellBadge {
  iconUrls: {
    large: string
  }
  level: number
  maxLevel: number
  name: string
  progress: number
  target: number
}

export interface SupercellBattleLog extends Array<BattleLogEntry> {}

export interface BattleLogEntry {
  arena: Arena
  battleTime: string
  deckSelection: string
  gameMode: GameMode
  isLadderTournament: boolean
  opponent: Player[] // Assuming similar structure to team
  team: Player[]
  type: string
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
  cards: Card[]
  clan?: Clan
  crowns: number
  elixirLeaked: number
  globalRank: null | number
  kingTowerHitPoints: number
  name: string
  princessTowersHitPoints: number[]
  rounds: Round[]
  startingTrophies?: number
  supportCards: Card[]
  tag: string
}

export interface Clan {
  badgeId: number
  name: string
  tag: string
}

export interface Card {
  elixirCost: number
  evolutionLevel?: number
  iconUrls: IconUrls
  id: number
  level: number
  maxEvolutionLevel?: number
  maxLevel: number
  name: string
  rarity: 'champion' | 'common' | 'epic' | 'legendary' | 'rare'
  starLevel?: number
  used?: boolean
}

export interface IconUrls {
  evolutionMedium?: string
  medium: string
}

export interface Round {
  cards: Card[]
  crowns: number
  elixirLeaked: number
  kingTowerHitPoints: number
  princessTowersHitPoints: number[]
}
