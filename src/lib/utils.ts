import badges from '../static/badges.json'

export const getLeague = (trophyCount: number): string => {
  const leagues = [
    { min: 5000, name: 'legendary-3' },
    { min: 4000, name: 'legendary-2' },
    { min: 3000, name: 'legendary-1' },
    { min: 2500, name: 'gold-3' },
    { min: 2000, name: 'gold-2' },
    { min: 1500, name: 'gold-1' },
    { min: 1200, name: 'silver-3' },
    { min: 900, name: 'silver-2' },
    { min: 600, name: 'silver-1' },
    { min: 400, name: 'bronze-3' },
    { min: 200, name: 'bronze-2' },
  ]

  const found = leagues.find(({ min }) => trophyCount >= min)
  return found?.name ?? 'bronze-1'
}

export const getClanBadge = (badgeId: number, trophyCount: number): string => {
  if (badgeId === -1 || !badgeId) return 'no_clan'

  const badgeName = badges.find((b: { id: number }) => b.id === badgeId)?.name
  if (!badgeName) return 'no_clan'

  return `${badgeName}_${getLeague(trophyCount)}`
}
