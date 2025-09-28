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

// For updating the webhook itself
export interface WebhookUpdateInput {
  webhookId: string // Webhook ID (from URL)
  webhookToken: string // Webhook token (from URL)
  botToken: string // Bot token (required for update)
  updateData: {
    name?: string // Webhook name
    avatar?: string // Base64 encoded avatar
    channel_id?: string // New channel ID to move webhook
  }
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

    const res = await axios.post(`${BASE_URL}/channels/${channelId}/webhooks`, webhook, {
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

export const sendDiscordDM = async (userId: string, embed: object) => {
  try {
    // create DM channel with the user
    const { data: dmChannel } = await axios.post(
      `${BASE_URL}/users/@me/channels`,
      { recipient_id: userId },
      {
        headers: {
          Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // send message to that DM channel
    await axios.post(
      `${BASE_URL}/channels/${dmChannel.id}/messages`,
      { embeds: [embed] },
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (e) {
    console.log(e)
    return { error: 'Error sending Discord DM for failed payment', userId }
  }
}

export async function assignRoleToUser(guildId: string, userId: string, roleId: string) {
  try {
    await axios.put(
      `${BASE_URL}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {},
      {
        headers: {
          Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
        },
      },
    )
  } catch {
    return { error: 'Error assigning role to user', guildId, roleId, userId }
  }
}

export async function unassignRoleFromUser(guildId: string, userId: string, roleId: string) {
  try {
    await axios.delete(`${BASE_URL}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      headers: {
        Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
      },
    })
  } catch {
    return { error: 'Error unassigning role to user', guildId, roleId, userId }
  }
}

export async function updateWebhook({ botToken, updateData, webhookId, webhookToken }: WebhookUpdateInput) {
  try {
    await axios.patch(`${BASE_URL}/webhooks/${webhookId}/${webhookToken}`, updateData, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    })
  } catch (err) {
    return { error: 'Error updating webhook', webhookId }
  }
}
