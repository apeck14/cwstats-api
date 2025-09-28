import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { getProSubscriptionSchema } from '@/schemas/mongo'
import { getProSubscription } from '@/services/stripe'

/**
 * Get subscription data and metadata for a given stripe id
 * @route GET /pro/subscription?stripeId
 */
const getProSubscriptionController = async (req: Request, res: Response) => {
  try {
    const parsed = getProSubscriptionSchema.parse({ query: req.query })
    const { stripeId } = parsed.query

    // Fetch subscription info from Stripe service
    const subscriptionData = await getProSubscription(stripeId)

    if (!subscriptionData) {
      res.status(404).json({ error: `Subscription not found: ${stripeId}`, status: 404 })
      return
    }

    res.status(200).json({
      data: subscriptionData,
    })
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

export default getProSubscriptionController
