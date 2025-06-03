import axios, { AxiosError } from 'axios'

import { DiscordApiError } from '@/lib/errors'

interface discordUserNicknameInput {
  guildId: string
  nickname: string
  userId: string
}

const BASE_URL = 'https://discord.com/api/v10'

const handleDiscordApiError = (err: unknown): never => {
  const axiosErr = err as AxiosError
  const status = axiosErr.response?.status || 500
  const data = axiosErr.response?.data

  const message =
    data && typeof data === 'object' && 'message' in data
      ? `Discord: ${data.message}`
      : axiosErr.message
        ? `Discord: ${axiosErr.message}`
        : 'Unknown error from Discord API'

  throw new DiscordApiError(message, status)
}

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
    handleDiscordApiError(err)
  }
}

export const deleteDiscordWebhookByUrl = async (webhookUrl: string): Promise<void> => {
  try {
    await axios.delete(webhookUrl)
  } catch (err) {
    handleDiscordApiError(err)
  }
}
