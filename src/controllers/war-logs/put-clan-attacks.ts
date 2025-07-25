// insert a single clan attacks document
import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { putWarLogClanAttacksSchema } from '@/schemas/mongo'
import { addWarLogClanAttacks } from '@/services/mongo'

/**
 * Add a clan war logs attacks entry
 * @route PUT /war-logs/attacks
 */
export const putWarLogClanAttacksController = async (req: Request, res: Response) => {
  try {
    const parsed = putWarLogClanAttacksSchema.parse({
      body: req.body,
    })

    const { attacks, dayIndex, tag } = parsed.body

    await addWarLogClanAttacks({ attacks, dayIndex, tag })

    res.status(200).json({ success: true })
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

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default putWarLogClanAttacksController
