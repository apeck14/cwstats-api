import { Request, Response } from 'express'
import { JWTPayload } from 'jose'
import { ZodError } from 'zod'

import stripe, { getOrCreateCustomer } from '@/lib/stripe'
import { verifyUserToken } from '@/lib/utils'
import { postProCheckoutSchema } from '@/schemas/mongo'
import { getAccount, getLinkedClan } from '@/services/mongo'
import { hasActiveSubscription } from '@/services/stripe'
import { getClan } from '@/services/supercell'

const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4400' : 'https://cwstats.com'

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

    const userPayload = (await verifyUserToken(userToken)) as JWTPayload & { user?: { discord_id?: string } }
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

    const name = (userPayload?.name || 'Unknown') as string
    const customerId = user.stripeCustomerId
    const customer = await getOrCreateCustomer(discordId, customerId, name)

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      cancel_url: `${BASE_URL}/checkout/cancel`,
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        description: `PRO tier for ${clan.name} (${clan.tag})`,
        metadata: {
          clanName: clan.name,
          clanTag: clan.tag,
          guildId: linkedClan.guildID,
          userId: discordId,
        },
        trial_period_days: 14,
      },
      success_url: `${BASE_URL}/checkout/success?sessionId={CHECKOUT_SESSION_ID}`,
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
