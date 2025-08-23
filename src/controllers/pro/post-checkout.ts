import { Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { ZodError } from 'zod'

import stripe from '@/lib/stripe'
import { verifyUserToken } from '@/lib/utils'
import { postProCheckoutSchema } from '@/schemas/mongo'
import { getAccount, getLinkedClan, setStripeCustomerId } from '@/services/mongo'
import { hasActiveSubscription } from '@/services/stripe'
import { getClan } from '@/services/supercell'

/**
 * Create Stripe Checkout Session for Pro subscription
 * @route POST /pro/checkout
 */
const postProCheckoutController = async (req: Request, res: Response) => {
  try {
    const parsed = postProCheckoutSchema.parse({
      body: req.body,
    })

    const { clanTag } = parsed.body

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

    // Validate clan exists
    const [{ data: clan, error, status }, user, linkedClan, isAlreadyPro] = await Promise.all([
      getClan(clanTag),
      getAccount(discordId),
      getLinkedClan(clanTag),
      hasActiveSubscription(clanTag),
    ])
    let customerId = user?.stripeCustomerId

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', status: 401 })
      return
    }

    if (error || !clan) {
      const message = status === 404 ? 'Clan not found.' : error
      res.status(status || 404).json({ error: message, status: status || 404 })
      return
    }

    if (!linkedClan) {
      res.status(400).json({ error: 'Clan is not linked.', status: 400 })
      return
    }

    if (isAlreadyPro) {
      res.status(400).json({ error: 'Clan already has Pro enabled.', status: 400 })
      return
    }

    if (!customerId) {
      // create new Stripe customer
      const customer = await stripe.customers.create({
        metadata: { name: '', userId: discordId },
      })
      customerId = customer.id

      // Save customerId to user in DB
      await setStripeCustomerId(discordId, customerId)
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      cancel_url: `https://cwstats.com/checkout/cancel`,
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      metadata: {
        clanName: clan.name,
        clanTag: clan.tag,
        guildId: linkedClan.guildID,
        userId: discordId,
      },
      mode: 'subscription',
      success_url: `https://cwstats.com/checkout/success?sessionId={CHECKOUT_SESSION_ID}`,
    })

    res.status(201).json({ url: session.url })
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

export default postProCheckoutController
