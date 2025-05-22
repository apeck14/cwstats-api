import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { guildCommandCooldownSchema } from '@/schemas/mongo'
import { setCommandCooldown } from '@/services/mongo'

/**
 * Set a command cooldown
 * @route PATCH /guild/:id/command-cooldown
 */
export const patchGuildCommandCooldown = async (req: Request, res: Response) => {
  try {
    const parsed = guildCommandCooldownSchema.parse({
      body: req.body,
      params: req.params,
    })

    const { id } = parsed.params
    const { commandName, delay } = parsed.body

    const { matchedCount, modifiedCount } = await setCommandCooldown({ commandName, delay, id })

    if (!matchedCount) {
      res.status(404).json({ error: 'Guild not found', status: 404 })
      return
    }

    if (!modifiedCount) {
      throw new Error()
    }

    res.status(200).json({ commandName, delay, id, success: true })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: err.errors[0].message,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default patchGuildCommandCooldown
