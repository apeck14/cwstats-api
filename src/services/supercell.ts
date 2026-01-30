import axios, { AxiosResponse } from 'axios'

import { formatTag } from '@/lib/format'
import { upsertPlayerInRedis } from '@/services/redis'
import { SupercellClan, SupercellClansSearch } from '@/types/supercell/clan'
import { SupercellWarLeaderboard } from '@/types/supercell/leaderboard'
import { SupercellBattleLog, SupercellPlayer } from '@/types/supercell/player'
import { SupercellRace } from '@/types/supercell/race'
import { SupercellRaceLog } from '@/types/supercell/race-log'

const isDev = process.env.NODE_ENV === 'development'
const BASE_URL = isDev ? 'https://proxy.royaleapi.dev/v1' : 'https://api.clashroyale.com/v1'

interface SupercellResponse<T> {
  data?: T
  error?: string
  status: number
}

export const handleSupercellRequest = async <T>(url: string): Promise<SupercellResponse<T>> => {
  const response: AxiosResponse = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${isDev ? process.env.TEST_CR_API_TOKEN : process.env.CR_API_TOKEN}`
    },
    validateStatus: () => true // prevent Axios from throwing on 4xx/5xx
  })

  const { data, status } = response

  if (status === 200) {
    return {
      data: data?.items ?? data,
      status
    }
  } else {
    let error = 'Unexpected error. Please try again.'

    if (status === 404) error = 'Not found.'
    else if (status === 429) error = 'Supercell rate limit exceeded. Please try again later.'
    else if (status === 503) error = 'Supercell maintenance break.'

    return {
      error,
      status
    }
  }
}

export const getPlayer = async (tag: string) => {
  const url = `${BASE_URL}/players/%23${formatTag(tag, false)}`
  const result = await handleSupercellRequest<SupercellPlayer>(url)

  // Update Redis with player info (non-blocking, fire-and-forget)
  if (result.data) {
    upsertPlayerInRedis({
      clanName: result.data.clan?.name || '',
      name: result.data.name,
      tag: result.data.tag
    }).catch(() => {})
  }

  return result
}

export const getPlayerBattleLog = (tag: string) => {
  const url = `${BASE_URL}/players/%23${formatTag(tag, false)}/battlelog`
  return handleSupercellRequest<SupercellBattleLog>(url)
}

export const getClan = (tag: string) => {
  const url = `${BASE_URL}/clans/%23${formatTag(tag, false)}`
  return handleSupercellRequest<SupercellClan>(url)
}

export const searchClans = (name: string) => {
  const url = `${BASE_URL}/clans?name=${encodeURIComponent(name)}`
  return handleSupercellRequest<SupercellClansSearch>(url)
}

export const getRiverRace = (tag: string) => {
  const url = `${BASE_URL}/clans/%23${formatTag(tag, false)}/currentriverrace`
  return handleSupercellRequest<SupercellRace>(url)
}

export const getWarLeaderboard = (locationId: number | string, limit?: number) => {
  const url = `${BASE_URL}/locations/${locationId}/rankings/clanwars?limit=${limit || 100}`
  return handleSupercellRequest<SupercellWarLeaderboard>(url)
}

export const getRaceLog = (tag: string) => {
  const url = `${BASE_URL}/clans/%23${formatTag(tag, false)}/riverracelog`
  return handleSupercellRequest<SupercellRaceLog>(url)
}
