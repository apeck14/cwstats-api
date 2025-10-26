import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { patchRisersFallersSchema } from '@/schemas/mongo'
import { setRisersAndFallers } from '@/services/mongo'

/**
 * Set weekly risers and fallers
 * @route PATCH /risers-fallers
 */
export const patchRisersAndFallersController = async (req: Request, res: Response) => {
  try {
    const parsed = patchRisersFallersSchema.parse({
      body: req.body
    })

    const { fallers, risers } = parsed.body

    const { modifiedCount } = await setRisersAndFallers(risers, fallers)

    if (!modifiedCount) {
      res.status(404).json({ error: 'Statistics document not found.', status: 404 })
      return
    }

    res.status(200).json({ success: true })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default patchRisersAndFallersController
