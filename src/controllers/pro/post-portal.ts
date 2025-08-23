import { Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { ZodError } from 'zod'

import stripe from '@/lib/stripe'
import { verifyUserToken } from '@/lib/utils'
import { getAccount } from '@/services/mongo'

/**
 * Create Stripe Customer Portal Session for managing subscriptions
 * @route POST /pro/portal
 */
const postProPortalController = async (req: Request, res: Response) => {
  try {
    const userToken = req.headers['x-user-token']

    if (!userToken || Array.isArray(userToken)) {
      res.status(401).json({ error: 'Unauthorized', status: 401 })
      return
    }

    const userPayload = verifyUserToken(userToken) as JwtPayload | null
    const discordId = userPayload?.user?.discord_id

    if (!discordId) {
      res.status(401).json({ error: 'Unauthorized', status: 401 })
      return
    }

    const user = await getAccount(discordId)

    if (!user || !user.stripeCustomerId) {
      res.status(400).json({ error: 'User not found', status: 400 })
      return
    }

    const customer = await stripe.customers.retrieve(user.stripeCustomerId)
    if (!customer || customer.deleted) {
      res.status(404).json({ error: 'Stripe customer not found', status: 404 })
      return
    }

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `https://cwstats.com`,
    })

    res.status(201).json({ url: portalSession.url })
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

export default postProPortalController
