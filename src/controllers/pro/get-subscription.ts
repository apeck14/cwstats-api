import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { requireAuth } from '@/lib/auth'
import logger from '@/lib/logger'
import { getProSubscriptionSchema } from '@/schemas/mongo'
import { getAccount } from '@/services/mongo'
import { getProSubscription } from '@/services/stripe'

const ADMIN_DISCORD_IDS = ['493245767448789023']

/**
 * Get subscription data and metadata for a given stripe id
 * @route GET /pro/subscription?stripeId
 */
const getProSubscriptionController = async (req: Request, res: Response) => {
  try {
    const parsed = getProSubscriptionSchema.parse({ query: req.query })
    const { stripeId } = parsed.query

    const authUser = await requireAuth(req, res)
    if (!authUser) return // Response already sent

    const { discordId } = authUser

    // Fetch subscription info from Stripe service
    const subscriptionData = await getProSubscription(stripeId)

    if (!subscriptionData) {
      res.status(404).json({ error: `Subscription not found: ${stripeId}`, status: 404 })
      return
    }

    // Authorization: verify the user owns this subscription or is an admin
    const isAdmin = ADMIN_DISCORD_IDS.includes(discordId)
    const subscriptionUserId = subscriptionData.metadata?.userId

    if (!isAdmin && subscriptionUserId !== discordId) {
      // Additional check: see if user's stripeCustomerId matches
      const user = await getAccount(discordId)
      const isOwner = user?.stripeCustomerId && subscriptionData.customer === user.stripeCustomerId

      if (!isOwner) {
        logger.warn('Subscription fetch attempted for subscription user does not own', {
          discordId,
          subscriptionId: stripeId,
          subscriptionUserId
        })
        res.status(403).json({ error: 'Forbidden', status: 403 })
        return
      }
    }

    res.status(200).json({
      data: subscriptionData
    })
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

export default getProSubscriptionController
