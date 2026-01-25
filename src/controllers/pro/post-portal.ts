/* eslint-disable camelcase */
import { Request, Response } from 'express'
import { JWTPayload } from 'jose'
import { ZodError } from 'zod'

import stripe from '@/lib/stripe'
import { verifyUserToken } from '@/lib/utils'
import { getAccount } from '@/services/mongo'

const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4400' : 'https://cwstats.com'

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

    const userPayload = (await verifyUserToken(userToken)) as JWTPayload & { user?: { discord_id?: string } }
    const discordId = userPayload?.user?.discord_id

    if (!discordId) {
      res.status(401).json({ error: 'Unauthorized', status: 401 })
      return
    }

    const user = await getAccount(discordId)

    if (!user || !user.stripeCustomerId) {
      res.status(400).json({ error: 'User not found or no Stripe customer', status: 400 })
      return
    }

    // Verify customer exists in Stripe
    let customer
    try {
      customer = await stripe.customers.retrieve(user.stripeCustomerId)
    } catch {
      res.status(404).json({ error: 'Stripe customer not found', status: 404 })
      return
    }

    if (!customer || customer.deleted) {
      res.status(404).json({ error: 'Stripe customer deleted', status: 404 })
      return
    }

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: BASE_URL
    })

    res.status(201).json({ url: portalSession.url })
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

export default postProPortalController
