/* eslint-disable camelcase */
import { Request, Response } from 'express'
import { JWTPayload } from 'jose'
import type Stripe from 'stripe'
import { ZodError } from 'zod'

import stripe from '@/lib/stripe'
import { verifyUserToken } from '@/lib/utils'
import { getAccount, setStripeCustomerId } from '@/services/mongo'

const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4400' : 'https://cwstats.com'

const NO_SUBSCRIPTION_RESPONSE = {
  code: 'NO_SUBSCRIPTION',
  error: 'No active subscription found. Please subscribe first.',
  status: 403
} as const

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

    if (!user) {
      res.status(401).json({ error: 'User not found', status: 401 })
      return
    }

    // If no customer ID, user has never subscribed
    if (!user.stripeCustomerId) {
      res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
      return
    }

    // Verify customer exists in Stripe and has subscriptions
    let customer
    try {
      customer = await stripe.customers.retrieve(user.stripeCustomerId, {
        expand: ['subscriptions']
      })
    } catch (stripeErr: unknown) {
      // Customer was deleted or doesn't exist - clear the invalid ID
      if (
        typeof stripeErr === 'object' &&
        stripeErr !== null &&
        'statusCode' in stripeErr &&
        stripeErr.statusCode === 404
      ) {
        await setStripeCustomerId(discordId, '')
        res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
        return
      }

      throw stripeErr
    }

    if (customer.deleted) {
      // Clear the deleted customer ID
      await setStripeCustomerId(discordId, '')
      res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
      return
    }

    // Check if user has any subscriptions
    const subscriptions = (customer as Stripe.Customer & { subscriptions?: Stripe.ApiList<Stripe.Subscription> })
      .subscriptions
    const hasActiveSubscription = subscriptions?.data.some((sub) =>
      ['active', 'trialing', 'past_due'].includes(sub.status)
    )

    if (!hasActiveSubscription) {
      res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
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
