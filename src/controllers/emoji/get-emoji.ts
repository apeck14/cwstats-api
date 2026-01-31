import { Request, Response } from 'express'
import { z } from 'zod'

import { getEmojiSchema } from '@/schemas/mongo'
import { getEmoji } from '@/services/mongo'

type EmojiParams = z.infer<typeof getEmojiSchema>['params']

/**
 * Get an emoji
 * @route GET /emoji/:name
 */
export const getEmojiController = async (req: Request, res: Response) => {
  try {
    const { name } = req.params as EmojiParams

    const emoji = await getEmoji(name)

    if (!emoji) {
      res.status(404).json({ error: 'Emoji not found.', status: 404 })
      return
    }

    res.status(200).json({ data: emoji })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getEmojiController
