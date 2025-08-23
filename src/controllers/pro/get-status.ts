import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { formatTag } from '@/lib/format'
import { getProStatusSchema } from '@/schemas/mongo'
import { hasActiveSubscription } from '@/services/stripe'

/**
 * Get Pro status for a given clan tag
 * @route GET /pro/status
 */
const getProStatusController = async (req: Request, res: Response) => {
  try {
    const parsed = getProStatusSchema.parse({
      body: req.body,
    })

    const { clanTag } = parsed.body

    const isPro = await hasActiveSubscription(clanTag)

    res.status(200).json({ clanTag: formatTag(clanTag, true), isPro })
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

export default getProStatusController
