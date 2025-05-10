import axios, { AxiosResponse } from 'axios'

import { formatTag } from '@/lib/format'
import { SupercellClan, SupercellClansSearch } from '@/types/supercell/clan'
import { SupercellWarLeaderboard } from '@/types/supercell/leaderboard'
import { SupercellBattleLog, SupercellPlayer } from '@/types/supercell/player'
import { SupercellRace } from '@/types/supercell/race'

const BASE_URL = 'https://api.clashroyale.com/v1'

interface SupercellResponse<T> {
  data?: T
  error?: string
  status: number
}

export const handleSupercellRequest = async <T>(url: string): Promise<SupercellResponse<T>> => {
  const response: AxiosResponse = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
    },
    validateStatus: () => true, // prevent Axios from throwing on 4xx/5xx
  })

  const { data, status } = response

  if (status === 200) {
    return {
      data: data?.items ?? data,
      status,
    }
  } else {
    let error = 'Unexpected error. Please try again.'

    if (status === 404) error = 'Not found.'
    else if (status === 429) error = 'Supercell rate limit exceeded. Please try again later.'
    else if (status === 503) error = 'Supercell maintenance break.'

    return {
      error,
      status,
    }
  }
}

export const getPlayer = (tag: string) => {
  const url = `${BASE_URL}/players/%23${formatTag(tag, false)}`
  return handleSupercellRequest<SupercellPlayer>(url)
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

export const getWarLeaderboard = (locationId: string | number, limit?: number) => {
  const url = `${BASE_URL}/locations/${locationId}/rankings/clanwars?limit=${limit || 100}`
  return handleSupercellRequest<SupercellWarLeaderboard>(url)
}
