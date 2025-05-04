import axios, { AxiosError } from 'axios'

import { DiscordApiError } from '../utils/errors'

interface discordUserNicknameInput {
  guildId: string
  nickname: string
  userId: string
}

const BASE_URL = 'https://discord.com/api/v10'

export const updateDiscordUserNickname = async ({
  guildId,
  nickname,
  userId,
}: discordUserNicknameInput): Promise<void> => {
  const url = `${BASE_URL}/guilds/${guildId}/members/${userId}`

  try {
    await axios.patch(
      url,
      { nick: nickname },
      {
        headers: {
          Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
        },
      },
    )
  } catch (err) {
    const axiosErr = err as AxiosError
    const status = axiosErr.response?.status || 500
    const data = axiosErr.response?.data

    const message =
      data && typeof data === 'object' && 'message' in data
        ? (data.message as string)
        : axiosErr.message || 'Unknown error from Discord API'

    throw new DiscordApiError(message, status)
  }
}
