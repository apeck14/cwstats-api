import { Request, Response } from 'express'
import { z, ZodError } from 'zod'

import logger from '@/lib/logger'
import { getCheckoutRedirectUrl } from '@/services/stripe'

const getCheckoutRedirectSchema = z.object({
  query: z.object({
    sessionId: z.string().min(1, 'sessionId is required')
  })
})

/**
 * Get redirect URL after successful checkout
 * @route GET /pro/checkout-redirect?sessionId=xxx
 */
const getCheckoutRedirectController = async (req: Request, res: Response) => {
  try {
    const parsed = getCheckoutRedirectSchema.parse({ query: req.query })
    const { sessionId } = parsed.query

    const redirectUrl = await getCheckoutRedirectUrl(sessionId)

    logger.info('Checkout redirect URL retrieved', { redirectUrl, sessionId })

    res.status(200).json({ url: redirectUrl })
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

    logger.error('Failed to get checkout redirect URL', {
      error: err instanceof Error ? err.message : 'Unknown error'
    })

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getCheckoutRedirectController
