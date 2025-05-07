import badges from '@/static/badges.json'

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
