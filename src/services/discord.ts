import axios, { AxiosError } from 'axios'
import fs from 'fs'

import { DiscordApiError } from '@/lib/errors'

interface discordUserNicknameInput {
  guildId: string
  nickname: string
  userId: string
}

interface SendWebhookInput {
  title: string
  description: string
  color: number
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

export const createWebhook = async (channelId: string, title: string) => {
  try {
    const base64Image = fs.readFileSync('src/static/icons/bot-logo.png', { encoding: 'base64' })

    const webhook = {
      avatar: `data:image/png;base64,${base64Image}`,
      name: title,
    }

    const res = await axios.post(`https://discord.com/api/v10/channels/${channelId}/webhooks`, webhook, {
      headers: {
        Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    const data = res.data

    return { url: data.url }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data?.message === 'Missing Permissions') {
      return { error: 'Missing Permission: Manage Webhooks' }
    }

    return { error: 'Unexpected error while creating webhook.' }
  }
}

export const sendWebhookEmbed = async ({ color, description, title }: SendWebhookInput) => {
  try {
    if (!process.env.STRIPE_WEBHOOK_URL) {
      return { error: 'Missing STRIPE_WEBHOOK_URL environment variable' }
    }

    const payload = {
      embeds: [
        {
          color,
          description,
          title,
        },
      ],
    }

    await axios.post(process.env.STRIPE_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return { success: true }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return {
        details: err.response?.data,
        error: `Webhook request failed: ${err.response?.status} ${err.response?.statusText}`,
      }
    }

    return { error: 'Unexpected error while sending webhook.' }
  }
}
