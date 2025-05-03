import axios, { AxiosResponse } from 'axios'

import { formatTag } from '../utils/format'

const BASE_URL = 'https://api.clashroyale.com/v1'

export const handleSupercellResponse = (res: AxiosResponse) => {
  const { data, status } = res

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

export const getPlayer = async (tag: string) => {
  const url = `${BASE_URL}/players/%23${formatTag(tag, false)}`
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
    },
    validateStatus: () => true, // prevent Axios from throwing on 4xx/5xx
  })

  return handleSupercellResponse(response)
}

export const getPlayerBattleLog = async (tag: string) => {
  const url = `${BASE_URL}/players/%23${formatTag(tag, false)}/battlelog`
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
    },
    validateStatus: () => true, // prevent Axios from throwing on 4xx/5xx
  })

  return handleSupercellResponse(response)
}

export const getClan = async (tag: string) => {
  const url = `${BASE_URL}/clans/%23${formatTag(tag, false)}`
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
    },
    validateStatus: () => true, // prevent Axios from throwing on 4xx/5xx
  })

  return handleSupercellResponse(response)
}

export const searchClans = async (name: string) => {
  const url = `${BASE_URL}/clans?name=${encodeURIComponent(name)}`
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
    },
    validateStatus: () => true, // prevent Axios from throwing on 4xx/5xx
  })

  return handleSupercellResponse(response)
}

export const getRiverRace = async (tag: string) => {
  const url = `${BASE_URL}/clans/%23${formatTag(tag, false)}/currentriverrace`
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
    },
    validateStatus: () => true, // prevent Axios from throwing on 4xx/5xx
  })

  return handleSupercellResponse(response)
}
