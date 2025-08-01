import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { DiscordApiError } from '@/lib/errors'
import { guildUserNicknameSchema } from '@/schemas/mongo'
import { updateDiscordUserNickname } from '@/services/discord'

/**
 * Set a user's nickname within a specific guild
 * @route PATCH /guild/:id/user-nickname
 */
export const patchGuildUserNickname = async (req: Request, res: Response) => {
  try {
    const parsed = guildUserNicknameSchema.parse({
      body: req.body,
      params: req.params,
    })

    const { id } = parsed.params
    const { nickname, userId } = parsed.body

    await updateDiscordUserNickname({ guildId: id, nickname, userId })

    res.status(200).json({ guildId: id, nickname, success: true, userId })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400,
      })
      return
    }

    if (err instanceof DiscordApiError) {
      res.status(err.status).json({ error: err.message, status: err.status })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default patchGuildUserNickname
