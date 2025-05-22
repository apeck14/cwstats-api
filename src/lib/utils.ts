import badges from '@/static/badges.json'
import { RaceClan } from '@/types/api/race'

interface GetAvgFameParams {
  boatPoints: number
  dayIndex: number
  decksUsedToday: number
  fame: number
  isColosseum: boolean
}

interface GetProjFameParams {
  dayIndex: number
  isColosseum: boolean
  fame: number
  boatPoints: number
  duelsCompleted: number // p.decksUsedToday >= 2
  decksUsedToday: number
}

interface GetMaxPossibleFameParams {
  dayIndex: number
  decksUsedToday: number
  duelsCompleted: number
  isColosseum: boolean
}

interface GetPlacementsParams {
  clans: RaceClan[]
  fameAccessor: 'projFame' | 'fame'
}

export const getLeague = (trophyCount: number): string => {
  const leagues = [
    { min: 5000, name: 'legendary3' },
    { min: 4000, name: 'legendary2' },
    { min: 3000, name: 'legendary1' },
    { min: 2500, name: 'gold3' },
    { min: 2000, name: 'gold2' },
    { min: 1500, name: 'gold1' },
    { min: 1200, name: 'silver3' },
    { min: 900, name: 'silver2' },
    { min: 600, name: 'silver1' },
    { min: 400, name: 'bronze3' },
    { min: 200, name: 'bronze2' },
  ]

  const found = leagues.find(({ min }) => trophyCount >= min)
  return found?.name ?? 'bronze1'
}

export const getClanBadge = (badgeId: number, trophyCount: number): string => {
  if (badgeId === -1 || !badgeId) return 'no_clan'

  const badgeName = badges.find((b: { id: number }) => b.id === badgeId)?.name
  if (!badgeName) return 'no_clan'

  return `${badgeName}_${getLeague(trophyCount)}`
}

const getMaxPossibleCurrentFame = ({
  dayIndex,
  decksUsedToday,
  duelsCompleted,
  isColosseum,
}: GetMaxPossibleFameParams): number => {
  let currentPossibleFame = duelsCompleted * 500 + (decksUsedToday - duelsCompleted * 2) * 200

  if (isColosseum) {
    currentPossibleFame += 45000 * (dayIndex - 3)
  }
  return currentPossibleFame
}

// returns amount of fame that can be earned from remaining attacks (includes all days remaining if colosseum)
const getMaxPossibleRemainingFame = ({
  dayIndex,
  decksUsedToday,
  duelsCompleted,
  isColosseum,
}: GetMaxPossibleFameParams): number => {
  const duelsRemainingToday = 50 - duelsCompleted
  const decksRemainingToday = 200 - decksUsedToday

  let maxPossibleRemainingFame =
    duelsRemainingToday * 500 + (decksRemainingToday - duelsRemainingToday * 2) * 200

  if (isColosseum) {
    maxPossibleRemainingFame += 45000 * (6 - dayIndex)
  }

  return maxPossibleRemainingFame
}

export const getAvgFame = ({
  boatPoints,
  dayIndex,
  decksUsedToday,
  fame,
  isColosseum,
}: GetAvgFameParams): number => {
  if (dayIndex < 3 || boatPoints >= 10000) return 0

  const firstDayOfColosseum = isColosseum && dayIndex === 3

  if (firstDayOfColosseum && decksUsedToday === 0) return 0
  if (!isColosseum && decksUsedToday === 0) return 0

  const totalAttacksUsed = isColosseum ? decksUsedToday + 200 * (dayIndex - 3) : decksUsedToday

  return fame / totalAttacksUsed
}

export const getProjFame = ({
  boatPoints,
  dayIndex,
  decksUsedToday,
  duelsCompleted,
  fame,
  isColosseum,
}: GetProjFameParams): number => {
  if (dayIndex < 3 || boatPoints >= 10000) return 0

  const firstDayOfColosseum = isColosseum && dayIndex === 3

  if (firstDayOfColosseum && decksUsedToday === 0) return 0
  if (!isColosseum && decksUsedToday === 0) return 0

  const maxPossibleCurrentFame = getMaxPossibleCurrentFame({
    dayIndex,
    decksUsedToday,
    duelsCompleted,
    isColosseum,
  })

  const maxPossibleRemainingFame = getMaxPossibleRemainingFame({
    dayIndex,
    decksUsedToday,
    duelsCompleted,
    isColosseum,
  })

  const currentFamePerc = fame / maxPossibleCurrentFame
  const projFame = fame + maxPossibleRemainingFame * currentFamePerc

  const multiple = fame % 10 === 0 ? 50 : 25

  return Math.min(isColosseum ? 180000 : 45000, Math.ceil(projFame / multiple) * multiple)
}

export const getPlacements = ({
  clans,
  fameAccessor,
}: GetPlacementsParams): { place: number; tag: string }[] => {
  const sortedClans = clans.slice().sort((a, b) => b[fameAccessor] - a[fameAccessor]) // copy to avoid mutating input
  const placements = [] // [{ place: 1, tag: "#ABC1234" }]

  let place = 1

  for (let i = 0; i < sortedClans.length; ) {
    const currentFame = sortedClans[i][fameAccessor]
    if (currentFame === 0) break

    let sameFameCount = 0

    for (let j = i; j < sortedClans.length && sortedClans[j][fameAccessor] === currentFame; j++) {
      placements.push({ place, tag: sortedClans[j].tag })
      sameFameCount++
    }

    i += sameFameCount
    place += sameFameCount
  }

  return placements
}
